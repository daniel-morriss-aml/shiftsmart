import { ShiftAssignment, StaffMember } from '../../models';
import { ShiftSlot } from './shift-slot.model';

export class NightBlockAssignmentHelper {
    static assignNightBlocks(
        nightSlots: ShiftSlot[],
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
        isSlotAssignedFn: (slot: ShiftSlot, assignments: ShiftAssignment[]) => boolean,
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean,
    ): void {
        const unassignedNights = nightSlots.filter((slot) => !isSlotAssignedFn(slot, assignments));
        unassignedNights.sort((a, b) => a.date.localeCompare(b.date));

        const nightBlocks = this.createNightBlocks(unassignedNights);

        for (const block of nightBlocks) {
            this.assignSingleBlock(
                block,
                staff,
                assignments,
                staffCount,
                week1Count,
                week2Count,
                assignSlotFn,
                isStaffAvailable,
            );
        }
    }

    private static createNightBlocks(unassignedNights: ShiftSlot[]): ShiftSlot[][] {
        const nightBlocks: ShiftSlot[][] = [];
        let currentBlock: ShiftSlot[] = [];

        for (let i = 0; i < unassignedNights.length; i++) {
            const slot = unassignedNights[i];

            if (currentBlock.length === 0) {
                currentBlock.push(slot);
            } else {
                const lastDate = new Date(currentBlock[currentBlock.length - 1].date);
                const currentDate = new Date(slot.date);
                const daysDiff = Math.floor(
                    (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
                );

                if (daysDiff === 1) {
                    currentBlock.push(slot);
                } else {
                    if (currentBlock.length > 0) {
                        nightBlocks.push(currentBlock);
                    }
                    currentBlock = [slot];
                }
            }
        }

        if (currentBlock.length > 0) {
            nightBlocks.push(currentBlock);
        }

        return nightBlocks;
    }

    private static assignSingleBlock(
        block: ShiftSlot[],
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
        const availableForBlock = staff.filter((s) => {
            return block.every((slot) => isStaffAvailable(s, slot));
        });

        if (availableForBlock.length > 0) {
            this.assignBlockWithAvailableStaff(
                block,
                availableForBlock,
                assignments,
                staffCount,
                week1Count,
                week2Count,
                assignSlotFn,
                isStaffAvailable,
            );
        } else {
            this.assignBlockWithFallback(
                block,
                staff,
                assignments,
                staffCount,
                week1Count,
                week2Count,
                assignSlotFn,
                isStaffAvailable,
            );
        }
    }

    private static assignBlockWithAvailableStaff(
        block: ShiftSlot[],
        availableForBlock: StaffMember[],
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
        let blockAssignedStaff: StaffMember[] | null = null;

        for (let i = 0; i < block.length; i++) {
            const slot = block[i];

            if (i === 0) {
                // First slot in the block: assign from all staff available for the whole block
                assignSlotFn(
                    slot,
                    availableForBlock,
                    assignments,
                    staffCount,
                    week1Count,
                    week2Count,
                    false,
                    isStaffAvailable,
                );

                if (slot.assignedStaff && slot.assignedStaff.length > 0) {
                    const assignedIds = new Set(slot.assignedStaff);
                    const matchedStaff = availableForBlock.filter((member) =>
                        assignedIds.has(member.id),
                    );

                    if (matchedStaff.length > 0) {
                        blockAssignedStaff = matchedStaff;
                    }
                }
            } else {
                const candidates =
                    blockAssignedStaff && blockAssignedStaff.length > 0
                        ? blockAssignedStaff
                        : availableForBlock;

                assignSlotFn(
                    slot,
                    candidates,
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

    private static assignBlockWithFallback(
        block: ShiftSlot[],
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
        let blockAssignedStaff: StaffMember[] | null = null;

        for (let i = 0; i < block.length; i++) {
            const slot = block[i];

            if (i === 0) {
                // First slot in the block: assign from the full staff list as a fallback
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

                if (slot.assignedStaff && slot.assignedStaff.length > 0) {
                    const assignedIds = new Set(slot.assignedStaff);
                    const matchedStaff = staff.filter((member) => assignedIds.has(member.id));

                    if (matchedStaff.length > 0) {
                        blockAssignedStaff = matchedStaff;
                    }
                }
            } else {
                const candidates =
                    blockAssignedStaff && blockAssignedStaff.length > 0
                        ? blockAssignedStaff
                        : staff;

                assignSlotFn(
                    slot,
                    candidates,
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
}
