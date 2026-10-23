import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, NgIf,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <div class="login-card">

        <div class="login-card__header">
          <img src="/assets/images/logo.png" alt="Logo Clave Seguridad" class="login-card__logo" />
          <h1 class="login-card__title">Clave Seguridad CTA</h1>
          <p class="login-card__subtitle">Sistema de Programación de Turnos</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-card__form">

          <mat-form-field appearance="outline">
            <mat-label>Correo electrónico</mat-label>
            <input matInput formControlName="email" type="email" autocomplete="email" />
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">El correo es requerido</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Correo inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input matInput formControlName="password"
                   [type]="showPass() ? 'text' : 'password'"
                   autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
              <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">La contraseña es requerida</mat-error>
          </mat-form-field>

          <div class="login-card__error" *ngIf="error()">
            <mat-icon>error_outline</mat-icon>
            {{ error() }}
          </div>

          <button mat-flat-button class="login-card__submit"
                  type="submit" [disabled]="loading()">
            <mat-spinner *ngIf="loading()" diameter="20" />
            <span *ngIf="!loading()">Ingresar</span>
          </button>

        </form>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  showPass = signal(false);
  loading  = signal(false);
  error    = signal('');

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Credenciales inválidas. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }
}