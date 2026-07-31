# GeoJSON-Styler TODO

## Next: Stroke Style Rules

Align with Leaflet's style model so stroke can be controlled independently from fill.

### Leaflet style properties
| Property | Controls | Default |
|---|---|---|
| `color` | Stroke colour | `#3388ff` |
| `weight` | Stroke width (px) | `3` |
| `opacity` | Stroke opacity | `1.0` |
| `fillColor` | Fill colour | same as `color` |
| `fillOpacity` | Fill opacity | `0.2` |

### Current limitation
`colour` rule sets both `color` and `fillColor` to the same value. Stroke and fill are coupled. Can't have blue fill + black stroke, or thin stroke + opaque fill.

### Plan: Add 3 new rule types (backward compatible)
| New rule | Sets | Default |
|---|---|---|
| `strokecolour` | `style.color` only (not fill) | inherited from colour rule |
| `strokeweight` | `style.weight` | `2` |
| `strokeopacity` | `style.opacity` (stroke only) | `1` |

Existing `colour` rule keeps setting both (backward compat). New rules override specific Leaflet properties. Can be static or dynamic (CSV column).

### Implementation
1. Add `strokecolour`, `strokeweight`, `strokeopacity` to `ruletype` in `data.component.ts`
2. Add rendering cases in `featurecollection.service.ts` `getGeoJsonForLayer()`
3. Apply in `map.component.ts` style function
4. Add to style rule dropdown options
