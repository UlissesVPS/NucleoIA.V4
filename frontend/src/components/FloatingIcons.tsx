import { Bot, Brain, Sparkles, Zap, MessageSquare, Image, Video, Mic } from "lucide-react";

const FloatingIcons = () => {
  const icons = [
    { Icon: Bot, className: "top-[10%] left-[5%] animate-float opacity-10", size: 48 },
    { Icon: Brain, className: "top-[20%] right-[8%] animate-float-delayed opacity-10", size: 56 },
    { Icon: Sparkles, className: "top-[60%] left-[10%] animate-float-slow opacity-10", size: 40 },
    { Icon: Zap, className: "bottom-[20%] right-[15%] animate-float opacity-10", size: 44 },
    { Icon: MessageSquare, className: "top-[40%] left-[85%] animate-float-delayed opacity-10", size: 36 },
    { Icon: Image, className: "bottom-[40%] left-[3%] animate-float-slow opacity-10", size: 42 },
    { Icon: Video, className: "top-[75%] right-[5%] animate-float opacity-10", size: 38 },
    { Icon: Mic, className: "top-[5%] right-[25%] animate-float-slow opacity-10", size: 34 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {icons.map(({ Icon, className, size }, index) => (
        <Icon
          key={index}
          className={`absolute text-primary ${className}`}
          size={size}
        />
      ))}
    </div>
  );
};

export default FloatingIcons;
