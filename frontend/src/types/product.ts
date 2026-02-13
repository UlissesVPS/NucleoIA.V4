export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  originalPrice: string | null;
  discount: string | null;
  features: string[];
  category: "Curso" | "E-book" | "Mentoria" | "Template";
  featured: boolean;
  salesToday: number;
  rating: number;
  guarantee: string;
  purchaseUrl?: string | null;
  isActive?: boolean;
}
