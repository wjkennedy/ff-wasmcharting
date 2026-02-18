import React, { useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Box, Button, ButtonGroup, DynamicTable, Heading, Inline, Label,
  LinkButton, Stack, Text, Textarea, Textfield, Spinner, Lozenge, Select, Link, Code
} from '@forge/react';
import { invoke, view, router } from '@forge/bridge';

const MODULES = [
  { key: 'jira:adminPage', label: 'Jira admin page', placement: 'Admin → Apps',
    impl: 'src/frontend/admin.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/' },
  { key: 'jira:backlogAction', label: 'Jira backlog action (Preview)', placement: 'Backlog (•••) menu',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-backlog-action/' },
  { key: 'jira:boardAction', label: 'Jira board action (Preview)', placement: 'Board (•••) menu',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-board-action/' },
  { key: 'jira:command', label: 'Jira command palette', placement: 'Command palette',
    impl: 'src/frontend/commandModal.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-command/' },
  { key: 'jira:customField', label: 'Jira custom field', placement: 'Issue fields',
    impl: 'src/frontend/customFieldView.jsx, src/frontend/customFieldEdit.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-custom-field/' },
  { key: 'jira:customFieldType', label: 'Jira custom field type', placement: 'Admin → Custom fields',
    impl: 'src/frontend/customFieldView.jsx, src/frontend/customFieldEdit.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-custom-field-type/' },
  { key: 'jira:dashboardBackgroundScript', label: 'Jira dashboard background script', placement: 'Dashboards (background)',
    impl: 'src/frontend/dashboardBackground.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-dashboard-background-script/' },
  { key: 'jira:dashboardGadget', label: 'Jira dashboard gadget', placement: 'Dashboards → gadgets',
    impl: 'src/frontend/dashboardGadgetView.jsx, src/frontend/dashboardGadgetEdit.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-dashboard-gadget/' },
  { key: 'jira:entityProperty', label: 'Jira entity property', placement: 'JQL indexing',
    impl: 'manifest.yml',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-entity-property/' },
  { key: 'jira:fullPage', label: 'Jira full page (Preview)', placement: 'Full-page navigation',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-full-page/' },
  { key: 'jira:globalPage', label: 'Jira global page', placement: 'Apps → left nav',
    impl: 'src/frontend/index.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-global-page/' },
  { key: 'jira:globalPermission', label: 'Jira global permission', placement: 'Admin → global permissions',
    impl: 'manifest.yml',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-global-permission/' },
  { key: 'jira:issueAction', label: 'Jira issue action', placement: 'Issue (•••) menu',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-action/' },
  { key: 'jira:issueActivity', label: 'Jira issue activity', placement: 'Issue → Activity panel',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-activity/' },
  { key: 'jira:issueContext', label: 'Jira issue context', placement: 'Issue → right side panel',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-context/' },
  { key: 'jira:issueGlance', label: 'Jira issue glance', placement: 'Issue → right sidebar glance',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-glance/' },
  { key: 'jira:issueNavigatorAction', label: 'Jira issue navigator action (Preview)', placement: 'Issue navigator (Apps menu)',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-navigator-action/' },
  { key: 'jira:issuePanel', label: 'Jira issue panel', placement: 'Issue → panel above Activity',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/' },
  { key: 'jira:issueViewBackgroundScript', label: 'Jira issue view background script', placement: 'Issue view (background)',
    impl: 'src/frontend/issueBackground.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-view-background-script/' },
  { key: 'jira:jqlFunction', label: 'Jira JQL function', placement: 'JQL',
    impl: 'index.js (jqlFunction)',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-jql-function/' },
  { key: 'jira:personalSettingsPage', label: 'Jira personal settings page (Preview)', placement: 'Profile → settings',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-personal-settings-page/' },
  { key: 'jira:projectPage', label: 'Jira project page', placement: 'Project left nav',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-project-page/' },
  { key: 'jira:projectPermission', label: 'Jira project permission', placement: 'Project permissions',
    impl: 'manifest.yml',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-project-permission/' },
  { key: 'jira:projectSettingsPage', label: 'Jira project settings page', placement: 'Project settings sidebar',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-project-settings-page/' },
  { key: 'jira:sprintAction', label: 'Jira sprint action (Preview)', placement: 'Backlog sprint card (•••)',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-sprint-action/' },
  { key: 'jira:timeTrackingProvider', label: 'Jira time tracking provider (Preview)', placement: 'Work log experience',
    impl: 'src/frontend/module.jsx',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-time-tracking-provider/' },
  { key: 'jira:uiModifications', label: 'Jira UI modifications', placement: 'Create/Transition/Issue view UIM',
    impl: 'static/ui-modifications/index.html',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-ui-modifications/' },
  { key: 'jira:workflowValidator', label: 'Jira workflow validator (Preview)', placement: 'Workflow transition validator',
    impl: 'manifest.yml',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-workflow-validator/' },
  { key: 'jira:workflowCondition', label: 'Jira workflow condition (Preview)', placement: 'Workflow transition condition',
    impl: 'manifest.yml',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-workflow-condition/' },
  { key: 'jira:workflowPostFunction', label: 'Jira workflow post function (Preview)', placement: 'Post-transition actions',
    impl: 'index.js (workflowPostFunction)',
    doc: 'https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-workflow-post-function/' }
];

function extractProjectKey(jql) {
  const m = /project\s*=\s*([A-Z0-9_]+)/i.exec(jql);
  if (m) return m[1].toUpperCase();
  return '';
}

const Sidebar = ({ current, onNav }) => (
  <Box xcss={{ width: '280px' }}>
    <Stack space="space.200">
      <Heading as="h3">Forge Primitives</Heading>
      <ButtonGroup>
        <LinkButton isDisabled={current==='search'} onClick={() => onNav('search')}>JQL Search</LinkButton>
        <LinkButton isDisabled={current==='extensions'} onClick={() => onNav('extensions')}>Extension Points</LinkButton>
        <LinkButton isDisabled={current==='about'} onClick={() => onNav('about')}>About</LinkButton>
        <LinkButton onClick={() => router.navigate({ target: 'module', moduleKey: 'primitives-demo-admin' })}>Admin page</LinkButton>
      </ButtonGroup>
      <Text size="small">UI Kit latest demo</Text>
    </Stack>
  </Box>
);

const JqlSearch = ({ featureFlags }) => {
  const [jql, setJql] = useState('project = DEMO ORDER BY updated DESC');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('My preset');
  const projectKey = React.useMemo(() => extractProjectKey(jql), [jql]);

  const refreshPresets = async () => {
    if (!featureFlags.presets) return;
    const list = await invoke('listPresets', { projectKey });
    setPresets(list || []);
  };

  useEffect(() => { refreshPresets(); /* eslint-disable-next-line */ }, [projectKey]);

  const search = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await invoke('searchJql', { jql, maxResults: 50 });
      if (!res?.ok) throw new Error(`Jira search failed: ${res?.status}`);
      const data = res.data || {};
      const tableRows = (data.issues || []).map((i) => ({
        key: i.id,
        cells: [
          { content: i.key },
          { content: i.fields?.summary || '' },
          { content: <Lozenge>{i.fields?.status?.name || ''}</Lozenge> },
          { content: i.fields?.assignee?.displayName || '' },
          { content: new Date(i.fields?.updated).toLocaleString() },
        ]
      }));
      setRows(tableRows);
      setIssues(data.issues || []);
      await invoke('logEvent', { type: 'search', details: { jql, results: data.total ?? tableRows.length } });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const savePreset = async () => {
    await invoke('savePreset', { name: presetName, jql, projectKey });
    await refreshPresets();
  };

  const loadPreset = async (name) => {
    const p = presets.find(x => x.name === name);
    if (p) setJql(p.jql);
  };

  const deletePreset = async (name) => {
    await invoke('deletePreset', { name, projectKey });
    await refreshPresets();
  };

  const exportCsv = async () => {
    if (!featureFlags.csvExport) return;
    const cols = ['Key','Summary','Status','Assignee','Updated'];
    const lines = [cols.join(',')];
    for (const i of issues) {
      const row = [
        i.key,
        (i.fields?.summary || '').replace(/"/g,'""'),
        (i.fields?.status?.name || ''),
        (i.fields?.assignee?.displayName || ''),
        new Date(i.fields?.updated).toISOString(),
      ];
      lines.push(row.map(v => `"${String(v)}"`).join(','));
    }
    const csv = lines.join('\n');
    try { await navigator.clipboard.writeText(csv); } catch {}
    const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    window.open(url, '_blank');
    await invoke('logEvent', { type: 'export:csv', details: { count: issues.length } });
  };

  return (
    <Stack space="space.200">
      <Heading as="h4">JQL Search</Heading>
      <Label labelFor="jql">JQL</Label>
      <Textfield id="jql" name="jql" value={jql} onChange={(e) => setJql(e.target.value)} />
      <Inline space="space.100">
        <Button appearance="primary" onClick={search} isDisabled={loading}>Search</Button>
        {featureFlags.presets && (
          <>
            <Text>Presets{projectKey ? ` for ${projectKey}` : ''}:</Text>
            <Select name="preset" placeholder={presets.length ? 'Choose preset' : 'No presets yet'} options={presets.map(p => ({ label: p.name, value: p.name }))} onChange={(val) => val && loadPreset(val.value)} />
            <Textfield width="160px" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
            <Button onClick={savePreset}>Save preset</Button>
            {presets.length > 0 && <Button onClick={() => deletePreset(presets[0].name)}>Delete first preset</Button>}
          </>
        )}
        {featureFlags.csvExport && <Button onClick={exportCsv}>Export CSV</Button>}
        {loading && <Spinner />}
      </Inline>
      {error && <Text tone="danger">{error}</Text>}
      <DynamicTable
        head={{ cells: [
          { content: 'Key' },
          { content: 'Summary' },
          { content: 'Status' },
          { content: 'Assignee' },
          { content: 'Updated' },
        ]}}
        rows={rows}
        rowsPerPage={10}
        defaultPage={1}
        isFixedSize
      />
    </Stack>
  );
};

const ExtensionPoints = () => {
  const rows = MODULES.map((m, idx) => ({
    key: String(idx),
    cells: [
      { content: <Code>{m.key}</Code> },
      { content: m.label },
      { content: m.placement },
      { content: <Code>{m.impl}</Code> },
      { content: <Link href={m.doc} openNewTab>Docs</Link> },
    ]
  }));
  return (
    <Stack space="space.200">
      <Heading as="h4">Forge Extension Points — Jira</Heading>
      <Text size="small">A catalog of Forge Jira modules with minimal reference implementations in this repo.</Text>
      <DynamicTable
        head={{ cells: [
          { content: 'Module key' },
          { content: 'Label' },
          { content: 'Placement' },
          { content: 'Reference implementation' },
          { content: 'Reference' },
        ]}}
        rows={rows}
        rowsPerPage={10}
        defaultPage={1}
        isFixedSize
      />
    </Stack>
  );
};

const About = () => (
  <Stack space="space.200">
    <Heading as="h4">About</Heading>
    <Text>UI Kit latest demo with primitives: sidebar, JQL, presets, CSV export, RBAC, and audit.</Text>
  </Stack>
);

const App = () => {
  const [viewKey, setViewKey] = useState('search');
  const [featureFlags, setFeatureFlags] = useState({ csvExport: true, jiraAudit: true, presets: true });

  useEffect(() => {
    (async () => {
      const ctx = await view.getContext();
      const access = await invoke('getAccess');
      setFeatureFlags(access?.featureFlags || {});
      await invoke('logEvent', { type: 'view', details: { moduleKey: ctx?.moduleKey, view: 'home' } });
    })();
  }, []);

  return (
    <Inline space="space.300" alignInline="start">
      <Box xcss={{ width: '280px' }}>
        <Stack space="space.200">
          <Heading as="h3">Forge Primitives</Heading>
          <ButtonGroup>
            <LinkButton isDisabled={viewKey==='search'} onClick={() => setViewKey('search')}>JQL Search</LinkButton>
            <LinkButton isDisabled={viewKey==='extensions'} onClick={() => setViewKey('extensions')}>Extension Points</LinkButton>
            <LinkButton onClick={() => router.navigate({ target: 'module', moduleKey: 'primitives-jql-editor' })}>JQL Editor (Custom UI)</LinkButton>
            <LinkButton isDisabled={viewKey==='about'} onClick={() => setViewKey('about')}>About</LinkButton>
            <LinkButton onClick={() => router.navigate({ target: 'module', moduleKey: 'primitives-demo-admin' })}>Admin page</LinkButton>
          </ButtonGroup>
          <Text size="small">UI Kit latest demo</Text>
        </Stack>
      </Box>
      <Box grow="1">
        {viewKey === 'search' && <JqlSearch featureFlags={featureFlags} />}
        {viewKey === 'extensions' && <ExtensionPoints />}
        {viewKey === 'about' && <About />}
      </Box>
    </Inline>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
