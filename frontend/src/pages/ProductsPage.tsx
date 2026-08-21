import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ProductToolbar } from '@/features/products/components/ProductToolbar';
import { ProductTable } from '@/features/products/components/ProductTable';
import { CreateProductModal } from '@/features/products/components/CreateProductModal';
import { EditProductModal } from '@/features/products/components/EditProductModal';
import { ProductDetailModal } from '@/features/products/components/ProductDetailModal';
import { ConfirmDeleteProductModal } from '@/features/products/components/ConfirmDeleteProductModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ProductFilterState } from '@/features/products/types/products.types';
import {
  useProductsListQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '@/features/products/hooks/useProducts';
import { Product, CreateProductInput, UpdateProductInput } from '@/services/products.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [filters, setFilters] = useState<ProductFilterState>({
    search: '',
    category: '',
    status: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [selectedEditProduct, setSelectedEditProduct] = useState<Product | null>(null);
  const [selectedDeleteProduct, setSelectedDeleteProduct] = useState<Product | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    category: filters.category || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: productsResponse, isLoading, isError, refetch } = useProductsListQuery(queryParams);
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();

  const productsList = productsResponse?.data || [];
  const meta = productsResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  const handleFilterChange = (updated: Partial<ProductFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: 'ALL',
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const handleCreateSubmit = async (data: CreateProductInput) => {
    await createProductMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: string, data: UpdateProductInput) => {
    await updateProductMutation.mutateAsync({ id, data });
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteProductMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Products & Master Catalog"
        description="Manage ERP product master data, pricing, unit specifications, and availability."
      />

      {/* Toolbar & Filters */}
      <ProductToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load product catalog</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve product records from server. Please check permissions or try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Product Table */}
      <ProductTable
        products={productsList}
        isLoading={isLoading}
        onView={(p) => setSelectedDetailProduct(p)}
        onEdit={(p) => setSelectedEditProduct(p)}
        onDelete={(p) => setSelectedDeleteProduct(p)}
      />

      {/* Pagination Bar */}
      {!isLoading && !isError && productsList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> products
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange({ page: Math.max(filters.page - 1, 1) })}
              disabled={filters.page <= 1}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="text-xs font-mono px-2">
              Page {meta.page} of {meta.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange({ page: Math.min(filters.page + 1, meta.totalPages || 1) })}
              disabled={filters.page >= (meta.totalPages || 1)}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createProductMutation.isPending}
      />

      <EditProductModal
        product={selectedEditProduct}
        isOpen={Boolean(selectedEditProduct)}
        onClose={() => setSelectedEditProduct(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateProductMutation.isPending}
      />

      <ProductDetailModal
        product={selectedDetailProduct}
        isOpen={Boolean(selectedDetailProduct)}
        onClose={() => setSelectedDetailProduct(null)}
      />

      <ConfirmDeleteProductModal
        product={selectedDeleteProduct}
        isOpen={Boolean(selectedDeleteProduct)}
        onClose={() => setSelectedDeleteProduct(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
};
