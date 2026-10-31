import { Component } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toastService.toasts | async"
           class="toast"
           [class.toast-success]="t.type === 'success'"
           [class.toast-error]="t.type === 'error'">

        <div class="toast-icon">
          <svg *ngIf="t.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg *ngIf="t.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>

        <div class="toast-body">
          <div class="toast-message">{{ t.message }}</div>
        </div>

      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
