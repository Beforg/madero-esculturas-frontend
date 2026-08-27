import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';

import {
  Product,
  ProductListResponse,
  ProductQueryParams
} from '../../shared/models/product.model';
import { SupabaseService } from '../../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private readonly supabaseService: SupabaseService) {}

  public getProducts(params: ProductQueryParams): Observable<ProductListResponse> {
    return from(this.supabaseService.getProducts(params));
  }

  public getProductByReference(reference: string): Observable<Product | undefined> {
    return from(this.supabaseService.getProductByReference(reference));
  }

  public getProductsByReferences(
    references: string[],
    page: number,
    pageSize: number
  ): Observable<ProductListResponse> {
    const uniqueReferences = Array.from(new Set(references));
    return uniqueReferences.length === 0
      ? of({ items: [], total: 0, page: 1, pageSize })
      : from(this.supabaseService.getProductsByReferences(uniqueReferences, page, pageSize));
  }
}
