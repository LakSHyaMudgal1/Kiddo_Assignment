export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  originalPrice: number | null;
  stockCount: number;
  attributes: Record<string, string>; // { size: 'M', color: 'Red' }
  imageUrls: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  brandName: string;
  categoryId: string;
  thumbnailUrl: string;
  imageUrls: string[];
  basePrice: number;
  discountPercent: number | null;
  averageRating: number;
  reviewCount: number;
  tags: string[];
  variants: ProductVariant[];
  isNew: boolean;
  isFeatured: boolean;
}

export type ProductSummary = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'name'
  | 'brandName'
  | 'thumbnailUrl'
  | 'basePrice'
  | 'discountPercent'
  | 'averageRating'
  | 'reviewCount'
  | 'isNew'
>;
