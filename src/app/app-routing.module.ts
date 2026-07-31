import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeojsonTrimmerComponent } from './geojson-trimmer/geojson-trimmer.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
