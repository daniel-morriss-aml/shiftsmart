import { Gender, Role, ShiftAssignment, StaffMember } from '../../models';
import { ShiftSlot } from './shift-slot.model';

export class SlotAssignmentHelper {
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
        const availableStaff = staff.filter((s) => isStaffAvailable(s, slot));

        const sortedStaff = this.sortStaffByPriority(
            availableStaff,
            staffCount,
            week1Count,
            week2Count,
            considerBalance,
        );

        const nurses = sortedStaff.filter((s) => s.role === Role.Nurse);
        const ras = sortedStaff.filter((s) => s.role === Role.RA);
        const maleRAs = ras.filter((ra) => ra.gender === Gender.Male);
        const otherRAs = ras.filter((ra) => ra.gender !== Gender.Male);

        let nursesAssigned = this.assignNurses(
            slot,
            nurses,
            staffCount,
            week1Count,
            week2Count,
            assignments,
        );
        let rasAssigned = this.assignRAs(
            slot,
            maleRAs,
            otherRAs,
            staffCount,
            week1Count,
            week2Count,
            assignments,
        );

        // If we haven't met the minimum RAs requirement, use nurses as backup
        if (rasAssigned < slot.minRAs) {
            this.assignNursesAsRABackup(
                slot,
                nurses,
                nursesAssigned,
                rasAssigned,
                staffCount,
                week1Count,
                week2Count,
                assignments,
            );
        }
    }

    private static sortStaffByPriority(
        availableStaff: StaffMember[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        considerBalance: boolean,
    ): StaffMember[] {
        return [...availableStaff].sort((a, b) => {
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
    }

    private static assignNurses(
        slot: ShiftSlot,
        nurses: StaffMember[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        assignments: ShiftAssignment[],
    ): number {
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

        return nursesAssigned;
    }

    private static assignRAs(
        slot: ShiftSlot,
        maleRAs: StaffMember[],
        otherRAs: StaffMember[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        assignments: ShiftAssignment[],
    ): number {
        let rasAssigned = 0;

        // Assign male RAs first
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

        // Then assign other RAs
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

        return rasAssigned;
    }

    private static assignNursesAsRABackup(
        slot: ShiftSlot,
        nurses: StaffMember[],
        nursesAssigned: number,
        rasAssigned: number,
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
        assignments: ShiftAssignment[],
    ): void {
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

    static addAssignment(
        slot: ShiftSlot,
        staffId: string,
        assignments: ShiftAssignment[],
        staffCount: Map<string, number>,
        week1Count: Map<string, number>,
        week2Count: Map<string, number>,
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
