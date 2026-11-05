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

  // ── RF-02: soportes en S3 ─────────────────────────────────────
  /** Pide al backend una URL pre-firmada para subir el archivo. */
  getUploadUrl(id: string, body: { fileName: string; contentType: string; size: number }) {
    return this.http.post<{ uploadUrl: string; key: string; expiresIn: number }>(
      `${this.base}/novelties/${id}/upload-url`, body);
  }

  /** Documentos registrados por la Lambda, con URL de descarga temporal. */
  getDocuments(id: string) {
    return this.http.get<any[]>(`${this.base}/novelties/${id}/documents`);
  }

  /**
   * Sube el archivo directo a S3. Se usa fetch (y no HttpClient) para que el
   * interceptor NO agregue el header Authorization: S3 rechazaría la firma.
   */
  async uploadToS3(uploadUrl: string, file: File) {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) throw new Error(`S3 respondió ${res.status}`);
  }
}
