// src/app/reports/reports.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportService } from '../core/services/report';
import { ClientService } from '../core/services/client';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTabsModule, MatTooltipModule,
  ],
  templateUrl: './reports.html',
  styleUrls:  ['./reports.scss'],
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);

  clients  = signal<any[]>([]);
  loading  = signal<string>(''); // nombre del informe que está cargando

  // Filtros compartidos de mes/año
  year  = new Date().getFullYear();
  month = new Date().getMonth() + 1;

  // Filtros específicos
  noveltyDateStart = '';
  noveltyDateEnd   = '';
  selectedClientId = '';
  pendingDateStart = '';
  pendingDateEnd   = '';

  // Resultados en JSON (para previsualización en pantalla)
  noveltyResults    = signal<any[]>([]);
  pendingResults    = signal<any[]>([]);
  crossResults      = signal<any[]>([]);

  months = [
    { v:1, l:'Enero' }, { v:2, l:'Febrero' }, { v:3, l:'Marzo' },
    { v:4, l:'Abril' }, { v:5, l:'Mayo' },    { v:6, l:'Junio' },
    { v:7, l:'Julio' }, { v:8, l:'Agosto' },  { v:9, l:'Septiembre' },
    { v:10, l:'Octubre' }, { v:11, l:'Noviembre' }, { v:12, l:'Diciembre' },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  ngOnInit() {
    this.clientService.getAll().subscribe(c => this.clients.set(c));
  }

  // ── 1. Novedades ─────────────────────────────
  loadNovelties() {
    if (!this.noveltyDateStart || !this.noveltyDateEnd) return;
    this.loading.set('novelties');
    this.reportService.getNoveltiesJson(this.noveltyDateStart, this.noveltyDateEnd)
      .subscribe({
        next: d => { this.noveltyResults.set(d); this.loading.set(''); },
        error: () => this.loading.set(''),
      });
  }

  downloadNoveltiesExcel() {
    if (!this.noveltyDateStart || !this.noveltyDateEnd) return;
    this.loading.set('novelties-excel');
    this.reportService.downloadNoveltiesExcel(this.noveltyDateStart, this.noveltyDateEnd)
      .subscribe({
        next: blob => {
          this.reportService.downloadBlob(blob, `novedades_${this.noveltyDateStart}_${this.noveltyDateEnd}.xlsx`);
          this.loading.set('');
        },
        error: () => this.loading.set(''),
      });
  }

  // ── 2. Programación mensual ──────────────────
  downloadMonthlyExcel() {
    this.loading.set('monthly-excel');
    this.reportService.downloadMonthlyExcel(this.year, this.month)
      .subscribe({
        next: blob => {
          this.reportService.downloadBlob(blob, `programacion_${this.year}_${this.month}.xlsx`);
          this.loading.set('');
        },
        error: () => this.loading.set(''),
      });
  }

  // ── 3. Por cliente ───────────────────────────
  downloadClientReport() {
    if (!this.selectedClientId) return;
    this.loading.set('client');
    this.reportService.getByClient(this.selectedClientId, this.year, this.month)
      .subscribe({
        next: () => {
          // En una iteración futura esto genera PDF; por ahora confirma que hay datos
          alert('Informe generado. La exportación a PDF se implementará próximamente.');
          this.loading.set('');
        },
        error: () => this.loading.set(''),
      });
  }

  // ── 4. Personal con turnos pendientes ────────
  loadPendingGuards() {
    if (!this.pendingDateStart || !this.pendingDateEnd) return;
    this.loading.set('pending');
    this.reportService.getPendingGuards(this.pendingDateStart, this.pendingDateEnd)
      .subscribe({
        next: d => { this.pendingResults.set(d); this.loading.set(''); },
        error: () => this.loading.set(''),
      });
  }

  // ── 5. Cruce de turnos ───────────────────────
  loadShiftCrosses() {
    this.loading.set('crosses');
    this.reportService.getShiftCrosses(this.year, this.month)
      .subscribe({
        next: d => { this.crossResults.set(d); this.loading.set(''); },
        error: () => this.loading.set(''),
      });
  }

  isLoading(key: string) { return this.loading() === key; }
  anyLoading()           { return this.loading() !== ''; }
}