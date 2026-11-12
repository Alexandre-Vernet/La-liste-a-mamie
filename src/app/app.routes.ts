import { Routes } from '@angular/router';
import { GroceryListPage } from './groceries/grocery-list-page/grocery-list-page';
import { GroceryCatalogPage } from './groceries/grocery-catalog-page/grocery-catalog-page';

export const routes: Routes = [
  { path: '', component: GroceryListPage },
  { path: 'produits', component: GroceryCatalogPage },
  { path: '**', redirectTo: '' },
];
