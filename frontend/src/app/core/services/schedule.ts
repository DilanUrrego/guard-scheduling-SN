import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { HttpClient } from '@angular/common/http';

export interface CalendarQuery {
  year: number; month: number;
  post_id?: string; guard_id?: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getCalendar(q: CalendarQuery) {
    return this.http.get<any[]>(`${this.base}/schedules/calendar`,
      { params: this.buildParams(q) });
  }

  getMonthlyByGuard(guardId: string, year: number, month: number) {
    return this.http.get<any>(`${this.base}/schedules/guard/${guardId}/monthly`,
      { params: this.buildParams({ year, month }) });
  }

  create(body: any) {
    return this.http.post<any>(`${this.base}/schedules`, body);
  }

  bulkCreate(body: any) {
    return this.http.post<any>(`${this.base}/schedules/bulk`, body);
  }

  update(id: string, body: any) {
    return this.http.patch<any>(`${this.base}/schedules/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<any>(`${this.base}/schedules/${id}`);
  }
}
