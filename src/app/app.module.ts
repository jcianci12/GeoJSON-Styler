import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FileuploadComponent } from './fileupload/fileupload.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularMaterialModule } from './material/material.module';
import { HttpClientModule } from '@angular/common/http';
import { MapComponent } from './map/map.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { SuburblistComponent } from './suburblist/suburblist.component';
import { SuburbfilterComponent } from './suburbfilter/suburbfilter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeaturefilterPipe } from './featurefilter.pipe';
import { FirstfeaturePipe } from './firstfeature.pipe';
import { SlicePipe } from './slice.pipe';
import { SuburbrowComponent } from './suburblist/suburbrow/suburbrow.component';
import { DataComponent } from './data/data.component';
import { JsontocsvPipe } from './jsontocsv.pipe';
import { TableheadersPipe } from './tableheaders.pipe';
import { GeocolumnComponent } from './data/geocolumn/geocolumn.component';
import { StyleruleComponent } from './data/stylerule/stylerule.component';
import { JsonendpointComponent } from './data/jsonendpoint/jsonendpoint.component';

@NgModule({
  declarations: [
    AppComponent,
    FileuploadComponent,
    MapComponent,
    SuburblistComponent,
    SuburbfilterComponent,
    FeaturefilterPipe,
    FirstfeaturePipe,
    SlicePipe,
    SuburbrowComponent,
    DataComponent,
    JsontocsvPipe,
    TableheadersPipe,
    GeocolumnComponent,
    StyleruleComponent,
    JsonendpointComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularMaterialModule,HttpClientModule,LeafletModule,FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
