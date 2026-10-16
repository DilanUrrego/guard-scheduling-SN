import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class GuardService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll(filters?: any) {
    return this.http.get<any[]>(`${this.base}/security-guards`,
      { params: this.buildParams(filters ?? {}) });
  }

  getOne(id: string) {
    return this.http.get<any>(`${this.base}/security-guards/${id}`);
  }

  create(body: any) {
    return this.http.post<any>(`${this.base}/security-guards`, body);
  }

  update(id: string, body: any) {
    return this.http.patch<any>(`${this.base}/security-guards/${id}`, body);
  }

  terminate(id: string, date?: string) {
    return this.http.patch<any>(`${this.base}/security-guards/${id}/terminate`,
      { termination_date: date });
  }

  reactivate(id: string) {
    return this.http.patch<any>(`${this.base}/security-guards/${id}/reactivate`, {});
  }

  withoutSchedule(dateStart: string, dateEnd: string) {
    return this.http.get<any[]>(`${this.base}/security-guards/without-schedule`,
      { params: this.buildParams({ dateStart, dateEnd }) });
  }
}
