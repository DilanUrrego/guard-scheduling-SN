import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ClientService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll()          { return this.http.get<any[]>(`${this.base}/clients`); }
  getOne(id:string) { return this.http.get<any>(`${this.base}/clients/${id}`); }
  create(body: any) { return this.http.post<any>(`${this.base}/clients`, body); }
  update(id: string, body: any) { return this.http.patch<any>(`${this.base}/clients/${id}`, body); }
  deactivate(id: string)        { return this.http.delete<any>(`${this.base}/clients/${id}`); }
}
