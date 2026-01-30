import { ShiftAssignment, StaffMember } from '../models';
import { NightBlockAssignmentHelper } from './helpers/night-block-assignment.helper';
import { ShiftSlot } from './helpers/shift-slot.model';
import { SlotAssignmentHelper } from './helpers/slot-assignment.helper';
import { WeekendAssignmentHelper } from './helpers/weekend-assignment.helper';

export type { ShiftSlot } from './helpers/shift-slot.model';

export class RotaAssignmentHelper {
    static isSlotAssigned(slot: ShiftSlot, assignments: ShiftAssignment[]): boolean {
        const slotId = `${slot.date}-${slot.shiftType}`;
        return assignments.some((a) => a.shiftSlotId === slotId);
    }

    static assignWeekendShifts(
        weekendSlots: ShiftSlot[],
        staff: StaffMember[],
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean,
    ): void {
        WeekendAssignmentHelper.assignWeekendShifts(
            weekendSlots,
            staff,
            assignments,
            staffCount,
            week1Count,
            week2Count,
            this.assignSlot.bind(this),
            isStaffAvailable,
        );
    }

    static assignNightBlocks(
        nightSlots: ShiftSlot[],
        staff: StaffMember[],
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean,
    ): void {
        NightBlockAssignmentHelper.assignNightBlocks(
            nightSlots,
            staff,
            assignments,
            staffCount,
            week1Count,
            week2Count,
            this.assignSlot.bind(this),
            this.isSlotAssigned.bind(this),
            isStaffAvailable,
        );
    }

    static assignSlot(
        slot: ShiftSlot,
        staff: StaffMember[],
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        considerBalance: boolean,
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean,
    ): void {
        SlotAssignmentHelper.assignSlot(
            slot,
            staff,
            assignments,
            staffCount,
            week1Count,
            week2Count,
            considerBalance,
            isStaffAvailable,
        );
    }

    static addAssignment(
        slot: ShiftSlot,
        staffId: string,
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
    ): void {
        SlotAssignmentHelper.addAssignment(
            slot,
            staffId,
            assignments,
            staffCount,
            week1Count,
            week2Count,
        );
    }
}
