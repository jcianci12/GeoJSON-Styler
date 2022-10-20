import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuburblistComponent } from './suburblist.component';

describe('SuburblistComponent', () => {
  let component: SuburblistComponent;
  let fixture: ComponentFixture<SuburblistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuburblistComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuburblistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
