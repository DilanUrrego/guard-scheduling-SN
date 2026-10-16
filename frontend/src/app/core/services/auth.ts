import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  id:    string;
  name:  string;
  email: string;
  role:  'admin' | 'coordinator' | 'viewer';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'clave_token';
  private readonly USER_KEY  = 'clave_user';

  // Signal reactivo — cualquier componente puede leer el usuario actual
  private _user = signal<CurrentUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string; user: CurrentUser }>(
        `${environment.apiUrl}/auth/login`,
        { email, password },
      )
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.access_token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this._user.set(res.user);
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  currentUser(): CurrentUser | null {
    return this._user();
  }

  // Para usar en templates con | async o directamente en signals
  readonly user = this._user.asReadonly();

  isAdmin():       boolean { return this._user()?.role === 'admin'; }
  isCoordinator(): boolean { return this._user()?.role === 'coordinator'; }
  isViewer():      boolean { return this._user()?.role === 'viewer'; }
  canEdit():       boolean { return this.isAdmin() || this.isCoordinator(); }

  private loadUser(): CurrentUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
