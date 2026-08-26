import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Product, TipoEscultura } from '../../shared/models/product.model';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  productForm: FormGroup;
  editForm: FormGroup;
  products: Product[] = [];
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
      description: ['', Validators.required],
      type: [TipoEscultura.Bovino, Validators.required] 
    });

    this.editForm = this.fb.group({
      reference: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      type: [TipoEscultura.Bovino, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loadingProducts = true;
    this.errorMessage = '';

    try {
      const response = await this.supabaseService.getProducts({ page: 1, pageSize: 1000 });
      this.products = response.items;
    } catch (error: any) {
      this.errorMessage = error.message || 'Não foi possível carregar o catálogo.';
    } finally {
      this.loadingProducts = false;
    }
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
      type: product.type
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

  goToLanding(): void {
    this.router.navigate(['/']);
  }
}
