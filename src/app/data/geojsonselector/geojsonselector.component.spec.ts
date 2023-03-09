import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeojsonselectorComponent } from './geojsonselector.component';

describe('GeojsonselectorComponent', () => {
  let component: GeojsonselectorComponent;
  let fixture: ComponentFixture<GeojsonselectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeojsonselectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeojsonselectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
