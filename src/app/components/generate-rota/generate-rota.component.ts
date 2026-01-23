import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../services/staff.service';
import { ShiftConfigService } from '../../services/shift-config.service';
import { RotaEngineService } from '../../services/rota-engine.service';
import { RotaStore } from '../../services/rota-store.service';
import { ShiftType } from '../../models';

@Component({
  selector: 'app-generate-rota',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './generate-rota.component.html',
  styleUrl: './generate-rota.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateRotaComponent {
  private staffService = inject(StaffService);
  private shiftConfigService = inject(ShiftConfigService);
  private rotaEngineService = inject(RotaEngineService);
  private rotaStore = inject(RotaStore);

  // Expose ShiftType enum to template
  protected readonly ShiftType = ShiftType;

  // Signals
  protected periodStartValue = signal<string>(this.getNextMonday());

  get periodStart(): string {
    return this.periodStartValue();
  }

  set periodStart(value: string) {
    this.periodStartValue.set(value);
  }

  // Readonly signals from services
  protected staff = this.staffService.staff;
  protected config = this.shiftConfigService.hospitalConfig;
  protected rota = this.rotaStore.rota;
  protected generating = this.rotaStore.generating;
  protected error = this.rotaStore.error;

  // Computed readiness checks
  protected hasStaff = computed(() => this.staff().length > 0);
  protected hasConfig = computed(() => {
    const cfg = this.config();
    return cfg.defaultDayRequirement && cfg.defaultNightRequirement;
  });

  protected readinessMessage = computed(() => {
    const messages: string[] = [];
    if (!this.hasStaff()) {
      messages.push('Add staff members on the Staff page');
    }
    if (!this.hasConfig()) {
      messages.push('Configure shift requirements on the Shift Setup page');
    }
    return messages;
  });

  protected canGenerate = computed(() => this.readinessMessage().length === 0);

  // Compute grid data for display
  protected rotaGrid = computed(() => {
    const currentRota = this.rota();
    if (!currentRota) return null;

    const dates: string[] = [];
    const startDate = new Date(currentRota.periodStart);
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return {
      dates,
      staff: this.staff(),
      assignments: currentRota.assignments
    };
  });

  getStaffName(staffId: string): string {
    return this.staff().find(s => s.id === staffId)?.name || 'Unknown';
  }

  getAssignmentsForStaffAndDate(staffId: string, date: string): ShiftType[] {
    const currentRota = this.rota();
    if (!currentRota) return [];
    
    return currentRota.assignments
      .filter(a => a.staffId === staffId && a.date === date)
      .map(a => a.shiftType);
  }

  getDayOfWeek(date: string): string {
    const d = new Date(date);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  }

  isWeekend(date: string): boolean {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  generateRota(): void {
    if (!this.canGenerate()) {
      return;
    }

    this.rotaStore.setGenerating(true);
    this.rotaStore.clearError();

    try {
      const rota = this.rotaEngineService.generateRota(
        this.staff(),
        this.config(),
        this.periodStart
      );
      this.rotaStore.setRota(rota);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate rota';
      this.rotaStore.setError(message);
    } finally {
      this.rotaStore.setGenerating(false);
    }
  }

  regenerateRota(): void {
    this.rotaStore.clearRota();
    this.generateRota();
  }

  toggleShiftAssignment(staffId: string, date: string, shiftType: ShiftType): void {
    const currentRota = this.rota();
    if (!currentRota) return;

    const assignments = [...currentRota.assignments];
    const existingIndex = assignments.findIndex(
      a => a.staffId === staffId && a.date === date && a.shiftType === shiftType
    );

    if (existingIndex >= 0) {
      // Remove assignment
      assignments.splice(existingIndex, 1);
    } else {
      // Add assignment
      const shiftSlotId = `${date}-${shiftType}`;
      assignments.push({
        shiftSlotId,
        shiftType,
        date,
        staffId,
      });
    }

    // Update the store with new assignments
    this.rotaStore.updateAssignments(assignments);
  }

  private getNextMonday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate days until next Monday (0=Sunday, 1=Monday, etc.)
    // If today is Sunday (0), next Monday is in 1 day
    // If today is Monday-Saturday (1-6), next Monday is (8 - dayOfWeek) days away
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }
}
