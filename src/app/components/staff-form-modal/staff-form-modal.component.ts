import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { StaffMember, Gender, Role } from '../../models';

interface ShiftSlot {
  day: number; // 1-14
  shift: 'Day' | 'Night';
  id: string;
  available: boolean;
}

@Component({
  selector: 'app-staff-form-modal',
  imports: [CommonModule, FormsModule, ModalComponent],
  standalone: true,
  templateUrl: './staff-form-modal.component.html',
  styleUrl: './staff-form-modal.component.scss'
})
export class StaffFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() staffMember: StaffMember | null = null;
  @Output() save = new EventEmitter<StaffMember>();
  @Output() cancel = new EventEmitter<void>();

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

  ngOnChanges(): void {
    if (this.staffMember) {
      this.loadStaffMember(this.staffMember);
    } else {
      this.resetForm();
    }
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

  getDayLabel(day: number): string {
    const weekday = (day - 1) % 7;
    const week = day <= 7 ? 1 : 2;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `W${week} ${days[weekday]}`;
  }

  isWeekend(day: number): boolean {
    const weekday = (day - 1) % 7;
    return weekday === 5 || weekday === 6; // Saturday or Sunday
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

    const staff: StaffMember = {
      id: this.staffMember?.id || this.generateId(),
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

  toggleAllShifts(shiftType: 'Day' | 'Night', available: boolean): void {
    this.shiftSlots
      .filter(slot => slot.shift === shiftType)
      .forEach(slot => slot.available = available);
  }

  toggleAllWeekdays(available: boolean): void {
    this.shiftSlots
      .filter(slot => !this.isWeekend(slot.day))
      .forEach(slot => slot.available = available);
  }

  toggleAllWeekends(available: boolean): void {
    this.shiftSlots
      .filter(slot => this.isWeekend(slot.day))
      .forEach(slot => slot.available = available);
  }
}
