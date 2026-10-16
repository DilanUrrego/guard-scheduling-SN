import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClientService } from '../../core/services/client';
import { AuthService } from '../../core/services/auth';
import { ClientFormComponent } from './client-form';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule,
  ],
  template: `
  <div class="list-page">
    <div class="list-page__header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Empresas y unidades que contratan el servicio de vigilancia</p>
      </div>
      <button class="btn btn--primary" (click)="openForm()">
        <mat-icon>add_business</mat-icon> Nuevo cliente
      </button>
    </div>

    <div class="card">
      <div class="list-loading" *ngIf="loading()"><mat-spinner diameter="36" /></div>
      <table class="data-table" *ngIf="!loading()">
        <thead>
          <tr>
            <th>Código</th><th>Nombre</th><th>NIT</th>
            <th>Teléfono</th><th>Puestos</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of clients()">
            <td><span class="badge badge--gray">{{ c.code }}</span></td>
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.nit }}</td>
            <td>{{ c.phone ?? '—' }}</td>
            <td>{{ c._count?.posts ?? 0 }} puestos</td>
            <td>
              <span class="badge" [class.badge--success]="c.is_active" [class.badge--gray]="!c.is_active">
                {{ c.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="table-actions">
              <button mat-icon-button matTooltip="Editar" (click)="openForm(c)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Desactivar" color="warn"
                      *ngIf="c.is_active" (click)="deactivate(c)">
                <mat-icon>block</mat-icon>
              </button>
            </td>
          </tr>
          <tr *ngIf="clients().length === 0">
            <td colspan="7">
              <div class="empty-state">
                <mat-icon>business</mat-icon>
                <h3>No hay clientes registrados</h3>
                <p>Agrega el primer cliente con el botón "Nuevo cliente"</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    .list-page__header { display:flex; align-items:flex-start; justify-content:space-between;
      gap:16px; margin-bottom:20px; }
    .list-loading { display:flex; justify-content:center; padding:40px; }
    .table-actions { display:flex; gap:4px; justify-content:flex-end; }
  `],
})
export class ClientsListComponent implements OnInit {
  clients = signal<any[]>([]);
  loading = signal(false);

  constructor(
    private clientService: ClientService,
    public auth: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.clientService.getAll().subscribe({
      next: c => { this.clients.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(client?: any) {
    const ref = this.dialog.open(ClientFormComponent, { width: '520px', data: { client } });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  deactivate(client: any) {
    if (!confirm(`¿Desactivar el cliente "${client.name}"?`)) return;
    this.clientService.deactivate(client.id).subscribe(() => this.load());
  }
}
