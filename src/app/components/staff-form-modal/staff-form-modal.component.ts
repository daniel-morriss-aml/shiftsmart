import { Component, input, output, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { StaffMember, Gender, Role, ShiftType, ShiftSlotId } from '../../models';

interface ShiftSlot {
  day: number; // 1-14
  shift: ShiftType;
  id: ShiftSlotId;
  available: boolean;
}

@Component({
  selector: 'app-staff-form-modal',
  imports: [CommonModule, FormsModule, ModalComponent],
  standalone: true,
  templateUrl: './staff-form-modal.component.html',
  styleUrl: './staff-form-modal.component.scss'
})
export class StaffFormModalComponent implements OnInit {
  isOpen = input(false);
  staffMember = input<StaffMember | null>(null);
  save = output<StaffMember>();
  cancel = output<void>();

  // Constants
  private readonly SATURDAY_INDEX = 5;
  private readonly SUNDAY_INDEX = 6;
  private readonly MAX_SHIFTS_PER_FORTNIGHT = 28;
  readonly days = Array.from({ length: 14 }, (_, i) => i + 1);

  // Form fields
  name = '';
  role: Role = Role.Nurse;
  gender: Gender = Gender.Female;
  shiftsPerFortnight = 7;
  
  // Availability
  shiftSlots: ShiftSlot[] = [];

  // Validation errors
  errorMessage = '';

  // Enums for templates
  Role = Role;
  Gender = Gender;
  roles = Object.values(Role);
  genders = Object.values(Gender);

  ngOnInit(): void {
    this.initializeShiftSlots();
  }

  constructor() {
    // Watch for changes to staffMember input
    effect(() => {
      const member = this.staffMember();
      if (member) {
        this.loadStaffMember(member);
      } else {
        this.resetForm();
      }
    });
  }

  initializeShiftSlots(): void {
    this.shiftSlots = [];
    for (let day = 1; day <= 14; day++) {
      this.shiftSlots.push({
        day,
        shift: 'Day',
        id: `day-${day}-Day`,
        available: true
      });
      this.shiftSlots.push({
        day,
        shift: 'Night',
        id: `day-${day}-Night`,
        available: true
      });
    }
  }

  loadStaffMember(member: StaffMember): void {
    this.name = member.name;
    this.role = member.role;
    this.gender = member.gender;
    this.shiftsPerFortnight = member.shiftsPerFortnight;
    
    // Initialize all slots as available
    this.initializeShiftSlots();
    
    // Mark unavailable slots using direct ID matching
    if (member.availability.unavailableSlots) {
      member.availability.unavailableSlots.forEach(slotId => {
        const slot = this.shiftSlots.find(s => s.id === slotId);
        if (slot) {
          slot.available = false;
        }
      });
    }
  }

  resetForm(): void {
    this.name = '';
    this.role = Role.Nurse;
    this.gender = Gender.Female;
    this.shiftsPerFortnight = 7;
    this.errorMessage = '';
    this.initializeShiftSlots();
  }

  /**
   * Returns a formatted label for a day in the fortnight (e.g., "W1 Mon", "W2 Fri")
   */
  getDayLabel(day: number): string {
    const weekday = (day - 1) % 7;
    const week = day <= 7 ? 1 : 2;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `W${week} ${days[weekday]}`;
  }

  /**
   * Checks if a given day falls on a weekend (Saturday or Sunday)
   */
  isWeekend(day: number): boolean {
    const weekday = (day - 1) % 7;
    return weekday === this.SATURDAY_INDEX || weekday === this.SUNDAY_INDEX;
  }

  onSave(): void {
    // Clear previous error
    this.errorMessage = '';

    if (!this.name.trim()) {
      this.errorMessage = 'Please enter a name';
      return;
    }

    if (this.shiftsPerFortnight <= 0) {
      this.errorMessage = 'Shifts per fortnight must be greater than 0';
      return;
    }

    if (this.shiftsPerFortnight > this.MAX_SHIFTS_PER_FORTNIGHT) {
      this.errorMessage = `Shifts per fortnight cannot exceed ${this.MAX_SHIFTS_PER_FORTNIGHT}`;
      return;
    }

    const unavailableSlots = this.shiftSlots
      .filter(slot => !slot.available)
      .map(slot => slot.id);

    const availableSlots = this.shiftSlots.filter(s => s.available);
    const canWorkDays = availableSlots.some(s => s.shift === 'Day');
    const canWorkNights = availableSlots.some(s => s.shift === 'Night');
    const canWorkWeekends = availableSlots.some(s => this.isWeekend(s.day));

    if (!canWorkDays && !canWorkNights) {
      this.errorMessage = 'Staff member must be available for at least one shift';
      return;
    }

    // Validate feasibility of shifts requested vs available slots
    const maxPossibleShifts = availableSlots.length;
    if (this.shiftsPerFortnight > maxPossibleShifts) {
      this.errorMessage = `Cannot request ${this.shiftsPerFortnight} shifts when only ${maxPossibleShifts} slots are available. Please adjust shifts or availability.`;
      return;
    }

    const staff: StaffMember = {
      id: this.staffMember()?.id || this.generateId(),
      name: this.name.trim(),
      role: this.role,
      gender: this.gender,
      shiftsPerFortnight: this.shiftsPerFortnight,
      availability: {
        canWorkDays,
        canWorkNights,
        canWorkWeekends,
        unavailableSlots
      }
    };

    this.save.emit(staff);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  generateId(): string {
    return `staff-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Toggles the availability of all shifts of a specific type (Day or Night)
   * @param shiftType The type of shift to toggle
   * @param available Whether to mark the shifts as available or unavailable
   */
  toggleAllShifts(shiftType: 'Day' | 'Night', available: boolean): void {
    this.shiftSlots
      .filter(slot => slot.shift === shiftType)
      .forEach(slot => slot.available = available);
  }

  /**
   * Toggles the availability of all weekday shifts (Monday-Friday)
   * @param available Whether to mark the shifts as available or unavailable
   */
  toggleAllWeekdays(available: boolean): void {
    this.shiftSlots
      .filter(slot => !this.isWeekend(slot.day))
      .forEach(slot => slot.available = available);
  }

  /**
   * Toggles the availability of all weekend shifts (Saturday-Sunday)
   * @param available Whether to mark the shifts as available or unavailable
   */
  toggleAllWeekends(available: boolean): void {
    this.shiftSlots
      .filter(slot => this.isWeekend(slot.day))
      .forEach(slot => slot.available = available);
  }
}
