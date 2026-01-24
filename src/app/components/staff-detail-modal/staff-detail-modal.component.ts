import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { StaffMember, StaffWorkSummary } from '../../models';

@Component({
  selector: 'app-staff-detail-modal',
  imports: [CommonModule, ModalComponent],
  templateUrl: './staff-detail-modal.component.html',
  styleUrl: './staff-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffDetailModalComponent {
  isOpen = input(false);
  staffMember = input<StaffMember | null>(null);
  workSummary = input<StaffWorkSummary | null>(null);
  close = output<void>();

  protected readonly weekDifference = computed(() => {
    const summary = this.workSummary();
    if (!summary) return 0;
    return Math.abs(summary.week1Assigned - summary.week2Assigned);
  });

  onClose(): void {
    this.close.emit();
  }

  getAvailabilityText(availability: {
    canWorkDays: boolean;
    canWorkNights: boolean;
    canWorkWeekends: boolean;
  }): string[] {
    const text: string[] = [];
    if (availability.canWorkDays) text.push('Days');
    if (availability.canWorkNights) text.push('Nights');
    if (availability.canWorkWeekends) text.push('Weekends');
    return text.length > 0 ? text : ['None specified'];
  }
}
