import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { ScheduleService } from '../../core/services/schedule';
import { ClientService } from '../../core/services/client';
import { PostService } from '../../core/services/post';
import { GuardService } from '../../core/services/guard';
import { AuthService } from '../../core/services/auth';
import { ScheduleModalComponent } from '../schedule-modal/schedule-modal';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, FullCalendarModule,
    MatIconModule, MatButtonModule, MatSelectModule,
    MatFormFieldModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule,
  ],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class CalendarComponent implements OnInit {
  // ── Estado ──────────────────────────────────
  loading   = signal(false);
  clients   = signal<any[]>([]);
  posts     = signal<any[]>([]);
  guards    = signal<any[]>([]);

  selectedClientId = signal<string>('');
  selectedPostId   = signal<string>('');
  selectedGuardId  = signal<string>('');

  currentYear  = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  // ── Opciones FullCalendar ────────────────────
  calendarOptions = signal<CalendarOptions>({
    plugins:       [dayGridPlugin, interactionPlugin],
    initialView:   'dayGridMonth',
    locale:        esLocale,
    headerToolbar: false,          // Usamos toolbar propio
    editable:      false,
    selectable:    true,
    selectMirror:  true,
    dayMaxEvents:  4,
    height:        'auto',
    events:        [],
    select:        (arg) => this.onDateSelect(arg),
    eventClick:    (arg) => this.onEventClick(arg),
    datesSet:      (arg) => this.onDatesSet(arg),
  });

  constructor(
    private scheduleService: ScheduleService,
    private clientService: ClientService,
    private postService: PostService,
    private guardService: GuardService,
    public  auth: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadClients();
    this.loadGuards();
    this.loadSchedules();
  }

  // ── Carga de datos maestros ──────────────────
  loadClients() {
    this.clientService.getAll().subscribe(c => this.clients.set(c));
  }

  onClientChange() {
    this.selectedPostId.set('');
    this.posts.set([]);
    if (this.selectedClientId()) {
      this.postService.getAll(this.selectedClientId())
        .subscribe(p => this.posts.set(p));
    }
    this.loadSchedules();
  }

  onPostChange()  { this.loadSchedules(); }
  onGuardChange() { this.loadSchedules(); }

  loadGuards() {
    this.guardService.getAll({ is_active: true })
      .subscribe(g => this.guards.set(g));
  }

  // ── Carga de programación ────────────────────
  loadSchedules() {
    this.loading.set(true);
    this.scheduleService.getCalendar({
      year:     this.currentYear,
      month:    this.currentMonth,
      post_id:  this.selectedPostId()  || undefined,
      guard_id: this.selectedGuardId() || undefined,
    }).subscribe({
      next: (schedules) => {
        this.calendarOptions.update(o => ({
          ...o,
          events: this.toCalendarEvents(schedules),
        }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Convierte respuesta API → eventos FullCalendar ──
  private toCalendarEvents(schedules: any[]): EventInput[] {
    return schedules.map(s => {
      // Si tiene novedad, muestra el código de novedad con su color
      const hasNovelty = !!s.novelty;
      const code  = hasNovelty ? s.novelty.novelty_type.code  : s.shift_config.code;
      const color = hasNovelty ? s.novelty.novelty_type.color_hex : s.shift_config.color_hex;
      const title = `${s.guard.full_name.split(' ')[0]} · ${code}`;

      return {
        id:               s.id,
        title,
        date:             s.date,
        backgroundColor:  color,
        borderColor:      color,
        textColor:        this.contrastColor(color),
        extendedProps:    { schedule: s },
      };
    });
  }

  // ── Navega el calendario ─────────────────────
  prevMonth() {
    if (this.currentMonth === 1) { this.currentMonth = 12; this.currentYear--; }
    else this.currentMonth--;
    this.loadSchedules();
  }

  nextMonth() {
    if (this.currentMonth === 12) { this.currentMonth = 1; this.currentYear++; }
    else this.currentMonth++;
    this.loadSchedules();
  }

  goToday() {
    this.currentYear  = new Date().getFullYear();
    this.currentMonth = new Date().getMonth() + 1;
    this.loadSchedules();
  }

  get monthLabel(): string {
    return new Date(this.currentYear, this.currentMonth - 1)
      .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  // Cuando FullCalendar cambia de mes por navegación interna
  onDatesSet(arg: any) {
    const d = new Date(arg.start);
    d.setDate(15); // centro del rango para evitar ambigüedad de mes
    if (d.getFullYear() !== this.currentYear || d.getMonth() + 1 !== this.currentMonth) {
      this.currentYear  = d.getFullYear();
      this.currentMonth = d.getMonth() + 1;
      this.loadSchedules();
    }
  }

  // ── Interacción con el calendario ───────────
  onDateSelect(arg: DateSelectArg) {
    if (!this.auth.canEdit()) return;
    this.openModal({ date: arg.startStr });
  }

  onEventClick(arg: EventClickArg) {
    const schedule = arg.event.extendedProps['schedule'];
    this.openModal({ schedule });
  }

  openModal(data: { date?: string; schedule?: any }) {
    const ref = this.dialog.open(ScheduleModalComponent, {
      width: '520px',
      data: {
        ...data,
        guards:  this.guards(),
        posts:   this.posts(),
        canEdit: this.auth.canEdit(),
      },
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadSchedules(); // Recarga si hubo cambios
    });
  }

  // Determina si el texto del evento debe ser blanco o negro según el fondo
  private contrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  }
}