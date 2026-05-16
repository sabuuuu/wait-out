import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Cpu, 
  Shirt, 
  Home, 
  Gamepad2, 
  Heart, 
  Palette, 
  Utensils, 
  Package, 
  Smartphone, 
  ShoppingBag,
  LucideIcon
} from "lucide-react-native";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('tech') || n.includes('electronic') || n.includes('gadget')) return Cpu;
  if (n.includes('fashion') || n.includes('cloth') || n.includes('wear')) return Shirt;
  if (n.includes('home') || n.includes('living') || n.includes('decor')) return Home;
  if (n.includes('game') || n.includes('play')) return Gamepad2;
  if (n.includes('health') || n.includes('fitness') || n.includes('gym')) return Heart;
  if (n.includes('hobby') || n.includes('art') || n.includes('craft')) return Palette;
  if (n.includes('food') || n.includes('eat') || n.includes('drink')) return Utensils;
  if (n.includes('phone') || n.includes('mobile')) return Smartphone;
  if (n.includes('shopping') || n.includes('buy')) return ShoppingBag;
  return Package;
}
