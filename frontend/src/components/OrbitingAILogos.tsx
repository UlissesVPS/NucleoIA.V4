import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

// Import AI tool images
import capcutProImg from "@/assets/capcut-pro.png";
import canvaProImg from "@/assets/canva-pro.png";
import gammaImg from "@/assets/gamma.png";
import midjourneyImg from "@/assets/midjourney.png";
import gpt5ProImg from "@/assets/gpt5-pro.png";
import runwayImg from "@/assets/runway.png";
import veo3Img from "@/assets/veo3.png";
import grokImg from "@/assets/grok.png";
import geminiProImg from "@/assets/gemini-pro.png";
import leonardoAiImg from "@/assets/leonardo-ai.png";
import hailuoAiImg from "@/assets/hailuo-ai.png";
import freepikImg from "@/assets/freepik.png";
import fishAudioImg from "@/assets/fish-audio.png";
import pikaLabsImg from "@/assets/pika-labs.png";
import higgsfieldImg from "@/assets/higgsfield.png";
import personaAiImg from "@/assets/persona-ai.png";
import nanobananaPro from "@/assets/nanobanana-pro.png";

// All AI logos available
const allLogos = [
  gpt5ProImg, veo3Img, midjourneyImg, runwayImg, canvaProImg, gammaImg, grokImg, geminiProImg,
  leonardoAiImg, hailuoAiImg, capcutProImg, freepikImg, fishAudioImg, pikaLabsImg, higgsfieldImg, personaAiImg, nanobananaPro
];

// Distribute logos across 3 rings
const outerLogos = allLogos.slice(0, 8);  // 8 logos
const middleLogos = allLogos.slice(4, 10); // 6 logos (with overlap)
const innerLogos = allLogos.slice(10, 14); // 4 logos

interface OrbitRingProps {
  logos: string[];
  radius: number;
  logoSize: number;
  opacity: number;
  duration: number;
  direction: "clockwise" | "counter-clockwise";
  ringOpacity: number;
}

const OrbitRing = ({ 
  logos, 
  radius, 
  logoSize, 
  opacity, 
  duration, 
  direction,
  ringOpacity 
}: OrbitRingProps) => {
  const rotateValue = direction === "clockwise" ? 360 : -360;
  const counterRotateValue = direction === "clockwise" ? -360 : 360;

  return (
    <>
      {/* Visible orbit ring */}
      <div
        className="absolute rounded-full border"
        style={{
          width: radius * 2,
          height: radius * 2,
          left: `calc(50% - ${radius}px)`,
          top: `calc(50% - ${radius}px)`,
          borderColor: `rgba(255, 255, 255, ${ringOpacity})`,
        }}
      />

      {/* Rotating container with logos */}
      <motion.div
        className="absolute"
        style={{
          width: radius * 2,
          height: radius * 2,
          left: `calc(50% - ${radius}px)`,
          top: `calc(50% - ${radius}px)`,
        }}
        animate={{ rotate: rotateValue }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {logos.map((logo, index) => {
          const angle = (index / logos.length) * 360;
          const x = Math.cos((angle * Math.PI) / 180) * radius + radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius + radius;

          return (
            <motion.div
              key={`logo-${index}`}
              className="absolute"
              style={{
                width: logoSize,
                height: logoSize,
                left: x - logoSize / 2,
                top: y - logoSize / 2,
                opacity,
              }}
              animate={{ rotate: counterRotateValue }}
              transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div
                className="w-full h-full rounded-xl overflow-hidden"
                style={{
                  background: "#1a1a1f",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                }}
              >
                <img
                  src={logo}
                  alt=""
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
};

const OrbitingAILogos = () => {
  const isMobile = useIsMobile();

  // Responsive radius multiplier
  const getRadiusMultiplier = () => {
    if (isMobile) return 0.6;
    if (typeof window !== "undefined" && window.innerWidth < 1024) return 0.8;
    return 1;
  };

  const multiplier = getRadiusMultiplier();

  // Ring configurations
  const outerConfig = {
    logos: isMobile ? outerLogos.slice(0, 4) : outerLogos,
    radius: 400 * multiplier,
    logoSize: isMobile ? 32 : 56,
    opacity: 0.35,
    duration: 120,
    direction: "clockwise" as const,
    ringOpacity: 0.06,
  };

  const middleConfig = {
    logos: isMobile ? middleLogos.slice(0, 3) : middleLogos,
    radius: 270 * multiplier,
    logoSize: isMobile ? 28 : 48,
    opacity: 0.25,
    duration: 90,
    direction: "counter-clockwise" as const,
    ringOpacity: 0.04,
  };

  const innerConfig = {
    logos: isMobile ? innerLogos.slice(0, 2) : innerLogos,
    radius: 160 * multiplier,
    logoSize: isMobile ? 24 : 40,
    opacity: 0.15,
    duration: 75,
    direction: "clockwise" as const,
    ringOpacity: 0.03,
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ willChange: "transform" }}
    >
      {/* Centered orbit container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {/* Outer Ring - 8 logos, clockwise */}
          <OrbitRing {...outerConfig} />

          {/* Middle Ring - 6 logos, counter-clockwise */}
          <OrbitRing {...middleConfig} />

          {/* Inner Ring - 4 logos, clockwise */}
          <OrbitRing {...innerConfig} />
        </div>
      </div>
    </div>
  );
};

export default OrbitingAILogos;
