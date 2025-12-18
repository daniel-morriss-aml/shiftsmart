import { Injectable, signal } from '@angular/core';
import { HospitalConfig, ShiftRequirement, ShiftType } from '../models';

@Injectable({
    providedIn: 'root',
})
export class ShiftConfigService {
    private readonly storageKey = 'shiftsmart_config';

    private readonly defaultDay: ShiftRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 2,
        maxNurses: 4,
        minRAs: 6,
        maxRAs: 8,
        maxTotalStaff: 12,
    };

    private readonly defaultNight: ShiftRequirement = {
        shiftType: ShiftType.Night,
        minNurses: 2,
        maxNurses: 3,
        minRAs: 2,
        maxRAs: 4,
        maxTotalStaff: 6,
    };

    private config = signal<HospitalConfig>({
        id: 'default',
        name: 'Default Hospital',
        defaultDayRequirement: this.defaultDay,
        defaultNightRequirement: this.defaultNight,
    });

    // Public readonly signal for components to read
    readonly hospitalConfig = this.config.asReadonly();

    constructor() {
        this.loadFromStorage();
    }

    updateDayRequirement(requirement: ShiftRequirement): void {
        this.config.update((current) => ({
            ...current,
            defaultDayRequirement: requirement,
        }));
        this.saveToStorage();
    }

    updateNightRequirement(requirement: ShiftRequirement): void {
        this.config.update((current) => ({
            ...current,
            defaultNightRequirement: requirement,
        }));
        this.saveToStorage();
    }

    updateHospitalName(name: string): void {
        this.config.update((current) => ({
            ...current,
            name,
        }));
        this.saveToStorage();
    }

    validateRequirement(requirement: ShiftRequirement): string[] {
        const errors: string[] = [];

        if (requirement.minNurses < 0) {
            errors.push('Minimum nurses cannot be negative');
        }
        if (requirement.maxNurses < requirement.minNurses) {
            errors.push('Maximum nurses must be >= minimum nurses');
        }
        if (requirement.minRAs < 0) {
            errors.push('Minimum RAs cannot be negative');
        }
        if (requirement.maxRAs < requirement.minRAs) {
            errors.push('Maximum RAs must be >= minimum RAs');
        }
        if (requirement.maxTotalStaff < requirement.minNurses + requirement.minRAs) {
            errors.push('Maximum total staff must be >= minimum nurses + minimum RAs');
        }
        if (requirement.maxTotalStaff < requirement.maxNurses + requirement.maxRAs) {
            errors.push('Maximum total staff must be >= maximum nurses + maximum RAs');
        }

        return errors;
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored) as HospitalConfig;
                this.config.set(data);
            }
        } catch (error) {
            console.error('Failed to load config from storage:', error);
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.config()));
        } catch (error) {
            console.error('Failed to save config to storage:', error);
        }
    }

    resetToDefaults(): void {
        this.config.set({
            id: 'default',
            name: 'Default Hospital',
            defaultDayRequirement: this.defaultDay,
            defaultNightRequirement: this.defaultNight,
        });
        this.saveToStorage();
    }
}
