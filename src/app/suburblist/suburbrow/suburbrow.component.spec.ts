import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuburbrowComponent } from './suburbrow.component';

describe('SuburbrowComponent', () => {
  let component: SuburbrowComponent;
  let fixture: ComponentFixture<SuburbrowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuburbrowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuburbrowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
