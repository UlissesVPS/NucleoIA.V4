import { useState } from "react";
import {
  Crown,
  ExternalLink,
  X,
  Info,
  Check,
  GraduationCap,
  BookOpen,
  Users,
  LayoutTemplate,
  Star,
  Flame,
  CircleCheck,
  Lock,
  Pencil,
  Trash2,
  Loader2
} from "lucide-react";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { FloatingActionButton, DeleteConfirmDialog, ProductFormDrawer } from "@/components/admin";
import { toast } from "sonner";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useApi";
import type { Product } from "@/types";

const CATEGORY_UI_TO_API: Record<string, string> = {
  'Curso': 'CURSO', 'E-book': 'EBOOK', 'Mentoria': 'MENTORIA', 'Template': 'TEMPLATE',
};

const parsePrice = (str: string): number => {
  const cleaned = str.replace(/[^\d,.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const categoryConfig = {
  Curso: { icon: GraduationCap, color: "bg-success" },
  "E-book": { icon: BookOpen, color: "bg-purple" },
  Mentoria: { icon: Users, color: "bg-primary" },
  Template: { icon: LayoutTemplate, color: "bg-accent" },
};

const Products = () => {
  const { isAdmin } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEditProduct = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDeleteClick = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await deleteProduct.mutateAsync(productToDelete.id);
        toast.success(`"${productToDelete.title}" foi excluído`);
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } catch (err) {
        toast.error("Erro ao excluir produto");
      }
    }
  };

  const handleFormSubmit = async (productData: Partial<Product>) => {
    const apiData = {
      title: productData.title,
      description: productData.description,
      imageUrl: productData.image,
      price: productData.price ? parsePrice(productData.price) : 0,
      originalPrice: productData.originalPrice ? parsePrice(productData.originalPrice) : null,
      discount: productData.discount ? parseInt(productData.discount.replace(/[^\d]/g, '')) || null : null,
      category: CATEGORY_UI_TO_API[productData.category || ''] || productData.category,
      features: productData.features || [],
      isFeatured: productData.featured ?? false,
      salesCount: productData.salesToday ?? 0,
      rating: productData.rating ?? 0,
      guarantee: productData.guarantee || '',
      purchaseUrl: productData.purchaseUrl || null,
    };

    try {
      if (productData.id) {
        await updateProduct.mutateAsync({ id: productData.id, ...apiData });
        toast.success(`"${productData.title}" foi atualizado`);
      } else {
        await createProduct.mutateAsync(apiData);
        toast.success(`"${productData.title}" foi adicionado`);
      }
    } catch (err) {
      toast.error("Erro ao salvar produto");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <Badge variant="warning">Produtos VIP</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Produtos Exclusivos</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Recursos premium para acelerar seus resultados com IA
        </p>
      </div>

      {/* Grid - Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {products.map((product: Product) => {
          const CategoryIcon = categoryConfig[product.category]?.icon || BookOpen;
          const categoryColor = categoryConfig[product.category]?.color || "bg-muted";

          return (
            <div
              key={product.id}
              className={cn(
                "relative rounded-xl bg-card border border-border overflow-hidden transition-all duration-300 group",
                hoveredProduct === product.id && "scale-[1.02] sm:scale-105 z-20 shadow-2xl shadow-primary/20",
                hoveredProduct !== null && hoveredProduct !== product.id && "sm:blur-[2px] sm:opacity-60"
              )}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Admin Actions */}
              {isAdmin && (
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-30 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => handleEditProduct(product, e)}
                    className="h-7 w-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted transition-colors touch-target"
                  >
                    <Pencil className="h-3.5 w-3.5 text-foreground" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(product, e)}
                    className="h-7 w-7 rounded-lg bg-destructive/90 backdrop-blur-sm border border-destructive/50 flex items-center justify-center hover:bg-destructive transition-colors touch-target"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                  </button>
                </div>
              )}

              {/* Image with badges, stats and lock overlay */}
              <div className="relative aspect-[4/3]">
                {/* Lock overlay - only on image */}
                <div className={cn(
                  "absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm transition-opacity duration-300",
                  hoveredProduct === product.id ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">Conteúdo VIP</span>
                </div>

                <img
                  src={product.image}
                  alt={product.title}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    hoveredProduct === product.id && "blur-sm"
                  )}
                  loading="lazy"
                />

                {/* Category badge - top left */}
                <div className={cn(
                  "absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold text-primary-foreground",
                  categoryColor
                )}>
                  <CategoryIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden xs:inline">{product.category}</span>
                </div>

                {/* Featured badge - top right (hidden when admin actions show) */}
                {product.featured && !isAdmin && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                    <span className="hidden sm:inline">Destaque</span>
                  </div>
                )}

                {/* Stats bar - bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-2 sm:px-3 py-1.5 sm:py-2.5 flex justify-between items-center text-foreground text-[10px] sm:text-xs">
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                    <span className="hidden xs:inline">{product.salesToday} vendas</span>
                    <span className="xs:hidden">{product.salesToday}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary fill-primary" />
                    {product.rating}
                  </span>
                </div>
              </div>

              {/* Content - always visible */}
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-1">{product.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                {/* Guarantee */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-success text-xs sm:text-sm">
                  <CircleCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {product.guarantee}
                </div>

                {/* Prices */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {product.originalPrice && (
                    <span className="text-xs sm:text-sm text-primary line-through">
                      {product.originalPrice}
                    </span>
                  )}
                  <div className="flex items-baseline">
                    <span className="text-xs sm:text-sm text-success">R$</span>
                    <span className="text-lg sm:text-2xl font-bold text-success ml-0.5">
                      {product.price.replace("R$ ", "")}
                    </span>
                  </div>
                  {product.discount && (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-success/20 text-success border border-success/30">
                      {product.discount}
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="gradient"
                    size="sm"
                    className="flex-1 text-xs sm:text-sm touch-target"
                    onClick={() => {
                      if (product.purchaseUrl) {
                        window.open(product.purchaseUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="ml-1">Comprar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 touch-target"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin FAB */}
      {isAdmin && (
        <FloatingActionButton onClick={handleAddProduct} label="Novo Produto" />
      )}

      {/* Product Detail Modal - Bottom sheet on mobile */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] bg-card rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-scale-in border-t sm:border border-border"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors border border-border touch-target"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="flex flex-col md:flex-row overflow-y-auto max-h-[85vh] sm:max-h-none">
              {/* Left - Image */}
              <div className="md:w-1/2 relative">
                <div className="aspect-video sm:aspect-square md:aspect-auto md:h-full">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedProduct.discount && (
                  <span className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-success/20 text-success border border-success/30">
                    {selectedProduct.discount}
                  </span>
                )}
              </div>

              {/* Right - Details */}
              <div className="md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <Badge variant="warning">Produto VIP</Badge>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(null);
                          handleEditProduct(selectedProduct);
                        }}
                        className="gap-1 text-xs"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">O que está incluso:</h4>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {selectedProduct.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                          <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-success" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex items-baseline">
                      <span className="text-sm sm:text-lg text-success">R$</span>
                      <span className="text-2xl sm:text-4xl font-bold text-success ml-1">
                        {selectedProduct.price.replace("R$ ", "")}
                      </span>
                    </div>
                    {selectedProduct.originalPrice && (
                      <span className="text-sm sm:text-lg text-primary line-through">
                        {selectedProduct.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full text-sm sm:text-base py-4 sm:py-6 touch-target"
                  onClick={() => {
                    if (selectedProduct.purchaseUrl) {
                      window.open(selectedProduct.purchaseUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Comprar Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Drawer */}
      <ProductFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Produto"
        itemName={productToDelete?.title}
      />
    </div>
  );
};

export default Products;
