import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ReportService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getNoveltiesJson(dateStart: string, dateEnd: string) {
    return this.http.get<any[]>(`${this.base}/reports/novelties`,
      { params: this.buildParams({ dateStart, dateEnd }) });
  }

  downloadNoveltiesExcel(dateStart: string, dateEnd: string) {
    return this.http.get(`${this.base}/reports/novelties/excel`,
      { params: this.buildParams({ dateStart, dateEnd }), responseType: 'blob' });
  }

  getMonthlyJson(year: number, month: number) {
    return this.http.get<any[]>(`${this.base}/reports/monthly`,
      { params: this.buildParams({ year, month }) });
  }

  downloadMonthlyExcel(year: number, month: number) {
    return this.http.get(`${this.base}/reports/monthly/excel`,
      { params: this.buildParams({ year, month }), responseType: 'blob' });
  }

  getByClient(clientId: string, year: number, month: number) {
    return this.http.get<any>(`${this.base}/reports/by-client`,
      { params: this.buildParams({ clientId, year, month }) });
  }

  getPendingGuards(dateStart: string, dateEnd: string) {
    return this.http.get<any[]>(`${this.base}/reports/pending-guards`,
      { params: this.buildParams({ dateStart, dateEnd }) });
  }

  getShiftCrosses(year: number, month: number) {
    return this.http.get<any[]>(`${this.base}/reports/shift-crosses`,
      { params: this.buildParams({ year, month }) });
  }

  // Utilidad: descarga un blob como archivo
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}