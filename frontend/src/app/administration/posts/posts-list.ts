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
import { PostService } from '../../core/services/post';
import { ClientService } from '../../core/services/client';
import { AuthService } from '../../core/services/auth';
import { PostFormComponent } from './post-form';

@Component({
  selector: 'app-posts-list',
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
        <h1 class="page-title">Puestos de Vigilancia</h1>
        <p class="page-subtitle">Ubicaciones donde se presta el servicio</p>
      </div>
      <button class="btn btn--primary" (click)="openForm()" *ngIf="auth.canEdit()">
        <mat-icon>add_location</mat-icon> Nuevo puesto
      </button>
    </div>

    <div class="card list-filters">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Filtrar por cliente</mat-label>
        <mat-select [(ngModel)]="selectedClientId" (ngModelChange)="load()">
          <mat-option value="">Todos los clientes</mat-option>
          <mat-option *ngFor="let c of clients()" [value]="c.id">{{ c.name }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="card">
      <div class="list-loading" *ngIf="loading()"><mat-spinner diameter="36" /></div>
      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr><th>Código</th><th>Nombre del puesto</th><th>Cliente</th><th>Dirección</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of posts()">
            <td><span class="badge badge--gray">{{ p.code }}</span></td>
            <td><strong>{{ p.name }}</strong></td>
            <td>{{ p.client?.name }}</td>
            <td>{{ p.address ?? '—' }}</td>
            <td>
              <span class="badge" [class.badge--success]="p.is_active" [class.badge--gray]="!p.is_active">
                {{ p.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="table-actions">
              <button mat-icon-button matTooltip="Editar" (click)="openForm(p)" *ngIf="auth.canEdit()">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Desactivar" color="warn"
                      *ngIf="p.is_active && auth.isAdmin()" (click)="deactivate(p)">
                <mat-icon>block</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="posts().length === 0">
            <td colspan="6">
              <div class="empty-state">
                <mat-icon>location_off</mat-icon>
                <h3>No hay puestos registrados</h3>
                <p>Agrega el primer puesto con el botón "Nuevo puesto"</p>
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
  `],
})
export class PostsListComponent implements OnInit {
  posts    = signal<any[]>([]);
  clients  = signal<any[]>([]);
  loading  = signal(false);
  selectedClientId = '';

  constructor(
    private postService: PostService,
    private clientService: ClientService,
    public  auth: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.clientService.getAll().subscribe(c => this.clients.set(c));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.postService.getAll(this.selectedClientId || undefined).subscribe({
      next: p => { this.posts.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(post?: any) {
    const ref = this.dialog.open(PostFormComponent, {
      width: '520px',
      data: { post, clients: this.clients() },
    });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  deactivate(post: any) {
    if (!confirm(`¿Desactivar el puesto "${post.name}"?`)) return;
    this.postService.deactivate(post.id).subscribe(() => this.load());
  }
}
