import { Injectable } from '@angular/core';
import { HospitalConfig, Rota, StaffMember } from '../models';

@Injectable({
    providedIn: 'root',
})
export class RotaEngineService {
    /**
     * Generates a 2-week rota based on staff, requirements, and rules.
     * This is a skeleton implementation to be filled in during Phase 4.
     *
     * @param staff - List of available staff members
     * @param config - Hospital configuration with shift requirements
     * @param periodStart - Start date (Monday of week 1) in ISO format
     * @returns Generated rota with assignments and summaries
     */
    generateRota(staff: StaffMember[], config: HospitalConfig, periodStart: string): Rota {
        // TODO: Implement the scheduling algorithm
        // Phase 4 will include:
        // 1. Build list of ShiftSlot objects for 14 days × 2 shifts
        // 2. Tag slots as weekend/weekday
        // 3. Assign staff to shifts respecting availability and role
        // 4. Compute StaffWorkSummary for each staff member
        //
        // Phase 5 will add business rules:
        // - Weekend assignment (1 weekend per 2 weeks)
        // - Night blocks (grouped nights, week of nights + week of days)
        // - Week 1/Week 2 balance
        // - Nurse/RA substitution
        // - Min 2 male RAs per shift

        // Calculate period end (13 days after start)
        const startDate = new Date(periodStart);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 13);

        // Return empty rota for now
        return {
            id: this.generateRotaId(),
            periodStart,
            periodEnd: endDate.toISOString().split('T')[0],
            assignments: [],
            staffSummaries: staff.map((s) => ({
                staffId: s.id,
                totalAssigned: 0,
                week1Assigned: 0,
                week2Assigned: 0,
                weekendCount: 0,
                nightCount: 0,
                dayCount: 0,
            })),
        };
    }

    private generateRotaId(): string {
        return `rota-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
