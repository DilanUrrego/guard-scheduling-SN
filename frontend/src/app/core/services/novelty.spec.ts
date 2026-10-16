import { TestBed } from '@angular/core/testing';

import { Novelty } from './novelty';

describe('Novelty', () => {
  let service: Novelty;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Novelty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
