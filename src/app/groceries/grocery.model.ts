export interface Grocery {
  id: string;
  name: string;
  quantity: number;
  done: boolean;
}

export type Filter = 'all' | 'active' | 'done';
