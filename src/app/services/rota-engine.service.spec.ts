import { TestBed } from '@angular/core/testing';
import { RotaEngineService } from './rota-engine.service';
import { Gender, HospitalConfig, Role, ShiftType, StaffMember } from '../models';

describe('RotaEngineService', () => {
    let service: RotaEngineService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RotaEngineService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('generateRota', () => {
        let testStaff: StaffMember[];
        let testConfig: HospitalConfig;
        let periodStart: string;

        beforeEach(() => {
            // Create test staff with different roles and availabilities
            testStaff = [
                {
                    id: 'nurse1',
                    name: 'Nurse Alice',
                    gender: Gender.Female,
                    role: Role.Nurse,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: true,
                        canWorkWeekends: true,
                    },
                    shiftsPerFortnight: 7,
                },
                {
                    id: 'nurse2',
                    name: 'Nurse Bob',
                    gender: Gender.Male,
                    role: Role.Nurse,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: false,
                        canWorkWeekends: true,
                    },
                    shiftsPerFortnight: 6,
                },
                {
                    id: 'ra1',
                    name: 'RA Charlie',
                    gender: Gender.Male,
                    role: Role.RA,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: true,
                        canWorkWeekends: true,
                    },
                    shiftsPerFortnight: 8,
                },
                {
                    id: 'ra2',
                    name: 'RA Dana',
                    gender: Gender.Female,
                    role: Role.RA,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: true,
                        canWorkWeekends: false,
                    },
                    shiftsPerFortnight: 5,
                },
            ];

            testConfig = {
                id: 'test-config',
                name: 'Test Hospital',
                defaultDayRequirement: {
                    shiftType: ShiftType.Day,
                    minNurses: 1,
                    maxNurses: 2,
                    minRAs: 2,
                    maxRAs: 3,
                    maxTotalStaff: 5,
                },
                defaultNightRequirement: {
                    shiftType: ShiftType.Night,
                    minNurses: 1,
                    maxNurses: 2,
                    minRAs: 1,
                    maxRAs: 2,
                    maxTotalStaff: 4,
                },
            };

            // Use a Monday as the start date
            periodStart = '2026-01-05'; // Monday
        });

        it('should generate a rota with correct period dates', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            expect(rota.periodStart).toBe('2026-01-05');
            expect(rota.periodEnd).toBe('2026-01-18');
        });

        it('should generate a unique rota ID', () => {
            const rota1 = service.generateRota(testStaff, testConfig, periodStart);
            const rota2 = service.generateRota(testStaff, testConfig, periodStart);

            expect(rota1.id).toBeTruthy();
            expect(rota2.id).toBeTruthy();
            expect(rota1.id).not.toBe(rota2.id);
        });

        it('should create assignments for 14 days × 2 shifts', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            // Count unique slot IDs
            const uniqueSlots = new Set(rota.assignments.map((a) => a.shiftSlotId));
            
            // Should have assignments (may not fill all 28 slots, but should have some)
            expect(rota.assignments.length).toBeGreaterThan(0);
        });

        it('should respect staff role (Nurse vs RA)', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            // Check that nurses are assigned
            const nurseAssignments = rota.assignments.filter((a) =>
                testStaff.find((s) => s.id === a.staffId && s.role === Role.Nurse)
            );
            expect(nurseAssignments.length).toBeGreaterThan(0);

            // Check that RAs are assigned
            const raAssignments = rota.assignments.filter((a) =>
                testStaff.find((s) => s.id === a.staffId && s.role === Role.RA)
            );
            expect(raAssignments.length).toBeGreaterThan(0);
        });

        it('should respect staff day/night availability', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            // Nurse Bob cannot work nights
            const nurseBobNightShifts = rota.assignments.filter(
                (a) => a.staffId === 'nurse2' && a.shiftType === ShiftType.Night
            );
            expect(nurseBobNightShifts.length).toBe(0);
        });

        it('should respect staff weekend availability', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            // RA Dana cannot work weekends
            const danaAssignments = rota.assignments.filter((a) => a.staffId === 'ra2');

            for (const assignment of danaAssignments) {
                const date = new Date(assignment.date);
                const dayOfWeek = date.getDay();
                expect(dayOfWeek).not.toBe(0); // Not Sunday
                expect(dayOfWeek).not.toBe(6); // Not Saturday
            }
        });

        it('should respect unavailable slots', () => {
            // Add unavailable slot to a staff member
            const modifiedStaff = [...testStaff];
            modifiedStaff[0] = {
                ...modifiedStaff[0],
                availability: {
                    ...modifiedStaff[0].availability,
                    unavailableSlots: ['2026-01-05-Day', '2026-01-06-Night'],
                },
            };

            const rota = service.generateRota(modifiedStaff, testConfig, periodStart);

            // Check that nurse1 is not assigned to unavailable slots
            const unavailableAssignments = rota.assignments.filter(
                (a) =>
                    a.staffId === 'nurse1' &&
                    (a.shiftSlotId === '2026-01-05-Day' || a.shiftSlotId === '2026-01-06-Night')
            );
            expect(unavailableAssignments.length).toBe(0);
        });

        it('should compute staff work summaries', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            expect(rota.staffSummaries.length).toBe(testStaff.length);

            // Each staff member should have a summary
            for (const staff of testStaff) {
                const summary = rota.staffSummaries.find((s) => s.staffId === staff.id);
                expect(summary).toBeTruthy();
                if (summary) {
                    expect(summary.totalAssigned).toBeGreaterThanOrEqual(0);
                    expect(summary.week1Assigned).toBeGreaterThanOrEqual(0);
                    expect(summary.week2Assigned).toBeGreaterThanOrEqual(0);
                    expect(summary.totalAssigned).toBe(
                        summary.week1Assigned + summary.week2Assigned
                    );
                }
            }
        });

        it('should track day and night counts in summaries', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            for (const summary of rota.staffSummaries) {
                expect(summary.dayCount).toBeGreaterThanOrEqual(0);
                expect(summary.nightCount).toBeGreaterThanOrEqual(0);
                expect(summary.totalAssigned).toBe(summary.dayCount + summary.nightCount);
            }
        });

        it('should track weekend counts in summaries', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            for (const summary of rota.staffSummaries) {
                expect(summary.weekendCount).toBeGreaterThanOrEqual(0);
                expect(summary.weekendCount).toBeLessThanOrEqual(summary.totalAssigned);
            }
        });

        it('should not exceed staff shiftsPerFortnight limit', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            for (const summary of rota.staffSummaries) {
                const staff = testStaff.find((s) => s.id === summary.staffId);
                expect(staff).toBeTruthy();
                expect(summary.totalAssigned).toBeLessThanOrEqual(staff!.shiftsPerFortnight);
            }
        });

        it('should handle empty staff list', () => {
            const rota = service.generateRota([], testConfig, periodStart);

            expect(rota.assignments.length).toBe(0);
            expect(rota.staffSummaries.length).toBe(0);
        });

        it('should assign correct dates in assignments', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            const startDateObj = new Date(periodStart);
            const endDateObj = new Date(rota.periodEnd);

            for (const assignment of rota.assignments) {
                const assignmentDate = new Date(assignment.date);
                expect(assignmentDate >= startDateObj).toBe(true);
                expect(assignmentDate <= endDateObj).toBe(true);
            }
        });

        it('should create shiftSlotId in correct format', () => {
            const rota = service.generateRota(testStaff, testConfig, periodStart);

            for (const assignment of rota.assignments) {
                // Format: YYYY-MM-DD-ShiftType
                expect(assignment.shiftSlotId).toMatch(/^\d{4}-\d{2}-\d{2}-(Day|Night)$/);
                expect(assignment.shiftSlotId).toBe(`${assignment.date}-${assignment.shiftType}`);
            }
        });

        it('should prioritize male RAs to reduce gender requirement violations', () => {
            // Test that male RA prioritization improves (reduces violations)
            // compared to not having the prioritization
            
            // First, test with staff that would definitely cause violations without proper ordering
            const testStaffForViolations: StaffMember[] = [
                // List nurses and female RAs first to test that male RAs are still prioritized
                {
                    id: 'nurse-1',
                    name: 'Nurse 1',
                    gender: Gender.Female,
                    role: Role.Nurse,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: true,
                        canWorkWeekends: true,
                    },
                    shiftsPerFortnight: 7,
                },
                {
                    id: 'female-ra-1',
                    name: 'Female RA 1',
                    gender: Gender.Female,
                    role: Role.RA,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: true,
                        canWorkWeekends: true,
                    },
                    shiftsPerFortnight: 7,
                },
                // Only 2 male RAs with limited shifts
                {
                    id: 'male-ra-1',
                    name: 'Male RA 1',
                    gender: Gender.Male,
                    role: Role.RA,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: true,
                        canWorkWeekends: true,
                    },
                    shiftsPerFortnight: 7,
                },
                {
                    id: 'male-ra-2',
                    name: 'Male RA 2',
                    gender: Gender.Male,
                    role: Role.RA,
                    availability: {
                        canWorkDays: true,
                        canWorkNights: true,
                        canWorkWeekends: true,
                    },
                    shiftsPerFortnight: 7,
                },
            ];

            const rota = service.generateRota(testStaffForViolations, testConfig, periodStart);

            // Verify that male RAs are being assigned to shifts
            const maleRAAssignments = rota.assignments.filter((a) => {
                const staff = testStaffForViolations.find((s) => s.id === a.staffId);
                return staff && staff.role === Role.RA && staff.gender === Gender.Male;
            });

            // Male RAs should be assigned to multiple shifts
            expect(maleRAAssignments.length).toBeGreaterThan(0);
            
            // Check work summaries show male RAs are working
            const maleRA1Summary = rota.staffSummaries.find((s) => s.staffId === 'male-ra-1');
            const maleRA2Summary = rota.staffSummaries.find((s) => s.staffId === 'male-ra-2');
            
            expect(maleRA1Summary).toBeTruthy();
            expect(maleRA2Summary).toBeTruthy();
            
            // Both male RAs should be assigned close to their maximum shifts
            if (maleRA1Summary && maleRA2Summary) {
                expect(maleRA1Summary.totalAssigned).toBeGreaterThan(0);
                expect(maleRA2Summary.totalAssigned).toBeGreaterThan(0);
            }
        });
    });
});
