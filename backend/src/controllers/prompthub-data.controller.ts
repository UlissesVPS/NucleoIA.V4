import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PHAuthRequest } from '../middleware/prompthub-auth.middleware';

const prisma = new PrismaClient();

// ==========================================
// PROMPTS (shared from NucleoIA)
// ==========================================

// GET /ph/prompts — with pagination, category flattened
export const getPrompts = async (req: PHAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 24;
    const type = req.query.type as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const where: any = {};
    if (type) where.type = type;
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: { category: true, author: { select: { id: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isCommunity: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.prompt.count({ where }),
    ]);

    const mapped = prompts.map((p: any) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      category: p.category?.name || 'Sem categoria',
      categoryId: p.categoryId,
      content: p.content,
      description: p.description,
      thumbnailUrl: p.thumbnailUrl,
      mediaUrl: p.mediaUrl,
      likes: p.likes || 0,
      tags: p.tags || [],
      author: p.author?.name || 'Nucleo IA',
      createdAt: p.createdAt,
      isCommunity: p.isCommunity || false,
      liked: false,
      favorited: false,
    }));

    return res.json({
      success: true,
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('PH getPrompts error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar prompts' } });
  }
};

// GET /ph/prompts/community
export const getCommunityPrompts = async (req: PHAuthRequest, res: Response) => {
  try {
    const prompts = await prisma.promptHubMyPrompt.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = prompts.map((p: any) => ({
      ...p,
      liked: false,
      favorited: false,
    }));
    return res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('PH getCommunityPrompts error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar prompts da comunidade' } });
  }
};

// POST /ph/prompts/:id/like (no-op for now)
export const likePrompt = async (req: PHAuthRequest, res: Response) => {
  return res.json({ success: true, data: { liked: true } });
};

// POST /ph/prompts/:id/copy
export const copyPrompt = async (req: PHAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const prompt = await prisma.prompt.findUnique({ where: { id }, include: { category: true } });
    if (!prompt) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prompt nao encontrado' } });
    }
    const copy = await prisma.promptHubMyPrompt.create({
      data: {
        userId: req.phUser!.id,
        title: prompt.title + ' (copia)',
        type: prompt.type,
        category: (prompt as any).category?.name || 'GERAL',
        content: prompt.content,
        description: prompt.description || '',
        thumbnailUrl: prompt.thumbnailUrl,
        tags: [],
        isPublic: false,
      },
    });
    return res.json({ success: true, data: copy });
  } catch (error) {
    console.error('PH copyPrompt error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao copiar prompt' } });
  }
};

// PATCH /ph/prompts/:id/toggle-public
export const togglePromptPublic = async (req: PHAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.promptHubMyPrompt.findFirst({
      where: { id, userId: req.phUser!.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prompt nao encontrado' } });
    }
    const updated = await prisma.promptHubMyPrompt.update({
      where: { id },
      data: { isPublic: !existing.isPublic },
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('PH togglePromptPublic error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao alterar visibilidade' } });
  }
};

// ==========================================
// AGENTS (shared from NucleoIA)
// ==========================================

export const getAgents = async (_req: PHAuthRequest, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: agents });
  } catch (error) {
    console.error('PH getAgents error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar agentes' } });
  }
};

// ==========================================
// COURSES (shared from NucleoIA)
// ==========================================

export const getCourses = async (_req: PHAuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: { modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: courses });
  } catch (error) {
    console.error('PH getCourses error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar cursos' } });
  }
};

export const getCourse = async (req: PHAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    });
    if (!course) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Curso nao encontrado' } });
    }
    return res.json({ success: true, data: course });
  } catch (error) {
    console.error('PH getCourse error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar curso' } });
  }
};

export const updateLessonProgress = async (req: PHAuthRequest, res: Response) => {
  return res.json({ success: true, data: { completed: true } });
};

// ==========================================
// PRODUCTS (shared from NucleoIA)
// ==========================================

export const getProducts = async (_req: PHAuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('PH getProducts error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar produtos' } });
  }
};

// ==========================================
// CATEGORIES
// ==========================================

export const getCategories = async (_req: PHAuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error('PH getCategories error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar categorias' } });
  }
};

// ==========================================
// MY PROMPTS (PH user own prompts)
// ==========================================

export const getMyPrompts = async (req: PHAuthRequest, res: Response) => {
  try {
    const prompts = await prisma.promptHubMyPrompt.findMany({
      where: { userId: req.phUser!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: prompts });
  } catch (error) {
    console.error('PH getMyPrompts error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar seus prompts' } });
  }
};

export const createMyPrompt = async (req: PHAuthRequest, res: Response) => {
  try {
    const { title, type, category, categoryId, content, promptText, description, thumbnailUrl, thumbnail, tags, isPublic, mediaUrl } = req.body;
    // Map frontend type ("image"/"video" lowercase) to Prisma enum (IMAGE/VIDEO)
    const typeMap: Record<string, string> = { image: 'IMAGE', video: 'VIDEO', img: 'IMAGE' };
    const mappedType = typeMap[(type || '').toLowerCase()] || (type || 'IMAGE').toUpperCase();
    // Resolve categoryId (UUID) to category name
    let resolvedCategory = category || 'GERAL';
    if (!category && categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      resolvedCategory = cat?.name || categoryId;
    }
    const prompt = await prisma.promptHubMyPrompt.create({
      data: {
        userId: req.phUser!.id,
        title,
        type: mappedType as any,
        category: resolvedCategory,
        content: content || promptText || '',
        description: description || '',
        thumbnailUrl: thumbnailUrl || thumbnail || null,
        mediaUrl: mediaUrl || null,
        tags: tags || [],
        isPublic: isPublic || false,
      },
    });
    return res.json({ success: true, data: prompt });
  } catch (error) {
    console.error('PH createMyPrompt error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao criar prompt' } });
  }
};

export const updateMyPrompt = async (req: PHAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.promptHubMyPrompt.findFirst({
      where: { id, userId: req.phUser!.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prompt nao encontrado' } });
    }
    const { title, type, category, categoryId, content, promptText, description, thumbnailUrl, thumbnail, tags, isPublic, mediaUrl } = req.body;
    // Map type
    const typeMap: Record<string, string> = { image: 'IMAGE', video: 'VIDEO', img: 'IMAGE' };
    const mappedType = type ? (typeMap[(type || '').toLowerCase()] || type.toUpperCase()) : undefined;
    // Resolve categoryId UUID to name
    let resolvedCategory = category;
    if (!category && categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      resolvedCategory = cat?.name || categoryId;
    }
    const resolvedContent = content || promptText;
    const resolvedThumb = thumbnailUrl || thumbnail;
    const updated = await prisma.promptHubMyPrompt.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(mappedType && { type: mappedType as any }),
        ...(resolvedCategory && { category: resolvedCategory }),
        ...(resolvedContent && { content: resolvedContent }),
        ...(description !== undefined && { description }),
        ...(resolvedThumb !== undefined && { thumbnailUrl: resolvedThumb }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(tags && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('PH updateMyPrompt error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao atualizar prompt' } });
  }
};

export const deleteMyPrompt = async (req: PHAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.promptHubMyPrompt.findFirst({
      where: { id, userId: req.phUser!.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prompt nao encontrado' } });
    }
    await prisma.promptHubMyPrompt.delete({ where: { id } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('PH deleteMyPrompt error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao deletar prompt' } });
  }
};

// ==========================================
// PROFILE
// ==========================================

export const getProfile = async (req: PHAuthRequest, res: Response) => {
  try {
    const user = await prisma.promptHubUser.findUnique({ where: { id: req.phUser!.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Usuario nao encontrado' } });
    }
    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        language: user.language,
        theme: user.theme,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('PH getProfile error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar perfil' } });
  }
};

export const updateProfile = async (req: PHAuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    const updated = await prisma.promptHubUser.update({
      where: { id: req.phUser!.id },
      data: { ...(name && { name }), ...(email && { email }) },
    });
    return res.json({ success: true, data: { id: updated.id, name: updated.name, email: updated.email, avatarUrl: updated.avatarUrl } });
  } catch (error) {
    console.error('PH updateProfile error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao atualizar perfil' } });
  }
};

export const getProfileStats = async (req: PHAuthRequest, res: Response) => {
  try {
    const user = await prisma.promptHubUser.findUnique({ where: { id: req.phUser!.id } });
    const promptCount = await prisma.promptHubMyPrompt.count({ where: { userId: req.phUser!.id } });
    return res.json({
      success: true,
      data: {
        totalPrompts: promptCount,
        memberSince: user?.createdAt || new Date(),
      },
    });
  } catch (error) {
    console.error('PH getProfileStats error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar estatisticas' } });
  }
};

export const updatePreferences = async (req: PHAuthRequest, res: Response) => {
  try {
    const { language, theme } = req.body;
    const updated = await prisma.promptHubUser.update({
      where: { id: req.phUser!.id },
      data: { ...(language && { language }), ...(theme && { theme }) },
    });
    return res.json({ success: true, data: { language: updated.language, theme: updated.theme } });
  } catch (error) {
    console.error('PH updatePreferences error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao atualizar preferencias' } });
  }
};

export const updateAvatar = async (req: PHAuthRequest, res: Response) => {
  try {
    const { avatarUrl } = req.body;
    const updated = await prisma.promptHubUser.update({
      where: { id: req.phUser!.id },
      data: { avatarUrl },
    });
    return res.json({ success: true, data: { avatarUrl: updated.avatarUrl } });
  } catch (error) {
    console.error('PH updateAvatar error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao atualizar avatar' } });
  }
};

export const changePassword = async (req: PHAuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.promptHubUser.findUnique({ where: { id: req.phUser!.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Usuario nao encontrado' } });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Senha atual incorreta' } });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.promptHubUser.update({ where: { id: req.phUser!.id }, data: { passwordHash: hash } });
    return res.json({ success: true, data: { message: 'Senha alterada com sucesso' } });
  } catch (error) {
    console.error('PH changePassword error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao alterar senha' } });
  }
};

// ==========================================
// DASHBOARD STATS
// ==========================================

export const getDashboardStats = async (_req: PHAuthRequest, res: Response) => {
  try {
    const [totalPrompts, totalAgents, totalCourses, totalProducts, totalUsers] = await Promise.all([
      prisma.prompt.count(),
      prisma.agent.count({ where: { isActive: true } }),
      prisma.course.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.promptHubUser.count(),
    ]);
    return res.json({
      success: true,
      data: {
        totalPrompts,
        totalAgents,
        totalCourses,
        totalProducts,
        totalUsers,
        totalTools: totalAgents,
      },
    });
  } catch (error) {
    console.error('PH getDashboardStats error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar estatisticas' } });
  }
};

// ==========================================
// AI TOOLS (empty for PH)
// ==========================================

export const getAITools = async (_req: PHAuthRequest, res: Response) => {
  return res.json({ success: true, data: [] });
};

// ==========================================
// SETTINGS
// ==========================================

export const getPageSettings = async (req: PHAuthRequest, res: Response) => {
  return res.json({ success: true, data: null });
};

// ==========================================
// FIRST ACCESS POPUP
// ==========================================

export const getFirstAccessPopupStatus = async (_req: PHAuthRequest, res: Response) => {
  return res.json({ success: true, data: { seen: true } });
};

export const dismissFirstAccessPopup = async (_req: PHAuthRequest, res: Response) => {
  return res.json({ success: true });
};

// ==========================================
// LOGOUT
// ==========================================

export const logout = async (_req: PHAuthRequest, res: Response) => {
  return res.json({ success: true });
};

// ==========================================
// FAVORITES (stub for PH)
// ==========================================

export const getFavorites = async (_req: PHAuthRequest, res: Response) => {
  return res.json({ success: true, data: [] });
};

export const toggleFavorite = async (_req: PHAuthRequest, res: Response) => {
  return res.json({ success: true, data: { favorited: true } });
};

// ==========================================
// MOST LIKED (stub)
// ==========================================

export const getMostLiked = async (_req: PHAuthRequest, res: Response) => {
  try {
    const prompts = await prisma.prompt.findMany({
      include: { category: true, author: { select: { id: true, name: true } } },
      orderBy: { likes: 'desc' },
      take: 10,
    });
    const mapped = prompts.map((p: any) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      category: p.category?.name || 'Sem categoria',
      categoryId: p.categoryId,
      content: p.content,
      description: p.description,
      thumbnailUrl: p.thumbnailUrl,
      mediaUrl: p.mediaUrl,
      likes: p.likes || 0,
      tags: p.tags || [],
      author: p.author?.name || 'Nucleo IA',
      createdAt: p.createdAt,
      liked: false,
      favorited: false,
    }));
    return res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('PH getMostLiked error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao buscar mais curtidos' } });
  }
};
