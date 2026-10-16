import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ShiftConfigService } from '../../core/services/shift-config';
import { PostService } from '../../core/services/post';
import { ShiftConfigFormComponent } from './shift-config-form';

@Component({
  selector: 'app-shift-configs-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule,
  ],
  template: `
  <div class="list-page">
    <div class="list-page__header">
      <div>
        <h1 class="page-title">Tipos de Turno</h1>
        <p class="page-subtitle">Configuración de códigos de turno por puesto</p>
      </div>
      <button class="btn btn--primary" (click)="openForm()">
        <mat-icon>more_time</mat-icon> Nuevo turno
      </button>
    </div>

    <div class="card list-filters">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Filtrar por puesto</mat-label>
        <mat-select [(ngModel)]="selectedPostId" (ngModelChange)="load()">
          <mat-option value="">Todos los puestos</mat-option>
          <mat-option *ngFor="let p of posts()" [value]="p.id">{{ p.name }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="card">
      <div class="list-loading" *ngIf="loading()"><mat-spinner diameter="36" /></div>
      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr>
            <th>Código</th><th>Nombre</th><th>Puesto</th>
            <th>Horario</th><th>Días</th><th>Tipo</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of shifts()">
            <td>
              <span class="shift-badge" [style.background]="s.color_hex">{{ s.code }}</span>
            </td>
            <td><strong>{{ s.name }}</strong></td>
            <td>{{ s.post?.name }}</td>
            <td>{{ s.start_time }} – {{ s.end_time }}
              <span class="badge badge--warning" *ngIf="s.crosses_midnight">+1 día</span>
            </td>
            <td><span class="days-display">{{ formatDays(s.active_days) }}</span></td>
            <td>
              <span class="badge badge--primary" *ngIf="s.is_worked_rest">Desc. laborado</span>
              <span class="badge badge--gray"    *ngIf="!s.is_worked_rest">Normal</span>
            </td>
            <td class="table-actions">
              <button mat-icon-button matTooltip="Editar" (click)="openForm(s)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Desactivar" color="warn"
                      *ngIf="s.is_active" (click)="deactivate(s)">
                <mat-icon>block</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="shifts().length === 0">
            <td colspan="7">
              <div class="empty-state">
                <mat-icon>schedule</mat-icon>
                <h3>No hay tipos de turno configurados</h3>
                <p>Agrega el primer tipo de turno con el botón "Nuevo turno"</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    .list-page__header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:20px; }
    .list-filters { margin-bottom:20px; padding:16px 20px; }
    .list-loading { display:flex; justify-content:center; padding:40px; }
    .table-actions { display:flex; gap:4px; justify-content:flex-end; }
    .shift-badge {
      display:inline-flex; align-items:center; justify-content:center;
      padding:2px 10px; border-radius:$border-radius-sm;
      font-size:$font-size-sm; font-weight:700; color:white; min-width:40px;
    }
    .days-display { font-size:$font-size-xs; font-family:monospace; letter-spacing:1px; }
  `],
})
export class ShiftConfigsListComponent implements OnInit {
  shifts  = signal<any[]>([]);
  posts   = signal<any[]>([]);
  loading = signal(false);
  selectedPostId = '';

  constructor(
    private shiftService: ShiftConfigService,
    private postService: PostService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.postService.getAll().subscribe(p => this.posts.set(p));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.shiftService.getAll(this.selectedPostId || undefined).subscribe({
      next: s => { this.shifts.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(shift?: any) {
    const ref = this.dialog.open(ShiftConfigFormComponent, {
      width: '560px',
      data: { shift, posts: this.posts() },
    });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  deactivate(shift: any) {
    if (!confirm(`¿Desactivar el turno "${shift.code} - ${shift.name}"?`)) return;
    this.shiftService.deactivate(shift.id).subscribe(() => this.load());
  }

  // "1111110" → "L M W J V S ·"
  formatDays(mask: string): string {
    const labels = ['L','M','W','J','V','S','D'];
    return mask.split('').map((v, i) => v === '1' ? labels[i] : '·').join(' ');
  } 
}