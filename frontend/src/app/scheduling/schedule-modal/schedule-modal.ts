// src/app/scheduling/schedule-modal/schedule-modal.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ScheduleService } from '../../core/services/schedule';
import { ShiftConfigService } from '../../core/services/shift-config';

@Component({
  selector: 'app-schedule-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule,
  ],
  templateUrl: './schedule-modal.html',
  styleUrls: ['./schedule-modal.scss'],
})
export class ScheduleModalComponent implements OnInit {

  private fb = inject(FormBuilder);
  private scheduleService = inject(ScheduleService);
  private shiftConfigService = inject(ShiftConfigService);
  private dialogRef = inject(MatDialogRef<ScheduleModalComponent>);

  public data = inject<{
      date?:    string;
      schedule?: any;
      guards:   any[];
      posts:    any[];
      canEdit:  boolean;
  }>(MAT_DIALOG_DATA);

  

  form = this.fb.nonNullable.group({
    guard_id:        ['', Validators.required],
    shift_config_id: ['', Validators.required],
    date:            ['', Validators.required],
    status:          ['scheduled'],
  });

  isEditMode  = signal(false);
  loading     = signal(false);
  saving      = signal(false);
  error       = signal('');
  shiftConfigs = signal<any[]>([]);

  constructor() {}

  ngOnInit() {
    if (this.data.schedule) {
      // Modo edición — precarga el formulario
      this.isEditMode.set(true);
      const s = this.data.schedule;
      this.form.patchValue({
        guard_id:        s.guard.id,
        shift_config_id: s.shift_config.id,
        date:            s.date.slice(0, 10),
        status:          s.status,
      });
      // Carga turnos del puesto ya asignado
      this.loadShiftConfigs(s.shift_config.post.id);

      if (!this.data.canEdit) this.form.disable();
    } else if (this.data.date) {
      this.form.patchValue({ date: this.data.date });
    }
  }

  onGuardChange(guardId: string) {
    // Al cambiar vigilante, reinicia turno (podría cambiar de puesto)
    this.form.patchValue({ shift_config_id: '' });
    this.shiftConfigs.set([]);
  }

  onPostChange(postId: string) {
    this.form.patchValue({ shift_config_id: '' });
    this.loadShiftConfigs(postId);
  }

  loadShiftConfigs(postId: string) {
    if (!postId) return;
    this.shiftConfigService.getAll(postId)
      .subscribe(s => this.shiftConfigs.set(s));
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');

    const body = this.form.getRawValue();
    const req  = this.isEditMode()
      ? this.scheduleService.update(this.data.schedule.id, body)
      : this.scheduleService.create(body);

    req.subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al guardar. Intenta de nuevo.');
        this.saving.set(false);
      },
    });
  }

  delete() {
    if (!confirm('¿Eliminar esta asignación?')) return;
    this.saving.set(true);
    this.scheduleService.remove(this.data.schedule.id).subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close(true); },
      error: () => { this.saving.set(false); },
    });
  }

  cancel() { this.dialogRef.close(false); }

  get schedule() { return this.data.schedule; }
  get posts()    { return this.data.posts; }
  get guards()   { return this.data.guards; }

  statusOptions = [
    { value: 'scheduled', label: 'Programado' },
    { value: 'executed',  label: 'Ejecutado'  },
    { value: 'novedad',   label: 'Novedad'    },
    { value: 'rest',      label: 'Descanso'   },
  ];
}