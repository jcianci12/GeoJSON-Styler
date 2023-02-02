import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadsavebuttonComponent } from './loadsavebutton.component';

describe('LoadsavebuttonComponent', () => {
  let component: LoadsavebuttonComponent;
  let fixture: ComponentFixture<LoadsavebuttonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadsavebuttonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadsavebuttonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
