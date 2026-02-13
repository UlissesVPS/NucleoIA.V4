import type { AITool } from "@/types";

// Import images
import capcutProImg from "@/assets/capcut-pro.png";
import canvaProImg from "@/assets/canva-pro.png";
import fishAudioImg from "@/assets/fish-audio.png";
import freepikImg from "@/assets/freepik.png";
import gammaImg from "@/assets/gamma.png";
import hailuoAiImg from "@/assets/hailuo-ai.png";
import midjourneyImg from "@/assets/midjourney.png";
import personaAiImg from "@/assets/persona-ai.png";
import gpt5ProImg from "@/assets/gpt5-pro.png";
import runwayImg from "@/assets/runway.png";
import veo3Img from "@/assets/veo3.png";
import grokImg from "@/assets/grok.png";
import pikaLabsImg from "@/assets/pika-labs.png";
import higgsfieldImg from "@/assets/higgsfield.png";
import geminiProImg from "@/assets/gemini-pro.png";
import leonardoAiImg from "@/assets/leonardo-ai.png";
import nanobananaPro from "@/assets/nanobanana-pro.png";

export const aiTools: AITool[] = [
  { id: 1, name: "ChatGPT 5 PRO", description: "IA conversacional avançada para texto e código", image: gpt5ProImg, category: "text", unlimited: true },
  { id: 2, name: "VEO3", description: "Geração de vídeos com IA do Google", image: veo3Img, category: "video", unlimited: true },
  { id: 3, name: "Higgsfield AI", description: "Criação de avatares e vídeos realistas", image: higgsfieldImg, category: "voice", unlimited: true },
  { id: 4, name: "Grok", description: "IA da xAI com acesso em tempo real", image: grokImg, category: "text", unlimited: true },
  { id: 5, name: "Midjourney", description: "Geração de imagens artísticas", image: midjourneyImg, category: "image", unlimited: true },
  { id: 6, name: "Runway", description: "Edição de vídeo com IA", image: runwayImg, category: "editing", unlimited: true },
  { id: 7, name: "Sora 2", description: "Geração de vídeos da OpenAI", image: pikaLabsImg, category: "video", unlimited: true },
  { id: 8, name: "Canva Pro", description: "Design com assistente IA", image: canvaProImg, category: "design", unlimited: true },
  { id: 9, name: "Gamma", description: "Apresentações criadas com IA", image: gammaImg, category: "presentations", unlimited: true },
  { id: 10, name: "Gemini Pro", description: "IA multimodal do Google", image: geminiProImg, category: "text", unlimited: true },
  { id: 11, name: "Leonardo AI", description: "Arte e assets para games", image: leonardoAiImg, category: "image", unlimited: true },
  { id: 12, name: "CapCut Pro", description: "Editor de vídeo profissional", image: capcutProImg, category: "editing", unlimited: true },
  { id: 13, name: "Fish Audio", description: "Clonagem e síntese de voz", image: fishAudioImg, category: "voice", unlimited: true },
  { id: 14, name: "Freepik", description: "Recursos gráficos e IA generativa", image: freepikImg, category: "design", unlimited: true },
  { id: 15, name: "Hailuo AI", description: "Geração de vídeos avançada", image: hailuoAiImg, category: "video", unlimited: true },
  { id: 16, name: "Dream Face", description: "Criação de avatares personalizados", image: personaAiImg, category: "voice", unlimited: true },
  { id: 17, name: "NanoBanana Pro", description: "Criação de imagens ultra realistas", image: nanobananaPro, category: "image", unlimited: true },
];
