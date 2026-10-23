import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostService } from '../../core/services/post';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, 
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
  <div class="modal">
    <div class="modal__header">
      <div class="modal__title-group">
        <mat-icon class="modal__icon">{{ isEdit ? 'edit_location' : 'add_location' }}</mat-icon>
        <h2 class="modal__title">{{ isEdit ? 'Editar puesto' : 'Nuevo puesto' }}</h2>
      </div>
      <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-divider />
    <form [formGroup]="form" (ngSubmit)="save()" class="modal__form">
      <mat-form-field appearance="outline">
        <mat-label>Cliente</mat-label>
        <mat-select formControlName="client_id">
          <mat-option *ngFor="let c of data.clients" [value]="c.id">{{ c.name }}</mat-option>
        </mat-select>
        <mat-error>Selecciona un cliente</mat-error>
      </mat-form-field>
      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" placeholder="Ej: 0235001" />
          <mat-error>El código es requerido</mat-error>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Nombre del puesto</mat-label>
        <input matInput formControlName="name" />
        <mat-error>El nombre es requerido</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Dirección</mat-label>
        <input matInput formControlName="address" />
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
        {{ isEdit ? 'Guardar cambios' : 'Registrar' }}
      </button>
    </div>
  </div>
  `,
  styleUrls: ['./post-form.scss'],
})
export class PostFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private postService = inject(PostService);
    public dialogRef = inject(MatDialogRef<PostFormComponent>);

    public data = inject<{
        post?: any;
        clients: any;
    }>(MAT_DIALOG_DATA);


  form = this.fb.nonNullable.group({
    client_id: ['', Validators.required],
    code:      ['', Validators.required],
    name:      ['', Validators.required],
    address:   [''],
  });

  saving = signal(false);
  error  = signal('');
  isEdit = false;

  constructor(
  ) {}

  ngOnInit() {
    if (this.data.post) {
      this.isEdit = true;
      const p = this.data.post;
      this.form.patchValue({ client_id: p.client?.id, code: p.code, name: p.name, address: p.address ?? '' });
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');
    const body = this.form.getRawValue();
    const req  = this.isEdit
      ? this.postService.update(this.data.post.id, body)
      : this.postService.create(body);
    req.subscribe({
      next:  () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.error.set(e.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  cancel() { this.dialogRef.close(false); }
}