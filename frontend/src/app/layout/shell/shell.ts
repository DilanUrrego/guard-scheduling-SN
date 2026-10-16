import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NgIf, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
})
export class ShellComponent {
  sidebarCollapsed = false;

  initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  });

  roleLabel = computed(() => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      coordinator: 'Coordinador',
      viewer: 'Visualizador',
    };
    return roles[this.auth.currentUser()?.role ?? ''] ?? '';
  });

  constructor(public auth: AuthService) {}

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
}
