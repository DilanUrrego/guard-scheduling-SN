import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GuardService } from '../../core/services/guard';

@Component({
  selector: 'app-guard-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
  <div class="modal">
    <div class="modal__header">
      <div class="modal__title-group">
        <mat-icon class="modal__icon">{{ isEdit ? 'edit' : 'person_add' }}</mat-icon>
        <h2 class="modal__title">{{ isEdit ? 'Editar vigilante' : 'Nuevo vigilante' }}</h2>
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
          <mat-label>Fecha de ingreso</mat-label>
          <input matInput type="date" formControlName="hire_date" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Nombre completo</mat-label>
        <input matInput formControlName="full_name" />
        <mat-error>El nombre es requerido</mat-error>
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Correo electrónico</mat-label>
          <input matInput type="email" formControlName="email" />
          <mat-error>Correo inválido</mat-error>
        </mat-form-field>
      </div>

      <mat-checkbox formControlName="is_supervisor" color="primary">
        Es supervisor
      </mat-checkbox>

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
    @use '../../../../styles/variables' as *;
    .modal { display: flex; flex-direction: column; }
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
export class GuardFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private guardService = inject(GuardService);
    public dialogRef = inject(MatDialogRef<GuardFormComponent>);

    public data = inject<{
        guard?: any;
    }>(MAT_DIALOG_DATA);

 
  form = this.fb.nonNullable.group({
    id_number:     ['', Validators.required],
    full_name:     ['', Validators.required],
    phone:         [''],
    email:         ['', Validators.email],
    hire_date:     [''],
    is_supervisor: [false],
  }); 
  
  saving = signal(false);
  error  = signal('');
  isEdit = false;

  constructor() {}

  ngOnInit() {
    if (this.data.guard) {
      this.isEdit = true;
      const g = this.data.guard;
      this.form.patchValue({
        id_number:     g.id_number,
        full_name:     g.full_name,
        phone:         g.phone ?? '',
        email:         g.email ?? '',
        hire_date:     g.hire_date?.slice(0, 10) ?? '',
        is_supervisor: g.is_supervisor,
      });
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');
    const body = this.form.getRawValue();
    const req  = this.isEdit
      ? this.guardService.update(this.data.guard.id, body)
      : this.guardService.create(body);

    req.subscribe({
      next:  () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.error.set(e.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  cancel() { this.dialogRef.close(false); }
}