import { TestBed } from '@angular/core/testing';

import { FeaturecollectionService } from './featurecollection.service';

describe('FeaturecollectionService', () => {
  let service: FeaturecollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeaturecollectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
