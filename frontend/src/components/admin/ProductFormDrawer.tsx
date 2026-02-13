import { useState, useEffect } from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageUpload } from "@/components/admin";
import type { Product } from "@/types";

interface ProductFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (product: Partial<Product>) => void;
}

const categories = ["E-book", "Curso", "Mentoria", "Template"];

const ProductFormDrawer = ({ open, onOpenChange, product, onSubmit }: ProductFormDrawerProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState<string>("E-book");
  const [featuresInput, setFeaturesInput] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");

  const isEditing = !!product;

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setDescription(product.description);
      setImage(product.image || "");
      setPrice(product.price?.replace("R$ ", "") || "");
      setOriginalPrice(product.originalPrice?.replace("R$ ", "") || "");
      setCategory(product.category || "E-book");
      setFeaturesInput(product.features?.join("\n") || "");
      setPurchaseUrl(product.purchaseUrl || "");
    } else {
      setTitle("");
      setDescription("");
      setImage("");
      setPrice("");
      setOriginalPrice("");
      setCategory("E-book");
      setFeaturesInput("");
      setPurchaseUrl("");
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceNum = parseFloat(price);
    const originalNum = originalPrice ? parseFloat(originalPrice) : null;
    const discount = originalNum ? `-${Math.round((1 - priceNum / originalNum) * 100)}%` : null;

    onSubmit({
      id: product?.id,
      title,
      description,
      image: image || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600",
      price: `R$ ${price}`,
      originalPrice: originalPrice ? `R$ ${originalPrice}` : null,
      discount,
      category: category as Product["category"],
      features: featuresInput.split("\n").filter(Boolean),
      featured: product?.featured || false,
      salesToday: product?.salesToday || Math.floor(Math.random() * 50),
      rating: product?.rating || 4.8,
      guarantee: "Garantia de 7 dias",
      purchaseUrl: purchaseUrl || null,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage("");
    setPrice("");
    setOriginalPrice("");
    setCategory("E-book");
    setFeaturesInput("");
    setPurchaseUrl("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Crown className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Produto</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Pack de Prompts Premium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do produto..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="97"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalPrice">Preço Original (opcional)</Label>
              <Input
                id="originalPrice"
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="197"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseUrl">Link de Compra (URL)</Label>
            <Input
              id="purchaseUrl"
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
              placeholder="https://exemplo.com/checkout"
              type="url"
            />
          </div>

          <ImageUpload
            value={image}
            onChange={setImage}
            label="Imagem do Produto"
          />

          <div className="space-y-2">
            <Label htmlFor="features">Benefícios (um por linha)</Label>
            <Textarea
              id="features"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder={"Acesso vitalício\nAtualizações grátis\nSuporte prioritário"}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" className="flex-1">
              {isEditing ? "Salvar Alterações" : "Adicionar Produto"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ProductFormDrawer;
