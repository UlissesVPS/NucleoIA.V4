import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Loader2,
  ExternalLink,
  Info,
  Star,
  Flame,
  CircleCheck,
  Lock,
  GraduationCap,
  BookOpen,
  Users,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

const categoryConfig: Record<string, { icon: any; color: string }> = {
  Curso: { icon: GraduationCap, color: "bg-success" },
  "E-book": { icon: BookOpen, color: "bg-purple" },
  Mentoria: { icon: Users, color: "bg-primary" },
  Template: { icon: LayoutTemplate, color: "bg-accent" },
};

// Product card component with animation
const ProductSlot = ({
  products,
  currentIndex,
  hoveredProduct,
  setHoveredProduct,
}: {
  products: Product[];
  currentIndex: number;
  hoveredProduct: string | null;
  setHoveredProduct: (id: string | null) => void;
}) => {
  const product = products[currentIndex % products.length];
  const CategoryIcon = categoryConfig[product.category]?.icon || BookOpen;
  const categoryColor = categoryConfig[product.category]?.color || "bg-muted";

  return (
    <div
      className={cn(
        "relative rounded-xl bg-card border border-border overflow-hidden transition-all duration-300 group",
        hoveredProduct === product.id && "scale-[1.02] sm:scale-105 z-20 shadow-2xl shadow-primary/20",
        hoveredProduct !== null && hoveredProduct !== product.id && "sm:blur-[2px] sm:opacity-60"
      )}
      onMouseEnter={() => setHoveredProduct(product.id)}
      onMouseLeave={() => setHoveredProduct(null)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="h-full"
        >
          {/* Image with badges, stats and lock overlay */}
          <div className="relative aspect-[4/3]">
            {/* Lock overlay on hover */}
            <div
              className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm transition-opacity duration-300",
                hoveredProduct === product.id
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              )}
            >
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                Conteúdo VIP
              </span>
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
            <div
              className={cn(
                "absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold text-primary-foreground",
                categoryColor
              )}
            >
              <CategoryIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {product.category}
            </div>

            {/* Featured badge - top right */}
            {product.featured && (
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-primary text-primary-foreground">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                Destaque
              </div>
            )}

            {/* Stats bar - bottom */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-2 sm:px-3 py-1.5 sm:py-2.5 flex justify-between items-center text-foreground text-[10px] sm:text-xs">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                {product.salesToday} vendas
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary fill-primary" />
                {product.rating}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-1 uppercase">
              {product.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>

            {/* Guarantee */}
            {product.guarantee && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-success text-xs sm:text-sm">
                <CircleCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                {product.guarantee}
              </div>
            )}

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
                className="flex-1 text-xs sm:text-sm"
                onClick={() => {
                  if (product.purchaseUrl) {
                    window.open(
                      product.purchaseUrl,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="ml-1">Comprar</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                asChild
              >
                <Link to="/produtos">
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const VIPProductsCarousel = () => {
  const { data: apiProducts, isLoading } = useProducts();
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  // Use Product type directly — mapApiProduct in useApi.ts already handles all transformation
  const produtos: Product[] = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    return apiProducts.filter((p: Product) => p.isActive !== false);
  }, [apiProducts]);

  // Get responsive visible count
  const getVisibleCount = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  };

  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Distribute products into slots
  const slotProducts = useMemo(() => {
    if (produtos.length === 0) return [];
    const slots: Product[][] = [];

    for (let slotIndex = 0; slotIndex < visibleCount; slotIndex++) {
      const slotItems: Product[] = [];
      for (let i = slotIndex; i < produtos.length; i += visibleCount) {
        slotItems.push(produtos[i]);
      }
      if (slotItems.length > 0) {
        slots.push(slotItems);
      }
    }

    return slots;
  }, [visibleCount, produtos]);

  // Check if we need rotation (more products than visible slots)
  const needsRotation = produtos.length > visibleCount;

  // Auto-rotation effect - advances all slots every 4 seconds
  useEffect(() => {
    if (isPaused || !needsRotation) return;

    const interval = setInterval(() => {
      setRotationIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, needsRotation]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => {
    setHoveredProduct(null);
    setTimeout(() => setIsPaused(false), 1000);
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="vip-products-section">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
            Produtos VIPs em Destaque
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  // Empty state
  if (!produtos || produtos.length === 0) {
    return (
      <section className="vip-products-section">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
            Produtos VIPs em Destaque
          </h2>
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Nenhum produto disponível
        </div>
      </section>
    );
  }

  return (
    <section
      className="vip-products-section"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
          Produtos VIPs em Destaque
        </h2>
        <Link
          to="/produtos"
          className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </div>

      {/* Cards Grid */}
      <div
        className={cn(
          "grid gap-3 sm:gap-4",
          visibleCount === 1 && "grid-cols-1",
          visibleCount === 2 && "grid-cols-2",
          visibleCount === 3 && "grid-cols-3",
          visibleCount === 4 && "grid-cols-4"
        )}
      >
        {slotProducts.map((slotItems, slotIndex) => (
          <ProductSlot
            key={slotIndex}
            products={slotItems}
            currentIndex={rotationIndex}
            hoveredProduct={hoveredProduct}
            setHoveredProduct={setHoveredProduct}
          />
        ))}
      </div>
    </section>
  );
};

export default VIPProductsCarousel;
