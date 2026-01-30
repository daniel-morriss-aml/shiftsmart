import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import dummyStaffData from '../../data/dummy-staff.json';
import { Role, StaffMember } from '../../models';
import { StaffService } from '../../services/staff.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { StaffFormModalComponent } from '../staff-form-modal/staff-form-modal.component';

@Component({
    selector: 'app-staff-list',
    imports: [CommonModule, StaffFormModalComponent, ConfirmationModalComponent],
    standalone: true,
    templateUrl: './staff-list.component.html',
    styleUrl: './staff-list.component.scss',
})
export class StaffListComponent {
    private staffService = inject(StaffService);

    staff = this.staffService.staff;

    // Computed signals for UI helpers
    hasStaff = computed(() => this.staff().length > 0);

    // Sorted staff alphabetically by name
    sortedStaff = computed(() => {
        return [...this.staff()].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Modal states
    isFormModalOpen = false;
    isDeleteModalOpen = false;
    selectedStaff: StaffMember | null = null;
    staffToDelete: StaffMember | null = null;

    openAddModal(): void {
        this.selectedStaff = null;
        this.isFormModalOpen = true;
    }

    openEditModal(staff: StaffMember): void {
        this.selectedStaff = staff;
        this.isFormModalOpen = true;
    }

    openDeleteModal(staff: StaffMember): void {
        this.staffToDelete = staff;
        this.isDeleteModalOpen = true;
    }

    closeFormModal(): void {
        this.isFormModalOpen = false;
        this.selectedStaff = null;
    }

    closeDeleteModal(): void {
        this.isDeleteModalOpen = false;
        this.staffToDelete = null;
    }

    onSaveStaff(staff: StaffMember): void {
        if (this.selectedStaff) {
            // Update existing staff
            this.staffService.updateStaff(staff);
        } else {
            // Add new staff
            this.staffService.addStaff(staff);
        }
        this.closeFormModal();
    }

    onConfirmDelete(): void {
        if (this.staffToDelete) {
            this.staffService.deleteStaff(this.staffToDelete.id);
        }
        this.closeDeleteModal();
    }

    // Method to check if staff member has impossible constraints
    hasImpossibleConstraints(member: StaffMember): boolean {
        const availability = member.availability;
        let maxPossibleSlots = 0;

        // Calculate max possible slots based on availability
        // 14 days total, each with Day and Night shifts
        if (availability.canWorkDays && availability.canWorkNights) {
            maxPossibleSlots = 28; // Can work all slots
        } else if (availability.canWorkDays || availability.canWorkNights) {
            maxPossibleSlots = 14; // Can work one shift type per day
        }

        // Adjust for weekend restrictions
        if (!availability.canWorkWeekends) {
            const slotsPerWeekend = availability.canWorkDays && availability.canWorkNights ? 4 : 2;
            maxPossibleSlots -= 2 * slotsPerWeekend; // 2 weekends in fortnight
        }

        return member.shiftsPerFortnight > maxPossibleSlots;
    }

    getRoleBadgeClass(role: Role): string {
        return role === Role.Nurse ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    }

    loadDummyData(): void {
        const dummyStaff = dummyStaffData as StaffMember[];

        // Clear existing data and add dummy data
        this.staffService.clearAll();
        dummyStaff.forEach((member) => this.staffService.addStaff(member));
    }

    exportStaffList(): void {
        this.staffService.downloadStaffList();
    }

    importStaffList(): void {
        // Warn user if there is existing data
        if (this.hasStaff()) {
            const confirmed = confirm(
                'Warning: Importing a staff list will replace all existing staff data. Do you want to continue?',
            );
            if (!confirmed) {
                return;
            }
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e: ProgressEvent<FileReader>) => {
                    const content = e.target?.result as string;
                    const result = this.staffService.importStaffList(content);

                    if (result.success) {
                        alert(`Successfully imported ${result.count} staff member(s)!`);
                    } else {
                        alert(`Failed to import staff list: ${result.error}`);
                    }
                };
                reader.onerror = (e: ProgressEvent<FileReader>) => {
                    const error = (e.target as FileReader | null)?.error;
                    const message =
                        error?.message || 'An error occurred while reading the selected file.';
                    alert(`Failed to read file: ${message}`);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}
