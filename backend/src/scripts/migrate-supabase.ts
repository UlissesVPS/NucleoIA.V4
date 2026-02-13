import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

const prisma = new PrismaClient();

// Conexão Supabase
const supabaseConfig = {
  host: 'db.pciwvlciwitsimsofslw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '@Nucleo1020',
  ssl: { rejectUnauthorized: false },
};

interface MigrationResult {
  table: string;
  source: number;
  migrated: number;
  errors: number;
  details: string[];
}

const results: MigrationResult[] = [];

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// ══════════════════════════════════════════════════
// 1. USERS (from assinantes + profiles)
// ══════════════════════════════════════════════════
async function migrateUsers(supabase: Client): Promise<void> {
  log('Migrando Users...');
  const result: MigrationResult = { table: 'users', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    // Primeiro: super_admin do profiles
    const { rows: profiles } = await supabase.query(`
      SELECT id, email, name, avatar_url, role, created_at, updated_at
      FROM profiles
    `);

    // Segundo: todos os assinantes
    const { rows: assinantes } = await supabase.query(`
      SELECT id, user_id, nome, email, status, role, plano,
             criado_em, observacao_admin, data_expiracao
      FROM assinantes
      ORDER BY criado_em
    `);

    result.source = profiles.length + assinantes.length;

    // Migrar profiles (super_admin)
    for (const row of profiles) {
      try {
        let role = 'MEMBER';
        if (row.role === 'super_admin') role = 'SUPER_ADMIN';
        else if (row.role === 'admin') role = 'ADMIN';

        await prisma.user.upsert({
          where: { email: row.email.toLowerCase() },
          update: {},
          create: {
            id: row.id,
            email: row.email.toLowerCase(),
            passwordHash: 'MAGIC_LINK_USER',
            name: row.name || row.email.split('@')[0],
            role: role as any,
            avatarUrl: row.avatar_url,
            isActive: true,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at || row.created_at),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`Profile ${row.email}: ${err.message}`);
      }
    }

    // Migrar assinantes
    for (const row of assinantes) {
      try {
        let role = 'MEMBER';
        if (row.role === 'admin') role = 'ADMIN';

        const isActive = row.status === 'ativo';

        await prisma.user.upsert({
          where: { email: row.email.toLowerCase() },
          update: {},
          create: {
            id: row.id,
            email: row.email.toLowerCase(),
            passwordHash: 'MAGIC_LINK_USER',
            name: row.nome || row.email.split('@')[0],
            role: role as any,
            isActive: isActive,
            adminNotes: row.observacao_admin,
            createdAt: new Date(row.criado_em),
            updatedAt: new Date(row.criado_em),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`Assinante ${row.email}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`Users: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 2. SUBSCRIPTIONS (from assinantes + subscriptions)
// ══════════════════════════════════════════════════
async function migrateSubscriptions(supabase: Client): Promise<void> {
  log('Migrando Subscriptions...');
  const result: MigrationResult = { table: 'subscriptions', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    // Subscriptions table (super_admin lifetime)
    const { rows: subs } = await supabase.query(`
      SELECT id, user_id, plan, status, started_at, expires_at, created_at
      FROM subscriptions
    `);

    // Assinantes com plano
    const { rows: assinantes } = await supabase.query(`
      SELECT id, email, status, plano, criado_em, data_expiracao
      FROM assinantes
      WHERE plano IS NOT NULL
    `);

    result.source = subs.length + assinantes.length;

    // Migrar subscription do super_admin
    for (const row of subs) {
      try {
        const user = await prisma.user.findUnique({ where: { id: row.user_id } });
        if (!user) {
          result.details.push(`Sub ${row.id}: user ${row.user_id} nao existe`);
          result.errors++;
          continue;
        }

        let plan = 'PREMIUM';
        if (row.plan === 'Basic' || row.plan === 'basic') plan = 'BASIC';

        let status = 'ACTIVE';
        if (row.status === 'inactive') status = 'INACTIVE';
        else if (row.status === 'expired') status = 'EXPIRED';
        else if (row.status === 'canceled') status = 'CANCELED';

        await prisma.subscription.upsert({
          where: { userId: row.user_id },
          update: {},
          create: {
            id: row.id,
            userId: row.user_id,
            plan: plan as any,
            status: status as any,
            startedAt: new Date(row.started_at || row.created_at),
            expiresAt: row.expires_at ? new Date(row.expires_at) : null,
            paymentGateway: 'lifetime',
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.created_at),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`Sub ${row.id}: ${err.message}`);
      }
    }

    // Migrar assinaturas dos assinantes
    for (const row of assinantes) {
      try {
        // Encontrar user pelo email
        const user = await prisma.user.findUnique({ where: { email: row.email.toLowerCase() } });
        if (!user) {
          result.errors++;
          continue;
        }

        // Verificar se ja tem subscription
        const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
        if (existing) continue; // Ja migrado (ex: super_admin)

        // Mapear plano: mensal=BASIC, trimestral/semestral=PREMIUM
        const planoLower = row.plano?.toLowerCase() || '';
        let plan = 'BASIC';
        if (planoLower === 'trimestral' || planoLower === 'semestral') plan = 'PREMIUM';

        // Mapear status
        let status = 'ACTIVE';
        if (row.status === 'pendente') status = 'PENDING';
        else if (row.status === 'suspenso') status = 'SUSPENDED';
        else if (row.status === 'rejeitado') status = 'CANCELED';

        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: plan as any,
            status: status as any,
            startedAt: new Date(row.criado_em),
            expiresAt: row.data_expiracao ? new Date(row.data_expiracao) : null,
            paymentGateway: 'lastlink',
            createdAt: new Date(row.criado_em),
            updatedAt: new Date(row.criado_em),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        if (result.details.length < 10) {
          result.details.push(`Assinante sub ${row.email}: ${err.message}`);
        }
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`Subscriptions: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 3. COURSES (from cursos)
// ══════════════════════════════════════════════════
async function migrateCourses(supabase: Client): Promise<void> {
  log('Migrando Courses...');
  const result: MigrationResult = { table: 'courses', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    const { rows } = await supabase.query(`
      SELECT id, title, description, thumbnail_url, icon_type, color,
             total_duration, is_new, is_featured, is_active, "order",
             created_at, updated_at
      FROM cursos
    `);

    result.source = rows.length;

    for (const row of rows) {
      try {
        await prisma.course.upsert({
          where: { id: row.id },
          update: {},
          create: {
            id: row.id,
            title: row.title,
            description: row.description || '',
            thumbnail: row.thumbnail_url || '',
            totalDuration: row.total_duration || '0h',
            isPublished: row.is_active ?? true,
            isNew: row.is_new ?? false,
            order: row.order || 0,
            iconType: row.icon_type,
            color: row.color,
            isFeatured: row.is_featured ?? false,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at || row.created_at),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`Course ${row.title}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`Courses: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 4. MODULES + LESSONS (from lessons, grouped by curso_id)
// ══════════════════════════════════════════════════
async function migrateModulesAndLessons(supabase: Client): Promise<void> {
  log('Migrando Modules e Lessons...');
  const moduleResult: MigrationResult = { table: 'modules', source: 0, migrated: 0, errors: 0, details: [] };
  const lessonResult: MigrationResult = { table: 'lessons', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    const { rows: lessons } = await supabase.query(`
      SELECT id, curso_id, title, description, video_url, thumbnail_url,
             duration, order_index, is_active, created_at
      FROM lessons
      ORDER BY curso_id, order_index
    `);

    lessonResult.source = lessons.length;

    // Agrupar por curso_id
    const courseGroups: Record<string, any[]> = {};
    for (const lesson of lessons) {
      const cid = lesson.curso_id;
      if (!courseGroups[cid]) courseGroups[cid] = [];
      courseGroups[cid].push(lesson);
    }

    for (const [courseId, courseLessons] of Object.entries(courseGroups)) {
      moduleResult.source++;

      try {
        const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
        if (!courseExists) {
          moduleResult.details.push(`course ${courseId} nao existe`);
          moduleResult.errors++;
          continue;
        }

        // Criar 1 modulo por curso
        const mod = await prisma.module.create({
          data: {
            courseId: courseId,
            title: 'Modulo Principal',
            description: '',
            order: 0,
          },
        });
        moduleResult.migrated++;

        for (const lesson of courseLessons) {
          try {
            // duration eh integer (segundos) no Supabase
            const secs = lesson.duration || 0;
            const mins = Math.floor(secs / 60);
            const secsRem = secs % 60;
            const durationStr = `${mins}:${secsRem.toString().padStart(2, '0')}`;

            await prisma.lesson.create({
              data: {
                id: lesson.id,
                moduleId: mod.id,
                title: lesson.title,
                description: lesson.description || '',
                videoUrl: lesson.video_url || '',
                thumbnail: lesson.thumbnail_url,
                duration: durationStr,
                durationSeconds: secs,
                order: lesson.order_index || 0,
                createdAt: new Date(lesson.created_at),
              },
            });
            lessonResult.migrated++;
          } catch (err: any) {
            lessonResult.errors++;
            lessonResult.details.push(`Lesson ${lesson.title}: ${err.message}`);
          }
        }
      } catch (err: any) {
        moduleResult.errors++;
        moduleResult.details.push(`Module curso ${courseId}: ${err.message}`);
      }
    }
  } catch (err: any) {
    moduleResult.details.push(`Erro geral: ${err.message}`);
  }

  results.push(moduleResult);
  results.push(lessonResult);
  log(`Modules: ${moduleResult.migrated}/${moduleResult.source} (${moduleResult.errors} erros)`);
  log(`Lessons: ${lessonResult.migrated}/${lessonResult.source} (${lessonResult.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 5. PRODUCTS (from digital_products)
// ══════════════════════════════════════════════════
async function migrateProducts(supabase: Client): Promise<void> {
  log('Migrando Products...');
  const result: MigrationResult = { table: 'products', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    const { rows } = await supabase.query(`
      SELECT id, title, description, full_description, price, original_price,
             category, thumbnail_url, video_url, purchase_url,
             is_featured, is_active, created_at, updated_at
      FROM digital_products
    `);

    result.source = rows.length;

    for (const row of rows) {
      try {
        // Mapear category
        let category = 'CURSO';
        const cat = row.category?.toLowerCase();
        if (cat === 'ferramenta' || cat === 'template') category = 'TEMPLATE';
        else if (cat === 'ebook') category = 'EBOOK';
        else if (cat === 'mentoria') category = 'MENTORIA';

        await prisma.product.upsert({
          where: { id: row.id },
          update: {},
          create: {
            id: row.id,
            title: row.title,
            description: row.description || '',
            imageUrl: row.thumbnail_url || '',
            price: parseFloat(row.price) || 0,
            originalPrice: row.original_price ? parseFloat(row.original_price) : null,
            features: [],
            category: category as any,
            isFeatured: row.is_featured ?? false,
            isActive: row.is_active ?? true,
            order: 0,
            purchaseUrl: row.purchase_url,
            fullDescription: row.full_description,
            videoUrl: row.video_url,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at || row.created_at),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`Product ${row.title}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`Products: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 6. NEWS (from novidades)
// ══════════════════════════════════════════════════
async function migrateNews(supabase: Client): Promise<void> {
  log('Migrando News...');
  const result: MigrationResult = { table: 'news', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    const { rows } = await supabase.query(`
      SELECT id, titulo, descricao, icone, cor_icone, badge, badge_cor,
             link, ordem, ativo, data_criacao, data_atualizacao
      FROM novidades
    `);

    result.source = rows.length;

    for (const row of rows) {
      try {
        await prisma.news.create({
          data: {
            id: row.id,
            title: row.titulo,
            content: row.descricao || '',
            isPublished: row.ativo ?? false,
            publishedAt: row.ativo ? new Date(row.data_criacao) : null,
            createdAt: new Date(row.data_criacao),
            updatedAt: new Date(row.data_atualizacao || row.data_criacao),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`News ${row.titulo}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`News: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 7. NEWS CONFIG (from configuracoes_novidades)
// ══════════════════════════════════════════════════
async function migrateNewsConfig(supabase: Client): Promise<void> {
  log('Migrando NewsConfig...');
  const result: MigrationResult = { table: 'news_config', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    const { rows } = await supabase.query(`
      SELECT id, secao_ativa, max_itens_exibidos, data_atualizacao
      FROM configuracoes_novidades
    `);

    result.source = rows.length;

    for (const row of rows) {
      try {
        await prisma.newsConfig.create({
          data: {
            id: row.id,
            autoShowOnLogin: row.secao_ativa ?? true,
            displayDays: row.max_itens_exibidos || 7,
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`NewsConfig: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`NewsConfig: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 8. SHARED CREDENTIALS (from credenciais_adspower)
// ══════════════════════════════════════════════════
async function migrateCredentials(supabase: Client): Promise<void> {
  log('Migrando SharedCredentials...');
  const result: MigrationResult = { table: 'shared_credentials', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    const { rows } = await supabase.query(`
      SELECT id, email_login, senha_atual, ultima_atualizacao
      FROM credenciais_adspower
    `);

    result.source = rows.length;

    for (const row of rows) {
      try {
        await prisma.sharedCredential.create({
          data: {
            id: row.id,
            serviceName: 'AdsPower',
            username: row.email_login,
            password: row.senha_atual,
            isActive: true,
            createdAt: new Date(row.ultima_atualizacao),
            updatedAt: new Date(row.ultima_atualizacao),
          },
        });
        result.migrated++;
      } catch (err: any) {
        result.errors++;
        result.details.push(`Credential: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`SharedCredentials: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// 9. ACTIVITY LOGS (from logs)
// ══════════════════════════════════════════════════
async function migrateActivityLogs(supabase: Client): Promise<void> {
  log('Migrando ActivityLogs (41k+ registros, pode demorar)...');
  const result: MigrationResult = { table: 'activity_logs', source: 0, migrated: 0, errors: 0, details: [] };

  try {
    // Pré-carregar mapa email → userId
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const emailToId: Record<string, string> = {};
    for (const u of allUsers) {
      emailToId[u.email.toLowerCase()] = u.id;
    }

    const { rows } = await supabase.query(`
      SELECT id, usuario_email, acao, timestamp
      FROM logs
      ORDER BY timestamp
    `);

    result.source = rows.length;
    log(`   Processando ${rows.length} logs em batches...`);

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          const acao = (row.acao || '').toLowerCase();

          // Inferir tipo pela acao
          let type = 'SYSTEM';
          if (acao.includes('login')) type = 'LOGIN';
          else if (acao.includes('logout')) type = 'LOGOUT';
          else if (acao.includes('webhook') || acao.includes('lastlink')) type = 'SYSTEM';
          else if (acao.includes('status') || acao.includes('alteração')) type = 'ADMIN';
          else if (acao.includes('acesso ao painel')) type = 'ADMIN';

          // Resolver userId pelo email
          const userId = row.usuario_email ? emailToId[row.usuario_email.toLowerCase()] : null;

          await prisma.activityLog.create({
            data: {
              id: row.id,
              userId: userId || null,
              type: type as any,
              description: row.acao || '',
              createdAt: new Date(row.timestamp),
            },
          });
          result.migrated++;
        } catch (err: any) {
          result.errors++;
          if (result.details.length < 10) {
            result.details.push(`Log ${row.id}: ${err.message}`);
          }
        }
      }

      if ((i + batchSize) % 5000 === 0 || i + batchSize >= rows.length) {
        log(`   Progresso: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
      }
    }
  } catch (err: any) {
    result.details.push(`Erro geral: ${err.message}`);
  }

  results.push(result);
  log(`ActivityLogs: ${result.migrated}/${result.source} (${result.errors} erros)`);
}

// ══════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   MIGRACAO SUPABASE -> POSTGRESQL LOCAL');
  console.log('   Nucleo IA v4');
  console.log('═══════════════════════════════════════════════════════\n');

  const supabase = new Client(supabaseConfig);

  try {
    log('Conectando ao Supabase...');
    await supabase.connect();
    log('Conectado!\n');

    // Executar migracoes na ordem correta (dependencias primeiro)
    await migrateUsers(supabase);
    await migrateSubscriptions(supabase);
    await migrateCourses(supabase);
    await migrateModulesAndLessons(supabase);
    await migrateProducts(supabase);
    await migrateNews(supabase);
    await migrateNewsConfig(supabase);
    await migrateCredentials(supabase);
    await migrateActivityLogs(supabase);

    // Relatorio final
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   RELATORIO FINAL');
    console.log('═══════════════════════════════════════════════════════\n');

    let totalSource = 0, totalMigrated = 0, totalErrors = 0;

    for (const r of results) {
      totalSource += r.source;
      totalMigrated += r.migrated;
      totalErrors += r.errors;

      const pct = r.source > 0 ? ((r.migrated / r.source) * 100).toFixed(1) : '100.0';
      console.log(`${r.table.padEnd(22)} | Origem: ${r.source.toString().padStart(6)} | Migrado: ${r.migrated.toString().padStart(6)} | Erros: ${r.errors.toString().padStart(4)} | ${pct}%`);

      if (r.details.length > 0 && r.details.length <= 5) {
        r.details.forEach(d => console.log(`   -> ${d}`));
      } else if (r.details.length > 5) {
        console.log(`   -> ${r.details.length} detalhes (primeiros 3):`);
        r.details.slice(0, 3).forEach(d => console.log(`      ${d}`));
      }
    }

    const totalPct = totalSource > 0 ? ((totalMigrated / totalSource) * 100).toFixed(1) : '100.0';
    console.log('──────────────────────────────────────────────────────────────────────');
    console.log(`TOTAL                  | Origem: ${totalSource.toString().padStart(6)} | Migrado: ${totalMigrated.toString().padStart(6)} | Erros: ${totalErrors.toString().padStart(4)} | ${totalPct}%`);
    console.log('\n═══════════════════════════════════════════════════════');

    if (totalErrors === 0) {
      console.log('MIGRACAO CONCLUIDA COM SUCESSO!');
    } else {
      const errorPct = ((totalErrors / totalSource) * 100).toFixed(1);
      console.log(`MIGRACAO CONCLUIDA COM ${totalErrors} ERROS (${errorPct}%)`);
    }

  } catch (error) {
    console.error('ERRO FATAL:', error);
    process.exit(1);
  } finally {
    await supabase.end();
    await prisma.$disconnect();
  }
}

main();
