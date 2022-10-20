import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StyleruleComponent } from './stylerule.component';

describe('StyleruleComponent', () => {
  let component: StyleruleComponent;
  let fixture: ComponentFixture<StyleruleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StyleruleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StyleruleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
