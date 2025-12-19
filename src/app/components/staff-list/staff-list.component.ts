import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffService } from '../../services/staff.service';
import { StaffMember, Gender, Role } from '../../models';

@Component({
  selector: 'app-staff-list',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss'
})
export class StaffListComponent {
  private staffService = inject(StaffService);

  staff = this.staffService.staff;

  // Computed signals for UI helpers
  hasStaff = computed(() => this.staff().length > 0);

  deleteStaff(id: string): void {
    if (confirm('Are you sure you want to delete this staff member?')) {
      this.staffService.deleteStaff(id);
    }
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
        shiftsPerFortnight: 15  // Impossible constraint: only 10 day shifts available on weekdays
      }
    ];

    // Clear existing data and add dummy data
    this.staffService.clearAll();
    dummyStaff.forEach(member => this.staffService.addStaff(member));
  }
}
