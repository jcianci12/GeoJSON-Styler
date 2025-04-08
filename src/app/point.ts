import * as L from 'leaflet';

export class point extends L.Marker {
  id: string | undefined;
  constructor(latlng: L.LatLngExpression, options?: L.MarkerOptions) {
    super(latlng, options);
  }
} 