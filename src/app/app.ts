import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from './bottom-nav/bottom-nav';
import { ThemeToggle } from './theme-toggle/theme-toggle';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNav, ThemeToggle],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
