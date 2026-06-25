import type { StateCreator } from 'zustand';

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface ActiveFilters {
  categoryId: string | null;
  priceRange: [number, number] | null;
  brands: string[];
  ratings: number | null;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface CatalogSlice {
  categories: Category[];
  activeFilters: ActiveFilters;
  searchQuery: string;
  recentSearches: string[];

  setCategories: (categories: Category[]) => void;
  setActiveFilters: (filters: Partial<ActiveFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const defaultFilters: ActiveFilters = {
  categoryId: null,
  priceRange: null,
  brands: [],
  ratings: null,
  sortBy: 'relevance',
};

export const createCatalogSlice: StateCreator<
  CatalogSlice,
  [],
  [],
  CatalogSlice
> = (set) => ({
  categories: [],
  activeFilters: defaultFilters,
  searchQuery: '',
  recentSearches: [],

  setCategories: (categories) => set({ categories }),

  setActiveFilters: (filters) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...filters },
    })),

  resetFilters: () => set({ activeFilters: defaultFilters }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addRecentSearch: (query) =>
    set((state) => ({
      recentSearches: [
        query,
        ...state.recentSearches.filter((q) => q !== query),
      ].slice(0, 10),
    })),

  clearRecentSearches: () => set({ recentSearches: [] }),
});
