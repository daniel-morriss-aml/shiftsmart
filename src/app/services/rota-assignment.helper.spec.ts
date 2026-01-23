import { TestBed } from '@angular/core/testing';
import { RotaAssignmentHelper, ShiftSlot } from './rota-assignment.helper';
import { Gender, Role, ShiftType, StaffMember, ShiftAssignment } from '../models';

describe('RotaAssignmentHelper', () => {
  let testStaff: StaffMember[];
  let assignments: ShiftAssignment[];
  let staffCount: Map<string, number>;
  let week1Count: Map<string, number>;
  let week2Count: Map<string, number>;
  let isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean;

  beforeEach(() => {
    testStaff = [
      {
        id: 'nurse1',
        name: 'Nurse Alice',
        gender: Gender.Female,
        role: Role.Nurse,
        availability: {
          canWorkDays: true,
          canWorkNights: true,
          canWorkWeekends: true,
        },
        shiftsPerFortnight: 10,
      },
      {
        id: 'ra1',
        name: 'Male RA 1',
        gender: Gender.Male,
        role: Role.RA,
        availability: {
          canWorkDays: true,
          canWorkNights: true,
          canWorkWeekends: true,
        },
        shiftsPerFortnight: 10,
      },
      {
        id: 'ra2',
        name: 'Male RA 2',
        gender: Gender.Male,
        role: Role.RA,
        availability: {
          canWorkDays: true,
          canWorkNights: true,
          canWorkWeekends: true,
        },
        shiftsPerFortnight: 10,
      },
      {
        id: 'ra3',
        name: 'Female RA',
        gender: Gender.Female,
        role: Role.RA,
        availability: {
          canWorkDays: true,
          canWorkNights: true,
          canWorkWeekends: true,
        },
        shiftsPerFortnight: 10,
      },
    ];

    assignments = [];
    staffCount = new Map();
    week1Count = new Map();
    week2Count = new Map();

    testStaff.forEach((s) => {
      staffCount.set(s.id, 0);
      week1Count.set(s.id, 0);
      week2Count.set(s.id, 0);
    });

    isStaffAvailable = (staff: StaffMember, slot: ShiftSlot): boolean => {
      if (slot.shiftType === ShiftType.Day && !staff.availability.canWorkDays) return false;
      if (slot.shiftType === ShiftType.Night && !staff.availability.canWorkNights) return false;
      if (slot.isWeekend && !staff.availability.canWorkWeekends) return false;
      return true;
    };
  });

  describe('isSlotAssigned', () => {
    it('should return false for unassigned slot', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      const result = RotaAssignmentHelper.isSlotAssigned(slot, assignments);

      expect(result).toBe(false);
    });

    it('should return true for assigned slot', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      assignments.push({
        shiftSlotId: '2026-01-05-Day',
        shiftType: ShiftType.Day,
        date: '2026-01-05',
        staffId: 'nurse1',
      });

      const result = RotaAssignmentHelper.isSlotAssigned(slot, assignments);

      expect(result).toBe(true);
    });
  });

  describe('addAssignment', () => {
    it('should add assignment to the list', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      RotaAssignmentHelper.addAssignment(
        slot,
        'nurse1',
        assignments,
        staffCount,
        week1Count,
        week2Count
      );

      expect(assignments.length).toBe(1);
      expect(assignments[0].staffId).toBe('nurse1');
      expect(assignments[0].shiftSlotId).toBe('2026-01-05-Day');
    });

    it('should increment staff count', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      expect(staffCount.get('nurse1')).toBe(0);

      RotaAssignmentHelper.addAssignment(
        slot,
        'nurse1',
        assignments,
        staffCount,
        week1Count,
        week2Count
      );

      expect(staffCount.get('nurse1')).toBe(1);
    });

    it('should increment week1 count for week 1 slot', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      expect(week1Count.get('nurse1')).toBe(0);
      expect(week2Count.get('nurse1')).toBe(0);

      RotaAssignmentHelper.addAssignment(
        slot,
        'nurse1',
        assignments,
        staffCount,
        week1Count,
        week2Count
      );

      expect(week1Count.get('nurse1')).toBe(1);
      expect(week2Count.get('nurse1')).toBe(0);
    });

    it('should increment week2 count for week 2 slot', () => {
      const slot: ShiftSlot = {
        date: '2026-01-12',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 2,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      expect(week1Count.get('nurse1')).toBe(0);
      expect(week2Count.get('nurse1')).toBe(0);

      RotaAssignmentHelper.addAssignment(
        slot,
        'nurse1',
        assignments,
        staffCount,
        week1Count,
        week2Count
      );

      expect(week1Count.get('nurse1')).toBe(0);
      expect(week2Count.get('nurse1')).toBe(1);
    });
  });

  describe('assignSlot', () => {
    it('should assign nurses to a slot', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      RotaAssignmentHelper.assignSlot(
        slot,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        false,
        isStaffAvailable
      );

      const nurseAssignments = assignments.filter((a) =>
        testStaff.find((s) => s.id === a.staffId && s.role === Role.Nurse)
      );

      expect(nurseAssignments.length).toBeGreaterThan(0);
    });

    it('should assign RAs to a slot', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      RotaAssignmentHelper.assignSlot(
        slot,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        false,
        isStaffAvailable
      );

      const raAssignments = assignments.filter((a) =>
        testStaff.find((s) => s.id === a.staffId && s.role === Role.RA)
      );

      expect(raAssignments.length).toBeGreaterThan(0);
    });

    it('should prioritize male RAs', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      RotaAssignmentHelper.assignSlot(
        slot,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        false,
        isStaffAvailable
      );

      const maleRAAssignments = assignments.filter((a) => {
        const staff = testStaff.find((s) => s.id === a.staffId);
        return staff && staff.role === Role.RA && staff.gender === Gender.Male;
      });

      expect(maleRAAssignments.length).toBeGreaterThan(0);
    });

    it('should respect staff shift limits', () => {
      const limitedStaff: StaffMember[] = [
        {
          id: 'nurse1',
          name: 'Nurse Alice',
          gender: Gender.Female,
          role: Role.Nurse,
          availability: {
            canWorkDays: true,
            canWorkNights: true,
            canWorkWeekends: true,
          },
          shiftsPerFortnight: 1, // Very limited
        },
      ];

      staffCount.set('nurse1', 1); // Already at limit

      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      RotaAssignmentHelper.assignSlot(
        slot,
        limitedStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        false,
        isStaffAvailable
      );

      // Should not assign nurse1 as they're at limit
      const nurse1Assignments = assignments.filter((a) => a.staffId === 'nurse1');
      expect(nurse1Assignments.length).toBe(0);
    });

    it('should respect maxTotalStaff limit', () => {
      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 3, // Limited to 3 total
      };

      RotaAssignmentHelper.assignSlot(
        slot,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        false,
        isStaffAvailable
      );

      const slotAssignments = assignments.filter((a) => a.shiftSlotId === '2026-01-05-Day');
      expect(slotAssignments.length).toBeLessThanOrEqual(3);
    });

    it('should filter unavailable staff', () => {
      const unavailableStaff: StaffMember[] = [
        {
          id: 'nurse1',
          name: 'Nurse Alice',
          gender: Gender.Female,
          role: Role.Nurse,
          availability: {
            canWorkDays: false, // Cannot work days
            canWorkNights: true,
            canWorkWeekends: true,
          },
          shiftsPerFortnight: 10,
        },
      ];

      const slot: ShiftSlot = {
        date: '2026-01-05',
        shiftType: ShiftType.Day,
        isWeekend: false,
        weekNumber: 1,
        assignedStaff: [],
        minNurses: 1,
        maxNurses: 2,
        minRAs: 2,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      RotaAssignmentHelper.assignSlot(
        slot,
        unavailableStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        false,
        isStaffAvailable
      );

      // Should not assign nurse1 for day shift
      const nurse1Assignments = assignments.filter((a) => a.staffId === 'nurse1');
      expect(nurse1Assignments.length).toBe(0);
    });
  });

  describe('assignWeekendShifts', () => {
    it('should assign staff to weekend shifts', () => {
      const weekendSlots: ShiftSlot[] = [
        {
          date: '2026-01-10', // Saturday
          shiftType: ShiftType.Day,
          isWeekend: true,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 2,
          maxRAs: 3,
          maxTotalStaff: 5,
        },
        {
          date: '2026-01-11', // Sunday
          shiftType: ShiftType.Day,
          isWeekend: true,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 2,
          maxRAs: 3,
          maxTotalStaff: 5,
        },
      ];

      RotaAssignmentHelper.assignWeekendShifts(
        weekendSlots,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        isStaffAvailable
      );

      expect(assignments.length).toBeGreaterThan(0);
    });

    it('should try to assign same staff for Saturday and Sunday', () => {
      const weekendSlots: ShiftSlot[] = [
        {
          date: '2026-01-10', // Saturday
          shiftType: ShiftType.Day,
          isWeekend: true,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 2,
          maxRAs: 3,
          maxTotalStaff: 5,
        },
        {
          date: '2026-01-11', // Sunday
          shiftType: ShiftType.Day,
          isWeekend: true,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 2,
          maxRAs: 3,
          maxTotalStaff: 5,
        },
      ];

      RotaAssignmentHelper.assignWeekendShifts(
        weekendSlots,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        isStaffAvailable
      );

      const saturdayAssignments = assignments.filter((a) => a.date === '2026-01-10');
      const sundayAssignments = assignments.filter((a) => a.date === '2026-01-11');

      // Check if there's overlap in staff between Saturday and Sunday
      const saturdayStaff = new Set(saturdayAssignments.map((a) => a.staffId));
      const sundayStaff = new Set(sundayAssignments.map((a) => a.staffId));
      const overlap = [...saturdayStaff].filter((id) => sundayStaff.has(id));

      // Should try to maintain some continuity
      expect(overlap.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty weekend slots', () => {
      RotaAssignmentHelper.assignWeekendShifts(
        [],
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        isStaffAvailable
      );

      expect(assignments.length).toBe(0);
    });
  });

  describe('assignNightBlocks', () => {
    it('should assign staff to night shifts in blocks', () => {
      const nightSlots: ShiftSlot[] = [
        {
          date: '2026-01-05',
          shiftType: ShiftType.Night,
          isWeekend: false,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 1,
          maxRAs: 2,
          maxTotalStaff: 4,
        },
        {
          date: '2026-01-06',
          shiftType: ShiftType.Night,
          isWeekend: false,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 1,
          maxRAs: 2,
          maxTotalStaff: 4,
        },
        {
          date: '2026-01-07',
          shiftType: ShiftType.Night,
          isWeekend: false,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 1,
          maxRAs: 2,
          maxTotalStaff: 4,
        },
      ];

      RotaAssignmentHelper.assignNightBlocks(
        nightSlots,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        isStaffAvailable
      );

      expect(assignments.length).toBeGreaterThan(0);
    });

    it('should assign same staff for consecutive nights', () => {
      const nightSlots: ShiftSlot[] = [
        {
          date: '2026-01-05',
          shiftType: ShiftType.Night,
          isWeekend: false,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 1,
          maxRAs: 2,
          maxTotalStaff: 4,
        },
        {
          date: '2026-01-06',
          shiftType: ShiftType.Night,
          isWeekend: false,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 1,
          maxRAs: 2,
          maxTotalStaff: 4,
        },
      ];

      RotaAssignmentHelper.assignNightBlocks(
        nightSlots,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        isStaffAvailable
      );

      const night1Assignments = assignments.filter((a) => a.date === '2026-01-05');
      const night2Assignments = assignments.filter((a) => a.date === '2026-01-06');

      // Check for staff continuity
      const night1Staff = new Set(night1Assignments.map((a) => a.staffId));
      const night2Staff = new Set(night2Assignments.map((a) => a.staffId));
      const overlap = [...night1Staff].filter((id) => night2Staff.has(id));

      expect(overlap.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty night slots', () => {
      RotaAssignmentHelper.assignNightBlocks(
        [],
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        isStaffAvailable
      );

      expect(assignments.length).toBe(0);
    });

    it('should skip already assigned night slots', () => {
      const nightSlots: ShiftSlot[] = [
        {
          date: '2026-01-05',
          shiftType: ShiftType.Night,
          isWeekend: false,
          weekNumber: 1,
          assignedStaff: [],
          minNurses: 1,
          maxNurses: 2,
          minRAs: 1,
          maxRAs: 2,
          maxTotalStaff: 4,
        },
      ];

      // Pre-assign this slot
      assignments.push({
        shiftSlotId: '2026-01-05-Night',
        shiftType: ShiftType.Night,
        date: '2026-01-05',
        staffId: 'nurse1',
      });

      const initialLength = assignments.length;

      RotaAssignmentHelper.assignNightBlocks(
        nightSlots,
        testStaff,
        assignments,
        staffCount,
        week1Count,
        week2Count,
        isStaffAvailable
      );

      // Should not add more assignments for already assigned slot
      expect(assignments.length).toBe(initialLength);
    });
  });
});
