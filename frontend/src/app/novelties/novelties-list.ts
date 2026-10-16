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
import { MatChipsModule } from '@angular/material/chips';
import { NoveltyService } from '../core/services/novelty';
import { GuardService } from '../core/services/guard';
import { AuthService } from '../core/services/auth';
import { NoveltyFormComponent } from './novelty-form';

@Component({
  selector: 'app-novelties-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressSpinnerModule, MatDialogModule, MatChipsModule,
  ],
  templateUrl: './novelties-list.html',
  styleUrls: ['./novelties-list.scss'],
})
export class NoveltiesListComponent implements OnInit {
  private noveltyService = inject(NoveltyService);
  private guardService   = inject(GuardService);
  private dialog         = inject(MatDialog);
  public  auth           = inject(AuthService);

  novelties    = signal<any[]>([]);
  guards       = signal<any[]>([]);
  noveltyTypes = signal<any[]>([]);
  loading      = signal(false);

  // Filtros
  filterGuardId      = '';
  filterCategory     = '';
  filterSupportPending = '';
  filterDateStart    = '';
  filterDateEnd      = '';

  categories = [
    { value: 'absence',     label: 'Ausencia'    },
    { value: 'permit',      label: 'Permiso'     },
    { value: 'suspension',  label: 'Suspensión'  },
    { value: 'vacation',    label: 'Vacaciones'  },
    { value: 'license',     label: 'Licencia'    },
    { value: 'accident',    label: 'Accidente'   },
    { value: 'termination', label: 'Retiro'      },
  ];

  ngOnInit() {
    this.guardService.getAll({ is_active: true }).subscribe(g => this.guards.set(g));
    this.noveltyService.getTypes().subscribe(t => this.noveltyTypes.set(t));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.noveltyService.getAll({
      guard_id:        this.filterGuardId       || undefined,
      category:        this.filterCategory      || undefined,
      support_pending: this.filterSupportPending || undefined,
      date_start:      this.filterDateStart      || undefined,
      date_end:        this.filterDateEnd        || undefined,
    }).subscribe({
      next: n => { this.novelties.set(n); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  clearFilters() {
    this.filterGuardId = '';
    this.filterCategory = '';
    this.filterSupportPending = '';
    this.filterDateStart = '';
    this.filterDateEnd = '';
    this.load();
  }

  openForm(novelty?: any) {
    const ref = this.dialog.open(NoveltyFormComponent, {
      width: '580px',
      data: {
        novelty,
        guards:       this.guards(),
        noveltyTypes: this.noveltyTypes(),
      },
    });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  markSupportSubmitted(novelty: any) {
    this.noveltyService.update(novelty.id, { support_submitted: true })
      .subscribe(() => this.load());
  }

  remove(novelty: any) {
    const name = `${novelty.novelty_type.code} de ${novelty.guard.full_name}`;
    if (!confirm(`¿Eliminar la novedad "${name}"?`)) return;
    this.noveltyService.remove(novelty.id).subscribe(() => this.load());
  }

  supportPendingCount() {
    return this.novelties().filter(
      n => n.novelty_type.support_required && !n.support_submitted
    ).length;
  }
}