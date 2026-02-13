import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCarouselProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const CourseCarousel = ({
  title,
  icon,
  children,
  showViewAll,
  onViewAll,
}: CourseCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      return () => ref.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div 
      className="relative group/carousel"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ver todos →
          </button>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center",
            "bg-gradient-to-r from-background via-background/80 to-transparent",
            "transition-opacity duration-300",
            canScrollLeft && isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </div>
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center",
            "bg-gradient-to-l from-background via-background/80 to-transparent",
            "transition-opacity duration-300",
            canScrollRight && isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="h-6 w-6" />
          </div>
        </button>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default CourseCarousel;
