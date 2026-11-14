import { Component, inject } from '@angular/core';
import { PwaUpdateService } from '../pwa-update/pwa-update.service';

@Component({
  selector: 'app-pwa-update-toast',
  templateUrl: './pwa-update-toast.html',
  styleUrl: './pwa-update-toast.scss',
})
export class PwaUpdateToast {
  protected readonly pwaUpdate = inject(PwaUpdateService);

  protected reload(): void {
    this.pwaUpdate.reload();
  }
}
