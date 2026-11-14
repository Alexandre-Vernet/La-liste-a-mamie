import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PwaUpdateToast } from './pwa-update-toast';
import { PwaUpdateService } from '../pwa-update/pwa-update.service';

describe('PwaUpdateToast', () => {
  let updateReady: ReturnType<typeof signal<boolean>>;
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    updateReady = signal(false);
    reload = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PwaUpdateToast],
      providers: [{ provide: PwaUpdateService, useValue: { updateReady, reload } }],
    }).compileComponents();
  });

  it('should show nothing when no update is ready', async () => {
    const fixture = TestBed.createComponent(PwaUpdateToast);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.update-toast')).toBeNull();
  });

  it('should show the toast and reload on click once an update is ready', async () => {
    const fixture = TestBed.createComponent(PwaUpdateToast);
    await fixture.whenStable();

    updateReady.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const toast: HTMLElement = fixture.nativeElement.querySelector('.update-toast');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Nouvelle version disponible');

    fixture.nativeElement.querySelector('button').click();

    expect(reload).toHaveBeenCalled();
  });
});
