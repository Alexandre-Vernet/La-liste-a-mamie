import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from './bottom-nav/bottom-nav';
import { ThemeToggle } from './theme-toggle/theme-toggle';
import { PwaUpdateToast } from './pwa-update-toast/pwa-update-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNav, ThemeToggle, PwaUpdateToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
