import { Product } from './types';

export const DEFAULT_MENU_ITEMS: Product[] = [
  {
    id: 'p1',
    name: 'BistrOS Burger',
    price: 12500,
    category: 'Principales',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    description: 'Hamburguesa premium con cheddar, panceta y salsa secreta.'
  },
  {
    id: 'p2',
    name: 'Papas Rústicas',
    price: 6500,
    category: 'Entradas',
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&auto=format&fit=crop&q=60',
    description: 'Papas cortadas a mano con hierbas y dip de ajo.'
  },
  {
    id: 'p3',
    name: 'Cerveza IPA Artesanal',
    price: 4500,
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&auto=format&fit=crop&q=60',
    description: 'IPA lupulada con notas cítricas y amargor medio.'
  },
  {
    id: 'p4',
    name: 'Limonada Menta y Jengibre',
    price: 3800,
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
    description: 'Refrescante limonada casera con menta fresca.'
  },
  {
    id: 'p5',
    name: 'Tiramisú de la Casa',
    price: 5500,
    category: 'Postres',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60',
    description: 'Clásico italiano con mascarpone y café espresso.'
  },
  {
    id: 'p6',
    name: 'Wrap Vegetariano',
    price: 10500,
    category: 'Principales',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=60',
    description: 'Tortilla de trigo con vegetales asados y hummus.'
  }
];

export const MENU_ITEMS = DEFAULT_MENU_ITEMS;