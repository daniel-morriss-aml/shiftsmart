import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffService } from '../../services/staff.service';
import { StaffMember, Gender, Role } from '../../models';
import { StaffFormModalComponent } from '../staff-form-modal/staff-form-modal.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-staff-list',
  imports: [CommonModule, StaffFormModalComponent, ConfirmationModalComponent],
  standalone: true,
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss'
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
    const dummyStaff: StaffMember[] = [
      {
        id: '1',
        name: 'Alice Johnson',
        gender: Gender.Female,
        role: Role.Nurse,
        availability: {
          canWorkDays: true,
          canWorkNights: true,
          canWorkWeekends: true
        },
        shiftsPerFortnight: 7
      },
      {
        id: '2',
        name: 'Bob Smith',
        gender: Gender.Male,
        role: Role.RA,
        availability: {
          canWorkDays: true,
          canWorkNights: false,
          canWorkWeekends: true
        },
        shiftsPerFortnight: 5
      },
      {
        id: '3',
        name: 'Carol Martinez',
        gender: Gender.Female,
        role: Role.Nurse,
        availability: {
          canWorkDays: false,
          canWorkNights: true,
          canWorkWeekends: false
        },
        shiftsPerFortnight: 6
      },
      {
        id: '4',
        name: 'David Lee',
        gender: Gender.Male,
        role: Role.RA,
        availability: {
          canWorkDays: true,
          canWorkNights: true,
          canWorkWeekends: true
        },
        shiftsPerFortnight: 8
      },
      {
        id: '5',
        name: 'Emma Wilson',
        gender: Gender.Other,
        role: Role.Nurse,
        availability: {
          canWorkDays: true,
          canWorkNights: false,
          canWorkWeekends: false
        },
        shiftsPerFortnight: 15  // Impossible constraint: only 10 day shifts available (weekdays only)
      }
    ];

    // Clear existing data and add dummy data
    this.staffService.clearAll();
    dummyStaff.forEach(member => this.staffService.addStaff(member));
  }
}
