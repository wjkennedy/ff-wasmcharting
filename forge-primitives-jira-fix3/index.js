import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import api, { route } from '@forge/api';

const resolver = new Resolver();

async function appendAudit(event) {
  const key = 'audit-log';
  const existing = (await storage.get(key)) || [];
  const withTs = { ts: new Date().toISOString(), ...event };
  existing.unshift(withTs);
  await storage.set(key, existing.slice(0, 500));
  return withTs;
}

const CONFIG_KEY = 'app-config';
const DEFAULT_CONFIG = {
  admins: [],
  allowUsers: [],
  featureFlags: { csvExport: true, jiraAudit: true, presets: true }
};

async function getConfig() {
  const cfg = await storage.get(CONFIG_KEY);
  return { ...DEFAULT_CONFIG, ...(cfg || {}) };
}
async function setConfig(cfg) { await storage.set(CONFIG_KEY, cfg); return cfg; }
function isAdmin(accountId, cfg) { return (cfg.admins || []).includes(accountId); }
function isAllowed(accountId, cfg) {
  const list = cfg.allowUsers || [];
  return list.length === 0 || list.includes(accountId) || isAdmin(accountId, cfg);
}

resolver.define('getAccess', async ({ context }) => {
  const cfg = await getConfig();
  const accountId = context?.accountId;
  return { isAdmin: isAdmin(accountId, cfg), isAllowed: isAllowed(accountId, cfg), featureFlags: cfg.featureFlags };
});

resolver.define('addAdmin', async ({ context, payload }) => {
  const cfg = await getConfig();
  if (!isAdmin(context?.accountId, cfg) && cfg.admins.length > 0) throw new Error('Only admins can add admins');
  const id = payload?.accountId || context?.accountId;
  if (!id) throw new Error('Missing accountId');
  if (!cfg.admins.includes(id)) cfg.admins.push(id);
  await setConfig(cfg);
  await appendAudit({ type: 'rbac:addAdmin', details: { accountId: id }, user: context?.accountId });
  return cfg.admins;
});

resolver.define('removeAdmin', async ({ context, payload }) => {
  const cfg = await getConfig();
  if (!isAdmin(context?.accountId, cfg)) throw new Error('Only admins can remove admins');
  const id = payload?.accountId;
  cfg.admins = (cfg.admins || []).filter(a => a !== id);
  await setConfig(cfg);
  await appendAudit({ type: 'rbac:removeAdmin', details: { accountId: id }, user: context?.accountId });
  return cfg.admins;
});

resolver.define('setFeatureFlag', async ({ context, payload }) => {
  const cfg = await getConfig();
  if (!isAdmin(context?.accountId, cfg)) throw new Error('Only admins can change feature flags');
  const { key, value } = payload || {};
  if (!(key in cfg.featureFlags)) throw new Error('Unknown flag');
  cfg.featureFlags[key] = !!value;
  await setConfig(cfg);
  await appendAudit({ type: 'rbac:setFlag', details: { key, value }, user: context?.accountId });
  return cfg.featureFlags;
});

const PRESETS_KEY = 'jql-presets';

resolver.define('savePreset', async ({ context, payload }) => {
  const cfg = await getConfig();
  if (!isAllowed(context?.accountId, cfg)) throw new Error('Not allowed');
  const { name, jql, projectKey } = payload || {};
  if (!name || !jql) throw new Error('Missing name or jql');
  const list = (await storage.get(PRESETS_KEY)) || [];
  const idx = list.findIndex(p => p.name === name && (p.projectKey || '') === (projectKey || ''));
  const record = { name, jql, projectKey: projectKey || '', createdBy: context?.accountId, ts: new Date().toISOString() };
  if (idx >= 0) list[idx] = record; else list.push(record);
  await storage.set(PRESETS_KEY, list);
  await appendAudit({ type: 'preset:save', details: { name, projectKey }, user: context?.accountId });
  return record;
});
resolver.define('listPresets', async ({ payload }) => {
  const { projectKey = '' } = payload || {};
  const list = (await storage.get(PRESETS_KEY)) || [];
  return list.filter(p => (projectKey ? p.projectKey === projectKey : true));
});
resolver.define('deletePreset', async ({ context, payload }) => {
  const { name, projectKey = '' } = payload || {};
  const list = (await storage.get(PRESETS_KEY)) || [];
  await storage.set(PRESETS_KEY, list.filter(p => !(p.name === name && (p.projectKey||'') === projectKey)));
  await appendAudit({ type: 'preset:delete', details: { name, projectKey }, user: context?.accountId });
  return true;
});

resolver.define('logEvent', async ({ payload, context }) => {
  const user = context?.accountId || 'unknown';
  return appendAudit({ user, ...payload });
});
resolver.define('getAudit', async () => (await storage.get('audit-log')) || []);
resolver.define('clearAudit', async ({ context }) => {
  const cfg = await getConfig();
  if (!isAdmin(context?.accountId, cfg)) throw new Error('Only admins can clear audit');
  await storage.set('audit-log', []);
  return true;
});

resolver.define('saveSecret', async ({ context, payload }) => {
  const cfg = await getConfig();
  if (!isAdmin(context?.accountId, cfg)) throw new Error('Only admins can save secrets');
  if (!payload?.key) throw new Error('Missing key');
  await storage.setSecret(`secret:${payload.key}`, payload.value ?? '');
  await appendAudit({ type: 'secret:set', details: { key: payload.key }, user: context?.accountId });
  return true;
});
resolver.define('readSecret', async ({ payload }) => {
  const value = await storage.getSecret(`secret:${payload?.key}`);
  return value ? '••••••' : '';
});

resolver.define('fetchJiraAudit', async ({ payload }) => {
  const { filter = '', from = '', to = '' } = payload || {};
  const qs = new URLSearchParams();
  if (filter) qs.set('filter', filter);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await api.asUser().requestJira(route`/rest/api/3/auditing/record?${qs.toString()}`);
  if (!res.ok) return { ok: false, status: res.status, error: await res.text() };
  return { ok: true, data: await res.json() };
});
// Enhanced JQL search (POST /rest/api/3/search/jql)
resolver.define('searchJql', async ({ payload }) => {
  const jql = payload?.jql || '';
  const maxResults = Math.min(Math.max(Number(payload?.maxResults) || 50, 1), 100);
  const body = {
    jql,
    startAt: 0,
    maxResults,
    fields: ['key','summary','status','assignee','updated']
  };
  const res = await api.asUser().requestJira(
    route`/rest/api/3/search/jql`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
});

export const workflowPostFunction = async (event = {}) => {
  await appendAudit({
    type: 'workflow:postFunction',
    details: { module: 'jira:workflowPostFunction' },
    user: event?.context?.accountId
  });
  return { ok: true };
};

export const jqlFunction = async (event = {}) => {
  const args = event?.arguments || [];
  const raw = String(args[0] ?? '').trim();
  const escaped = raw.replace(/"/g, '\\"');
  const clause = raw ? `text ~ "${escaped}"` : 'order by updated DESC';
  return { jql: clause };
};

export const handler = resolver.getDefinitions();
