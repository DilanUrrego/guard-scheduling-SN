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
  styles: [`
    @use '../../../styles/variables' as *;

    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $color-dark;
      background-image: radial-gradient(circle at 20% 50%, rgba($color-primary, .15) 0%, transparent 60%),
                        radial-gradient(circle at 80% 20%, rgba($color-primary, .11) 0%, transparent 50%);
      padding: 24px;
    }

    .login-card {
      background: $color-white;
      border-radius: $border-radius-lg;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: $shadow-lg;

      &__header { text-align: center; margin-bottom: 32px; }

      &__logo {
        height: 64px;
        object-fit: contain;
        margin-bottom: 16px;
      }

      &__title {
        font-size: $font-size-lg;
        font-weight: 700;
        color: $color-dark;
        margin-bottom: 4px;
      }

      &__subtitle {
        font-size: $font-size-sm;
        color: $color-gray;
      }

      &__form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        mat-form-field { width: 100%; }
      }

      &__error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: $color-danger-light;
        color: $color-danger;
        border-radius: $border-radius;
        font-size: $font-size-sm;
        mat-icon { font-size: 18px; }
      }

      &__submit {
        margin-top: 8px;
        height: 46px;
        background: $color-primary !important;
        color: $color-dark !important;
        font-weight: 700 !important;
        font-size: $font-size-md !important;
        border-radius: $border-radius !important;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
    }
  `],
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