import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Feature } from 'geojson';
import { parseJSONInWorker } from '../services/json-parse-worker';
import { FeaturecollectionService } from '../featurecollection.service';

interface FeatureItem {
  index: number;
  feature: Feature;
  selected: boolean;
}

@Component({
  selector: 'app-geojson-trimmer',
  templateUrl: './geojson-trimmer.component.html',
  styleUrls: ['./geojson-trimmer.component.css']
})
export class GeojsonTrimmerComponent {
  features: Feature[] = [];
  items: FeatureItem[] = [];
  filteredFeatures: FeatureItem[] = [];
  propertyKeys: string[] = [];
  activeProperty = '';
  filterText = '';
  isLoading = false;
  progressPercent = 0;
  progressText = '';

  get selectedCount(): number {
    return this.items.filter(i => i.selected).length;
  }

  get filteredCount(): number {
    return this.filteredFeatures.length;
  }

  get allSelected(): boolean {
    return this.filteredFeatures.length > 0 && this.filteredFeatures.every(i => i.selected);
  }

  get visibleProperties(): string[] {
    // Show all discovered properties
    return this.propertyKeys;
  }

  constructor(
    private snackbar: MatSnackBar,
    private fcs: FeaturecollectionService
  ) {}

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    this.progressPercent = 0;
    this.progressText = 'Reading file...';

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        this.progressPercent = Math.round((e.loaded / e.total) * 50); // first 50% = reading
        this.progressText = `Reading: ${(e.loaded / 1024 / 1024).toFixed(1)} MB / ${(e.total / 1024 / 1024).toFixed(1)} MB`;
      }
    };

    reader.onload = async () => {
      try {
        this.progressText = 'Parsing JSON...';
        this.progressPercent = 55;
        const jsonData = await parseJSONInWorker(reader.result as string);
        this.progressPercent = 80;
        this.progressText = 'Processing features...';

        const features = jsonData.features as Feature[];
        if (!features || !Array.isArray(features)) {
          this.snackbar.open('Invalid GeoJSON: no "features" array', 'OK', { duration: 3000 });
          this.isLoading = false;
          return;
        }

        this.features = features;
        this.items = features.map((f, i) => ({ index: i, feature: f, selected: true }));
        this.extractProperties(features);
        this.applyFilter();

        this.progressPercent = 100;
        this.progressText = `${features.length} features loaded.`;
        this.isLoading = false;
        event.target.value = '';

        this.snackbar.open(`Loaded ${features.length} features`, 'OK', { duration: 2000 });
      } catch (e) {
        console.error('Parse error:', e);
        this.snackbar.open('Failed to parse GeoJSON', 'OK', { duration: 3000 });
        this.isLoading = false;
      }
    };

    reader.onerror = () => {
      this.snackbar.open('Error reading file', 'OK', { duration: 3000 });
      this.isLoading = false;
    };

    reader.readAsText(file, 'UTF-8');
  }

  private extractProperties(features: Feature[]) {
    const keys = new Set<string>();
    for (const f of features.slice(0, 100)) { // sample first 100 for property discovery
      if (f.properties) {
        Object.keys(f.properties).forEach(k => keys.add(k));
      }
    }
    this.propertyKeys = Array.from(keys).sort();
    if (this.propertyKeys.length > 0) {
      this.activeProperty = this.propertyKeys[0];
    }
  }

  onPropertyChange() {
    this.filterText = '';
    this.applyFilter();
  }

  applyFilter() {
    if (!this.filterText.trim()) {
      this.filteredFeatures = [...this.items];
    } else {
      const query = this.filterText.toLowerCase().trim();
      this.filteredFeatures = this.items.filter(item => {
        const val = item.feature.properties?.[this.activeProperty];
        return val != null && String(val).toLowerCase().includes(query);
      });
    }
  }

  clearFilter() {
    this.filterText = '';
    this.applyFilter();
  }

  toggleFeature(item: FeatureItem) {
    item.selected = !item.selected;
  }

  toggleAll(event: any) {
    const checked = event.target.checked;
    this.filteredFeatures.forEach(i => i.selected = checked);
  }

  selectAllFiltered() {
    this.filteredFeatures.forEach(i => i.selected = true);
  }

  deselectAllFiltered() {
    this.filteredFeatures.forEach(i => i.selected = false);
  }

  invertSelection() {
    this.filteredFeatures.forEach(i => i.selected = !i.selected);
  }

  downloadFiltered() {
    const selectedFeatures = this.items
      .filter(i => i.selected)
      .map(i => i.feature);

    if (selectedFeatures.length === 0) {
      this.snackbar.open('No features selected', 'OK', { duration: 2000 });
      return;
    }

    const geojson = {
      type: 'FeatureCollection',
      features: selectedFeatures
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered-${selectedFeatures.length}-features.geojson`;
    a.click();
    URL.revokeObjectURL(url);

    this.snackbar.open(`Downloaded ${selectedFeatures.length} features`, 'OK', { duration: 2000 });
  }

  openInStyler() {
    const selectedFeatures = this.items
      .filter(i => i.selected)
      .map(i => i.feature);

    if (selectedFeatures.length === 0) {
      this.snackbar.open('No features selected', 'OK', { duration: 2000 });
      return;
    }

    // Add selected features as a new layer in the styler
    this.fcs.addLayerFromGeoJSONChunked(selectedFeatures, (p) => {
      if (p.phase === 'done') {
        this.snackbar.open(`Opened ${selectedFeatures.length} features in Styler. Switch to the map tab.`, 'OK', { duration: 4000 });
      }
    });
  }
}
