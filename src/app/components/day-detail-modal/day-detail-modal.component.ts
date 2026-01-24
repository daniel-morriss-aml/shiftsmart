import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { DaySummary } from '../../services/day-summary.service';
import { RuleViolationSeverity } from '../../models';

@Component({
  selector: 'app-day-detail-modal',
  imports: [CommonModule, ModalComponent],
  templateUrl: './day-detail-modal.component.html',
  styleUrl: './day-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayDetailModalComponent {
  isOpen = input(false);
  daySummary = input<DaySummary | null>(null);
  close = output<void>();

  protected readonly RuleViolationSeverity = RuleViolationSeverity;

  onClose(): void {
    this.close.emit();
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
