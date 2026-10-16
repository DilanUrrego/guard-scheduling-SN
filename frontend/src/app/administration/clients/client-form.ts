import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../../core/services/client';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
  <div class="modal">
    <div class="modal__header">
      <div class="modal__title-group">
        <mat-icon class="modal__icon">{{ isEdit ? 'edit' : 'add_business' }}</mat-icon>
        <h2 class="modal__title">{{ isEdit ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
      </div>
      <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-divider />
    <form [formGroup]="form" (ngSubmit)="save()" class="modal__form">
      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" />
          <mat-error>El código es requerido</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>NIT</mat-label>
          <input matInput formControlName="nit" placeholder="000000000-0" />
          <mat-error>Formato inválido (000000000-0)</mat-error>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Nombre del cliente</mat-label>
        <input matInput formControlName="name" />
        <mat-error>El nombre es requerido</mat-error>
      </mat-form-field>
      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
      </div>
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
        {{ isEdit ? 'Guardar cambios' : 'Registrar' }}
      </button>
    </div>
  </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    .modal { display:flex; flex-direction:column; }
    .modal__header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 16px; }
    .modal__title-group { display:flex; align-items:center; gap:10px; }
    .modal__icon { color:$color-primary; }
    .modal__title { font-size:$font-size-md; font-weight:700; }
    .modal__form { padding:20px 24px; display:flex; flex-direction:column; gap:8px;
      mat-form-field { width:100%; } }
    .modal__error { display:flex; align-items:center; gap:8px; padding:10px 14px;
      background:$color-danger-light; color:$color-danger; border-radius:$border-radius;
      font-size:$font-size-sm; mat-icon { font-size:18px; } }
    .modal__actions { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px 20px; }
  `],
})
export class ClientFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private clientService = inject(ClientService);
    public dialogRef = inject(MatDialogRef<ClientFormComponent>);

    public data = inject<{
        client?: any;
    }>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    code:    ['', Validators.required],
    name:    ['', Validators.required],
    nit:     ['', [Validators.required, Validators.pattern(/^\d{6,10}-\d$/)]],
    phone:   [''],
    address: [''],
  });

  saving = signal(false);
  error  = signal('');
  isEdit = false;

  constructor() {}

  ngOnInit() {
    if (this.data.client) {
      this.isEdit = true;
      this.form.patchValue(this.data.client);
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');
    const body = this.form.getRawValue();
    const req  = this.isEdit
      ? this.clientService.update(this.data.client.id, body)
      : this.clientService.create(body);
    req.subscribe({
      next:  () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.error.set(e.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  cancel() { this.dialogRef.close(false); }
}