function compactErrorBody(raw) {
  return String(raw || '')
    .replaceAll('\n', ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 300);
}

function splitOrderBy(jql) {
  const text = (jql || '').trim();
  if (!text) {
    return { where: '', orderBy: '' };
  }
  const match = text.match(/\border\s+by\b/i);
  if (!match || match.index === undefined) {
    return { where: text, orderBy: '' };
  }
  const idx = match.index;
  return {
    where: text.slice(0, idx).trim(),
    orderBy: text.slice(idx).trim()
  };
}

function composeScopedJql(inputJql, projectKey, daysBack = 90) {
  const { where, orderBy } = splitOrderBy(inputJql);
  const clauses = [];
  if (projectKey) {
    clauses.push(`project = "${projectKey}"`);
  }
  if (where) {
    clauses.push(`(${where})`);
  }
  clauses.push(`updated >= -${daysBack}d`);
  const scoped = clauses.join(' AND ');
  return `${scoped} ${orderBy || 'ORDER BY updated DESC'}`.trim();
}

async function executePaginatedSearch(api, route, jql, maxIssues) {
  const fields = ['summary', 'status', 'priority', 'created', 'updated', 'issuetype'];
  const pageSizeMax = 100;
  let nextPageToken = '';
  let total = null;
  const issues = [];

  while (issues.length < maxIssues) {
    const pageSize = Math.min(pageSizeMax, maxIssues - issues.length);
    const response = nextPageToken
      ? await api.asUser().requestJira(
          route`/rest/api/3/search/jql?jql=${jql}&maxResults=${pageSize}&fields=${fields.join(',')}&nextPageToken=${nextPageToken}`,
          { method: 'GET' }
        )
      : await api.asUser().requestJira(
          route`/rest/api/3/search/jql?jql=${jql}&maxResults=${pageSize}&fields=${fields.join(',')}`,
          { method: 'GET' }
        );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Jira search failed (${response.status}): ${compactErrorBody(errorBody)}`);
    }

    const payload = await response.json();
    const batch = payload?.issues || [];
    issues.push(...batch);
    if (typeof payload?.total === 'number') {
      total = payload.total;
    }

    nextPageToken = payload?.nextPageToken || '';
    if (!nextPageToken || payload?.isLast === true || batch.length === 0) {
      break;
    }
  }

  return { issues, total };
}

async function fetchWorkItemsAsUser({
  api,
  route,
  jql,
  maxIssues,
  projectKey,
  daysBack = 90
}) {
  const scoped = composeScopedJql(jql, projectKey, daysBack);
  try {
    const result = await executePaginatedSearch(api, route, scoped, maxIssues);
    return { ...result, appliedJql: scoped };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Unbounded JQL queries are not allowed/i.test(message)) {
      throw error;
    }
    const fallback = composeScopedJql('', projectKey, daysBack);
    const result = await executePaginatedSearch(api, route, fallback, maxIssues);
    return { ...result, appliedJql: fallback };
  }
}

export {
  composeScopedJql,
  fetchWorkItemsAsUser,
  splitOrderBy
};
