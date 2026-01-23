import { Gender, Role, ShiftAssignment, ShiftType, StaffMember } from '../models';

export interface ShiftSlot {
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
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean
    ): void {
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

        for (const [, slots] of weekendGroups) {
            slots.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.shiftType === ShiftType.Day ? -1 : 1;
            });

            for (const slot of slots) {
                this.assignSlot(slot, staff, assignments, staffCount, week1Count, week2Count, false, isStaffAvailable);
            }
        }
    }

    static assignNightBlocks(
        nightSlots: ShiftSlot[],
        staff: StaffMember[],
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean
    ): void {
        const unassignedNights = nightSlots.filter((slot) => !this.isSlotAssigned(slot, assignments));
        unassignedNights.sort((a, b) => a.date.localeCompare(b.date));

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
                    (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
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

        for (const block of nightBlocks) {
            const availableForBlock = staff.filter((s) => {
                return block.every((slot) => isStaffAvailable(s, slot));
            });

            if (availableForBlock.length > 0) {
                let blockAssignedStaff: StaffMember[] | null = null;

                for (let i = 0; i < block.length; i++) {
                    const slot = block[i];

                    if (i === 0) {
                        // First slot in the block: assign from all staff available for the whole block.
                        this.assignSlot(
                            slot,
                            availableForBlock,
                            assignments,
                            staffCount,
                            week1Count,
                            week2Count,
                            false,
                            isStaffAvailable
                        );

                        if (slot.assignedStaff && slot.assignedStaff.length > 0) {
                            const assignedIds = new Set(slot.assignedStaff);
                            const matchedStaff = availableForBlock.filter((member) =>
                                assignedIds.has((member as any).id)
                            );

                            if (matchedStaff.length > 0) {
                                blockAssignedStaff = matchedStaff;
                            }
                        }
                    } else {
                        const candidates = blockAssignedStaff && blockAssignedStaff.length > 0
                            ? blockAssignedStaff
                            : availableForBlock;

                        this.assignSlot(
                            slot,
                            candidates,
                            assignments,
                            staffCount,
                            week1Count,
                            week2Count,
                            false,
                            isStaffAvailable
                        );
                    }
                }
            } else {
                let blockAssignedStaff: StaffMember[] | null = null;

                for (let i = 0; i < block.length; i++) {
                    const slot = block[i];

                    if (i === 0) {
                        // First slot in the block: assign from the full staff list as a fallback.
                        this.assignSlot(
                            slot,
                            staff,
                            assignments,
                            staffCount,
                            week1Count,
                            week2Count,
                            false,
                            isStaffAvailable
                        );

                        if (slot.assignedStaff && slot.assignedStaff.length > 0) {
                            const assignedIds = new Set(slot.assignedStaff);
                            const matchedStaff = staff.filter((member) =>
                                assignedIds.has((member as any).id)
                            );

                            if (matchedStaff.length > 0) {
                                blockAssignedStaff = matchedStaff;
                            }
                        }
                    } else {
                        const candidates = blockAssignedStaff && blockAssignedStaff.length > 0
                            ? blockAssignedStaff
                            : staff;

                        this.assignSlot(
                            slot,
                            candidates,
                            assignments,
                            staffCount,
                            week1Count,
                            week2Count,
                            false,
                            isStaffAvailable
                        );
                    }
                }
            }
        }
    }

    static assignSlot(
        slot: ShiftSlot,
        staff: StaffMember[],
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        considerBalance: boolean,
        isStaffAvailable: (staff: StaffMember, slot: ShiftSlot) => boolean
    ): void {
        const availableStaff = staff.filter((s) => isStaffAvailable(s, slot));

        availableStaff.sort((a, b) => {
            const aCount = staffCount.get(a.id) || 0;
            const bCount = staffCount.get(b.id) || 0;
            
            if (considerBalance) {
                const aWeek1 = week1Count.get(a.id) || 0;
                const aWeek2 = week2Count.get(a.id) || 0;
                const bWeek1 = week1Count.get(b.id) || 0;
                const bWeek2 = week2Count.get(b.id) || 0;
                
                const aBalance = Math.abs(aWeek1 - aWeek2);
                const bBalance = Math.abs(bWeek1 - bWeek2);
                
                if (aBalance !== bBalance) {
                    return aBalance - bBalance;
                }
            }
            
            return aCount - bCount;
        });

        const nurses = availableStaff.filter((s) => s.role === Role.Nurse);
        const ras = availableStaff.filter((s) => s.role === Role.RA);
        const maleRAs = ras.filter((ra) => ra.gender === Gender.Male);
        const otherRAs = ras.filter((ra) => ra.gender !== Gender.Male);

        let nursesAssigned = 0;
        for (const nurse of nurses) {
            if (nursesAssigned >= slot.minNurses && nursesAssigned >= slot.maxNurses) break;
            if (slot.assignedStaff.length >= slot.maxTotalStaff) break;

            const currentCount = staffCount.get(nurse.id) || 0;
            if (currentCount < nurse.shiftsPerFortnight) {
                this.addAssignment(slot, nurse.id, assignments, staffCount, week1Count, week2Count);
                slot.assignedStaff.push(nurse.id);
                nursesAssigned++;
            }
        }

        let rasAssigned = 0;
        for (const ra of maleRAs) {
            if (rasAssigned >= slot.minRAs && rasAssigned >= slot.maxRAs) break;
            if (slot.assignedStaff.length >= slot.maxTotalStaff) break;

            const currentCount = staffCount.get(ra.id) || 0;
            if (currentCount < ra.shiftsPerFortnight) {
                this.addAssignment(slot, ra.id, assignments, staffCount, week1Count, week2Count);
                slot.assignedStaff.push(ra.id);
                rasAssigned++;
            }
        }

        for (const ra of otherRAs) {
            if (rasAssigned >= slot.minRAs && rasAssigned >= slot.maxRAs) break;
            if (slot.assignedStaff.length >= slot.maxTotalStaff) break;

            const currentCount = staffCount.get(ra.id) || 0;
            if (currentCount < ra.shiftsPerFortnight) {
                this.addAssignment(slot, ra.id, assignments, staffCount, week1Count, week2Count);
                slot.assignedStaff.push(ra.id);
                rasAssigned++;
            }
        }

        if (rasAssigned < slot.minRAs) {
            let remainingRAsNeeded = slot.minRAs - rasAssigned;

            for (const nurse of nurses) {
                if (remainingRAsNeeded <= 0) break;
                if (nursesAssigned >= slot.maxNurses) break;
                if (slot.assignedStaff.length >= slot.maxTotalStaff) break;
                if (slot.assignedStaff.includes(nurse.id)) continue;

                const currentCount = staffCount.get(nurse.id) || 0;
                if (currentCount < nurse.shiftsPerFortnight) {
                    this.addAssignment(slot, nurse.id, assignments, staffCount, week1Count, week2Count);
                    slot.assignedStaff.push(nurse.id);
                    nursesAssigned++;
                    rasAssigned++;
                    remainingRAsNeeded--;
                }
            }
        }
    }

    static addAssignment(
        slot: ShiftSlot,
        staffId: string,
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>
    ): void {
        assignments.push({
            shiftSlotId: `${slot.date}-${slot.shiftType}`,
            shiftType: slot.shiftType,
            date: slot.date,
            staffId,
        });

        const currentCount = staffCount.get(staffId) || 0;
        staffCount.set(staffId, currentCount + 1);

        if (slot.weekNumber === 1) {
            const w1Count = week1Count.get(staffId) || 0;
            week1Count.set(staffId, w1Count + 1);
        } else {
            const w2Count = week2Count.get(staffId) || 0;
            week2Count.set(staffId, w2Count + 1);
        }
    }
}
