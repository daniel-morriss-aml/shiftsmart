import { CommonModule } from '@angular/common';
import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShiftRequirement, ShiftType } from '../../models';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-shift-form-modal',
  imports: [CommonModule, FormsModule, ModalComponent],
  standalone: true,
  templateUrl: './shift-form-modal.component.html',
  styleUrl: './shift-form-modal.component.scss'
})
export class ShiftFormModalComponent {
  isOpen = input(false);
  shiftRequirement = input<ShiftRequirement | null>(null);
  shiftType = input<ShiftType>(ShiftType.Day);
  save = output<ShiftRequirement>();
  cancel = output<void>();

  // Form fields with reasonable defaults
  minNurses = 2;
  maxNurses = 4;
  minRAs = 2;
  maxRAs = 4;
  maxTotalStaff = 8;

  // Validation errors
  errorMessage = '';

  // Enums for templates
  ShiftType = ShiftType;

  constructor() {
    // Watch for changes to shiftRequirement input
    effect(() => {
      const requirement = this.shiftRequirement();
      if (requirement) {
        this.loadShiftRequirement(requirement);
      } else {
        this.resetForm();
      }
    });
  }

  loadShiftRequirement(requirement: ShiftRequirement): void {
    this.minNurses = requirement.minNurses;
    this.maxNurses = requirement.maxNurses;
    this.minRAs = requirement.minRAs;
    this.maxRAs = requirement.maxRAs;
    this.maxTotalStaff = requirement.maxTotalStaff;
  }

  resetForm(): void {
    // Reset to reasonable defaults (actual defaults come from the loaded requirement)
    this.minNurses = 2;
    this.maxNurses = 4;
    this.minRAs = 2;
    this.maxRAs = 4;
    this.maxTotalStaff = 8;
    this.errorMessage = '';
  }

  onSave(): void {
    // Clear previous error
    this.errorMessage = '';

    // Validation
    if (this.minNurses < 0) {
      this.errorMessage = 'Minimum nurses cannot be negative';
      return;
    }
    if (this.maxNurses < this.minNurses) {
      this.errorMessage = 'Maximum nurses must be >= minimum nurses';
      return;
    }
    if (this.minRAs < 0) {
      this.errorMessage = 'Minimum RAs cannot be negative';
      return;
    }
    if (this.maxRAs < this.minRAs) {
      this.errorMessage = 'Maximum RAs must be >= minimum RAs';
      return;
    }
    if (this.maxTotalStaff < this.minNurses + this.minRAs) {
      this.errorMessage = 'Maximum total staff must be >= minimum nurses + minimum RAs';
      return;
    }
    if (this.maxTotalStaff < this.maxNurses + this.maxRAs) {
      this.errorMessage = 'Maximum total staff must be >= maximum nurses + maximum RAs';
      return;
    }

    const requirement: ShiftRequirement = {
      shiftType: this.shiftType(),
      minNurses: this.minNurses,
      maxNurses: this.maxNurses,
      minRAs: this.minRAs,
      maxRAs: this.maxRAs,
      maxTotalStaff: this.maxTotalStaff
    };

    this.save.emit(requirement);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getShiftTypeLabel(): string {
    return this.shiftType() === ShiftType.Day ? 'Day' : 'Night';
  }
}
