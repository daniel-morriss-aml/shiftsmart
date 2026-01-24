import { TestBed } from '@angular/core/testing';
import { DaySummaryService } from './day-summary.service';
import {
  Gender,
  Role,
  RuleValidation,
  RuleViolationSeverity,
  ShiftAssignment,
  ShiftType,
  StaffMember,
} from '../models';

describe('DaySummaryService', () => {
  let service: DaySummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DaySummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDaySummary', () => {
    const mockStaff: StaffMember[] = [
      {
        id: '1',
        name: 'Alice',
        gender: Gender.Female,
        role: Role.Nurse,
        availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
        shiftsPerFortnight: 7,
      },
      {
        id: '2',
        name: 'Bob',
        gender: Gender.Male,
        role: Role.RA,
        availability: { canWorkDays: true, canWorkNights: false, canWorkWeekends: true },
        shiftsPerFortnight: 5,
      },
      {
        id: '3',
        name: 'Charlie',
        gender: Gender.Male,
        role: Role.Nurse,
        availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: false },
        shiftsPerFortnight: 6,
      },
      {
        id: '4',
        name: 'Diana',
        gender: Gender.Other,
        role: Role.RA,
        availability: { canWorkDays: false, canWorkNights: true, canWorkWeekends: true },
        shiftsPerFortnight: 4,
      },
    ];

    it('should compute day shift summary correctly', () => {
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-26-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-26',
          staffId: '1',
        },
        {
          shiftSlotId: '2026-01-26-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-26',
          staffId: '2',
        },
        {
          shiftSlotId: '2026-01-26-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-26',
          staffId: '3',
        },
      ];

      const summary = service.getDaySummary('2026-01-26', assignments, mockStaff, []);

      expect(summary.dayShift.nurses.female).toBe(1);
      expect(summary.dayShift.nurses.male).toBe(1);
      expect(summary.dayShift.nurses.other).toBe(0);
      expect(summary.dayShift.ras.male).toBe(1);
      expect(summary.dayShift.ras.female).toBe(0);
      expect(summary.dayShift.ras.other).toBe(0);
    });

    it('should compute night shift summary correctly', () => {
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-26-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-26',
          staffId: '1',
        },
        {
          shiftSlotId: '2026-01-26-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-26',
          staffId: '4',
        },
      ];

      const summary = service.getDaySummary('2026-01-26', assignments, mockStaff, []);

      expect(summary.nightShift.nurses.female).toBe(1);
      expect(summary.nightShift.ras.other).toBe(1);
    });

    it('should handle missing staff gracefully', () => {
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-26-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-26',
          staffId: 'unknown',
        },
      ];

      const summary = service.getDaySummary('2026-01-26', assignments, mockStaff, []);

      expect(summary.dayShift.nurses.female).toBe(0);
      expect(summary.dayShift.nurses.male).toBe(0);
      expect(summary.dayShift.ras.male).toBe(0);
    });

    it('should filter validations by date correctly', () => {
      const validations: RuleValidation[] = [
        {
          ruleId: 'test-rule',
          ruleName: 'Test Rule',
          description: 'Test description',
          severity: RuleViolationSeverity.HardViolation,
          violationCount: 3,
          details: [
            'Shift 2026-01-26-Day has only 1 male RA(s), requires 2',
            'Shift 2026-01-27-Day has only 0 male RA(s), requires 2',
            'Shift 2026-01-26-Night has only 0 male RA(s), requires 2',
          ],
        },
      ];

      const summary = service.getDaySummary('2026-01-26', [], mockStaff, validations);

      expect(summary.validations.length).toBe(1);
      expect(summary.validations[0].details.length).toBe(2);
      expect(summary.validations[0].violationCount).toBe(2);
    });

    it('should not match partial date strings', () => {
      const validations: RuleValidation[] = [
        {
          ruleId: 'test-rule',
          ruleName: 'Test Rule',
          description: 'Test description',
          severity: RuleViolationSeverity.HardViolation,
          violationCount: 2,
          details: [
            'Shift 2026-01-26-Day has only 1 male RA(s), requires 2',
            'Shift 2026-01-261-Day has only 0 male RA(s), requires 2', // Should not match
          ],
        },
      ];

      const summary = service.getDaySummary('2026-01-26', [], mockStaff, validations);

      expect(summary.validations[0].details.length).toBe(1);
      expect(summary.validations[0].details[0]).toContain('2026-01-26-Day');
    });

    it('should detect critical violations correctly', () => {
      const validations: RuleValidation[] = [
        {
          ruleId: 'hard-rule',
          ruleName: 'Hard Rule',
          description: 'Test',
          severity: RuleViolationSeverity.HardViolation,
          violationCount: 1,
          details: ['Shift 2026-01-26-Day has violation'],
        },
      ];

      const summary = service.getDaySummary('2026-01-26', [], mockStaff, validations);

      expect(summary.hasCriticalViolations).toBe(true);
    });

    it('should not flag soft violations as critical', () => {
      const validations: RuleValidation[] = [
        {
          ruleId: 'soft-rule',
          ruleName: 'Soft Rule',
          description: 'Test',
          severity: RuleViolationSeverity.SoftViolation,
          violationCount: 1,
          details: ['Shift 2026-01-26-Day has soft violation'],
        },
      ];

      const summary = service.getDaySummary('2026-01-26', [], mockStaff, validations);

      expect(summary.hasCriticalViolations).toBe(false);
    });

    it('should return empty summaries for dates with no assignments', () => {
      const summary = service.getDaySummary('2026-01-26', [], mockStaff, []);

      expect(summary.dayShift.nurses.female).toBe(0);
      expect(summary.dayShift.nurses.male).toBe(0);
      expect(summary.nightShift.nurses.female).toBe(0);
      expect(summary.nightShift.nurses.male).toBe(0);
      expect(summary.validations.length).toBe(0);
      expect(summary.hasCriticalViolations).toBe(false);
    });
  });
});
