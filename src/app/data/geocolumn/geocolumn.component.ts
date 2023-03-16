import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { FeatureCollectionLayer } from 'src/app/featureCollection';
import { FeaturecollectionService } from 'src/app/featurecollection.service';
import { terms } from 'src/app/suburbfilter/suburbfilter.component';
import { Select } from 'src/app/tableheaders.pipe';

@Component({
  selector: 'app-geocolumn',
  templateUrl: './geocolumn.component.html',
  styleUrls: ['./geocolumn.component.css'],
})
export class GeocolumnComponent implements OnInit {
  // Define the class properties
  featureCollectionLayers!: FeatureCollectionLayer [];
  @Input() featureCollectionIndex!: number;
  @Input() tableheaders: Select[] = [];
  geocolumn: GeoColumnMapping= { GEOColumn: '', GEOJSON: '' };
  @Output() geocolumnChange = new EventEmitter<GeoColumnMapping>();

  constructor(private fcs: FeaturecollectionService) {}

  ngOnInit(): void {
    // Subscribe to the feature collection layer observable
    this.fcs.FeatureCollectionLayerObservable.subscribe((i) => {
      // Reset the feature collection layers array
      this.featureCollectionLayers = [];

      // Set the feature collection layers array to the new value
      this.featureCollectionLayers = i;

      // Set the geocolumn to the new value
      this.geocolumn = this.featureCollectionLayers[this.featureCollectionIndex].geocolumn
    });
  }

  // Event handler for the geoJSON select change event
  geoJSONChanged(event: MatSelectChange) {
    // Update the geocolumn with the new value
    this.featureCollectionLayers[this.featureCollectionIndex].geocolumn.GEOJSON = event.value
  }

  // Event handler for the geoColumn select change event
  geoColumnChanged(event: MatSelectChange) {
    // Update the geocolumn with the new value
    this.featureCollectionLayers[this.featureCollectionIndex].geocolumn.GEOColumn = event.value
  }
}

// Define the GeoColumnMapping interface
export interface GeoColumnMapping {
  GEOJSON: string;
  GEOColumn: string;
}
