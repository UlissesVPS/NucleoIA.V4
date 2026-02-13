import { motion } from "framer-motion";
import { aiTools } from "@/data/ai-tools";

// Position and animation config for each floating logo
const floatingLogos = [
  // FRONT LAYER (5 logos - larger, more opaque)
  { layer: "front", size: 60, opacity: 0.45, top: "8%",  left: "65%", duration: 7,  delay: 0,   zDepth: 80  },
  { layer: "front", size: 56, opacity: 0.5,  top: "28%", left: "88%", duration: 8,  delay: 1.5, zDepth: 60  },
  { layer: "front", size: 52, opacity: 0.4,  top: "55%", left: "72%", duration: 6,  delay: 0.5, zDepth: 90  },
  { layer: "front", size: 58, opacity: 0.45, top: "72%", left: "92%", duration: 9,  delay: 2,   zDepth: 70  },
  { layer: "front", size: 54, opacity: 0.4,  top: "42%", left: "58%", duration: 7,  delay: 3,   zDepth: 85  },
  
  // MIDDLE LAYER (6 logos - medium size and opacity)
  { layer: "middle", size: 44, opacity: 0.3,  top: "12%", left: "52%", duration: 10, delay: 0.5, zDepth: 20  },
  { layer: "middle", size: 40, opacity: 0.25, top: "38%", left: "80%", duration: 11, delay: 1,   zDepth: 10  },
  { layer: "middle", size: 42, opacity: 0.28, top: "62%", left: "60%", duration: 9,  delay: 2,   zDepth: 30  },
  { layer: "middle", size: 38, opacity: 0.22, top: "82%", left: "75%", duration: 12, delay: 0,   zDepth: 15  },
  { layer: "middle", size: 46, opacity: 0.3,  top: "18%", left: "95%", duration: 10, delay: 3,   zDepth: 25  },
  { layer: "middle", size: 36, opacity: 0.2,  top: "48%", left: "98%", duration: 11, delay: 1.5, zDepth: 5   },
  
  // BACK LAYER (5 logos - smaller, more transparent)
  { layer: "back", size: 32, opacity: 0.12, top: "5%",  left: "58%", duration: 14, delay: 0,   zDepth: -40 },
  { layer: "back", size: 28, opacity: 0.1,  top: "32%", left: "70%", duration: 16, delay: 2,   zDepth: -60 },
  { layer: "back", size: 30, opacity: 0.08, top: "52%", left: "85%", duration: 15, delay: 1,   zDepth: -50 },
  { layer: "back", size: 26, opacity: 0.1,  top: "78%", left: "62%", duration: 18, delay: 3,   zDepth: -70 },
  { layer: "back", size: 34, opacity: 0.12, top: "90%", left: "88%", duration: 14, delay: 0.5, zDepth: -30 },
];

// Different float animation variants
const floatVariants = [
  {
    y: [0, -20, -8, -25, 0],
    x: [0, 5, -5, 8, 0],
    rotateX: [0, 5, -3, 4, 0],
    rotateY: [0, 5, -3, 4, 0],
  },
  {
    y: [0, -30, -12, 0],
    x: [0, -10, 8, 0],
    rotateX: [0, 8, -5, 0],
    rotateZ: [0, 3, -2, 0],
  },
  {
    y: [0, -18, 0],
    x: [0, 6, 0],
    rotateY: [0, 6, 0],
    rotateZ: [0, -4, 0],
  },
  {
    y: [0, -15, -28, -10, 0],
    x: [0, 10, -6, 4, 0],
    rotateX: [0, 4, -6, 3, 0],
    rotateY: [0, -4, 6, -3, 0],
  },
  {
    y: [0, -22, -8, 0],
    x: [0, -12, 6, 0],
    rotateZ: [0, 5, -3, 0],
  },
];

// Light particles for extra premium effect
const particles = Array.from({ length: 10 }, (_, i) => ({
  top: `${Math.random() * 90 + 5}%`,
  left: `${50 + Math.random() * 50}%`,
  size: Math.random() * 3 + 2,
  duration: Math.random() * 6 + 8,
  delay: Math.random() * 4,
}));

export function FloatingAILogos3D() {
  return (
    <>
      {/* Desktop version - right side floating effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
        {/* Fade gradients to protect text legibility */}
        <div className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-background via-background/95 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/80 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent z-10" />
        
        {/* 3D Container with slow rotation */}
        <motion.div
          className="absolute inset-0"
          style={{ perspective: 1200 }}
          animate={{
            rotateY: [0, 8, 0, -8, 0],
            rotateX: [3, -3, 3],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div 
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Floating AI logos */}
            {floatingLogos.map((config, index) => {
              const tool = aiTools[index % aiTools.length];
              const variant = floatVariants[index % floatVariants.length];
              
              return (
                <motion.div
                  key={`floating-${index}`}
                  className="absolute"
                  style={{
                    top: config.top,
                    left: config.left,
                    width: config.size,
                    height: config.size,
                    opacity: config.opacity,
                    zIndex: config.layer === "front" ? 30 : config.layer === "middle" ? 20 : 10,
                    transform: `translateZ(${config.zDepth}px)`,
                    willChange: "transform",
                  }}
                  animate={variant}
                  transition={{
                    duration: config.duration,
                    delay: config.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div 
                    className={`
                      w-full h-full rounded-xl overflow-hidden
                      bg-card/60 backdrop-blur-sm
                      border border-border/30
                      ${config.layer === "front" 
                        ? "shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_25px_rgba(249,115,22,0.1)]" 
                        : config.layer === "middle"
                        ? "shadow-[0_6px_24px_rgba(0,0,0,0.3)]"
                        : "shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                      }
                    `}
                  >
                    <img
                      src={tool.image}
                      alt={tool.name}
                      className="w-full h-full object-contain p-1.5"
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Light particles */}
            {particles.map((particle, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full bg-primary/40"
                style={{
                  top: particle.top,
                  left: particle.left,
                  width: particle.size,
                  height: particle.size,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tablet version - simpler, behind content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block lg:hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70 z-10" />
        
        {floatingLogos.slice(0, 10).map((config, index) => {
          const tool = aiTools[index % aiTools.length];
          const variant = floatVariants[index % floatVariants.length];
          
          return (
            <motion.div
              key={`tablet-${index}`}
              className="absolute"
              style={{
                top: config.top,
                left: `${parseInt(config.left) - 10}%`,
                width: config.size * 0.8,
                height: config.size * 0.8,
                opacity: config.opacity * 0.7,
              }}
              animate={{
                y: variant.y?.map(v => v * 0.7),
                x: variant.x?.map(v => v * 0.7),
              }}
              transition={{
                duration: config.duration * 1.2,
                delay: config.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-full h-full rounded-lg overflow-hidden bg-card/40 border border-border/20">
                <img
                  src={tool.image}
                  alt=""
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile version - very subtle, only a few logos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none block md:hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90 z-10" />
        
        {floatingLogos.slice(0, 6).map((config, index) => {
          const tool = aiTools[index % aiTools.length];
          
          return (
            <motion.div
              key={`mobile-${index}`}
              className="absolute"
              style={{
                top: `${parseInt(config.top) + 10}%`,
                left: `${parseInt(config.left) - 20}%`,
                width: config.size * 0.6,
                height: config.size * 0.6,
                opacity: config.opacity * 0.4,
              }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: config.duration * 1.5,
                delay: config.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-full h-full rounded-lg overflow-hidden bg-card/30 border border-border/10">
                <img
                  src={tool.image}
                  alt=""
                  className="w-full h-full object-contain p-0.5"
                  loading="lazy"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

export default FloatingAILogos3D;
