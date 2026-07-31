import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { FeaturecollectionService, ChunkProgress } from 'src/app/featurecollection.service';
import { parseJSONInWorker } from 'src/app/services/json-parse-worker';

@Component({
  selector: 'app-geojsonselector',
  templateUrl: './geojsonselector.component.html',
  styleUrls: ['./geojsonselector.component.css'],
  providers: [HttpClient]
})
export class GeojsonselectorComponent implements OnInit {
  featurecollectionLayer: FeatureCollectionLayer[] | undefined;

  // Progress tracking
  isLoading = false;
  progress: ChunkProgress = { loaded: 0, total: 0, phase: 'reading' };
  progressPercent = 0;

  constructor(private http: HttpClient
    , private fcs: FeaturecollectionService, private matsnack: MatSnackBar) { }
  @Input() layerindex!: number;

  ngOnInit(): void {

    const subscription = this.fcs.FeatureCollectionLayerObservable.subscribe(i => {
      this.featurecollectionLayer = i;
    });

    this.addLayer()

  }

  async onFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    this.progress = { loaded: 0, total: file.size, phase: 'reading' };
    this.progressPercent = 0;

    const fileReader = new FileReader();

    // Phase 1: track file read progress (bytes)
    fileReader.onprogress = (e) => {
      if (e.lengthComputable) {
        this.progress = { loaded: e.loaded, total: e.total, phase: 'reading' };
        this.progressPercent = Math.round((e.loaded / e.total) * 100);
      }
    };

    fileReader.onload = async () => {
      try {
        // Phase 2: parsing (offloaded to Web Worker)
        this.progress = { loaded: 0, total: 0, phase: 'parsing' };
        const jsonData = await parseJSONInWorker(fileReader.result as string);
        const features = jsonData.features;

        if (!features || !Array.isArray(features)) {
          this.matsnack.open('File does not contain a valid "features" array', 'Okay', { duration: 2000 });
          this.isLoading = false;
          event.target.value = '';
          return;
        }

        // Phase 3: chunked processing — replace features on existing layer, set inactive
        // so layer doesn't auto-render. User enables via "Active" checkbox when ready.
        await this.fcs.replaceLayerFeaturesChunked(
          this.layerindex,
          features,
          (p) => {
            this.progress = p;
            this.progressPercent = p.total > 0 ? Math.round((p.loaded / p.total) * 100) : 0;
          },
          500,
          false  // setActive = false — don't render yet
        );

        this.isLoading = false;
        event.target.value = '';
        this.matsnack.open(`${features.length} features loaded. Check "Active" to render.`, 'OK', { duration: 3000 });
      } catch (e) {
        console.error('Error parsing JSON:', e);
        this.matsnack.open("File doesn't appear to be valid JSON", 'Okay', { duration: 2000 });
        this.isLoading = false;
        event.target.value = '';
      }
    };

    fileReader.onerror = () => {
      this.matsnack.open('Error reading file', 'Okay', { duration: 2000 });
      this.isLoading = false;
      event.target.value = '';
    };

    fileReader.readAsText(file, 'UTF-8');
  }

  addLayer() {

      if (this.featurecollectionLayer)
        this.fcs.FeatureCollectionLayerObservable.next(this.featurecollectionLayer)


  }
}
