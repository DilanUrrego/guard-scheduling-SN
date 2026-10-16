import { TestBed } from '@angular/core/testing';

import { ShiftConfig } from './shift-config';

describe('ShiftConfig', () => {
  let service: ShiftConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShiftConfig);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
