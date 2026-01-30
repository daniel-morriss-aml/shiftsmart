import { ShiftAssignment, ShiftType, StaffMember } from '../../models';
import { ShiftSlot } from './shift-slot.model';

export class WeekendAssignmentHelper {
    static assignWeekendShifts(
        weekendSlots: ShiftSlot[],
        staff: StaffMember[],
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        assignSlotFn: (
            slot: ShiftSlot,
            staff: StaffMember[],
            assignments: ShiftAssignment[],
            staffCount: Map<string, number>,
            week1Count: Map<string, number>,
            week2Count: Map<string, number>,
            considerBalance: boolean,
            isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean,
        ) => void,
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean,
    ): void {
        const weekendGroups = this.groupWeekendSlots(weekendSlots);

        for (const [, slots] of weekendGroups) {
            const { saturdaySlots, sundaySlots, otherSlots } = this.categorizeWeekendSlots(slots);

            // First, assign Saturday slots using the original staff ordering
            for (const slot of saturdaySlots) {
                assignSlotFn(
                    slot,
                    staff,
                    assignments,
                    staffCount,
                    week1Count,
                    week2Count,
                    false,
                    isStaffAvailable,
                );
            }

            // Collect staff who worked on Saturday so we can prioritize them for Sunday
            const saturdayStaffIds = this.collectSaturdayStaff(saturdaySlots);

            const reorderedStaff = this.reorderStaffForSunday(staff, saturdayStaffIds);

            // Then, assign Sunday slots, prioritizing staff who worked on Saturday
            for (const slot of sundaySlots) {
                assignSlotFn(
                    slot,
                    reorderedStaff,
                    assignments,
                    staffCount,
                    week1Count,
                    week2Count,
                    false,
                    isStaffAvailable,
                );
            }

            // Finally, handle any non-Saturday/Sunday slots (if present) with the original ordering
            for (const slot of otherSlots) {
                assignSlotFn(
                    slot,
                    staff,
                    assignments,
                    staffCount,
                    week1Count,
                    week2Count,
                    false,
                    isStaffAvailable,
                );
            }
        }
    }

    private static groupWeekendSlots(weekendSlots: ShiftSlot[]): Map<string, ShiftSlot[]> {
        const weekendGroups = new Map<string, ShiftSlot[]>();

        for (const slot of weekendSlots) {
            const date = new Date(slot.date);
            const day = date.getDay();

            let saturdayDate: Date;
            if (day === 6) {
                saturdayDate = new Date(date);
            } else {
                saturdayDate = new Date(date);
                saturdayDate.setDate(date.getDate() - 1);
            }

            const weekendKey = saturdayDate.toISOString().split('T')[0];
            if (!weekendGroups.has(weekendKey)) {
                weekendGroups.set(weekendKey, []);
            }
            weekendGroups.get(weekendKey)!.push(slot);
        }

        return weekendGroups;
    }

    private static categorizeWeekendSlots(slots: ShiftSlot[]): {
        saturdaySlots: ShiftSlot[];
        sundaySlots: ShiftSlot[];
        otherSlots: ShiftSlot[];
    } {
        const sortSlots = (a: ShiftSlot, b: ShiftSlot): number => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.shiftType === ShiftType.Day ? -1 : 1;
        };

        const saturdaySlots: ShiftSlot[] = [];
        const sundaySlots: ShiftSlot[] = [];
        const otherSlots: ShiftSlot[] = [];

        for (const slot of slots) {
            const dayOfWeek = new Date(slot.date).getDay();
            if (dayOfWeek === 6) {
                saturdaySlots.push(slot);
            } else if (dayOfWeek === 0) {
                sundaySlots.push(slot);
            } else {
                otherSlots.push(slot);
            }
        }

        saturdaySlots.sort(sortSlots);
        sundaySlots.sort(sortSlots);
        otherSlots.sort(sortSlots);

        return { saturdaySlots, sundaySlots, otherSlots };
    }

    private static collectSaturdayStaff(saturdaySlots: ShiftSlot[]): Set<string> {
        const saturdayStaffIds = new Set<string>();
        for (const slot of saturdaySlots) {
            for (const staffId of slot.assignedStaff) {
                saturdayStaffIds.add(staffId);
            }
        }
        return saturdayStaffIds;
    }

    private static reorderStaffForSunday(
        staff: StaffMember[],
        saturdayStaffIds: Set<string>,
    ): StaffMember[] {
        if (saturdayStaffIds.size === 0) {
            return staff;
        }

        const preferredStaff = staff.filter((member) => saturdayStaffIds.has(member.id));
        const remainingStaff = staff.filter((member) => !saturdayStaffIds.has(member.id));
        return [...preferredStaff, ...remainingStaff];
    }
}
