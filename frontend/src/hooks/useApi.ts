import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Auth
export const useSendMagicLink = () =>
  useMutation({
    mutationFn: (email: string) =>
      api.post('/auth/magic-link/send', { email }).then((r) => r.data),
  });

export const useVerifyMagicLink = () =>
  useMutation({
    mutationFn: (token: string) =>
      api.post('/auth/magic-link/verify', { token }).then((r) => r.data),
  });

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout').then((r) => r.data),
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      qc.clear();
    },
  });
};

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

// Users
export const useUsers = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get('/users', { params }).then((r) => r.data),
  });


export const useUserStats = () =>
  useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => api.get('/users/stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/users', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch(`/users/${id}/status`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch(`/users/${id}/subscription`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

// Categories
export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/categories', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/categories/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

// AI Tools
const mapApiTool = (t: any) => ({
  ...t,
  image: t.imageUrl || t.image || '',
  category: (t.category || '').toLowerCase(),
});

export const useAITools = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['ai-tools', params],
    queryFn: () => api.get('/ai-tools', { params }).then((r) =>
      (r.data.data || []).map(mapApiTool)
    ),
  });

export const useAITool = (id: string) =>
  useQuery({
    queryKey: ['ai-tools', id],
    queryFn: () => api.get(`/ai-tools/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateAITool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/ai-tools', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-tools'] }),
  });
};

export const useUpdateAITool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/ai-tools/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-tools'] }),
  });
};

export const useDeleteAITool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/ai-tools/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-tools'] }),
  });
};

// Prompts
const mapApiPrompt = (p: any) => ({
  ...p,
  id: p.id,
  type: (p.type || "image").toLowerCase(),
  thumbnail: p.thumbnailUrl || p.thumbnail || "",
  promptText: p.content || p.promptText || "",
  mediaUrl: p.mediaUrl || null,
  createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "",
  likes: p.likesCount || p.likes || 0,
  author: p.author?.name || p.author || "Nucleo IA",
  liked: !!p.liked,
  favorited: !!p.favorited,
});

export const usePrompts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['prompts', params],
    queryFn: () => api.get('/prompts', { params }).then((r) =>
      (r.data.data || []).map(mapApiPrompt)
    ),
  });

export const usePromptsPaginated = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['prompts', 'paginated', params],
    queryFn: () => api.get('/prompts', { params }).then((r) => ({
      data: (r.data.data || []).map(mapApiPrompt),
      meta: r.data.meta || { total: 0, page: 1, limit: 24, totalPages: 1 },
    })),
    placeholderData: (prev: any) => prev,
  });

export const useCommunityPrompts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['prompts', 'community', params],
    queryFn: () =>
      api.get('/prompts', { params }).then((r) =>
        (r.data.data || []).map(mapApiPrompt)
      ),
  });

export const useMyPrompts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['my-prompts', params],
    queryFn: () =>
      api.get('/prompts/my', { params }).then((r) =>
        (r.data.data || []).map(mapApiPrompt)
      ),
  });

export const useUpdateMyPrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/prompts/my/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-prompts'] });
      qc.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
};

export const useDeleteMyPrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/prompts/my/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-prompts'] });
      qc.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
};

export const useCreatePrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/prompts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prompts'] }),
  });
};

export const useUpdatePrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/prompts/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prompts'] }),
  });
};

export const useDeletePrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/prompts/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prompts'] }),
  });
};

export const useBulkDeletePrompts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.delete('/prompts/bulk-delete', { data: { ids } }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prompts'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['most-liked'] });
    },
  });
};

export const useLikePrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/prompts/${id}/like`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prompts'] });
      qc.invalidateQueries({ queryKey: ['most-liked'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

export const useFavoritePrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/prompts/${id}/favorite`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prompts'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['most-liked'] });
    },
  });
};

export const useFavorites = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['favorites', params],
    queryFn: () => api.get('/prompts/favorites', { params }).then((r) =>
      (r.data.data || []).map(mapApiPrompt)
    ),
  });

export const useMostLiked = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['most-liked', params],
    queryFn: () => api.get('/prompts/most-liked', { params }).then((r) =>
      (r.data.data || []).map(mapApiPrompt)
    ),
  });

export const useCopyPrompt = () =>
  useMutation({
    mutationFn: (id: string) =>
      api.post(`/prompts/${id}/copy`).then((r) => r.data),
  });

export const useCreateCommunityPrompt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/prompts/my', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prompts'] });
      qc.invalidateQueries({ queryKey: ['my-prompts'] });
    },
  });
};

// Courses
const mapApiCourse = (c: any) => ({
  ...c,
  modules: (c.modules || []).map((m: any) => ({
    ...m,
    lessons: (m.lessons || []).map((l: any) => ({
      ...l,
      completed: l.completed || false,
      progressPct: l.progressPct || 0,
    })),
  })),
  totalLessons: c.totalLessons || 0,
  progress: c.progress || 0,
  createdAt: c.createdAt || new Date().toISOString(),
  isNew: c.isNew || false,
  isPublished: c.isPublished ?? true,
  order: c.order ?? 0,
});

export const useCourses = () =>
  useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then((r) => (r.data.data || []).map(mapApiCourse)),
  });

export const useCourse = (id: string) =>
  useQuery({
    queryKey: ['courses', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => mapApiCourse(r.data.data)),
    enabled: !!id,
  });

export const useCreateCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/courses', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useUpdateCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/courses/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useDeleteCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useCreateModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...data }: { courseId: string; title: string; description?: string; order?: number }) =>
      api.post(`/courses/${courseId}/modules`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useUpdateLessonProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, ...data }: { lessonId: string; completed: boolean; progressPct: number }) =>
      api.patch(`/lessons/${lessonId}/progress`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useUpdateModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; order?: number }) =>
      api.put(`/modules/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useDeleteModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/modules/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useCreateLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, ...data }: { moduleId: string; title: string; description?: string; videoUrl?: string; thumbnail?: string; duration?: string; durationSeconds?: number; order?: number }) =>
      api.post(`/modules/${moduleId}/lessons`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useUpdateLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; videoUrl?: string; thumbnail?: string; duration?: string; durationSeconds?: number; order?: number }) =>
      api.put(`/lessons/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useDeleteLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};

export const useUploadImage = () =>
  useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data.data);
    },
  });

export const useUploadThumbnail = () =>
  useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/upload/thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data.data);
    },
  });

export const useUploadVideo = () =>
  useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/upload/member/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      }).then((r) => r.data.data);
    },
  });
// Member upload hooks (no admin required)
export const useMemberUploadImage = () =>
  useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/upload/member/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data.data);
    },
  });

export const useMemberUploadThumbnail = () =>
  useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/upload/member/thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data.data);
    },
  });

export const useMemberUploadVideo = () =>
  useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/upload/member/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      }).then((r) => r.data.data);
    },
  });

// Toggle prompt public/private
export const useTogglePromptPublic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/prompts/${id}/toggle-public`).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-prompts'] });
      qc.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
};

// Products
const PRODUCT_CAT_API_TO_UI: Record<string, string> = {
  CURSO: 'Curso', EBOOK: 'E-book', MENTORIA: 'Mentoria', TEMPLATE: 'Template',
};
const mapApiProduct = (p: any) => ({
  ...p,
  image: p.imageUrl || p.image || '',
  price: p.price != null ? `R$ ${Number(p.price).toFixed(2).replace('.', ',')}` : 'R$ 0,00',
  originalPrice: p.originalPrice != null ? `R$ ${Number(p.originalPrice).toFixed(2).replace('.', ',')}` : null,
  discount: p.discount ? `-${p.discount}%` : null,
  features: Array.isArray(p.features) ? p.features : [],
  category: PRODUCT_CAT_API_TO_UI[p.category] || p.category,
  featured: p.isFeatured ?? false,
  salesToday: p.salesCount ?? 0,
  rating: Number(p.rating) || 0,
  guarantee: p.guarantee || '',
});
export const useProducts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => api.get('/products', { params }).then((r) =>
      (r.data.data || []).map(mapApiProduct)
    ),
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/products', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/products/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/products/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};
// System / Stats
export const useSystemStats = () =>
  useQuery({
    queryKey: ['system', 'stats'],
    queryFn: () => api.get('/system/stats').then((r) => r.data.data),
  });


export const usePublicStats = () =>
  useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.get('/system/stats/public').then((r) => r.data.data),
    staleTime: 60000,
  });

export const useActivityLogs = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['system', 'activity-logs', params],
    queryFn: () =>
      api.get('/system/activity-logs', { params }).then((r) => r.data),
  });

// Profile
export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data.data),
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put('/profile', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};
export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/profile/password', data).then((r) => r.data),
  });

export const useProfileStats = () =>
  useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: () => api.get('/profile/stats').then((r) => r.data.data),
  });

export const useUpdatePreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put('/profile/preferences', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};

export const useUpdateAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (avatarUrl: string) =>
      api.put('/profile/avatar', { avatarUrl }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};
// System (VPS, API Keys, Webhooks, Backups)
export const useVpsStats = () =>
  useQuery({
    queryKey: ['system', 'vps-stats'],
    queryFn: () => api.get('/system/vps-stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

export const useOnlineUsers = () =>
  useQuery({
    queryKey: ['system', 'online-users'],
    queryFn: () => api.get('/system/online-users').then((r) => r.data.data),
    refetchInterval: 30000,
  });

// IP History
export const useIpHistory = () =>
  useQuery({
    queryKey: ['system', 'ip-history'],
    queryFn: () => api.get('/system/ip-history').then((r) => r.data.data),
    refetchInterval: 120000,
  });

// IP Alerts
export const useIpAlerts = () =>
  useQuery({
    queryKey: ['system', 'ip-alerts'],
    queryFn: () => api.get('/system/ip-alerts').then((r) => r.data.data),
    refetchInterval: 60000,
  });

// API Keys
export const useApiKeys = () =>
  useQuery({
    queryKey: ['system', 'api-keys'],
    queryFn: () => api.get('/system/api-keys').then((r) => r.data.data),
  });

export const useCreateApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/system/api-keys', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'api-keys'] }),
  });
};

export const useRevokeApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/system/api-keys/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'api-keys'] }),
  });
};
// Webhooks
export const useWebhooks = () =>
  useQuery({
    queryKey: ['system', 'webhooks'],
    queryFn: () => api.get('/system/webhooks').then((r) => r.data.data),
  });

export const useCreateWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/system/webhooks', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'webhooks'] }),
  });
};

export const useUpdateWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/system/webhooks/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'webhooks'] }),
  });
};

export const useDeleteWebhook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/system/webhooks/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'webhooks'] }),
  });
};

export const useTestWebhook = () =>
  useMutation({
    mutationFn: (id: string) =>
      api.post(`/system/webhooks/${id}/test`).then((r) => r.data),
  });
// Backups
export const useBackups = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['system', 'backups', params],
    queryFn: () => api.get('/system/backups', { params }).then((r) => r.data),
  });

export const useBackupSchedule = () =>
  useQuery({
    queryKey: ['system', 'backup-schedule'],
    queryFn: () => api.get('/system/backups/schedule').then((r) => r.data.data),
  });

export const useUpdateBackupSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put('/system/backups/schedule', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'backup-schedule'] }),
  });
};

// Sessions
export const useHeartbeat = () =>
  useMutation({
    mutationFn: () => api.post('/sessions/heartbeat').then((r) => r.data),
  });

// Shared Credentials
export const useSharedCredentials = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['shared-credentials', params],
    queryFn: () => api.get('/shared-credentials', { params }).then((r) => r.data.data),
  });

export const useUpdateSharedCredential = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; username?: string; password?: string }) =>
      api.put(`/shared-credentials/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shared-credentials'] }),
  });
};
// Page Settings
export const usePageSettings = (page: string) =>
  useQuery({
    queryKey: ['settings', 'page', page],
    queryFn: () => api.get(`/settings/page/${page}`).then((r) => r.data.data),
  });

export const useUpdatePageSettings = (page: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/settings/page/${page}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'page', page] }),
  });
};


// TOTP / Authenticator 2FA
export const useTotpStatus = (toolName = 'Dicloak') =>
  useQuery({
    queryKey: ['totp', 'status', toolName],
    queryFn: () => api.get('/totp/status', { params: { toolName } }).then((r) => r.data.data),
    refetchInterval: 30000,
  });

export const useGenerateTotp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolName: string) =>
      api.post('/totp/generate', { toolName }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['totp'] }),
  });
};

export const useSetTotpSecret = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { toolName: string; secret: string }) =>
      api.put('/totp/secret', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['totp'] }),
  });
};



// ============================================
// First Access Popup
// ============================================
export const useFirstAccessPopupStatus = () =>
  useQuery({
    queryKey: ['first-access-popup'],
    queryFn: () => api.get('/profile/first-access-popup').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

export const useDismissFirstAccessPopup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.put('/profile/first-access-popup/dismiss').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['first-access-popup'] });
    },
  });
};


// ============================================
// Agents
// ============================================
export const useAgents = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['agents', params],
    queryFn: () => api.get('/agents', { params }).then((r) => r.data.data),
  });

export const useCreateAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/agents', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
};

export const useUpdateAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      api.put(`/agents/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
};

export const useDeleteAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/agents/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
};
