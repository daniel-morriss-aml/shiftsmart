import { Injectable } from '@angular/core';
import {
    Gender,
    Role,
    RuleValidation,
    RuleValidationResult,
    RuleViolationSeverity,
    ShiftAssignment,
    ShiftType,
    StaffMember,
    StaffWorkSummary,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class RotaValidationService {
    /**
     * Validates all business rules against the generated rota
     */
    validateRota(
        assignments: ShiftAssignment[],
        summaries: StaffWorkSummary[],
        staff: StaffMember[],
        periodStart: string
    ): RuleValidationResult {
        const rules: RuleValidation[] = [];

        // Weekend Rule
        rules.push(this.validateWeekendRule(assignments, summaries, staff));

        // Night Block Rule
        rules.push(this.validateNightBlockRule(assignments, staff, periodStart));

        // Week 1/Week 2 Balance
        rules.push(this.validateWeekBalanceRule(summaries, staff));

        // Gender Rule (Min 2 Male RAs per Shift)
        rules.push(this.validateGenderRule(assignments, staff, periodStart));

        const hasHardViolations = rules.some((r) => r.severity === RuleViolationSeverity.HardViolation);
        const hasSoftViolations = rules.some((r) => r.severity === RuleViolationSeverity.SoftViolation);

        return {
            rules,
            hasHardViolations,
            hasSoftViolations,
        };
    }

    private validateWeekendRule(
        assignments: ShiftAssignment[],
        summaries: StaffWorkSummary[],
        staff: StaffMember[]
    ): RuleValidation {
        const details: string[] = [];
        let violationCount = 0;

        // Check if weekend shifts are grouped (same person Sat & Sun)
        const weekendDates = this.getWeekendDates(assignments);
        const weekendGroups = this.groupWeekendsByStaff(assignments, weekendDates);

        for (const [staffId, weekends] of weekendGroups) {
            const staffMember = staff.find((s) => s.id === staffId);
            if (!staffMember) continue;

            // Check if staff has partial weekends (only Sat or Sun, not both)
            for (const weekend of weekends) {
                if (weekend.hasOnlyOneDay) {
                    violationCount++;
                    details.push(
                        `${staffMember.name} has only ${weekend.days.join(', ')} for weekend ${weekend.weekendLabel}`
                    );
                }
            }
        }

        return {
            ruleId: 'weekend-grouping',
            ruleName: 'Weekend Grouping',
            description: 'Weekend shifts should be grouped (same person works both Saturday and Sunday)',
            severity: violationCount > 0 ? RuleViolationSeverity.SoftViolation : RuleViolationSeverity.Satisfied,
            violationCount,
            details,
        };
    }

    private validateNightBlockRule(
        assignments: ShiftAssignment[],
        staff: StaffMember[],
        periodStart: string
    ): RuleValidation {
        const details: string[] = [];
        let violationCount = 0;

        // Group night assignments by staff
        const nightAssignmentsByStaff = new Map<string, ShiftAssignment[]>();
        
        for (const assignment of assignments) {
            if (assignment.shiftType === ShiftType.Night) {
                if (!nightAssignmentsByStaff.has(assignment.staffId)) {
                    nightAssignmentsByStaff.set(assignment.staffId, []);
                }
                nightAssignmentsByStaff.get(assignment.staffId)!.push(assignment);
            }
        }

        // Check for isolated night shifts
        for (const [staffId, nightShifts] of nightAssignmentsByStaff) {
            const staffMember = staff.find((s) => s.id === staffId);
            if (!staffMember || nightShifts.length === 0) continue;

            // Sort by date
            nightShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Check for isolated nights (single night shifts with gaps)
            let consecutiveCount = 1;
            for (let i = 1; i < nightShifts.length; i++) {
                const prevDate = new Date(nightShifts[i - 1].date);
                const currDate = new Date(nightShifts[i].date);
                const daysDiff = Math.floor(
                    (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysDiff === 1) {
                    consecutiveCount++;
                } else {
                    // Check if previous block was isolated (only 1 night)
                    if (consecutiveCount === 1) {
                        violationCount++;
                        details.push(
                            `${staffMember.name} has an isolated night shift on ${nightShifts[i - 1].date}`
                        );
                    }
                    consecutiveCount = 1;
                }
            }

            // Check the last block
            if (consecutiveCount === 1 && nightShifts.length > 0) {
                violationCount++;
                details.push(
                    `${staffMember.name} has an isolated night shift on ${nightShifts[nightShifts.length - 1].date}`
                );
            }
        }

        return {
            ruleId: 'night-blocking',
            ruleName: 'Night Block Assignment',
            description: 'Night shifts should be assigned in consecutive blocks, avoiding isolated single nights',
            severity: violationCount > 0 ? RuleViolationSeverity.SoftViolation : RuleViolationSeverity.Satisfied,
            violationCount,
            details,
        };
    }

    private validateWeekBalanceRule(summaries: StaffWorkSummary[], staff: StaffMember[]): RuleValidation {
        const details: string[] = [];
        let violationCount = 0;

        for (const summary of summaries) {
            const staffMember = staff.find((s) => s.id === summary.staffId);
            if (!staffMember) continue;

            const difference = Math.abs(summary.week1Assigned - summary.week2Assigned);

            // Tolerance of 1 shift is acceptable
            if (difference > 1) {
                violationCount++;
                details.push(
                    `${staffMember.name} has unbalanced weeks: ${summary.week1Assigned} shifts in Week 1, ${summary.week2Assigned} shifts in Week 2 (difference: ${difference})`
                );
            }
        }

        return {
            ruleId: 'week-balance',
            ruleName: 'Week 1/Week 2 Balance',
            description: 'Staff shifts should be balanced between Week 1 and Week 2 (difference ≤ 1)',
            severity: violationCount > 0 ? RuleViolationSeverity.SoftViolation : RuleViolationSeverity.Satisfied,
            violationCount,
            details,
        };
    }

    private validateGenderRule(
        assignments: ShiftAssignment[],
        staff: StaffMember[],
        periodStart: string
    ): RuleValidation {
        const details: string[] = [];
        let violationCount = 0;

        // Group assignments by shift slot
        const slotAssignments = new Map<string, ShiftAssignment[]>();
        
        for (const assignment of assignments) {
            if (!slotAssignments.has(assignment.shiftSlotId)) {
                slotAssignments.set(assignment.shiftSlotId, []);
            }
            slotAssignments.get(assignment.shiftSlotId)!.push(assignment);
        }

        // Check each shift for at least 2 male RAs
        for (const [slotId, slotStaff] of slotAssignments) {
            const maleRAs = slotStaff.filter((a) => {
                const member = staff.find((s) => s.id === a.staffId);
                return member && member.role === Role.RA && member.gender === Gender.Male;
            });

            if (maleRAs.length < 2) {
                violationCount++;
                const [date, shiftType] = slotId.split('-').slice(0, -1).join('-') + '-' + slotId.split('-').pop();
                details.push(`Shift ${slotId} has only ${maleRAs.length} male RA(s), requires 2`);
            }
        }

        return {
            ruleId: 'gender-requirement',
            ruleName: 'Minimum Male RAs',
            description: 'Each shift requires at least 2 male RAs',
            severity: violationCount > 0 ? RuleViolationSeverity.HardViolation : RuleViolationSeverity.Satisfied,
            violationCount,
            details,
        };
    }

    private getWeekendDates(assignments: ShiftAssignment[]): Set<string> {
        const weekendDates = new Set<string>();
        
        for (const assignment of assignments) {
            const date = new Date(assignment.date);
            const day = date.getDay();
            if (day === 0 || day === 6) {
                weekendDates.add(assignment.date);
            }
        }
        
        return weekendDates;
    }

    private groupWeekendsByStaff(
        assignments: ShiftAssignment[],
        weekendDates: Set<string>
    ): Map<string, Array<{ weekendLabel: string; days: string[]; hasOnlyOneDay: boolean }>> {
        const staffWeekends = new Map<string, Map<string, Set<string>>>();

        // Group weekend assignments by staff and weekend pair
        for (const assignment of assignments) {
            if (!weekendDates.has(assignment.date)) continue;

            const date = new Date(assignment.date);
            const day = date.getDay();

            // Find the Saturday of this weekend
            let saturdayDate: Date;
            if (day === 6) {
                // This is Saturday
                saturdayDate = new Date(date);
            } else {
                // This is Sunday, go back one day
                saturdayDate = new Date(date);
                saturdayDate.setDate(saturdayDate.getDate() - 1);
            }

            const weekendKey = saturdayDate.toISOString().split('T')[0];

            if (!staffWeekends.has(assignment.staffId)) {
                staffWeekends.set(assignment.staffId, new Map());
            }

            const staffMap = staffWeekends.get(assignment.staffId)!;
            if (!staffMap.has(weekendKey)) {
                staffMap.set(weekendKey, new Set());
            }

            staffMap.get(weekendKey)!.add(assignment.date);
        }

        // Convert to result format
        const result = new Map<string, Array<{ weekendLabel: string; days: string[]; hasOnlyOneDay: boolean }>>();

        for (const [staffId, weekendsMap] of staffWeekends) {
            const weekends: Array<{ weekendLabel: string; days: string[]; hasOnlyOneDay: boolean }> = [];

            for (const [saturdayKey, dates] of weekendsMap) {
                const daysArray = Array.from(dates).sort();
                weekends.push({
                    weekendLabel: saturdayKey,
                    days: daysArray,
                    hasOnlyOneDay: dates.size === 1,
                });
            }

            result.set(staffId, weekends);
        }

        return result;
    }
}
