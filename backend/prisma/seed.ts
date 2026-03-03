import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // [SECURITY] Admin creation removed from seed.
  // The only SUPER_ADMIN is castroweverton001@gmail.com (managed directly in production DB).
  // DO NOT create admin users via seed in production.
  console.log('Seed: admin creation skipped (security)');

  // Create categories
  const categories = [
    { name: 'Negocios', slug: 'negocios' },
    { name: 'Marketing', slug: 'marketing' },
    { name: 'Criativo', slug: 'criativo' },
    { name: 'Educacao', slug: 'educacao' },
    { name: 'Tecnologia', slug: 'tecnologia' },
    { name: 'Saude', slug: 'saude' },
    { name: 'Financas', slug: 'financas' },
    { name: 'Outros', slug: 'outros' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Categories created');

  // Create AI Tools (17 tools)
  const aiTools = [
    { name: 'ChatGPT', description: 'IA conversacional avancada da OpenAI', imageUrl: '/tools/chatgpt.png', category: 'TEXT' as const, unlimited: true, order: 1 },
    { name: 'Claude', description: 'Assistente de IA da Anthropic', imageUrl: '/tools/claude.png', category: 'TEXT' as const, unlimited: true, order: 2 },
    { name: 'Midjourney', description: 'Geracao de imagens por IA', imageUrl: '/tools/midjourney.png', category: 'IMAGE' as const, unlimited: false, order: 3 },
    { name: 'DALL-E 3', description: 'Criacao de imagens com IA', imageUrl: '/tools/dalle.png', category: 'IMAGE' as const, unlimited: false, order: 4 },
    { name: 'Stable Diffusion', description: 'Geracao de imagens open source', imageUrl: '/tools/sd.png', category: 'IMAGE' as const, unlimited: true, order: 5 },
    { name: 'Runway', description: 'Edicao de video com IA', imageUrl: '/tools/runway.png', category: 'VIDEO' as const, unlimited: false, order: 6 },
    { name: 'Synthesia', description: 'Criacao de videos com avatares', imageUrl: '/tools/synthesia.png', category: 'VIDEO' as const, unlimited: false, order: 7 },
    { name: 'ElevenLabs', description: 'Sintese de voz realista', imageUrl: '/tools/elevenlabs.png', category: 'VOICE' as const, unlimited: false, order: 8 },
    { name: 'Murf', description: 'Voz over com IA', imageUrl: '/tools/murf.png', category: 'VOICE' as const, unlimited: false, order: 9 },
    { name: 'Canva AI', description: 'Design com inteligencia artificial', imageUrl: '/tools/canva.png', category: 'DESIGN' as const, unlimited: true, order: 10 },
    { name: 'Figma AI', description: 'Design de interfaces com IA', imageUrl: '/tools/figma.png', category: 'DESIGN' as const, unlimited: false, order: 11 },
    { name: 'Descript', description: 'Edicao de audio e video', imageUrl: '/tools/descript.png', category: 'EDITING' as const, unlimited: false, order: 12 },
    { name: 'Kapwing', description: 'Editor de video online', imageUrl: '/tools/kapwing.png', category: 'EDITING' as const, unlimited: true, order: 13 },
    { name: 'Gamma', description: 'Apresentacoes com IA', imageUrl: '/tools/gamma.png', category: 'PRESENTATIONS' as const, unlimited: true, order: 14 },
    { name: 'Beautiful.ai', description: 'Slides profissionais', imageUrl: '/tools/beautifulai.png', category: 'PRESENTATIONS' as const, unlimited: false, order: 15 },
    { name: 'Tome', description: 'Storytelling com IA', imageUrl: '/tools/tome.png', category: 'PRESENTATIONS' as const, unlimited: false, order: 16 },
    { name: 'Perplexity', description: 'Pesquisa com IA', imageUrl: '/tools/perplexity.png', category: 'TEXT' as const, unlimited: true, order: 17 },
  ];

  for (const tool of aiTools) {
    const toolId = tool.name.toLowerCase().replace(/[\s.]+/g, '-');
    await prisma.aiTool.upsert({
      where: { id: toolId },
      update: tool,
      create: { id: toolId, ...tool },
    });
  }
  console.log('AI Tools created (17)');

  // Create backup schedule
  await prisma.backupSchedule.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: true,
      frequency: 'daily',
      hour: 3,
      minute: 0,
      components: { database: true, uploads: true, config: true },
      retention: 30,
    },
  });
  console.log('Backup schedule created');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
