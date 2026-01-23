import { Injectable, signal } from '@angular/core';
import { Rota, ShiftAssignment, StaffWorkSummary, ShiftType } from '../models';

@Injectable({
    providedIn: 'root',
})
export class RotaStore {
    private currentRota = signal<Rota | null>(null);
    private isGenerating = signal<boolean>(false);
    private lastError = signal<string | null>(null);

    // Public readonly signals for components
    readonly rota = this.currentRota.asReadonly();
    readonly generating = this.isGenerating.asReadonly();
    readonly error = this.lastError.asReadonly();

    setRota(rota: Rota): void {
        this.currentRota.set(rota);
        this.lastError.set(null);
    }

    clearRota(): void {
        this.currentRota.set(null);
        this.lastError.set(null);
    }

    setGenerating(generating: boolean): void {
        this.isGenerating.set(generating);
    }

    setError(error: string): void {
        this.lastError.set(error);
        this.isGenerating.set(false);
    }

    clearError(): void {
        this.lastError.set(null);
    }

    /**
     * Updates the rota assignments and recalculates staff summaries
     */
    updateAssignments(assignments: ShiftAssignment[]): void {
        const rota = this.currentRota();
        if (!rota) return;

        const updatedRota: Rota = {
            ...rota,
            assignments,
            staffSummaries: this.recalculateStaffSummaries(assignments, rota),
        };

        this.currentRota.set(updatedRota);
    }

    /**
     * Recalculates staff work summaries based on current assignments
     */
    private recalculateStaffSummaries(assignments: ShiftAssignment[], rota: Rota): StaffWorkSummary[] {
        const startDate = new Date(rota.periodStart);
        const summaries: StaffWorkSummary[] = [];

        // Get unique staff IDs from current summaries to maintain all staff
        const staffIds = new Set(rota.staffSummaries.map(s => s.staffId));

        for (const staffId of staffIds) {
            const memberAssignments = assignments.filter(a => a.staffId === staffId);

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
                staffId,
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
}
