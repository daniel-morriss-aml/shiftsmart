import { ShiftType } from './enums';
import { ShiftSlotId } from './staff.model';

export interface ShiftAssignment {
    shiftSlotId: ShiftSlotId;
    shiftType: ShiftType;
    date: string;
    staffId: string;
}

export interface StaffWorkSummary {
    staffId: string;
    totalAssigned: number;
    week1Assigned: number;
    week2Assigned: number;
    weekendCount: number;
    nightCount: number;
    dayCount: number;
    // Useful for checking fairness constraints
}

export interface Rota {
    id: string;
    periodStart: string; // Monday of week 1 (ISO date)
    periodEnd: string; // Sunday of week 2 (ISO date)
    assignments: ShiftAssignment[];
    staffSummaries: StaffWorkSummary[];
}

export interface RotaRules {
    requireWeekendPerFortnight: boolean;
    groupWeekends: boolean;
    groupNights: boolean;
    week1Week2BalanceTolerance: number; // e.g. 1 shift difference
    minMaleRAsPerShift: number; // 2
    nurseCanSubstituteRA: boolean; // true
}
