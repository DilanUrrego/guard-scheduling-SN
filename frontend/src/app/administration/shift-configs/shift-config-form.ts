import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit, signal } from '@angular/core';
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
import { ShiftConfigService } from '../../core/services/shift-config';

@Component({
  selector: 'app-shift-config-form',
  standalone: true,
  imports: [CommonModule, 
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
  <div class="modal">
    <div class="modal__header">
      <div class="modal__title-group">
        <mat-icon class="modal__icon">more_time</mat-icon>
        <h2 class="modal__title">{{ isEdit ? 'Editar turno' : 'Nuevo turno' }}</h2>
      </div>
      <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-divider />
    <form [formGroup]="form" (ngSubmit)="save()" class="modal__form">

      <mat-form-field appearance="outline">
        <mat-label>Puesto</mat-label>
        <mat-select formControlName="post_id">
          <mat-option *ngFor="let p of data.posts" [value]="p.id">{{ p.name }}</mat-option>
        </mat-select>
        <mat-error>Selecciona un puesto</mat-error>
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" placeholder="Ej: 214" />
          <mat-error>El código es requerido</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <input matInput type="color" formControlName="color_hex" style="height:36px;cursor:pointer" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Nombre del turno</mat-label>
        <input matInput formControlName="name" placeholder="Ej: Descanso Laborado 05 a 17" />
        <mat-error>El nombre es requerido</mat-error>
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Hora inicio</mat-label>
          <input matInput type="time" formControlName="start_time" />
          <mat-error>Requerido</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Hora fin</mat-label>
          <input matInput type="time" formControlName="end_time" />
          <mat-error>Requerido</mat-error>
        </mat-form-field>
      </div>

      <!-- Selector de días activos -->
      <div class="days-selector">
        <span class="days-label">Días activos</span>
        <div class="days-grid">
          <button type="button" *ngFor="let d of dayLabels; let i = index"
                  class="day-btn" [class.day-btn--active]="getDayActive(i)"
                  (click)="toggleDay(i)">{{ d }}</button>
        </div>
      </div>

      <div class="form-row" style="gap:24px">
        <mat-checkbox formControlName="is_worked_rest" color="primary">
          Es descanso laborado
        </mat-checkbox>
      </div>
      @if (error()){
        <div class="modal__error">
        <mat-icon>warning_amber</mat-icon> {{ error() }}
      </div>
      }
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
  styleUrls: ['./shift-config-form.scss'],
})
export class ShiftConfigFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private shiftService = inject(ShiftConfigService);
    public dialogRef = inject(MatDialogRef<ShiftConfigFormComponent>);

    public data = inject<{
        shift?: any;
        posts: any[];
    }>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    post_id:        ['', Validators.required],
    code:           ['', Validators.required],
    name:           ['', Validators.required],
    start_time:     ['', Validators.required],
    end_time:       ['', Validators.required],
    is_worked_rest: [false],
    color_hex:      ['#4A90D9'],
  });

  saving    = signal(false);
  error     = signal('');
  isEdit    = false;
  dayLabels = ['L','M','W','J','V','S','D'];
  activeDays = [true,true,true,true,true,true,true]; // bitmask como array

  constructor() {}

  ngOnInit() {
    if (this.data.shift) {
      this.isEdit = true;
      const s = this.data.shift;
      this.form.patchValue({
        post_id: s.post?.id, code: s.code, name: s.name,
        start_time: s.start_time, end_time: s.end_time,
        is_worked_rest: s.is_worked_rest, color_hex: s.color_hex,
      });
      this.activeDays = s.active_days.split('').map((c: string) => c === '1');
    }
  }

  getDayActive(i: number) { return this.activeDays[i]; }
  toggleDay(i: number)    { this.activeDays[i] = !this.activeDays[i]; }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');
    const body = {
      ...this.form.getRawValue(),
      active_days: this.activeDays.map(v => v ? '1' : '0').join(''),
    };
    const req = this.isEdit
      ? this.shiftService.update(this.data.shift.id, body)
      : this.shiftService.create(body);
    req.subscribe({
      next:  () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.error.set(e.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  cancel() { this.dialogRef.close(false); }
}