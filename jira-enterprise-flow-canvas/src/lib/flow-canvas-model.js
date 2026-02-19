function statusToLane(statusName, statusGroups) {
  const name = statusName || 'Unknown';
  const groups = statusGroups || {};
  if ((groups.done || []).includes(name)) return 'done';
  if ((groups.inProgress || []).includes(name)) return 'inProgress';
  if ((groups.backlog || []).includes(name)) return 'backlog';
  return 'other';
}

function deterministicJitter(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 1000) / 1000) - 0.5;
}

function buildFlowWorkItems(issues, statusGroups) {
  const now = Date.now();
  return issues.map((issue) => {
    const createdMs = Date.parse(issue?.fields?.created || '') || now;
    const ageDays = Math.max(0, (now - createdMs) / (1000 * 60 * 60 * 24));
    const status = issue?.fields?.status?.name || 'Unknown';
    return {
      key: issue.key,
      summary: issue?.fields?.summary || '',
      status,
      priority: issue?.fields?.priority?.name || '',
      ageDays,
      lane: statusToLane(status, statusGroups)
    };
  });
}

function buildFlowCanvasDataset(workItems) {
  const maxAge = Math.max(1, ...workItems.map((w) => w.ageDays));
  const laneY = {
    backlog: 0.2,
    inProgress: 0.45,
    done: 0.7,
    other: 0.9
  };
  const laneCounts = {
    backlog: 0,
    inProgress: 0,
    done: 0,
    other: 0
  };
  const points = workItems.map((w) => {
    laneCounts[w.lane] = (laneCounts[w.lane] || 0) + 1;
    const jitter = deterministicJitter(`${w.key}:${w.lane}`) * 0.08;
    return {
      x: Math.min(1, w.ageDays / maxAge),
      y: Math.max(0.05, Math.min(0.95, (laneY[w.lane] || laneY.other) + jitter)),
      lane: w.lane,
      issueKey: w.key,
      summary: w.summary,
      status: w.status,
      priority: w.priority,
      ageDays: w.ageDays
    };
  });

  return {
    points,
    laneCounts,
    maxAgeDays: maxAge
  };
}

function buildLaneFilterJql(baseJql, lane, statusGroups) {
  const statuses = statusGroups?.[lane] || [];
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return baseJql;
  }
  const clause = `status in (${statuses.map((s) => `"${String(s).replaceAll('"', '\\"')}"`).join(', ')})`;
  return `(${baseJql}) AND (${clause})`;
}

export {
  buildFlowCanvasDataset,
  buildFlowWorkItems,
  buildLaneFilterJql
};
