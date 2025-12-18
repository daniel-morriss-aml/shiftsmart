import { Gender, Role } from './enums';

export type ShiftSlotId = string;
// e.g. '2025-01-01-Day' – standardized format: YYYY-MM-DD-ShiftType

export interface StaffAvailability {
    canWorkDays: boolean;
    canWorkNights: boolean;
    canWorkWeekends: boolean;
    // Optional: explicit unavailable dates inside the 2-week window
    unavailableSlots?: ShiftSlotId[];
}

export interface StaffMember {
    id: string;
    name: string;
    gender: Gender;
    role: Role;
    availability: StaffAvailability;
    shiftsPerFortnight: number; // target number, e.g. 7
}
