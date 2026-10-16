import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class NoveltyService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getTypes()       { return this.http.get<any[]>(`${this.base}/novelties/types`); }
  getAll(f?: any)  { return this.http.get<any[]>(`${this.base}/novelties`,
      { params: this.buildParams(f ?? {}) }); }
  getOne(id:string){ return this.http.get<any>(`${this.base}/novelties/${id}`); }
  create(body:any) { return this.http.post<any>(`${this.base}/novelties`, body); }
  update(id:string, body:any) { return this.http.patch<any>(`${this.base}/novelties/${id}`, body); }
  remove(id:string)           { return this.http.delete<any>(`${this.base}/novelties/${id}`); }
}
