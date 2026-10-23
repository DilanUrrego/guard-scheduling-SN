// src/app/administration/users/user-form.component.ts
import { Component, OnInit, signal, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
  <div class="modal">
    <div class="modal__header">
      <div class="modal__title-group">
        <mat-icon class="modal__icon">{{ isEdit ? 'manage_accounts' : 'person_add' }}</mat-icon>
        <h2 class="modal__title">{{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
      </div>
      <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-divider />

    <form [formGroup]="form" (ngSubmit)="save()" class="modal__form">

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Cédula</mat-label>
          <input matInput formControlName="id_number" />
          <mat-error>La cédula es requerida</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role">
            <mat-option value="admin">Administrador</mat-option>
            <mat-option value="coordinator">Coordinador</mat-option>
            <mat-option value="viewer">Visualizador</mat-option>
          </mat-select>
          <mat-error>Selecciona un rol</mat-error>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Nombre completo</mat-label>
        <input matInput formControlName="name" />
        <mat-error>El nombre es requerido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Correo electrónico</mat-label>
        <input matInput type="email" formControlName="email" />
        <mat-error>Ingresa un correo válido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña' }}</mat-label>
        <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="password" />
        <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
          <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <mat-hint *ngIf="!isEdit">Mínimo 8 caracteres, una mayúscula y un número</mat-hint>
        <mat-error>La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número</mat-error>
      </mat-form-field>

      <div class="modal__error" *ngIf="error()">
        <mat-icon>warning_amber</mat-icon> {{ error() }}
      </div>
    </form>

    <mat-divider />
    <div class="modal__actions">
      <button class="btn btn--secondary" (click)="cancel()">Cancelar</button>
      <button class="btn btn--primary" (click)="save()" [disabled]="saving()">
        <mat-spinner *ngIf="saving()" diameter="18" />
        <mat-icon *ngIf="!saving()">save</mat-icon>
        {{ isEdit ? 'Guardar cambios' : 'Crear usuario' }}
      </button>
    </div>
  </div>
  `,
  styleUrls: ['./user-form.scss'],
})
export class UserFormComponent implements OnInit {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);
  public  dialogRef = inject(MatDialogRef<UserFormComponent>);

  saving   = signal(false);
  error    = signal('');
  showPass = signal(false);
  isEdit   = false;

  form = this.fb.nonNullable.group({
    id_number: ['', Validators.required],
    name:      ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    role:      ['coordinator', Validators.required],
    password:  [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { user?: any }) {}

  ngOnInit() {
    if (this.data.user) {
      this.isEdit = true;
      this.form.patchValue({
        id_number: this.data.user.id_number,
        name:      this.data.user.name,
        email:     this.data.user.email,
        role:      this.data.user.role,
        password:  '',
      });
      // En edición la contraseña no es requerida
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
      // En creación la contraseña es obligatoria con validación fuerte
      this.form.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/),
      ]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');

    const raw  = this.form.getRawValue();
    // En edición, si password está vacío no lo enviamos
    const body = this.isEdit && !raw.password
      ? { id_number: raw.id_number, name: raw.name, email: raw.email, role: raw.role }
      : raw;

    const url = this.isEdit
      ? `${environment.apiUrl}/users/${this.data.user.id}`
      : `${environment.apiUrl}/users`;
    const req = this.isEdit
      ? this.http.patch(url, body)
      : this.http.post(url, body);

    req.subscribe({
      next:  () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.error.set(e.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  cancel() { this.dialogRef.close(false); }
}
