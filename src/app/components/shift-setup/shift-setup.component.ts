import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftConfigService } from '../../services/shift-config.service';
import { ShiftRequirement, ShiftType } from '../../models';
import { ShiftFormModalComponent } from '../shift-form-modal/shift-form-modal.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-shift-setup',
  imports: [CommonModule, ShiftFormModalComponent, ConfirmationModalComponent],
  standalone: true,
  templateUrl: './shift-setup.component.html',
  styleUrl: './shift-setup.component.scss'
})
export class ShiftSetupComponent {
  private shiftConfigService = inject(ShiftConfigService);

  config = this.shiftConfigService.hospitalConfig;

  // Computed signals for UI helpers
  dayRequirement = computed(() => this.config().defaultDayRequirement);
  nightRequirement = computed(() => this.config().defaultNightRequirement);

  // Modal states
  isFormModalOpen = false;
  isResetModalOpen = false;
  selectedShiftType: ShiftType | null = null;
  editingRequirement: ShiftRequirement | null = null;

  // Enums for template
  ShiftType = ShiftType;

  openEditModal(shiftType: ShiftType): void {
    this.selectedShiftType = shiftType;
    this.editingRequirement = shiftType === ShiftType.Day 
      ? this.dayRequirement() 
      : this.nightRequirement();
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedShiftType = null;
    this.editingRequirement = null;
  }

  openResetModal(): void {
    this.isResetModalOpen = true;
  }

  closeResetModal(): void {
    this.isResetModalOpen = false;
  }

  onSaveRequirement(requirement: ShiftRequirement): void {
    if (this.selectedShiftType === ShiftType.Day) {
      this.shiftConfigService.updateDayRequirement(requirement);
    } else if (this.selectedShiftType === ShiftType.Night) {
      this.shiftConfigService.updateNightRequirement(requirement);
    }
    this.closeFormModal();
  }

  onConfirmReset(): void {
    this.shiftConfigService.resetToDefaults();
    this.closeResetModal();
  }

  getShiftTypeBadgeClass(shiftType: ShiftType): string {
    return shiftType === ShiftType.Day 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-indigo-100 text-indigo-800';
  }

  hasValidationIssues(requirement: ShiftRequirement): boolean {
    const errors = this.shiftConfigService.validateRequirement(requirement);
    return errors.length > 0;
  }

  getValidationIssues(requirement: ShiftRequirement): string[] {
    return this.shiftConfigService.validateRequirement(requirement);
  }

  loadDemoData(): void {
    // Reset to defaults as demo data
    this.shiftConfigService.resetToDefaults();
  }
}
