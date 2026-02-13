import { motion } from "framer-motion";

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

interface FloatingLogo {
  image: string;
  size: number;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  delay: number;
  duration: number;
}

const floatingLogos: FloatingLogo[] = [
  { image: gpt5ProImg, size: 64, position: { top: "8%", left: "5%" }, delay: 0, duration: 8 },
  { image: midjourneyImg, size: 72, position: { top: "12%", right: "8%" }, delay: 1.5, duration: 10 },
  { image: veo3Img, size: 56, position: { top: "35%", left: "3%" }, delay: 0.8, duration: 9 },
  { image: runwayImg, size: 60, position: { bottom: "30%", right: "5%" }, delay: 2, duration: 7 },
  { image: canvaProImg, size: 52, position: { bottom: "15%", left: "8%" }, delay: 1.2, duration: 11 },
  { image: geminiProImg, size: 68, position: { top: "55%", right: "3%" }, delay: 0.5, duration: 8 },
  { image: gammaImg, size: 48, position: { top: "75%", left: "4%" }, delay: 2.5, duration: 9 },
  { image: leonardoAiImg, size: 54, position: { bottom: "45%", left: "2%" }, delay: 1.8, duration: 10 },
  { image: grokImg, size: 58, position: { top: "20%", left: "12%" }, delay: 0.3, duration: 12 },
  { image: hailuoAiImg, size: 50, position: { bottom: "25%", right: "12%" }, delay: 1, duration: 8 },
  { image: capcutProImg, size: 46, position: { top: "45%", right: "10%" }, delay: 2.2, duration: 11 },
  { image: freepikImg, size: 44, position: { bottom: "60%", right: "6%" }, delay: 0.7, duration: 9 },
];

const FloatingAILogos = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {floatingLogos.map((logo, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            ...logo.position,
            width: logo.size,
            height: logo.size,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.08, 0.15, 0.08],
            scale: [1, 1.1, 1],
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: logo.duration,
            delay: logo.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div 
            className="w-full h-full rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(24 100% 55% / 0.1), hsl(270 85% 55% / 0.1))",
              padding: "8px",
              boxShadow: "0 0 30px hsl(24 100% 55% / 0.15)",
            }}
          >
            <img
              src={logo.image}
              alt=""
              className="w-full h-full object-contain rounded-xl"
              style={{
                filter: "drop-shadow(0 0 10px hsl(24 100% 55% / 0.3))",
              }}
            />
          </div>
        </motion.div>
      ))}
      
      {/* Extra glow orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(24 100% 55% / 0.08) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(270 85% 55% / 0.08) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.6, 0.4, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default FloatingAILogos;
