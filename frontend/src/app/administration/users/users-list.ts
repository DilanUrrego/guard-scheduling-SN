import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth';
import { UserFormComponent } from './user-form';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  templateUrl: './users-list.html',
  styleUrls:  ['./users-list.scss'],
})
export class UsersListComponent implements OnInit {
  private http   = inject(HttpClient);
  private dialog = inject(MatDialog);
  public  auth   = inject(AuthService);

  users   = signal<any[]>([]);
  loading = signal(false);

  roleLabels: Record<string, string> = {
    admin:       'Administrador',
    coordinator: 'Coordinador',
    viewer:      'Visualizador',
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(user?: any) {
    const ref = this.dialog.open(UserFormComponent, {
      width: '500px',
      data: { user },
    });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  deactivate(user: any) {
    if (user.id === this.auth.currentUser()?.id) {
      alert('No puedes desactivar tu propio usuario.');
      return;
    }
    if (!confirm(`¿Desactivar al usuario "${user.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/users/${user.id}`)
      .subscribe(() => this.load());
  }

  roleBadgeClass(role: string): string {
    return { admin: 'badge--danger', coordinator: 'badge--primary', viewer: 'badge--gray' }[role] ?? 'badge--gray';
  }

  isCurrentUser(user: any): boolean {
    return user.id === this.auth.currentUser()?.id;
  }

  getInitials(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}
}