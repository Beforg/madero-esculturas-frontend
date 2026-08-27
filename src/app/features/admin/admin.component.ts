import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Product, TipoEscultura } from '../../shared/models/product.model';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, CommonModule, RouterLink, MatPaginatorModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  productForm: FormGroup;
  editForm: FormGroup;
  filterForm: FormGroup;
  products: Product[] = [];
  totalProducts = 0;
  pageIndex = 0;
  pageSize = 12;
  readonly pageSizeOptions = [8, 12, 24, 48];
  selectedProduct: Product | null = null;
  selectedFile: File | null = null;
  editFile: File | null = null;
  loading = false;
  loadingProducts = false;
  savingEdit = false;
  errorMessage = '';

  tiposEscultura = Object.values(TipoEscultura);

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      reference: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      type: [TipoEscultura.Bovino, Validators.required],
      pelagem: [''] 
    });

    this.editForm = this.fb.group({
      reference: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      type: [TipoEscultura.Bovino, Validators.required],
      pelagem: [''] 
    });

    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      pelagem: [''],
      minPrice: [null, Validators.min(0)],
      maxPrice: [null, Validators.min(0)]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(page = this.pageIndex + 1, pageSize = this.pageSize): Promise<void> {
    this.loadingProducts = true;
    this.errorMessage = '';

    try {
      const filters = this.filterForm.value;
      const response = await this.supabaseService.getProducts({
        page,
        pageSize,
        search: filters.search || null,
        type: filters.type || null,
        pelagem: filters.pelagem || null,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice
      });
      this.products = response.items;
      this.totalProducts = response.total;
      this.pageIndex = Math.max(response.page - 1, 0);
      this.pageSize = response.pageSize;
    } catch (error: any) {
      this.errorMessage = error.message || 'Não foi possível carregar o catálogo.';
    } finally {
      this.loadingProducts = false;
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts(this.pageIndex + 1, this.pageSize);
  }

  applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.pageIndex = 0;
    this.loadProducts(1, this.pageSize);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', type: '', pelagem: '', minPrice: null, maxPrice: null });
    this.pageIndex = 0;
    this.loadProducts(1, this.pageSize);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.editFile = file;
    }
  }

  async onSubmit() {
    if (this.productForm.invalid || !this.selectedFile) {
      alert('Preencha todos os campos e selecione uma imagem.');
      return;
    }

    this.loading = true;

    try {

      const imageUrl = await this.supabaseService.uploadImage(this.selectedFile);

      const newProduct = {
        reference: this.productForm.value.reference,
        price: this.productForm.value.price,
        description: this.productForm.value.description,
        type: this.productForm.value.type,
        pelagem: this.productForm.value.pelagem || null,
        image: imageUrl
        
      };

      const { error } = await this.supabaseService.createProduct(newProduct);

      if (error) throw error;

      alert('Escultura adicionada com sucesso!');
      this.productForm.reset();
      this.selectedFile = null;
      await this.loadProducts();

    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  openEdit(product: Product): void {
    this.selectedProduct = product;
    this.editFile = null;
    this.editForm.patchValue({
      reference: product.reference,
      price: product.price,
      description: product.description,
      type: product.type,
      pelagem: product.pelagem || ''
    });
  }

  closeEdit(): void {
    if (!this.savingEdit) {
      this.selectedProduct = null;
      this.editFile = null;
    }
  }

  async saveEdit(): Promise<void> {
    if (!this.selectedProduct || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.savingEdit = true;
    try {
      let image = this.selectedProduct.image;
      if (this.editFile) {
        image = await this.supabaseService.uploadImage(this.editFile);
      }

      const { error } = await this.supabaseService.updateProduct(this.selectedProduct.id, {
        ...this.editForm.value,
        image
      });

      if (error) throw error;

      alert('Escultura atualizada com sucesso!');
      this.selectedProduct = null;
      this.editFile = null;
      await this.loadProducts();
    } catch (error: any) {
      alert('Erro ao atualizar: ' + error.message);
    } finally {
      this.savingEdit = false;
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    const confirmed = confirm(`Deseja excluir a escultura "${product.reference}"? Esta ação não pode ser desfeita.`);

    if (!confirmed) {
      return;
    }

    try {
      await this.supabaseService.deleteProduct(product);
      this.products = this.products.filter((item) => item.id !== product.id);
      alert('Escultura excluída com sucesso!');
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  }

  goToLanding(): void {
    this.router.navigate(['/']);
  }
}
