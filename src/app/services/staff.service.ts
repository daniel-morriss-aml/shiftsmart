import { Injectable, signal } from '@angular/core';
import { StaffMember } from '../models';

@Injectable({
    providedIn: 'root',
})
export class StaffService {
    private readonly storageKey = 'shiftsmart_staff';
    private staffList = signal<StaffMember[]>([]);

    // Public readonly signal for components to read
    readonly staff = this.staffList.asReadonly();

    constructor() {
        this.loadFromStorage();
    }

    addStaff(member: StaffMember): void {
        this.staffList.update((current) => {
            if (current.some((s) => s.id === member.id)) {
                console.warn(`Staff member with id "${member.id}" already exists. Skipping add.`);
                return current;
            }
            return [...current, member];
        });
        this.saveToStorage();
    }

    updateStaff(member: StaffMember): void {
        this.staffList.update((current) => current.map((s) => (s.id === member.id ? member : s)));
        this.saveToStorage();
    }

    deleteStaff(id: string): void {
        this.staffList.update((current) => current.filter((s) => s.id !== id));
        this.saveToStorage();
    }

    getStaffById(id: string): StaffMember | undefined {
        return this.staffList().find((s) => s.id === id);
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored) as StaffMember[];
                this.staffList.set(data);
            }
        } catch (error) {
            console.error('Failed to load staff from storage:', error);
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.staffList()));
        } catch (error) {
            console.error('Failed to save staff to storage:', error);
        }
    }

    clearAll(): void {
        this.staffList.set([]);
        localStorage.removeItem(this.storageKey);
    }

    exportStaffList(): string {
        return JSON.stringify(this.staffList(), null, 2);
    }

    downloadStaffList(): void {
        const jsonData = this.exportStaffList();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shiftsmart-staff-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    importStaffList(jsonData: string): { success: boolean; error?: string; count?: number } {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate that data is an array
            if (!Array.isArray(data)) {
                return { success: false, error: 'Invalid format: Expected an array of staff members' };
            }

            // Validate each staff member has required fields
            for (const member of data) {
                if (!this.isValidStaffMember(member)) {
                    return { 
                        success: false, 
                        error: `Invalid staff member format. Each member must have: id, name, gender, role, availability, and shiftsPerFortnight` 
                    };
                }
            }

            // Import the data
            this.staffList.set(data as StaffMember[]);
            this.saveToStorage();
            
            return { success: true, count: data.length };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to parse JSON data' 
            };
        }
    }

    private isValidStaffMember(member: unknown): member is StaffMember {
        if (typeof member !== 'object' || member === null) {
            return false;
        }

        const m = member as Record<string, unknown>;
        
        return (
            typeof m['id'] === 'string' &&
            typeof m['name'] === 'string' &&
            typeof m['gender'] === 'string' &&
            typeof m['role'] === 'string' &&
            typeof m['shiftsPerFortnight'] === 'number' &&
            typeof m['availability'] === 'object' &&
            m['availability'] !== null &&
            this.isValidAvailability(m['availability'])
        );
    }

    private isValidAvailability(availability: unknown): boolean {
        if (typeof availability !== 'object' || availability === null) {
            return false;
        }

        const a = availability as Record<string, unknown>;

        const hasValidUnavailableSlots =
            a['unavailableSlots'] === undefined ||
            (Array.isArray(a['unavailableSlots']) &&
                (a['unavailableSlots'] as unknown[]).every((slot) => typeof slot === 'string'));

        return (
            typeof a['canWorkDays'] === 'boolean' &&
            typeof a['canWorkNights'] === 'boolean' &&
            typeof a['canWorkWeekends'] === 'boolean' &&
            hasValidUnavailableSlots
        );
    }
}
