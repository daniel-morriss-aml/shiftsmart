import { Injectable } from '@angular/core';
import {
    HospitalConfig,
    Rota,
    ShiftAssignment,
    ShiftType,
    StaffMember,
    StaffWorkSummary,
    Role,
} from '../models';

interface ShiftSlot {
    date: string;
    shiftType: ShiftType;
    isWeekend: boolean;
    weekNumber: 1 | 2;
    assignedStaff: string[];
    minNurses: number;
    maxNurses: number;
    minRAs: number;
    maxRAs: number;
    maxTotalStaff: number;
}

@Injectable({
    providedIn: 'root',
})
export class RotaEngineService {
    /**
     * Generates a 2-week rota based on staff, requirements, and rules.
     *
     * @param staff - List of available staff members
     * @param config - Hospital configuration with shift requirements
     * @param periodStart - Start date (Monday of week 1) in ISO format
     * @returns Generated rota with assignments and summaries
     */
    generateRota(staff: StaffMember[], config: HospitalConfig, periodStart: string): Rota {
        const startDate = new Date(periodStart);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 13);

        // Build list of ShiftSlot objects for 14 days × 2 shifts
        const slots = this.buildShiftSlots(startDate, config);

        // Assign staff to shifts
        const assignments = this.assignStaffToShifts(slots, staff);

        // Compute StaffWorkSummary
        const staffSummaries = this.computeStaffWorkSummaries(assignments, staff, startDate);

        return {
            id: this.generateRotaId(),
            periodStart,
            periodEnd: endDate.toISOString().split('T')[0],
            assignments,
            staffSummaries,
        };
    }

    private buildShiftSlots(startDate: Date, config: HospitalConfig): ShiftSlot[] {
        const slots: ShiftSlot[] = [];

        for (let day = 0; day < 14; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + day);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
            const weekNumber = day < 7 ? 1 : 2;

            // Day shift
            slots.push({
                date: dateStr,
                shiftType: ShiftType.Day,
                isWeekend,
                weekNumber: weekNumber as 1 | 2,
                assignedStaff: [],
                minNurses: config.defaultDayRequirement.minNurses,
                maxNurses: config.defaultDayRequirement.maxNurses,
                minRAs: config.defaultDayRequirement.minRAs,
                maxRAs: config.defaultDayRequirement.maxRAs,
                maxTotalStaff: config.defaultDayRequirement.maxTotalStaff,
            });

            // Night shift
            slots.push({
                date: dateStr,
                shiftType: ShiftType.Night,
                isWeekend,
                weekNumber: weekNumber as 1 | 2,
                assignedStaff: [],
                minNurses: config.defaultNightRequirement.minNurses,
                maxNurses: config.defaultNightRequirement.maxNurses,
                minRAs: config.defaultNightRequirement.minRAs,
                maxRAs: config.defaultNightRequirement.maxRAs,
                maxTotalStaff: config.defaultNightRequirement.maxTotalStaff,
            });
        }

        return slots;
    }

    private assignStaffToShifts(slots: ShiftSlot[], staff: StaffMember[]): ShiftAssignment[] {
        const assignments: ShiftAssignment[] = [];

        // Track how many shifts each staff member has been assigned
        const staffAssignmentCount = new Map<string, number>();
        staff.forEach((s) => staffAssignmentCount.set(s.id, 0));

        // Process each slot and try to fill it
        for (const slot of slots) {
            // Filter available staff for this slot
            const availableStaff = staff.filter((s) => this.isStaffAvailable(s, slot));

            // Sort by current assignment count (fewest shifts first for fair distribution)
            availableStaff.sort(
                (a, b) => (staffAssignmentCount.get(a.id) || 0) - (staffAssignmentCount.get(b.id) || 0)
            );

            // Separate nurses and RAs
            const nurses = availableStaff.filter((s) => s.role === Role.Nurse);
            const ras = availableStaff.filter((s) => s.role === Role.RA);

            // Assign nurses first (to meet minimum requirement)
            let nursesAssigned = 0;
            for (const nurse of nurses) {
                if (nursesAssigned >= slot.minNurses && nursesAssigned >= slot.maxNurses) break;
                if (slot.assignedStaff.length >= slot.maxTotalStaff) break;

                const currentCount = staffAssignmentCount.get(nurse.id) || 0;
                if (currentCount < nurse.shiftsPerFortnight) {
                    slot.assignedStaff.push(nurse.id);
                    nursesAssigned++;
                    staffAssignmentCount.set(nurse.id, currentCount + 1);

                    assignments.push({
                        shiftSlotId: `${slot.date}-${slot.shiftType}`,
                        shiftType: slot.shiftType,
                        date: slot.date,
                        staffId: nurse.id,
                    });
                }
            }

            // Assign RAs (to meet minimum requirement)
            let rasAssigned = 0;
            for (const ra of ras) {
                if (rasAssigned >= slot.minRAs && rasAssigned >= slot.maxRAs) break;
                if (slot.assignedStaff.length >= slot.maxTotalStaff) break;

                const currentCount = staffAssignmentCount.get(ra.id) || 0;
                if (currentCount < ra.shiftsPerFortnight) {
                    slot.assignedStaff.push(ra.id);
                    rasAssigned++;
                    staffAssignmentCount.set(ra.id, currentCount + 1);

                    assignments.push({
                        shiftSlotId: `${slot.date}-${slot.shiftType}`,
                        shiftType: slot.shiftType,
                        date: slot.date,
                        staffId: ra.id,
                    });
                }
            }
        }

        return assignments;
    }

    private isStaffAvailable(staff: StaffMember, slot: ShiftSlot): boolean {
        // Check if staff can work this shift type
        if (slot.shiftType === ShiftType.Day && !staff.availability.canWorkDays) {
            return false;
        }
        if (slot.shiftType === ShiftType.Night && !staff.availability.canWorkNights) {
            return false;
        }

        // Check if staff can work weekends
        if (slot.isWeekend && !staff.availability.canWorkWeekends) {
            return false;
        }

        // Check if this slot is in the unavailable list
        const slotId = `${slot.date}-${slot.shiftType}`;
        if (staff.availability.unavailableSlots?.includes(slotId)) {
            return false;
        }

        return true;
    }

    private computeStaffWorkSummaries(
        assignments: ShiftAssignment[],
        staff: StaffMember[],
        startDate: Date
    ): StaffWorkSummary[] {
        const summaries: StaffWorkSummary[] = [];

        for (const member of staff) {
            const memberAssignments = assignments.filter((a) => a.staffId === member.id);

            let week1Count = 0;
            let week2Count = 0;
            let weekendCount = 0;
            let nightCount = 0;
            let dayCount = 0;

            for (const assignment of memberAssignments) {
                const assignmentDate = new Date(assignment.date);
                const daysDiff = Math.floor(
                    (assignmentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Week 1 or Week 2
                if (daysDiff < 7) {
                    week1Count++;
                } else {
                    week2Count++;
                }

                // Weekend check
                const dayOfWeek = assignmentDate.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    weekendCount++;
                }

                // Day/Night count
                if (assignment.shiftType === ShiftType.Day) {
                    dayCount++;
                } else {
                    nightCount++;
                }
            }

            summaries.push({
                staffId: member.id,
                totalAssigned: memberAssignments.length,
                week1Assigned: week1Count,
                week2Assigned: week2Count,
                weekendCount,
                nightCount,
                dayCount,
            });
        }

        return summaries;
    }

    private generateRotaId(): string {
        return `rota-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
