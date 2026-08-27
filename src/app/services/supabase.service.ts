import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Product, ProductQueryParams, ProductListResponse } from '../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
  
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  // --- MÉTODOS DE PRODUTOS E STORAGE ---

  async uploadImage(file: File): Promise<string> {
    const filePath = `${Date.now()}_${file.name}`; 
    
    const { error } = await this.supabase.storage
      .from('esculturas')
      .upload(filePath, file);

    if (error) throw error;


    const { data: publicUrlData } = this.supabase.storage
      .from('esculturas')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async createProduct(productData: any) {
    return await this.supabase.from('produtos').insert(productData);
  }

  async updateProduct(id: number, productData: Partial<Product>) {
    return await this.supabase.from('produtos').update(productData).eq('id', id);
  }

  async deleteProduct(product: Product) {
    const { error: productError } = await this.supabase
      .from('produtos')
      .delete()
      .eq('id', product.id);

    if (productError) throw productError;

    const imagePath = this.getStoragePath(product.image);
    if (imagePath) {
      const { error: imageError } = await this.supabase.storage
        .from('esculturas')
        .remove([imagePath]);

      if (imageError) {
        console.warn('Produto excluído, mas a imagem não pôde ser removida:', imageError);
      }
    }

    return { error: null };
  }

  async getProducts(params: ProductQueryParams): Promise<ProductListResponse> {
    const { page, pageSize, type, search, pelagem, minPrice, maxPrice } = params;
    
    // Cálculo de paginação do PostgreSQL (ex: página 1 com 10 itens = index 0 a 9)
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Inicia a query pedindo os dados e a contagem total exata
    let query = this.supabase
      .from('produtos')
      .select('*', { count: 'exact' });

    // Se o usuário selecionou uma categoria (Ovino, Equino, etc), aplica o filtro
    if (type) {
      query = query.eq('type', type);
    }

    if (search?.trim()) {
      const term = search.trim().replace(/,/g, '');
      query = query.or(`reference.ilike.%${term}%,description.ilike.%${term}%`);
    }

    if (pelagem?.trim()) {
      query = query.ilike('pelagem', `%${pelagem.trim()}%`);
    }

    if (minPrice !== null && minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }

    if (maxPrice !== null && maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Aplica a paginação
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // Retorna os dados exatamente no formato da sua interface ProductListResponse
    return {
      items: data || [],
      total: count || 0,
      page: page,
      pageSize: pageSize
    };
  }

  async getProductByReference(reference: string): Promise<Product | undefined> {
    const { data, error } = await this.supabase
      .from('produtos')
      .select('*')
      .eq('reference', reference)
      .maybeSingle();

    if (error) throw error;

    return data || undefined;
  }

  async getProductsByReferences(
    references: string[],
    page: number,
    pageSize: number
  ): Promise<ProductListResponse> {
    if (references.length === 0) {
      return { items: [], total: 0, page: 1, pageSize };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await this.supabase
      .from('produtos')
      .select('*', { count: 'exact' })
      .in('reference', references)
      .range(from, to);

    if (error) throw error;

    return {
      items: data || [],
      total: count || 0,
      page,
      pageSize
    };
  }

  private getStoragePath(imageUrl: string): string | null {
    const marker = '/storage/v1/object/public/esculturas/';
    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
  }
}