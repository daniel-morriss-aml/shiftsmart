import { TestBed } from '@angular/core/testing';
import { RotaValidationService } from './rota-validation.service';
import {
  Gender,
  Role,
  ShiftType,
  StaffMember,
  ShiftAssignment,
  StaffWorkSummary,
  RuleViolationSeverity,
} from '../models';

describe('RotaValidationService', () => {
  let service: RotaValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RotaValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateRota', () => {
    it('should return validation results with all rules', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      const assignments: ShiftAssignment[] = [];
      const summaries: StaffWorkSummary[] = [
        {
          staffId: 'staff1',
          totalAssigned: 0,
          week1Assigned: 0,
          week2Assigned: 0,
          weekendCount: 0,
          nightCount: 0,
          dayCount: 0,
        },
      ];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');

      expect(result).toBeTruthy();
      expect(result.rules).toBeDefined();
      expect(result.rules.length).toBe(4); // 4 validation rules
      expect(result.hasHardViolations).toBeDefined();
      expect(result.hasSoftViolations).toBeDefined();
    });

    it('should detect hard violations when minimum male RAs not met', () => {
      const staff: StaffMember[] = [
        {
          id: 'nurse1',
          name: 'Jane Nurse',
          gender: Gender.Female,
          role: Role.Nurse,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'nurse1',
        },
      ];

      const summaries: StaffWorkSummary[] = [
        {
          staffId: 'nurse1',
          totalAssigned: 1,
          week1Assigned: 1,
          week2Assigned: 0,
          weekendCount: 0,
          nightCount: 0,
          dayCount: 1,
        },
      ];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');

      expect(result.hasHardViolations).toBe(true);
      const genderRule = result.rules.find((r) => r.ruleId === 'gender-requirement');
      expect(genderRule?.severity).toBe(RuleViolationSeverity.HardViolation);
    });

    it('should return no violations for valid rota', () => {
      const staff: StaffMember[] = [
        {
          id: 'ra1',
          name: 'Male RA 1',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
        {
          id: 'ra2',
          name: 'Male RA 2',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra1',
        },
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra2',
        },
      ];

      const summaries: StaffWorkSummary[] = [
        {
          staffId: 'ra1',
          totalAssigned: 1,
          week1Assigned: 1,
          week2Assigned: 0,
          weekendCount: 0,
          nightCount: 0,
          dayCount: 1,
        },
        {
          staffId: 'ra2',
          totalAssigned: 1,
          week1Assigned: 1,
          week2Assigned: 0,
          weekendCount: 0,
          nightCount: 0,
          dayCount: 1,
        },
      ];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');

      expect(result.hasHardViolations).toBe(false);
      expect(result.hasSoftViolations).toBe(false);
    });
  });

  describe('validateWeekendRule', () => {
    it('should detect partial weekend assignments as soft violations', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Saturday only, no Sunday (2026-01-10 is Saturday, 2026-01-11 is Sunday)
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-10-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-10',
          staffId: 'staff1',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const weekendRule = result.rules.find((r) => r.ruleId === 'weekend-grouping');

      expect(weekendRule).toBeTruthy();
      expect(weekendRule?.severity).toBe(RuleViolationSeverity.SoftViolation);
      expect(weekendRule?.violationCount).toBeGreaterThan(0);
      expect(weekendRule?.details.length).toBeGreaterThan(0);
    });

    it('should pass when staff works both Saturday and Sunday', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Both Saturday and Sunday (2026-01-10 is Saturday, 2026-01-11 is Sunday)
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-10-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-10',
          staffId: 'staff1',
        },
        {
          shiftSlotId: '2026-01-11-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-11',
          staffId: 'staff1',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const weekendRule = result.rules.find((r) => r.ruleId === 'weekend-grouping');

      expect(weekendRule).toBeTruthy();
      expect(weekendRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(weekendRule?.violationCount).toBe(0);
    });

    it('should pass when no weekend assignments exist', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-06-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-06', // Monday
          staffId: 'staff1',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-06');
      const weekendRule = result.rules.find((r) => r.ruleId === 'weekend-grouping');

      expect(weekendRule).toBeTruthy();
      expect(weekendRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(weekendRule?.violationCount).toBe(0);
    });
  });

  describe('validateNightBlockRule', () => {
    it('should detect isolated night shifts as soft violations', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Single isolated night shift with gaps
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-05',
          staffId: 'staff1',
        },
        // Gap of 2 days
        {
          shiftSlotId: '2026-01-08-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-08',
          staffId: 'staff1',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const nightRule = result.rules.find((r) => r.ruleId === 'night-blocking');

      expect(nightRule).toBeTruthy();
      expect(nightRule?.severity).toBe(RuleViolationSeverity.SoftViolation);
      expect(nightRule?.violationCount).toBeGreaterThan(0);
    });

    it('should pass when night shifts are in consecutive blocks', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Consecutive night shifts (block of 3)
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-05',
          staffId: 'staff1',
        },
        {
          shiftSlotId: '2026-01-06-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-06',
          staffId: 'staff1',
        },
        {
          shiftSlotId: '2026-01-07-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-07',
          staffId: 'staff1',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const nightRule = result.rules.find((r) => r.ruleId === 'night-blocking');

      expect(nightRule).toBeTruthy();
      expect(nightRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(nightRule?.violationCount).toBe(0);
    });

    it('should pass when no night shifts exist', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Only day shifts
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'staff1',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const nightRule = result.rules.find((r) => r.ruleId === 'night-blocking');

      expect(nightRule).toBeTruthy();
      expect(nightRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(nightRule?.violationCount).toBe(0);
    });
  });

  describe('validateWeekBalanceRule', () => {
    it('should detect unbalanced week assignments as soft violations', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Unbalanced: 5 in week 1, 1 in week 2 (difference of 4, which is > 1)
      const summaries: StaffWorkSummary[] = [
        {
          staffId: 'staff1',
          totalAssigned: 6,
          week1Assigned: 5,
          week2Assigned: 1,
          weekendCount: 0,
          nightCount: 0,
          dayCount: 6,
        },
      ];

      const result = service.validateRota([], summaries, staff, '2026-01-05');
      const balanceRule = result.rules.find((r) => r.ruleId === 'week-balance');

      expect(balanceRule).toBeTruthy();
      expect(balanceRule?.severity).toBe(RuleViolationSeverity.SoftViolation);
      expect(balanceRule?.violationCount).toBeGreaterThan(0);
      expect(balanceRule?.details.length).toBeGreaterThan(0);
    });

    it('should pass when week assignments are balanced within tolerance', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Balanced: 3 in week 1, 3 in week 2 (difference of 0)
      const summaries: StaffWorkSummary[] = [
        {
          staffId: 'staff1',
          totalAssigned: 6,
          week1Assigned: 3,
          week2Assigned: 3,
          weekendCount: 0,
          nightCount: 0,
          dayCount: 6,
        },
      ];

      const result = service.validateRota([], summaries, staff, '2026-01-05');
      const balanceRule = result.rules.find((r) => r.ruleId === 'week-balance');

      expect(balanceRule).toBeTruthy();
      expect(balanceRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(balanceRule?.violationCount).toBe(0);
    });

    it('should pass when week assignments differ by exactly 1', () => {
      const staff: StaffMember[] = [
        {
          id: 'staff1',
          name: 'John Doe',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Acceptable: 4 in week 1, 3 in week 2 (difference of 1, which is allowed)
      const summaries: StaffWorkSummary[] = [
        {
          staffId: 'staff1',
          totalAssigned: 7,
          week1Assigned: 4,
          week2Assigned: 3,
          weekendCount: 0,
          nightCount: 0,
          dayCount: 7,
        },
      ];

      const result = service.validateRota([], summaries, staff, '2026-01-05');
      const balanceRule = result.rules.find((r) => r.ruleId === 'week-balance');

      expect(balanceRule).toBeTruthy();
      expect(balanceRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(balanceRule?.violationCount).toBe(0);
    });
  });

  describe('validateGenderRule', () => {
    it('should detect missing male RAs as hard violations', () => {
      const staff: StaffMember[] = [
        {
          id: 'nurse1',
          name: 'Jane Nurse',
          gender: Gender.Female,
          role: Role.Nurse,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
        {
          id: 'ra1',
          name: 'Female RA',
          gender: Gender.Female,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Shift with 0 male RAs (needs 2)
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'nurse1',
        },
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra1',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const genderRule = result.rules.find((r) => r.ruleId === 'gender-requirement');

      expect(genderRule).toBeTruthy();
      expect(genderRule?.severity).toBe(RuleViolationSeverity.HardViolation);
      expect(genderRule?.violationCount).toBeGreaterThan(0);
      expect(genderRule?.details.length).toBeGreaterThan(0);
    });

    it('should detect shifts with only 1 male RA as violations', () => {
      const staff: StaffMember[] = [
        {
          id: 'ra1',
          name: 'Male RA',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
        {
          id: 'ra2',
          name: 'Female RA',
          gender: Gender.Female,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Shift with only 1 male RA (needs 2)
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra1',
        },
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra2',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const genderRule = result.rules.find((r) => r.ruleId === 'gender-requirement');

      expect(genderRule).toBeTruthy();
      expect(genderRule?.severity).toBe(RuleViolationSeverity.HardViolation);
      expect(genderRule?.violationCount).toBe(1);
    });

    it('should pass when shift has at least 2 male RAs', () => {
      const staff: StaffMember[] = [
        {
          id: 'ra1',
          name: 'Male RA 1',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
        {
          id: 'ra2',
          name: 'Male RA 2',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Shift with 2 male RAs
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra1',
        },
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra2',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const genderRule = result.rules.find((r) => r.ruleId === 'gender-requirement');

      expect(genderRule).toBeTruthy();
      expect(genderRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(genderRule?.violationCount).toBe(0);
    });

    it('should pass with more than 2 male RAs', () => {
      const staff: StaffMember[] = [
        {
          id: 'ra1',
          name: 'Male RA 1',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
        {
          id: 'ra2',
          name: 'Male RA 2',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
        {
          id: 'ra3',
          name: 'Male RA 3',
          gender: Gender.Male,
          role: Role.RA,
          availability: { canWorkDays: true, canWorkNights: true, canWorkWeekends: true },
          shiftsPerFortnight: 7,
        },
      ];

      // Shift with 3 male RAs
      const assignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra1',
        },
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra2',
        },
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'ra3',
        },
      ];

      const summaries: StaffWorkSummary[] = [];

      const result = service.validateRota(assignments, summaries, staff, '2026-01-05');
      const genderRule = result.rules.find((r) => r.ruleId === 'gender-requirement');

      expect(genderRule).toBeTruthy();
      expect(genderRule?.severity).toBe(RuleViolationSeverity.Satisfied);
      expect(genderRule?.violationCount).toBe(0);
    });
  });
});
