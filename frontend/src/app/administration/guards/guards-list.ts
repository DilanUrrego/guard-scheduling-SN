import { Component, OnInit, signal } from '@angular/core';
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
import { GuardService } from '../../core/services/guard';
import { AuthService } from '../../core/services/auth';
import { GuardFormComponent } from './guard-form';

@Component({
  selector: 'app-guards-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  templateUrl: './guards-list.html',
  styleUrls:  ['./guards-list.scss'],
})
export class GuardsListComponent implements OnInit {
  guards   = signal<any[]>([]);
  loading  = signal(false);
  search   = '';
  filterActive: string = 'true';

  constructor(
    private guardService: GuardService,
    public  auth: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.guardService.getAll({
      search:    this.search || undefined,
      is_active: this.filterActive,
    }).subscribe({
      next: g => { this.guards.set(g); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(guard?: any) {
    const ref = this.dialog.open(GuardFormComponent, {
      width: '560px',
      data: { guard },
    });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  terminate(guard: any) {
    if (!confirm(`¿Retirar a ${guard.full_name}?`)) return;
    this.guardService.terminate(guard.id).subscribe(() => this.load());
  }

  reactivate(guard: any) {
    if (!confirm(`¿Reactivar a ${guard.full_name}?`)) return;
    this.guardService.reactivate(guard.id).subscribe(() => this.load());
  }
}