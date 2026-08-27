export interface Product {
  id: number;
  reference: string;
  price: number;
  image: string;
  description: string;
  type: TipoEscultura;
  pelagem?: string;
}

export enum TipoEscultura {
  Ovino = 'Ovino',
  Equino = 'Equino',
  Bovino = 'Bovino',
  Outros = 'Outros'
}

export interface ProductQueryParams {
  page: number;
  pageSize: number;
  type?: TipoEscultura | null;
  search?: string | null;
  pelagem?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}
