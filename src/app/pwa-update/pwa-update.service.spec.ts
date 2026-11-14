import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject, of } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  let versionUpdates: Subject<VersionEvent>;
  let unrecoverable: Subject<unknown>;
  let checkForUpdate: ReturnType<typeof vi.fn>;

  function configure(isEnabled: boolean): void {
    versionUpdates = new Subject<VersionEvent>();
    unrecoverable = new Subject<unknown>();
    checkForUpdate = vi.fn().mockResolvedValue(false);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SwUpdate,
          useValue: { isEnabled, versionUpdates, unrecoverable, checkForUpdate },
        },
        { provide: ApplicationRef, useValue: { isStable: of(true) } },
      ],
    });
  }

  it('should flag an update as ready once a VERSION_READY event is received', () => {
    configure(true);
    const service = TestBed.inject(PwaUpdateService);

    expect(service.updateReady()).toBe(false);

    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    });

    expect(service.updateReady()).toBe(true);
  });

  it('should reload automatically on an unrecoverable state', () => {
    configure(true);
    const service = TestBed.inject(PwaUpdateService);
    const reloadSpy = vi.spyOn(service, 'reload').mockImplementation(() => {});

    unrecoverable.next({});

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should check for updates once the app is stable', () => {
    configure(true);
    TestBed.inject(PwaUpdateService);

    expect(checkForUpdate).toHaveBeenCalled();
  });

  it('should do nothing when the service worker is disabled', () => {
    configure(false);
    const service = TestBed.inject(PwaUpdateService);

    expect(service.updateReady()).toBe(false);
    expect(checkForUpdate).not.toHaveBeenCalled();
  });
});
