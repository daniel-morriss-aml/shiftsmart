import { Component, computed, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { DaySummary } from '../../services/day-summary.service';
import { RuleViolationSeverity, ShiftType, StaffMember } from '../../models';
import { RotaStore } from '../../services/rota-store.service';
import { StaffService } from '../../services/staff.service';

@Component({
  selector: 'app-day-detail-modal',
  imports: [CommonModule, ModalComponent],
  templateUrl: './day-detail-modal.component.html',
  styleUrl: './day-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayDetailModalComponent {
  private readonly rotaStore = inject(RotaStore);
  private readonly staffService = inject(StaffService);

  isOpen = input(false);
  daySummary = input<DaySummary | null>(null);
  close = output<void>();
  dayUpdated = output<void>();

  protected readonly RuleViolationSeverity = RuleViolationSeverity;
  protected readonly ShiftType = ShiftType;

  protected readonly staff = this.staffService.staff;
  protected readonly rota = this.rotaStore.rota;

  protected readonly assignedByShift = computed(() => {
    const summary = this.daySummary();
    const rota = this.rota();

    if (!summary || !rota) {
      return new Map<ShiftType, string[]>();
    }

    const map = new Map<ShiftType, string[]>();
    for (const shiftType of [ShiftType.Day, ShiftType.Night]) {
      const assignedStaffIds = rota.assignments
        .filter((assignment) => assignment.date === summary.date && assignment.shiftType === shiftType)
        .map((assignment) => assignment.staffId);

      map.set(shiftType, assignedStaffIds);
    }

    return map;
  });

  onClose(): void {
    this.close.emit();
  }

  toggleStaffForShift(staffId: string, shiftType: ShiftType): void {
    const summary = this.daySummary();
    const rota = this.rota();

    if (!summary || !rota) {
      return;
    }

    const assignments = [...rota.assignments];
    const existingIndex = assignments.findIndex(
      (assignment) =>
        assignment.date === summary.date &&
        assignment.shiftType === shiftType &&
        assignment.staffId === staffId
    );

    if (existingIndex >= 0) {
      assignments.splice(existingIndex, 1);
    } else {
      assignments.push({
        shiftSlotId: `${summary.date}-${shiftType}-${staffId}`,
        date: summary.date,
        shiftType,
        staffId,
      });
    }

    this.rotaStore.updateAssignments(assignments);
    this.dayUpdated.emit();
  }

  getAssignedStaffForShift(shiftType: ShiftType): StaffMember[] {
    const summary = this.daySummary();
    const rota = this.rota();

    if (!summary || !rota) {
      return [];
    }

    const assignedIds = new Set(
      rota.assignments
        .filter((assignment) => assignment.date === summary.date && assignment.shiftType === shiftType)
        .map((assignment) => assignment.staffId)
    );

    return this.staff().filter((member) => assignedIds.has(member.id));
  }

  getUnassignedStaffForShift(shiftType: ShiftType): StaffMember[] {
    const summary = this.daySummary();
    const rota = this.rota();

    if (!summary || !rota) {
      return [];
    }

    const assignedIds = new Set(
      rota.assignments
        .filter((assignment) => assignment.date === summary.date && assignment.shiftType === shiftType)
        .map((assignment) => assignment.staffId)
    );

    return this.staff().filter((member) => !assignedIds.has(member.id));
  }

  getModalTitle(): string {
    const summary = this.daySummary();
    if (!summary || !summary.date) {
      return 'Day Details';
    }
    return `${this.getDayOfWeek(summary.date)} - ${this.formatDate(summary.date)}`;
  }

  getDayOfWeek(date: string): string {
    const d = new Date(date);
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      d.getDay()
    ];
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  getSeverityClass(severity: RuleViolationSeverity): string {
    switch (severity) {
      case RuleViolationSeverity.HardViolation:
        return 'text-red-700 bg-red-50';
      case RuleViolationSeverity.SoftViolation:
        return 'text-yellow-700 bg-yellow-50';
      case RuleViolationSeverity.Satisfied:
        return 'text-green-700 bg-green-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  }

  getSeverityLabel(severity: RuleViolationSeverity): string {
    switch (severity) {
      case RuleViolationSeverity.HardViolation:
        return 'Critical';
      case RuleViolationSeverity.SoftViolation:
        return 'Warning';
      case RuleViolationSeverity.Satisfied:
        return 'Satisfied';
      default:
        return 'Unknown';
    }
  }
}
