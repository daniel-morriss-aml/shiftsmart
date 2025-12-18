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
}
