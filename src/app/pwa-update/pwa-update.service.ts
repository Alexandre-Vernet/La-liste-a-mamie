import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { first } from 'rxjs';

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  readonly updateReady = signal(false);

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.updateReady.set(true);
      }
    });

    this.swUpdate.unrecoverable.subscribe(() => this.reload());

    this.appRef.isStable.pipe(first((stable) => stable)).subscribe(() => {
      this.checkForUpdate();
      setInterval(() => this.checkForUpdate(), UPDATE_CHECK_INTERVAL_MS);
    });
  }

  reload(): void {
    document.location.reload();
  }

  private checkForUpdate(): void {
    void this.swUpdate.checkForUpdate();
  }
}
