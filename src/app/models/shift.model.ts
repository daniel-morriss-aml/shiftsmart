import { ShiftType } from './enums';

export interface ShiftRequirement {
    shiftType: ShiftType; // Day or Night
    minNurses: number;
    maxNurses: number;
    minRAs: number;
    maxRAs: number;
    maxTotalStaff: number;
}

export interface DayShiftRequirements {
    date: string; // ISO date, e.g. '2025-01-01'
    dayRequirement: ShiftRequirement;
    nightRequirement: ShiftRequirement;
}

export interface HospitalConfig {
    id: string;
    name: string;
    // These are defaults; can be overridden per day if needed
    defaultDayRequirement: ShiftRequirement;
    defaultNightRequirement: ShiftRequirement;
}
