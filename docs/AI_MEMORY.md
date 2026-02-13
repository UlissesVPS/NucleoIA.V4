# Memória de Desenvolvimento do Nucleo IA

## [2026-02-09 20:45] - Correção do Bug de Persistência (FASE COMPLETA)

### Objetivo
Corrigir todas as páginas frontend que usavam dados hardcoded/mock (useState com dados estáticos) ao invés de chamar a API real do backend. O mesmo bug de persistência documentado em 2026-02-06 para Products e AI Tools existia em 6+ páginas adicionais.

### Arquivos Alterados

**Backend:**
- `backend/src/controllers/courses.controller.ts` - listCourses agora retorna modules com lessons na resposta

**Frontend - Tipos:**
- `frontend/src/types/course.ts` - id: string|number, modules opcional
- `frontend/src/types/prompt.ts` - id: string|number, campos extras

**Frontend - Hooks:**
- `frontend/src/hooks/useApi.ts` - Adicionados normalizers (mapApiCourse, mapApiPrompt), novos hooks (useDeleteCourse, useCreateModule, useUpdateLessonProgress, useCreateCommunityPrompt), corrigidas rotas de prompts

**Frontend - Utilitários:**
- `frontend/src/utils/courses.ts` - NOVO: getAllLessons() e calculateProgress() extraídos de @/data/courses.ts

**Frontend - Páginas Reescritas:**
- `frontend/src/pages/Courses.tsx` - mockCourses → useCourses()
- `frontend/src/pages/CourseDetail.tsx` - mockCourses.find() → useCourse()
- `frontend/src/pages/Prompts.tsx` - initialPrompts hardcoded → usePrompts()
- `frontend/src/pages/MyPrompts.tsx` - initialPrompts hardcoded → useMyPrompts()
- `frontend/src/pages/Admin.tsx` - removido mockSecurityAlerts

**Frontend - Admin Tabs Reescritos:**
- `frontend/src/components/admin/tabs/OverviewTab.tsx` - getAdminStats() → useSystemStats()
- `frontend/src/components/admin/tabs/MembersTab.tsx` - mockMembers → useUsers()
- `frontend/src/components/admin/tabs/OnlineUsersTab.tsx` - mockOnlineUsers → useOnlineUsers()
- `frontend/src/components/admin/tabs/ActivityLogsTab.tsx` - mockActivityLogs → useActivityLogs()

**Frontend - Componentes Ajustados:**
- `frontend/src/components/courses/NetflixCourseCard.tsx` - import de @/data/courses → @/utils/courses
- `frontend/src/components/courses/CourseSidebar.tsx` - tipos de moduleId atualizados
- `frontend/src/components/HeroBanner.tsx` - removido import de mockCourses

### Decisões Técnicas
1. **Normalizers no useApi.ts** - Backend retorna UUIDs (string), frontend esperava number. Normalizers convertem automaticamente
2. **Módulos na listagem** - Backend já fazia include de modules no Prisma mas descartava no mapeamento. Incluído na resposta para Netflix view funcionar
3. **Rotas de prompts** - Frontend chamava /prompts/community e /prompts/mine, backend tem /prompts e /prompts/my. Corrigido no useApi.ts
4. **utils/courses.ts** - getAllLessons e calculateProgress extraídos de @/data/courses.ts para arquivo utilitário independente

### Rollback
Para cada arquivo: reverter para versão anterior e rodar `cd /var/www/nucleoia/frontend && npm run build`
Para backend: reverter courses.controller.ts e rodar `cd /var/www/nucleoia/backend && npm run build && pm2 restart nucleoia-api`

### Status: ✅ SUCESSO
- Frontend build OK (3118 módulos, 6.25s)
- Backend online (PM2 cluster mode, 2 instâncias)
- API health: OK
- Todas as 6+ páginas agora usam hooks React Query → API real → PostgreSQL
