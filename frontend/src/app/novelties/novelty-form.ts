// src/app/novelties/novelty-form.component.ts
import { Component, OnInit, signal, inject, Inject } from '@angular/core';
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
import { NoveltyService } from '../core/services/novelty';
import { PostService } from '../core/services/post';

@Component({
  selector: 'app-novelty-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  templateUrl: './novelty-form.html',
  styleUrls: ['./novelty-form.scss'],
})
export class NoveltyFormComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private noveltyService = inject(NoveltyService);
  private postService    = inject(PostService);
  public  dialogRef      = inject(MatDialogRef<NoveltyFormComponent>);

  saving       = signal(false);
  error        = signal('');
  posts        = signal<any[]>([]);
  isEdit       = false;
  selectedType = signal<any>(null);

  form = this.fb.nonNullable.group({
    guard_id:         ['', Validators.required],
    novelty_type_id:  ['', Validators.required],
    post_id:          ['', Validators.required],
    date_start:       ['', Validators.required],
    date_end:         [''],
    support_submitted: [false],
    observations:     [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    novelty?: any;
    guards: any[];
    noveltyTypes: any[];
  }) {}

  ngOnInit() {
    this.postService.getAll().subscribe(p => this.posts.set(p));

    if (this.data.novelty) {
      this.isEdit = true;
      const n = this.data.novelty;
      this.form.patchValue({
        guard_id:          n.guard.id,
        novelty_type_id:   n.novelty_type.id,
        post_id:           n.post.id,
        date_start:        n.date_start.slice(0, 10),
        date_end:          n.date_end?.slice(0, 10) ?? '',
        support_submitted: n.support_submitted,
        observations:      n.observations ?? '',
      });
      this.selectedType.set(n.novelty_type);
    }
  }

  onTypeChange(typeId: string) {
    const t = this.data.noveltyTypes.find(t => t.id === typeId);
    this.selectedType.set(t ?? null);
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');

    const raw  = this.form.getRawValue();
    const body = { ...raw, date_end: raw.date_end || undefined };

    const req = this.isEdit
      ? this.noveltyService.update(this.data.novelty.id, body)
      : this.noveltyService.create(body);

    req.subscribe({
      next:  () => { this.saving.set(false); this.dialogRef.close(true); },
      error: (e) => { this.error.set(e.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  cancel() { this.dialogRef.close(false); }

  get requiresSupport() { return this.selectedType()?.support_required; }
  get isTermination()   { return this.selectedType()?.is_termination; }
}