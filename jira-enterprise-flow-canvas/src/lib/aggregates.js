export function pickStatusGroup(statusName, statusGroups) {
  const name = statusName || 'Unknown';
  const groups = statusGroups || {};
  if ((groups.done || []).includes(name)) return 'done';
  if ((groups.inProgress || []).includes(name)) return 'inProgress';
  if ((groups.backlog || []).includes(name)) return 'backlog';
  return 'other';
}

export function buildFlowAggregate(issues, statusGroups) {
  const buckets = {
    backlog: 0,
    inProgress: 0,
    done: 0,
    other: 0
  };
  for (const issue of issues) {
    const statusName = issue?.fields?.status?.name || 'Unknown';
    const group = pickStatusGroup(statusName, statusGroups);
    buckets[group] += 1;
  }
  return {
    type: 'flow',
    totalIssues: issues.length,
    buckets
  };
}

export function buildDistributionAggregate(issues, teamFieldId) {
  const teams = {};
  const priorities = {};
  for (const issue of issues) {
    const priority = issue?.fields?.priority?.name || 'Unspecified';
    priorities[priority] = (priorities[priority] || 0) + 1;

    const teamValue = teamFieldId ? issue?.fields?.[teamFieldId] : '';
    const teamKey = Array.isArray(teamValue)
      ? teamValue.join(', ')
      : String(teamValue || 'Unassigned');
    teams[teamKey] = (teams[teamKey] || 0) + 1;
  }
  return {
    type: 'distribution',
    totalIssues: issues.length,
    byPriority: priorities,
    byTeam: teams
  };
}

export function hashKey(raw) {
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `${Math.abs(hash)}`;
}
