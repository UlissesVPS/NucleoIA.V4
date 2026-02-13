import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { notifyMembers } from "../services/notification.service";
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      totalPrompts,
      totalCourses,
      totalProducts,
      onlineUsers,
      todayLogins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.prompt.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.session.count({ where: { isActive: true, lastActivity: { gte: fiveMinutesAgo } } }),
      prisma.activityLog.count({
        where: {
          type: 'LOGIN',
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return successResponse(res, {
      users: { total: totalUsers, active: activeUsers, premium: premiumUsers },
      content: { prompts: totalPrompts, courses: totalCourses, products: totalProducts },
      activity: { online: onlineUsers, todayLogins },
    });
  } catch (error) {
    return errorResponse(res, 'STATS_ERROR', 'Erro ao buscar estatisticas', 500);
  }
};

export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;

    const where: any = {};
    if (type) where.type = type;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return successResponse(res, logs, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return errorResponse(res, 'LOGS_ERROR', 'Erro ao buscar logs', 500);
  }
};

// API Keys
export const listApiKeys = async (req: AuthRequest, res: Response) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(
      res,
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        type: k.type,
        status: k.status,
        permissions: k.permissions,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      }))
    );
  } catch (error) {
    return errorResponse(res, 'API_KEYS_ERROR', 'Erro ao listar API keys', 500);
  }
};

export const createApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, permissions, expiresAt } = req.body;

    const rawKey = `nuc_${uuidv4().replace(/-/g, '')}`;
    const keyHash = await hashPassword(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        type: type || 'CUSTOM',
        permissions: permissions || [],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        type: 'ADMIN',
        description: `API key "${name}" criada`,
        ipAddress: req.ip,
      },
    });

    return successResponse(res, { ...apiKey, rawKey }, undefined, 201);
  } catch (error) {
    return errorResponse(res, 'API_KEY_CREATE_ERROR', 'Erro ao criar API key', 500);
  }
};

export const revokeApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const key = await prisma.apiKey.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        type: 'ADMIN',
        description: `API key "${key.name}" revogada`,
        ipAddress: req.ip,
      },
    });

    return successResponse(res, { message: 'API key revogada' });
  } catch (error) {
    return errorResponse(res, 'API_KEY_REVOKE_ERROR', 'Erro ao revogar API key', 500);
  }
};

// Webhooks
export const listWebhooks = async (req: AuthRequest, res: Response) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, webhooks);
  } catch (error) {
    return errorResponse(res, 'WEBHOOKS_ERROR', 'Erro ao listar webhooks', 500);
  }
};

export const createWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { name, url, event, headers } = req.body;

    const secret = uuidv4();

    const webhook = await prisma.webhook.create({
      data: { name, url, event, secret, headers },
    });

    return successResponse(res, webhook, undefined, 201);
  } catch (error) {
    return errorResponse(res, 'WEBHOOK_CREATE_ERROR', 'Erro ao criar webhook', 500);
  }
};

export const updateWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, event, status, headers } = req.body;

    const webhook = await prisma.webhook.update({
      where: { id },
      data: { name, url, event, status, headers },
    });

    return successResponse(res, webhook);
  } catch (error) {
    return errorResponse(res, 'WEBHOOK_UPDATE_ERROR', 'Erro ao atualizar webhook', 500);
  }
};

export const deleteWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.webhook.delete({ where: { id } });

    return successResponse(res, { message: 'Webhook deletado' });
  } catch (error) {
    return errorResponse(res, 'WEBHOOK_DELETE_ERROR', 'Erro ao deletar webhook', 500);
  }
};

export const testWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      return errorResponse(res, 'WEBHOOK_NOT_FOUND', 'Webhook nao encontrado', 404);
    }

    // Send test request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret,
        ...(webhook.headers as object || {}),
      },
      body: JSON.stringify({ event: 'test', timestamp: new Date().toISOString() }),
    });

    await prisma.webhook.update({
      where: { id },
      data: {
        lastStatus: response.status,
        lastFired: new Date(),
        status: response.ok ? 'ACTIVE' : 'ERROR',
        failures: response.ok ? 0 : { increment: 1 },
      },
    });

    return successResponse(res, { status: response.status, ok: response.ok });
  } catch (error) {
    return errorResponse(res, 'WEBHOOK_TEST_ERROR', 'Erro ao testar webhook', 500);
  }
};

// VPS Stats
async function runCmd(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 5000 });
    return stdout.trim();
  } catch {
    return '';
  }
}

export const getVpsStats = async (req: AuthRequest, res: Response) => {
  try {
    const [cpuRaw, memRaw, diskRaw, uptimeRaw, pm2Raw, nodeRaw, pgRunning, nginxRunning, loadAvg] = await Promise.all([
      runCmd("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"),
      runCmd("free -b | awk '/Mem:/ {printf \"%s %s %s\", $2, $3, $7}'"),
      runCmd("df -B1 / | awk 'NR==2 {printf \"%s %s %s\", $2, $3, $5}'"),
      runCmd("uptime -s"),
      runCmd("pm2 jlist 2>/dev/null || echo '[]'"),
      runCmd("node --version"),
      runCmd("systemctl is-active postgresql 2>/dev/null || echo 'unknown'"),
      runCmd("systemctl is-active nginx 2>/dev/null || echo 'unknown'"),
      runCmd("cat /proc/loadavg | awk '{print $1, $2, $3}'"),
    ]);

    // Parse CPU
    const cpuPercent = parseFloat(cpuRaw) || 0;

    // Parse Memory (bytes)
    const memParts = memRaw.split(' ');
    const memTotal = parseInt(memParts[0]) || 0;
    const memUsed = parseInt(memParts[1]) || 0;
    const memAvailable = parseInt(memParts[2]) || 0;

    // Parse Disk (bytes)
    const diskParts = diskRaw.split(' ');
    const diskTotal = parseInt(diskParts[0]) || 0;
    const diskUsed = parseInt(diskParts[1]) || 0;
    const diskPercent = parseInt(diskParts[2]) || 0;

    // Parse uptime
    let uptimeSecs = 0;
    if (uptimeRaw) {
      const bootTime = new Date(uptimeRaw).getTime();
      uptimeSecs = Math.floor((Date.now() - bootTime) / 1000);
    }

    // Parse PM2 processes
    let pm2Processes: any[] = [];
    try {
      pm2Processes = JSON.parse(pm2Raw);
    } catch {}

    const services = [
      ...pm2Processes.map((p: any) => ({
        name: `PM2: ${p.name}`,
        status: p.pm2_env?.status === 'online' ? 'online' : 'stopped',
        uptime: p.pm2_env?.pm_uptime ? Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000) : 0,
        cpu: p.monit?.cpu || 0,
        memory: p.monit?.memory || 0,
      })),
      { name: 'PostgreSQL', status: pgRunning === 'active' ? 'online' : 'stopped', uptime: uptimeSecs, cpu: 0, memory: 0 },
      { name: 'Nginx', status: nginxRunning === 'active' ? 'online' : 'stopped', uptime: uptimeSecs, cpu: 0, memory: 0 },
    ];

    const loadParts = (loadAvg || '0 0 0').split(' ');

    return successResponse(res, {
      cpu: { percent: Math.round(cpuPercent * 10) / 10, loadAvg: loadParts.map(Number) },
      memory: { total: memTotal, used: memUsed, available: memAvailable, percent: memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0 },
      disk: { total: diskTotal, used: diskUsed, free: diskTotal - diskUsed, percent: diskPercent },
      uptime: uptimeSecs,
      node: nodeRaw || 'unknown',
      services,
    });
  } catch (error) {
    return errorResponse(res, 'VPS_STATS_ERROR', 'Erro ao buscar stats do VPS', 500);
  }
};

// Online Users
export const getOnlineUsers = async (req: AuthRequest, res: Response) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: { isActive: true, lastActivity: { gte: fiveMinutesAgo } },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
      orderBy: { lastActivity: 'desc' },
    });

    const users = sessions.map((s) => ({
      id: s.user.id,
      sessionId: s.id,
      name: s.user.name,
      email: s.user.email,
      avatarUrl: s.user.avatarUrl,
      role: s.user.role,
      ip: s.ip,
      currentPage: s.currentPage,
      device: s.device,
      browser: s.browser,
      city: s.city,
      state: s.state,
      lastActivity: s.lastActivity,
      connectedAt: s.connectedAt,
    }));

    // Detect users with multiple different IPs (possible account sharing)
    const userIpMap: Record<string, Set<string>> = {};
    for (const session of sessions) {
      const uid = session.user.id;
      const ip = session.ip || '';
      if (!ip || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') continue;
      if (!userIpMap[uid]) userIpMap[uid] = new Set();
      userIpMap[uid].add(ip);
    }

    const ipAlerts = Object.entries(userIpMap)
      .filter(([_, ips]) => ips.size >= 2)
      .map(([userId, ips]) => {
        const userSessions = sessions.filter((s) => s.user.id === userId);
        const user = userSessions[0]?.user;
        return {
          userId,
          name: user?.name || '',
          email: user?.email || '',
          ips: Array.from(ips),
          sessionCount: userSessions.length,
          sessions: userSessions.map((s) => ({
            ip: s.ip,
            device: s.device,
            browser: s.browser,
            city: s.city,
            state: s.state,
            connectedAt: s.connectedAt,
            lastActivity: s.lastActivity,
          })),
        };
      });

    return successResponse(res, { users, ipAlerts });
  } catch (error) {
    return errorResponse(res, 'ONLINE_USERS_ERROR', 'Erro ao buscar usuarios online', 500);
  }
};

// Backups
export const listBackups = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [rawBackups, total] = await Promise.all([
      prisma.backupRecord.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.backupRecord.count(),
    ]);

    // Convert BigInt sizeBytes to Number for JSON serialization
    const backups = rawBackups.map((b: any) => ({
      ...b,
      sizeBytes: b.sizeBytes ? Number(b.sizeBytes) : null,
    }));

    return successResponse(res, backups, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('BACKUPS_ERROR:', error);
    return errorResponse(res, 'BACKUPS_ERROR', 'Erro ao listar backups', 500);
  }
};

export const getBackupSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const schedule = await prisma.backupSchedule.findFirst();
    return successResponse(res, schedule);
  } catch (error) {
    return errorResponse(res, 'BACKUP_SCHEDULE_ERROR', 'Erro ao buscar agendamento', 500);
  }
};

export const updateBackupSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, frequency, hour, minute, weekday, components, retention, notifyEmail, email } = req.body;

    let schedule = await prisma.backupSchedule.findFirst();
    if (schedule) {
      schedule = await prisma.backupSchedule.update({
        where: { id: schedule.id },
        data: { enabled, frequency, hour, minute, weekday, components, retention, notifyEmail, email },
      });
    } else {
      schedule = await prisma.backupSchedule.create({
        data: { enabled, frequency, hour, minute, weekday, components, retention, notifyEmail, email },
      });
    }

    return successResponse(res, schedule);
  } catch (error) {
    return errorResponse(res, 'BACKUP_SCHEDULE_UPDATE_ERROR', 'Erro ao atualizar agendamento', 500);
  }
};

// Public Stats (no auth required)
export const getPublicStats = async (req: Request, res: Response) => {
  try {
    const [
      totalTools,
      totalPrompts,
      totalProducts,
      totalCourses,
      totalMembers,
      activeMembers,
    ] = await Promise.all([
      prisma.aiTool.count({ where: { isActive: true } }),
      prisma.prompt.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
    ]);

    return successResponse(res, {
      totalTools,
      totalPrompts,
      totalProducts,
      totalCourses,
      totalMembers,
      activeMembers,
    });
  } catch (error) {
    return errorResponse(res, "PUBLIC_STATS_ERROR", "Erro ao buscar estatisticas publicas", 500);
  }
};


export const sendNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, message, link } = req.body;

    if (!type || !title || !message) {
      return errorResponse(res, 'MISSING_FIELDS', 'type, title e message sao obrigatorios', 400);
    }

    const validTypes = ['NEW_COURSE', 'NEW_PROMPT', 'UPDATE', 'MARKETING'];
    if (!validTypes.includes(type)) {
      return errorResponse(res, 'INVALID_TYPE', 'Tipo invalido. Use: ' + validTypes.join(', '), 400);
    }

    const result = await notifyMembers({ type, title, message, link });

    return successResponse(res, {
      message: "Notificacoes enviadas",
      sent: result.sent,
      total: result.total,
    });
  } catch (error) {
    return errorResponse(res, 'NOTIFICATION_ERROR', 'Erro ao enviar notificacoes', 500);
  }
};


// IP Alerts - Detect users with multiple active sessions from different IPs
export const getIpAlerts = async (req: AuthRequest, res: Response) => {
  try {
    // Look at sessions active in the last 24 hours for broader detection
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: {
        isActive: true,
        lastActivity: { gte: twentyFourHoursAgo },
        ip: { notIn: ['::ffff:127.0.0.1', '127.0.0.1', '::1', '', 'unknown'] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { lastActivity: 'desc' },
    });

    // Group by user, collect unique IPs
    const userMap: Record<string, { user: any; ips: Map<string, any[]> }> = {};

    for (const s of sessions) {
      const uid = s.user.id;
      if (!userMap[uid]) {
        userMap[uid] = { user: s.user, ips: new Map() };
      }
      const ip = s.ip || '';
      if (!ip) continue;
      if (!userMap[uid].ips.has(ip)) {
        userMap[uid].ips.set(ip, []);
      }
      userMap[uid].ips.get(ip)!.push({
        sessionId: s.id,
        device: s.device,
        browser: s.browser,
        city: s.city,
        state: s.state,
        currentPage: s.currentPage,
        connectedAt: s.connectedAt,
        lastActivity: s.lastActivity,
      });
    }

    // Filter only users with 2+ different IPs
    const alerts = Object.values(userMap)
      .filter((entry) => entry.ips.size >= 2)
      .map((entry) => ({
        userId: entry.user.id,
        name: entry.user.name,
        email: entry.user.email,
        role: entry.user.role,
        uniqueIps: entry.ips.size,
        ips: Array.from(entry.ips.entries()).map(([ip, sessions]) => ({
          ip,
          sessionCount: sessions.length,
          sessions,
        })),
      }))
      .sort((a, b) => b.uniqueIps - a.uniqueIps);

    return successResponse(res, {
      totalAlerts: alerts.length,
      alerts,
    });
  } catch (error) {
    return errorResponse(res, 'IP_ALERTS_ERROR', 'Erro ao buscar alertas de IP', 500);
  }
};

// IP History - Historical login IPs per member (from activity logs + sessions)
export const getIpHistory = async (req: AuthRequest, res: Response) => {
  try {
    // Get all LOGIN activity logs with IP addresses
    const loginLogs = await prisma.activityLog.findMany({
      where: {
        type: 'LOGIN',
        ipAddress: { not: null },
        userId: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get all sessions (active and inactive) for broader IP data
    const sessions = await prisma.session.findMany({
      where: {
        ip: { notIn: ['::ffff:127.0.0.1', '127.0.0.1', '::1', '', 'unknown'] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      },
      orderBy: { connectedAt: 'desc' },
    });

    // Build user IP map combining both sources
    const userMap: Record<string, {
      user: any;
      ips: Map<string, { firstSeen: Date; lastSeen: Date; loginCount: number; devices: Set<string>; cities: Set<string> }>;
    }> = {};

    // Process activity logs
    for (const log of loginLogs) {
      if (!log.userId || !log.user) continue;
      const ip = log.ipAddress || '';
      if (!ip || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1' || ip === '::1') continue;

      if (!userMap[log.userId]) {
        userMap[log.userId] = { user: log.user, ips: new Map() };
      }

      const entry = userMap[log.userId];
      if (!entry.ips.has(ip)) {
        entry.ips.set(ip, { firstSeen: log.createdAt, lastSeen: log.createdAt, loginCount: 0, devices: new Set(), cities: new Set() });
      }
      const ipData = entry.ips.get(ip)!;
      ipData.loginCount++;
      if (log.createdAt < ipData.firstSeen) ipData.firstSeen = log.createdAt;
      if (log.createdAt > ipData.lastSeen) ipData.lastSeen = log.createdAt;
    }

    // Process sessions for device/city/extra IP info
    for (const s of sessions) {
      if (!s.user) continue;
      const ip = s.ip || '';
      if (!ip || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1' || ip === '::1') continue;

      const uid = s.user.id;
      if (!userMap[uid]) {
        userMap[uid] = { user: s.user, ips: new Map() };
      }

      const entry = userMap[uid];
      if (!entry.ips.has(ip)) {
        entry.ips.set(ip, { firstSeen: s.connectedAt, lastSeen: s.connectedAt, loginCount: 0, devices: new Set(), cities: new Set() });
      }
      const ipData = entry.ips.get(ip)!;
      if (s.connectedAt < ipData.firstSeen) ipData.firstSeen = s.connectedAt;
      if (s.lastActivity && s.lastActivity > ipData.lastSeen) ipData.lastSeen = s.lastActivity;
      if (s.device) ipData.devices.add(s.device);
      if (s.browser) ipData.devices.add(s.browser);
      if (s.city) ipData.cities.add(s.city + (s.state ? ', ' + s.state : ''));
    }

    // Build response
    const members = Object.values(userMap)
      .map((entry) => ({
        userId: entry.user.id,
        name: entry.user.name,
        email: entry.user.email,
        role: entry.user.role,
        isActive: entry.user.isActive,
        uniqueIps: entry.ips.size,
        ips: Array.from(entry.ips.entries()).map(([ip, data]) => ({
          ip,
          loginCount: data.loginCount,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
          devices: Array.from(data.devices),
          cities: Array.from(data.cities),
        })).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()),
      }))
      .sort((a, b) => b.uniqueIps - a.uniqueIps);

    // Separate flagged (2+ IPs) from normal
    const flagged = members.filter((m) => m.uniqueIps >= 2);
    const all = members;

    return successResponse(res, {
      totalMembers: members.length,
      flaggedCount: flagged.length,
      flagged,
      all,
    });
  } catch (error) {
    return errorResponse(res, 'IP_HISTORY_ERROR', 'Erro ao buscar historico de IPs', 500);
  }
};