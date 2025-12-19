import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirmation-modal',
  imports: [CommonModule, ModalComponent],
  standalone: true,
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {
  isOpen = input(false);
  title = input('Confirm Action');
  message = input('Are you sure you want to proceed?');
  confirmText = input('Confirm');
  cancelText = input('Cancel');
  confirmButtonClass = input('bg-red-600 hover:bg-red-700');
  confirm = output<void>();
  cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
