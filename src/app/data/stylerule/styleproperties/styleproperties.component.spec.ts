import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StylepropertiesComponent } from './styleproperties.component';

describe('StylepropertiesComponent', () => {
  let component: StylepropertiesComponent;
  let fixture: ComponentFixture<StylepropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StylepropertiesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StylepropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
