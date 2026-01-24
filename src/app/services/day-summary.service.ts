import { Injectable } from '@angular/core';
import {
  Gender,
  Role,
  RuleValidation,
  RuleViolationSeverity,
  ShiftAssignment,
  ShiftType,
  StaffMember,
} from '../models';

export interface ShiftSummary {
  nurses: {
    male: number;
    female: number;
    other: number;
  };
  ras: {
    male: number;
    female: number;
    other: number;
  };
}

export interface DaySummary {
  date: string;
  dayShift: ShiftSummary;
  nightShift: ShiftSummary;
  validations: RuleValidation[];
  hasCriticalViolations: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DaySummaryService {
  /**
   * Computes summary statistics for a specific day
   */
  getDaySummary(
    date: string,
    assignments: ShiftAssignment[],
    staff: StaffMember[],
    allValidations: RuleValidation[]
  ): DaySummary {
    const dayAssignments = assignments.filter((a) => a.date === date);

    const dayShiftSummary = this.computeShiftSummary(
      dayAssignments.filter((a) => a.shiftType === ShiftType.Day),
      staff
    );

    const nightShiftSummary = this.computeShiftSummary(
      dayAssignments.filter((a) => a.shiftType === ShiftType.Night),
      staff
    );

    // Filter validations relevant to this day
    const dayValidations = this.getValidationsForDay(date, allValidations);

    const hasCriticalViolations = dayValidations.some(
      (v) => v.severity === RuleViolationSeverity.HardViolation
    );

    return {
      date,
      dayShift: dayShiftSummary,
      nightShift: nightShiftSummary,
      validations: dayValidations,
      hasCriticalViolations,
    };
  }

  private computeShiftSummary(
    assignments: ShiftAssignment[],
    staff: StaffMember[]
  ): ShiftSummary {
    const summary: ShiftSummary = {
      nurses: { male: 0, female: 0, other: 0 },
      ras: { male: 0, female: 0, other: 0 },
    };

    for (const assignment of assignments) {
      const member = staff.find((s) => s.id === assignment.staffId);
      if (!member) continue;

      const genderKey =
        member.gender === Gender.Male
          ? 'male'
          : member.gender === Gender.Female
            ? 'female'
            : 'other';

      if (member.role === Role.Nurse) {
        summary.nurses[genderKey]++;
      } else if (member.role === Role.RA) {
        summary.ras[genderKey]++;
      }
    }

    return summary;
  }

  private getValidationsForDay(date: string, validations: RuleValidation[]): RuleValidation[] {
    const dayValidations: RuleValidation[] = [];

    for (const validation of validations) {
      // Filter validation details that mention this date using exact word boundary matching
      const relevantDetails = validation.details.filter((detail) => {
        // Use word boundary regex to match the exact date format
        const datePattern = new RegExp(`\\b${date}\\b`);
        return datePattern.test(detail);
      });

      if (relevantDetails.length > 0) {
        // Create a filtered copy of the validation with only relevant details
        // Note: violationCount represents day-specific violations, not total violations across the rota
        dayValidations.push({
          ...validation,
          details: relevantDetails,
          violationCount: relevantDetails.length,
        });
      }
    }

    return dayValidations;
  }
}
