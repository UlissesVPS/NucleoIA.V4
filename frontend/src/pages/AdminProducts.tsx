import { useState } from "react";
import { Search, MoreVertical, Star, Edit, Plus, X, Check, Trash2, Copy, Package, Image, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import InputWithIcon from "@/components/InputWithIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useApi";
import type { Product } from "@/types";

const categories = ["Curso", "E-book", "Mentoria", "Template"] as const;

const categoryIcons: Record<string, string> = {
  "Curso": "🎓",
  "E-book": "📚",
  "Mentoria": "👤",
  "Template": "📄",
};

const CATEGORY_UI_TO_API: Record<string, string> = {
  'Curso': 'CURSO', 'E-book': 'EBOOK', 'Mentoria': 'MENTORIA', 'Template': 'TEMPLATE',
};

const parsePrice = (str: string): number => {
  const cleaned = str.replace(/[^\d,.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const AdminProducts = () => {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    price: "",
    originalPrice: "",
    discount: "",
    category: "E-book" as Product["category"],
    features: "",
    featured: false,
    salesToday: 0,
    rating: 5.0,
    guarantee: "Garantia de 7 dias",
  });

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    return (
      <Badge>
        {categoryIcons[category] || "📦"} {category}
      </Badge>
    );
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      price: "",
      originalPrice: "",
      discount: "",
      category: "E-book",
      features: "",
      featured: false,
      salesToday: 0,
      rating: 5.0,
      guarantee: "Garantia de 7 dias",
    });
  };

  const buildApiData = () => ({
    title: formData.title,
    description: formData.description,
    imageUrl: formData.image,
    price: parsePrice(formData.price),
    originalPrice: formData.originalPrice ? parsePrice(formData.originalPrice) : null,
    discount: formData.discount ? parseInt(formData.discount.replace(/[^\d]/g, '')) || null : null,
    category: CATEGORY_UI_TO_API[formData.category] || formData.category,
    features: formData.features.split("\n").filter((f: string) => f.trim()),
    isFeatured: formData.featured,
    salesCount: formData.salesToday,
    rating: formData.rating,
    guarantee: formData.guarantee,
  });

  const handleAddProduct = async () => {
    if (!formData.title || !formData.description || !formData.image || !formData.price || !formData.guarantee) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createProduct.mutateAsync(buildApiData());
      setShowAddModal(false);
      resetForm();
      toast.success("Produto adicionado com sucesso!");
    } catch (err) {
      toast.error("Erro ao adicionar produto");
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    if (!formData.title || !formData.description || !formData.image || !formData.price || !formData.guarantee) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await updateProduct.mutateAsync({ id: selectedProduct.id, ...buildApiData() });
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      toast.success("Produto atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar produto");
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await deleteProduct.mutateAsync(selectedProduct.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
      toast.success("Produto removido com sucesso!");
    } catch (err) {
      toast.error("Erro ao remover produto");
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, isFeatured: !product.featured });
      toast.success(product.featured ? "Destaque removido!" : "Produto destacado!");
    } catch (err) {
      toast.error("Erro ao atualizar destaque");
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      await createProduct.mutateAsync({
        title: `${product.title} (Cópia)`,
        description: product.description,
        imageUrl: product.image,
        price: parsePrice(product.price),
        originalPrice: product.originalPrice ? parsePrice(product.originalPrice) : null,
        discount: product.discount ? parseInt(product.discount.replace(/[^\d]/g, '')) || null : null,
        category: CATEGORY_UI_TO_API[product.category] || product.category,
        features: product.features,
        isFeatured: product.featured,
        salesCount: 0,
        rating: product.rating,
        guarantee: product.guarantee,
      });
      toast.success("Produto duplicado!");
    } catch (err) {
      toast.error("Erro ao duplicar produto");
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice || "",
      discount: product.discount || "",
      category: product.category,
      features: product.features.join("\n"),
      featured: product.featured,
      salesToday: product.salesToday,
      rating: product.rating,
      guarantee: product.guarantee,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Produtos VIP</h1>
          </div>
          <p className="text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <InputWithIcon
          icon={Search}
          placeholder="Buscar por título..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-72"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-11 rounded-lg border border-border bg-card px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{categoryIcons[cat]} {cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Produto</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Preço</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Destaque</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: Product) => (
                <tr key={product.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{product.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{getCategoryBadge(product.category)}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-foreground">{product.price}</p>
                      {product.discount && (
                        <p className="text-xs text-success">{product.discount}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {product.featured ? (
                      <Star className="h-5 w-5 text-warning fill-warning" />
                    ) : (
                      <Star className="h-5 w-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="success">Ativo</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(product)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                          <Star className="h-4 w-4 mr-2" />
                          {product.featured ? "Remover Destaque" : "Marcar Destaque"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDeleteModal(product)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg bg-card rounded-2xl p-6 shadow-2xl border border-border animate-scale-in my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Adicionar Produto</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Nome do produto"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  placeholder="Descrição do produto"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  URL da Imagem *
                </Label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço *</Label>
                  <Input
                    placeholder="R$ 97"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Original</Label>
                  <Input
                    placeholder="R$ 197"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desconto</Label>
                  <Input
                    placeholder="-51%"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as Product["category"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryIcons[cat]} {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (uma por linha) *</Label>
                <Textarea
                  placeholder="Acesso vitalício&#10;Atualizações grátis&#10;Suporte prioritário"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label>Produto em Destaque</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendas Hoje</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.salesToday}
                    onChange={(e) => setFormData({ ...formData, salesToday: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Garantia *</Label>
                <Input
                  placeholder="Garantia de 7 dias"
                  value={formData.guarantee}
                  onChange={(e) => setFormData({ ...formData, guarantee: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleAddProduct} disabled={createProduct.isPending}>
                  <Check className="h-4 w-4 mr-2" />
                  {createProduct.isPending ? "Salvando..." : "Adicionar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-lg bg-card rounded-2xl p-6 shadow-2xl border border-border animate-scale-in my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Editar Produto</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Nome do produto"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  placeholder="Descrição do produto"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  URL da Imagem *
                </Label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço *</Label>
                  <Input
                    placeholder="R$ 97"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Original</Label>
                  <Input
                    placeholder="R$ 197"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desconto</Label>
                  <Input
                    placeholder="-51%"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as Product["category"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryIcons[cat]} {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (uma por linha) *</Label>
                <Textarea
                  placeholder="Acesso vitalício&#10;Atualizações grátis&#10;Suporte prioritário"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label>Produto em Destaque</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendas Hoje</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.salesToday}
                    onChange={(e) => setFormData({ ...formData, salesToday: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Garantia *</Label>
                <Input
                  placeholder="Garantia de 7 dias"
                  value={formData.guarantee}
                  onChange={(e) => setFormData({ ...formData, guarantee: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleEditProduct} disabled={updateProduct.isPending}>
                  <Check className="h-4 w-4 mr-2" />
                  {updateProduct.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-2xl border border-border animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Excluir Produto</h2>
              <p className="text-muted-foreground mb-6">
                Tem certeza que deseja excluir <strong>"{selectedProduct.title}"</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleDeleteProduct} disabled={deleteProduct.isPending}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteProduct.isPending ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
