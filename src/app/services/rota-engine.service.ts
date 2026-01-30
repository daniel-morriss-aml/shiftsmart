import { Injectable, inject } from '@angular/core';
import {
    Gender,
    HospitalConfig,
    Role,
    Rota,
    ShiftAssignment,
    ShiftType,
    StaffMember,
    StaffWorkSummary,
} from '../models';
import { RotaValidationService } from './rota-validation.service';
import { RotaAssignmentHelper, ShiftSlot } from './rota-assignment.helper';

@Injectable({
    providedIn: 'root',
})
export class RotaEngineService {
    private validationService = inject(RotaValidationService);

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

        // Assign staff to shifts with business rules
        const assignments = this.assignStaffToShifts(slots, staff, startDate);

        // Compute StaffWorkSummary
        const staffSummaries = this.computeStaffWorkSummaries(assignments, staff, startDate);

        // Validate the rota against all business rules
        const validationResult = this.validationService.validateRota(
            assignments,
            staffSummaries,
            staff,
            periodStart
        );

        return {
            id: this.generateRotaId(),
            periodStart,
            periodEnd: endDate.toISOString().split('T')[0],
            assignments,
            staffSummaries,
            validationResult,
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

    private assignStaffToShifts(slots: ShiftSlot[], staff: StaffMember[], startDate: Date): ShiftAssignment[] {
        const assignments: ShiftAssignment[] = [];

        // Sort staff to prioritize male RAs first to satisfy gender requirements
        const sortedStaff = this.sortStaffByGenderPriority(staff);

        const staffAssignmentCount = new Map<string, number>();
        const week1Count = new Map<string, number>();
        const week2Count = new Map<string, number>();
        sortedStaff.forEach((s) => {
            staffAssignmentCount.set(s.id, 0);
            week1Count.set(s.id, 0);
            week2Count.set(s.id, 0);
        });

        const weekendSlots = slots.filter((s) => s.isWeekend);
        const nightSlots = slots.filter((s) => s.shiftType === ShiftType.Night);

        RotaAssignmentHelper.assignWeekendShifts(
            weekendSlots,
            sortedStaff,
            assignments,
            staffAssignmentCount,
            week1Count,
            week2Count,
            this.isStaffAvailable.bind(this)
        );

        RotaAssignmentHelper.assignNightBlocks(
            nightSlots,
            sortedStaff,
            assignments,
            staffAssignmentCount,
            week1Count,
            week2Count,
            this.isStaffAvailable.bind(this)
        );

        const remainingSlots = slots.filter((slot) => {
            return !RotaAssignmentHelper.isSlotAssigned(slot, assignments);
        });

        for (const slot of remainingSlots) {
            RotaAssignmentHelper.assignSlot(
                slot,
                sortedStaff,
                assignments,
                staffAssignmentCount,
                week1Count,
                week2Count,
                true,
                this.isStaffAvailable.bind(this)
            );
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

    /**
     * Sorts staff to prioritize male RAs first, ensuring they are assigned to shifts
     * before other staff members to satisfy the "2 male RAs per shift" requirement.
     * 
     * Priority order:
     * 1. Male RAs
     * 2. Other RAs (Female, Other gender)
     * 3. Nurses
     */
    private sortStaffByGenderPriority(staff: StaffMember[]): StaffMember[] {
        return [...staff].sort((a, b) => {
            // Male RAs get highest priority
            const aIsMaleRA = a.role === Role.RA && a.gender === Gender.Male;
            const bIsMaleRA = b.role === Role.RA && b.gender === Gender.Male;
            
            if (aIsMaleRA && !bIsMaleRA) return -1;
            if (!aIsMaleRA && bIsMaleRA) return 1;
            
            // Other RAs get second priority
            const aIsOtherRA = a.role === Role.RA && !aIsMaleRA;
            const bIsOtherRA = b.role === Role.RA && !bIsMaleRA;
            
            if (aIsOtherRA && !bIsOtherRA) return -1;
            if (!aIsOtherRA && bIsOtherRA) return 1;
            
            // Nurses come last, maintain original order
            return 0;
        });
    }
}
