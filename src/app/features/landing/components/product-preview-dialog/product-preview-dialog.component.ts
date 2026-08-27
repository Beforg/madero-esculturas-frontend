import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { Product } from '../../../../shared/models/product.model';

export interface ProductPreviewDialogResult {
  addToCart?: boolean;
}

@Component({
  selector: 'app-product-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './product-preview-dialog.component.html',
  styleUrl: './product-preview-dialog.component.scss'
})
export class ProductPreviewDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<ProductPreviewDialogComponent, ProductPreviewDialogResult>>(MatDialogRef);

  public readonly product = inject<Product>(MAT_DIALOG_DATA);

  public close(): void {
    this.dialogRef.close();
  }

  public addToCart(): void {
    this.dialogRef.close({ addToCart: true });
  }
}
