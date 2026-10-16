import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { GuardService } from '../core/services/guard';
import { ClientService } from '../core/services/client';
import { PostService } from '../core/services/post';
import { NoveltyService } from '../core/services/novelty';
import { ReportService } from '../core/services/report';
import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.html',
  styleUrls:  ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  private guardService   = inject(GuardService);
  private clientService  = inject(ClientService);
  private postService    = inject(PostService);
  private noveltyService = inject(NoveltyService);
  private reportService  = inject(ReportService);
  public  auth           = inject(AuthService);

  loading = signal(true);

  // Métricas
  totalGuards        = signal(0);
  totalClients       = signal(0);
  totalPosts         = signal(0);
  pendingNovelties   = signal(0);  // novedades con soporte pendiente
  pendingGuards      = signal(0);  // vigilantes sin turno este mes
  shiftCrosses       = signal(0);  // cruces detectados este mes
  recentNovelties    = signal<any[]>([]);
  pendingGuardsList  = signal<any[]>([]);

  now     = new Date();
  year    = this.now.getFullYear();
  month   = this.now.getMonth() + 1;
  monthLabel = this.now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  // Primer y último día del mes para los filtros
  private dateStart = new Date(this.year, this.month - 1, 1).toISOString().slice(0, 10);
  private dateEnd   = new Date(this.year, this.month, 0).toISOString().slice(0, 10);

  ngOnInit() {
    forkJoin({
      guards:   this.guardService.getAll({ is_active: true }),
      clients:  this.clientService.getAll(),
      posts:    this.postService.getAll(),
      novelties: this.noveltyService.getAll({ support_pending: true }),
      pending:  this.guardService.withoutSchedule(this.dateStart, this.dateEnd),
      crosses:  this.reportService.getShiftCrosses(this.year, this.month),
      recent:   this.noveltyService.getAll({ date_start: this.dateStart, date_end: this.dateEnd }),
    }).subscribe({
      next: (res) => {
        this.totalGuards.set(res.guards.length);
        this.totalClients.set(res.clients.length);
        this.totalPosts.set(res.posts.length);
        this.pendingNovelties.set(res.novelties.length);
        this.pendingGuards.set(res.pending.length);
        this.shiftCrosses.set(res.crosses.length);
        this.recentNovelties.set(res.recent.slice(0, 6));
        this.pendingGuardsList.set(res.pending.slice(0, 5));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get greeting(): string {
    const h = this.now.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get firstName(): string {
  const name = this.auth.currentUser()?.name;
  return name ? name.split(' ')[0] : 'Usuario'; // Valor por defecto si no ha cargado
}
}