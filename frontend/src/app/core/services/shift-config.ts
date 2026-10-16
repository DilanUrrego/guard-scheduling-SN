import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ShiftConfigService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll(postId?: string) {
    return this.http.get<any[]>(`${this.base}/shift-configs`,
      { params: this.buildParams({ postId: postId ?? '' }) });
  }
  getOne(id: string) { return this.http.get<any>(`${this.base}/shift-configs/${id}`); }
  create(body: any)  { return this.http.post<any>(`${this.base}/shift-configs`, body); }
  update(id: string, body: any) { return this.http.patch<any>(`${this.base}/shift-configs/${id}`, body); }
  deactivate(id: string)        { return this.http.delete<any>(`${this.base}/shift-configs/${id}`); }
}
