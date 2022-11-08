import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonendpointComponent } from './jsonendpoint.component';

describe('JsonendpointComponent', () => {
  let component: JsonendpointComponent;
  let fixture: ComponentFixture<JsonendpointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JsonendpointComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonendpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
