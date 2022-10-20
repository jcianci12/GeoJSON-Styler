import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuburbfilterComponent } from './suburbfilter.component';

describe('SuburbfilterComponent', () => {
  let component: SuburbfilterComponent;
  let fixture: ComponentFixture<SuburbfilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuburbfilterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuburbfilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
