import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PostService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll(clientId?: string) {
    return this.http.get<any[]>(`${this.base}/posts`,
      { params: this.buildParams({ clientId: clientId ?? '' }) });
  }
  getOne(id: string) { return this.http.get<any>(`${this.base}/posts/${id}`); }
  create(body: any)  { return this.http.post<any>(`${this.base}/posts`, body); }
  update(id: string, body: any) { return this.http.patch<any>(`${this.base}/posts/${id}`, body); }
  deactivate(id: string)        { return this.http.delete<any>(`${this.base}/posts/${id}`); }
}
