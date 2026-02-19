import ResolverImport from '@forge/resolver';
import api, { route, storage } from '@forge/api';
import {
  buildDistributionAggregate,
  hashKey
} from './lib/aggregates.js';
import { fetchWorkItemsAsUser } from './lib/work-fetch.js';
import { buildFlowCanvasDataset, buildFlowWorkItems } from './lib/flow-canvas-model.js';

const Resolver = ResolverImport?.default || ResolverImport;
const resolver = new Resolver();

const CONFIG_KEY = 'efc:config';
const SAVED_VIEW_PREFIX = 'efc:view:';
const PERF_PREFIX = 'efc:perf:';
const CACHE_PREFIX = 'efc:cache:';

const DEFAULT_CONFIG = {
  adminAccountIds: [],
  fieldMapping: {
    team: '',
    points: '',
    statusCategoryFallback: true
  },
  statusGroups: {
    backlog: ['To Do'],
    inProgress: ['In Progress'],
    done: ['Done']
  },
  cacheTtlSeconds: 900,
  maxIssuesPerQuery: 2000
};

function nowIso() {
  return new Date().toISOString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || min));
}

async function getConfig() {
  const cfg = await storage.get(CONFIG_KEY);
  return { ...DEFAULT_CONFIG, ...(cfg || {}) };
}

async function setConfig(config) {
  await storage.set(CONFIG_KEY, config);
  return config;
}

function isAdmin(context, config) {
  const accountId = context?.accountId || '';
  const admins = config?.adminAccountIds || [];
  if (admins.length === 0) {
    return true;
  }
  return admins.includes(accountId);
}

function requireAdmin(context, config) {
  if (!isAdmin(context, config)) {
    throw new Error('Admin permission required');
  }
}

function buildCacheKey(accountId, payload, config) {
  const raw = JSON.stringify({
    accountId,
    jql: payload?.jql || '',
    projectKey: payload?.projectKey || '',
    timeWindow: payload?.timeWindow || 'P90D',
    viewType: payload?.viewType || 'flow',
    fieldMapping: config?.fieldMapping || {},
    statusGroups: config?.statusGroups || {}
  });
  return `${CACHE_PREFIX}${hashKey(raw)}`;
}

async function readCache(cacheKey) {
  const record = await storage.get(cacheKey);
  if (!record?.expiresAt || Date.now() > record.expiresAt) {
    return null;
  }
  return record.data;
}

async function writeCache(cacheKey, data, ttlSeconds) {
  await storage.set(cacheKey, {
    data,
    expiresAt: Date.now() + (clamp(ttlSeconds, 60, 3600) * 1000),
    cachedAt: nowIso()
  });
}

async function recordPerf(context, payload) {
  const accountId = context?.accountId || 'unknown';
  await storage.set(`${PERF_PREFIX}${accountId}`, {
    ...payload,
    ts: nowIso()
  });
}

resolver.define('getBootstrap', async ({ context }) => {
  const config = await getConfig();
  return {
    viewer: {
      accountId: context?.accountId || '',
      cloudId: context?.cloudId || '',
      isAdmin: isAdmin(context, config),
      projectKey: context?.extension?.project?.key || ''
    },
    config: {
      fieldMapping: config.fieldMapping,
      statusGroups: config.statusGroups,
      cacheTtlSeconds: config.cacheTtlSeconds
    },
    constraints: {
      forgeOnly: true,
      dataEgress: false
    }
  };
});

resolver.define('queryAggregate', async ({ context, payload }) => {
  const startedAt = Date.now();
  try {
    const config = await getConfig();
    const jql = (payload?.jql || '').trim();
    if (!jql) {
      throw new Error('JQL is required');
    }

    const maxIssues = clamp(payload?.maxIssues || config.maxIssuesPerQuery, 100, 5000);
    const cacheKey = buildCacheKey(context?.accountId || '', payload, config);
    const cached = await readCache(cacheKey);
    if (cached) {
      await recordPerf(context, {
        op: 'queryAggregate',
        cacheHit: true,
        elapsedMs: Date.now() - startedAt
      });
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cacheHit: true
        }
      };
    }

    const projectKey = payload?.projectKey || context?.extension?.project?.key || '';
    const search = await fetchWorkItemsAsUser({
      api,
      route,
      jql,
      maxIssues,
      projectKey
    });
    const issues = search.issues;
    const viewType = payload?.viewType === 'distribution' ? 'distribution' : 'flow';
    const aggregate = viewType === 'distribution'
      ? buildDistributionAggregate(issues, config.fieldMapping.team)
      : buildFlowCanvasDataset(buildFlowWorkItems(issues, config.statusGroups));

    const result = {
      aggregate,
      sampleIssues: issues.slice(0, 200).map((issue) => ({
        key: issue.key,
        summary: issue?.fields?.summary || '',
        status: issue?.fields?.status?.name || '',
        priority: issue?.fields?.priority?.name || ''
      })),
      meta: {
        sourceCount: issues.length,
        totalAvailable: typeof search.total === 'number' ? search.total : issues.length,
        truncated: typeof search.total === 'number' ? issues.length < search.total : false,
        jqlRequested: jql,
        jqlApplied: search.appliedJql,
        generatedAt: nowIso(),
        cacheHit: false
      }
    };

    await writeCache(cacheKey, result, config.cacheTtlSeconds);
    await recordPerf(context, {
      op: 'queryAggregate',
      cacheHit: false,
      elapsedMs: Date.now() - startedAt,
      issueCount: issues.length
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`queryAggregate failed: ${message}`);
  }
});

resolver.define('listIssues', async ({ payload }) => {
  const jql = (payload?.jql || '').trim();
  if (!jql) {
    throw new Error('JQL is required');
  }
  const maxIssues = clamp(payload?.maxIssues || 200, 1, 1000);
  const projectKey = payload?.projectKey || '';
  const search = await fetchWorkItemsAsUser({
    api,
    route,
    jql,
    maxIssues,
    projectKey
  });
  const issues = search.issues;
  return issues.map((issue) => ({
    key: issue.key,
    summary: issue?.fields?.summary || '',
    status: issue?.fields?.status?.name || '',
    priority: issue?.fields?.priority?.name || '',
    updated: issue?.fields?.updated || ''
  }));
});

resolver.define('exportIssuesCsv', async ({ payload }) => {
  const jql = (payload?.jql || '').trim();
  if (!jql) {
    throw new Error('JQL is required');
  }
  const projectKey = payload?.projectKey || '';
  const search = await fetchWorkItemsAsUser({
    api,
    route,
    jql,
    maxIssues: clamp(payload?.maxIssues || 500, 1, 1000),
    projectKey
  });
  const issues = search.issues;
  const header = ['Key', 'Summary', 'Status', 'Priority', 'Updated'];
  const rows = issues.map((issue) => [
    issue.key,
    (issue?.fields?.summary || '').replaceAll('"', '""'),
    issue?.fields?.status?.name || '',
    issue?.fields?.priority?.name || '',
    issue?.fields?.updated || ''
  ]);
  const csv = [header, ...rows]
    .map((cols) => cols.map((c) => `"${String(c)}"`).join(','))
    .join('\n');
  return {
    fileName: 'flow-canvas-export.csv',
    content: csv
  };
});

resolver.define('saveView', async ({ context, payload }) => {
  const name = (payload?.name || '').trim();
  if (!name) {
    throw new Error('View name is required');
  }
  const accountId = context?.accountId || '';
  const record = {
    name,
    jql: payload?.jql || '',
    timeWindow: payload?.timeWindow || 'P90D',
    viewType: payload?.viewType || 'flow',
    updatedAt: nowIso()
  };
  await storage.set(`${SAVED_VIEW_PREFIX}${accountId}:${name}`, record);
  return record;
});

resolver.define('listViews', async ({ context }) => {
  const accountId = context?.accountId || '';
  const query = await storage.query()
    .where('key', storage.startsWith(`${SAVED_VIEW_PREFIX}${accountId}:`))
    .limit(50)
    .getMany();
  return (query?.results || []).map((item) => item.value);
});

resolver.define('deleteView', async ({ context, payload }) => {
  const accountId = context?.accountId || '';
  const name = (payload?.name || '').trim();
  if (!name) {
    throw new Error('View name is required');
  }
  await storage.delete(`${SAVED_VIEW_PREFIX}${accountId}:${name}`);
  return { deleted: true };
});

resolver.define('getPerfSnapshot', async ({ context }) => {
  const accountId = context?.accountId || 'unknown';
  return (await storage.get(`${PERF_PREFIX}${accountId}`)) || null;
});

resolver.define('getAdminConfig', async ({ context }) => {
  const config = await getConfig();
  return {
    ...config,
    isAdmin: isAdmin(context, config)
  };
});

resolver.define('saveAdminConfig', async ({ context, payload }) => {
  const current = await getConfig();
  requireAdmin(context, current);
  const next = {
    ...current,
    fieldMapping: {
      ...current.fieldMapping,
      ...(payload?.fieldMapping || {})
    },
    statusGroups: {
      ...current.statusGroups,
      ...(payload?.statusGroups || {})
    },
    cacheTtlSeconds: clamp(payload?.cacheTtlSeconds || current.cacheTtlSeconds, 60, 3600),
    maxIssuesPerQuery: clamp(payload?.maxIssuesPerQuery || current.maxIssuesPerQuery, 100, 5000),
    adminAccountIds: Array.isArray(payload?.adminAccountIds) ? payload.adminAccountIds : current.adminAccountIds
  };
  await setConfig(next);
  return next;
});

export const handler = resolver.getDefinitions();

export const __private = {
  buildFlowAggregate,
  buildDistributionAggregate,
  pickStatusGroup,
  hashKey
};
