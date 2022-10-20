import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeocolumnComponent } from './geocolumn.component';

describe('GeocolumnComponent', () => {
  let component: GeocolumnComponent;
  let fixture: ComponentFixture<GeocolumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeocolumnComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeocolumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
