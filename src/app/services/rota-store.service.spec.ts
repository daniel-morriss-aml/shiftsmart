import { TestBed } from '@angular/core/testing';
import { RotaStore } from './rota-store.service';
import {
  Rota,
  ShiftAssignment,
  ShiftType,
  RuleViolationSeverity,
  StaffWorkSummary,
} from '../models';

describe('RotaStore', () => {
  let store: RotaStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(RotaStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with null rota', () => {
      expect(store.rota()).toBeNull();
    });

    it('should initialize with generating as false', () => {
      expect(store.generating()).toBe(false);
    });

    it('should initialize with null error', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('setRota', () => {
    it('should set the rota', () => {
      const testRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(testRota);

      expect(store.rota()).toEqual(testRota);
    });

    it('should clear error when setting rota', () => {
      store.setError('Test error');
      expect(store.error()).toBe('Test error');

      const testRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(testRota);

      expect(store.error()).toBeNull();
    });
  });

  describe('clearRota', () => {
    it('should clear the rota', () => {
      const testRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(testRota);
      expect(store.rota()).toBeTruthy();

      store.clearRota();

      expect(store.rota()).toBeNull();
    });

    it('should clear error when clearing rota', () => {
      store.setError('Test error');
      expect(store.error()).toBe('Test error');

      store.clearRota();

      expect(store.error()).toBeNull();
    });
  });

  describe('setGenerating', () => {
    it('should set generating to true', () => {
      store.setGenerating(true);

      expect(store.generating()).toBe(true);
    });

    it('should set generating to false', () => {
      store.setGenerating(true);
      store.setGenerating(false);

      expect(store.generating()).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Test error message';

      store.setError(errorMessage);

      expect(store.error()).toBe(errorMessage);
    });

    it('should set generating to false when error is set', () => {
      store.setGenerating(true);
      expect(store.generating()).toBe(true);

      store.setError('Error occurred');

      expect(store.generating()).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      store.setError('Test error');
      expect(store.error()).toBe('Test error');

      store.clearError();

      expect(store.error()).toBeNull();
    });
  });

  describe('updateAssignments', () => {
    it('should update assignments in the rota', () => {
      const initialRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [
          {
            shiftSlotId: '2026-01-05-Day',
            shiftType: ShiftType.Day,
            date: '2026-01-05',
            staffId: 'staff1',
          },
        ],
        staffSummaries: [
          {
            staffId: 'staff1',
            totalAssigned: 1,
            week1Assigned: 1,
            week2Assigned: 0,
            weekendCount: 0,
            nightCount: 0,
            dayCount: 1,
          },
        ],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(initialRota);

      const newAssignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'staff1',
        },
        {
          shiftSlotId: '2026-01-06-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-06',
          staffId: 'staff1',
        },
      ];

      store.updateAssignments(newAssignments);

      const updatedRota = store.rota();
      expect(updatedRota).toBeTruthy();
      expect(updatedRota!.assignments.length).toBe(2);
      expect(updatedRota!.assignments).toEqual(newAssignments);
    });

    it('should recalculate staff summaries when updating assignments', () => {
      const initialRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [
          {
            staffId: 'staff1',
            totalAssigned: 0,
            week1Assigned: 0,
            week2Assigned: 0,
            weekendCount: 0,
            nightCount: 0,
            dayCount: 0,
          },
        ],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(initialRota);

      const newAssignments: ShiftAssignment[] = [
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'staff1',
        },
        {
          shiftSlotId: '2026-01-06-Night',
          shiftType: ShiftType.Night,
          date: '2026-01-06',
          staffId: 'staff1',
        },
      ];

      store.updateAssignments(newAssignments);

      const updatedRota = store.rota();
      expect(updatedRota).toBeTruthy();
      const summary = updatedRota!.staffSummaries.find((s) => s.staffId === 'staff1');
      expect(summary).toBeTruthy();
      expect(summary!.totalAssigned).toBe(2);
      expect(summary!.week1Assigned).toBe(2);
      expect(summary!.week2Assigned).toBe(0);
      expect(summary!.dayCount).toBe(1);
      expect(summary!.nightCount).toBe(1);
    });

    it('should correctly calculate week counts', () => {
      const initialRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05', // Monday of week 1
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [
          {
            staffId: 'staff1',
            totalAssigned: 0,
            week1Assigned: 0,
            week2Assigned: 0,
            weekendCount: 0,
            nightCount: 0,
            dayCount: 0,
          },
        ],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(initialRota);

      const newAssignments: ShiftAssignment[] = [
        // Week 1 assignments (2026-01-05 to 2026-01-11)
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'staff1',
        },
        {
          shiftSlotId: '2026-01-06-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-06',
          staffId: 'staff1',
        },
        // Week 2 assignments (2026-01-12 onwards)
        {
          shiftSlotId: '2026-01-12-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-12',
          staffId: 'staff1',
        },
      ];

      store.updateAssignments(newAssignments);

      const updatedRota = store.rota();
      const summary = updatedRota!.staffSummaries.find((s) => s.staffId === 'staff1');
      expect(summary!.week1Assigned).toBe(2);
      expect(summary!.week2Assigned).toBe(1);
    });

    it('should correctly calculate weekend counts', () => {
      const initialRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05', // Monday
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [
          {
            staffId: 'staff1',
            totalAssigned: 0,
            week1Assigned: 0,
            week2Assigned: 0,
            weekendCount: 0,
            nightCount: 0,
            dayCount: 0,
          },
        ],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(initialRota);

      const newAssignments: ShiftAssignment[] = [
        // Saturday
        {
          shiftSlotId: '2026-01-10-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-10',
          staffId: 'staff1',
        },
        // Sunday
        {
          shiftSlotId: '2026-01-11-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-11',
          staffId: 'staff1',
        },
        // Weekday
        {
          shiftSlotId: '2026-01-06-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-06',
          staffId: 'staff1',
        },
      ];

      store.updateAssignments(newAssignments);

      const updatedRota = store.rota();
      const summary = updatedRota!.staffSummaries.find((s) => s.staffId === 'staff1');
      expect(summary!.weekendCount).toBe(2); // Saturday and Sunday
      expect(summary!.totalAssigned).toBe(3);
    });

    it('should handle empty assignments', () => {
      const initialRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [
          {
            shiftSlotId: '2026-01-05-Day',
            shiftType: ShiftType.Day,
            date: '2026-01-05',
            staffId: 'staff1',
          },
        ],
        staffSummaries: [
          {
            staffId: 'staff1',
            totalAssigned: 1,
            week1Assigned: 1,
            week2Assigned: 0,
            weekendCount: 0,
            nightCount: 0,
            dayCount: 1,
          },
        ],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(initialRota);

      store.updateAssignments([]);

      const updatedRota = store.rota();
      expect(updatedRota!.assignments.length).toBe(0);
      const summary = updatedRota!.staffSummaries.find((s) => s.staffId === 'staff1');
      expect(summary!.totalAssigned).toBe(0);
    });

    it('should do nothing if no rota is set', () => {
      expect(store.rota()).toBeNull();

      store.updateAssignments([
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'staff1',
        },
      ]);

      expect(store.rota()).toBeNull();
    });

    it('should maintain rota metadata when updating assignments', () => {
      const initialRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [
          {
            staffId: 'staff1',
            totalAssigned: 0,
            week1Assigned: 0,
            week2Assigned: 0,
            weekendCount: 0,
            nightCount: 0,
            dayCount: 0,
          },
        ],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(initialRota);

      store.updateAssignments([
        {
          shiftSlotId: '2026-01-05-Day',
          shiftType: ShiftType.Day,
          date: '2026-01-05',
          staffId: 'staff1',
        },
      ]);

      const updatedRota = store.rota();
      expect(updatedRota!.id).toBe('rota-1');
      expect(updatedRota!.periodStart).toBe('2026-01-05');
      expect(updatedRota!.periodEnd).toBe('2026-01-18');
      expect(updatedRota!.validationResult).toEqual(initialRota.validationResult);
    });
  });

  describe('signal reactivity', () => {
    it('should expose readonly signals', () => {
      expect(typeof store.rota).toBe('function');
      expect(typeof store.generating).toBe('function');
      expect(typeof store.error).toBe('function');
    });

    it('should update signals reactively', () => {
      expect(store.generating()).toBe(false);

      store.setGenerating(true);

      expect(store.generating()).toBe(true);
    });
  });

  describe('workflow scenarios', () => {
    it('should handle typical generation workflow', () => {
      // Start generation
      store.setGenerating(true);
      expect(store.generating()).toBe(true);
      expect(store.rota()).toBeNull();

      // Complete generation successfully
      const testRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(testRota);
      store.setGenerating(false);

      expect(store.generating()).toBe(false);
      expect(store.rota()).toEqual(testRota);
      expect(store.error()).toBeNull();
    });

    it('should handle error during generation', () => {
      // Start generation
      store.setGenerating(true);

      // Error occurs
      store.setError('Failed to generate rota');

      expect(store.generating()).toBe(false);
      expect(store.error()).toBe('Failed to generate rota');
      expect(store.rota()).toBeNull();
    });

    it('should handle clearing and regenerating', () => {
      // First generation
      const firstRota: Rota = {
        id: 'rota-1',
        periodStart: '2026-01-05',
        periodEnd: '2026-01-18',
        assignments: [],
        staffSummaries: [],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(firstRota);
      expect(store.rota()).toEqual(firstRota);

      // Clear
      store.clearRota();
      expect(store.rota()).toBeNull();

      // Regenerate
      const secondRota: Rota = {
        id: 'rota-2',
        periodStart: '2026-01-19',
        periodEnd: '2026-02-01',
        assignments: [],
        staffSummaries: [],
        validationResult: {
          rules: [],
          hasHardViolations: false,
          hasSoftViolations: false,
        },
      };

      store.setRota(secondRota);
      expect(store.rota()).toEqual(secondRota);
    });
  });
});
