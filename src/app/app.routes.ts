import { Routes } from '@angular/router';
import { GroceryListPage } from './groceries/grocery-list-page/grocery-list-page';

export const routes: Routes = [
  { path: '', component: GroceryListPage },
  {
    path: 'produits',
    loadComponent: () =>
      import('./groceries/grocery-catalog-page/grocery-catalog-page').then(
        (m) => m.GroceryCatalogPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
