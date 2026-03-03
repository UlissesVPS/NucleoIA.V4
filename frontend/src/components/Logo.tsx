import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { img: 20, imgSrc: "/sidebar-logo.png", text: "text-lg" },
  md: { img: 28, imgSrc: "/logo.png", text: "text-xl" },
  lg: { img: 36, imgSrc: "/logo.png", text: "text-2xl" },
  xl: { img: 48, imgSrc: "/logo.png", text: "text-4xl" },
};

const Logo = ({ size = "md", showText = true, className }: LogoProps) => {
  const { img, imgSrc, text } = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={imgSrc}
        alt="Nucleo IA"
        width={img}
        height={img}
        className="object-contain"
      />
      {showText && (
        <span className={cn("font-bold text-gradient", text)}>
          NÚCLEO IA
        </span>
      )}
    </div>
  );
};

export default Logo;
