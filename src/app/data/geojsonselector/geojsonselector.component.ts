import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { FeaturecollectionService } from 'src/app/featurecollection.service';

@Component({
  selector: 'app-geojsonselector',
  templateUrl: './geojsonselector.component.html',
  styleUrls: ['./geojsonselector.component.css'],
  providers: [HttpClient]
})
export class GeojsonselectorComponent implements OnInit {
  featurecollectionLayer: FeatureCollectionLayer[] | undefined;
  constructor(private http: HttpClient
    , private fcs: FeaturecollectionService, private matsnack: MatSnackBar) { }
  @Input() layerindex!: number;

  ngOnInit(): void {

    const subscription = this.fcs.FeatureCollectionLayerObservable.subscribe(i => {
      this.featurecollectionLayer = i;
    });

    this.addLayer()

  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        const jsonData = JSON.parse(fileReader.result as string);
        this.featurecollectionLayer![this.layerindex].features = jsonData.features
        if (this.featurecollectionLayer) {
          this.fcs.FeatureCollectionLayerObservable.next(this.featurecollectionLayer);

        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
        this.matsnack.open("File doesnt appear to be valid JSON", "Okay", { duration: 2000 });
      }
    };
    fileReader.readAsText(file, 'UTF-8');
  }

  addLayer() {

      if (this.featurecollectionLayer)
        this.fcs.FeatureCollectionLayerObservable.next(this.featurecollectionLayer)


  }
}
