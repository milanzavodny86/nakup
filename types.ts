export type ProductStatus = 'stocked' | 'needed';

export interface Product {
  id: string;
  name: string;
  category: string;
  status: ProductStatus;
  quantity?: string;
}

export const DEFAULT_CATEGORIES = [
  'Ovocie a zelenina',
  'Pečivo',
  'Mliečne výrobky',
  'Mäso a údeniny',
  'Trvanlivé potraviny',
  'Nápoje',
  'Drogéria',
  'Ostatné'
];

export type CategoryType = string;
