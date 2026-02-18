import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Button, DynamicTable, Heading, Inline, Label, Stack, Text, Textfield, SectionMessage, Toggle
} from '@forge/react';
import { invoke } from '@forge/bridge';

const Gate = ({ children }) => {
  const [allowed, setAllowed] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({});

  useEffect(() => {
    (async () => {
      const access = await invoke('getAccess');
      setAllowed(access?.isAllowed);
      setIsAdmin(access?.isAdmin);
      setFeatureFlags(access?.featureFlags || {});
    })();
  }, []);

  if (allowed === null) return <Text>Loading…</Text>;
  if (!allowed) return <Text tone="danger">You are not allowed to use this app.</Text>;
  return children({ isAdmin, featureFlags, setFeatureFlags });
};

const RBAC = ({ isAdmin, featureFlags, setFeatureFlags }) => {
  const [added, setAdded] = useState(false);
  const addMe = async () => {
    await invoke('addAdmin');
    setAdded(true);
  };
  const setFlag = async (key, value) => {
    const flags = await invoke('setFeatureFlag', { key, value });
    setFeatureFlags(flags);
  };
  return (
    <Stack space="space.150">
      <Heading as="h5">Access Control</Heading>
      {!isAdmin && (
        <Inline space="space.100">
          <Button appearance="primary" onClick={addMe}>Add me as admin</Button>
          {added && <Text>Added. Reopen the page to refresh privileges.</Text>}
        </Inline>
      )}
      {isAdmin && (
        <Stack space="space.100">
          <Text>Feature flags</Text>
          <Inline space="space.150">
            <Toggle isChecked={!!featureFlags.csvExport} onChange={(e)=>setFlag('csvExport', e.target.checked)}>CSV export</Toggle>
            <Toggle isChecked={!!featureFlags.presets} onChange={(e)=>setFlag('presets', e.target.checked)}>Presets</Toggle>
            <Toggle isChecked={!!featureFlags.jiraAudit} onChange={(e)=>setFlag('jiraAudit', e.target.checked)}>Jira audit reader</Toggle>
          </Inline>
        </Stack>
      )}
    </Stack>
  );
};

const Secrets = ({ isAdmin }) => {
  const [key, setKey] = useState('openai-api-key');
  const [value, setValue] = useState('');
  const [savedMask, setSavedMask] = useState('');
  const save = async () => {
    await invoke('saveSecret', { key, value });
    setValue('');
    const mask = await invoke('readSecret', { key });
    setSavedMask(mask);
  };
  useEffect(() => { (async () => setSavedMask(await invoke('readSecret', { key })))(); }, [key]);
  if (!isAdmin) return <Text>Ask an admin to grant you admin rights to manage secrets.</Text>;
  return (
    <Stack space="space.150">
      <Heading as="h5">Secrets</Heading>
      <Label labelFor="secret-key">Key</Label>
      <Textfield id="secret-key" value={key} onChange={(e) => setKey(e.target.value)} />
      <Label labelFor="secret-value">Value</Label>
      <Textfield id="secret-value" value={value} onChange={(e) => setValue(e.target.value)} />
      <Inline space="space.100">
        <Button appearance="primary" onClick={save}>Save secret</Button>
        {savedMask && <Text>Saved: {savedMask}</Text>}
      </Inline>
    </Stack>
  );
};

const AuditViewer = ({ isAdmin }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [jiraAuditCount, setJiraAuditCount] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await invoke('getAudit');
    setRows((data || []).map((e, idx) => ({
      key: String(idx),
      cells: [
        { content: e.ts },
        { content: e.type },
        { content: JSON.stringify(e.details || {}) },
        { content: e.user || '' },
      ],
    })));
    setLoading(false);
  };

  const tryFetchJiraAudit = async () => {
    const res = await invoke('fetchJiraAudit', { filter });
    if (res?.ok) setJiraAuditCount(res.data?.total ?? 0);
    else setJiraAuditCount(`Error: ${res?.status || res?.error}`);
  };

  useEffect(() => { load(); }, []);

  return (
    <Stack space="space.150">
      <Heading as="h5">App Audit Trail</Heading>
      <Inline space="space.100">
        <Button onClick={load} isDisabled={loading}>Refresh</Button>
        {isAdmin && <Button appearance="warning" onClick={async ()=>{ await invoke('clearAudit'); await load(); }}>Clear</Button>}
      </Inline>
      <DynamicTable
        head={{ cells: [
          { content: 'Timestamp' },
          { content: 'Type' },
          { content: 'Details' },
          { content: 'User' },
        ]}}
        rows={rows}
        rowsPerPage={10}
        defaultPage={1}
        isFixedSize
      />
      <SectionMessage title="Jira Audit (read-only)">
        <Stack space="space.100">
          <Text>This utility tries to read site audit records (requires Administer Jira permission).</Text>
          <Label labelFor="filter">Filter</Label>
          <Textfield id="filter" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <Inline space="space.100">
            <Button onClick={tryFetchJiraAudit}>Fetch count</Button>
            {jiraAuditCount !== null && <Text>Count: {String(jiraAuditCount)}</Text>}
          </Inline>
        </Stack>
      </SectionMessage>
    </Stack>
  );
};

const AdminApp = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { (async () => {
    const access = await invoke('getAccess');
    setIsAdmin(access?.isAdmin);
    await invoke('logEvent', { type: 'view', details: { view: 'admin' } });
  })(); }, []);

  return (
    <Gate>
      {({ isAdmin, featureFlags, setFeatureFlags }) => (
        <Box>
          <Heading as="h4">Forge Primitives Demo — Admin</Heading>
          <Stack space="space.300">
            <RBAC isAdmin={isAdmin} featureFlags={featureFlags} setFeatureFlags={setFeatureFlags} />
            <Secrets isAdmin={isAdmin} />
            <AuditViewer isAdmin={isAdmin} />
          </Stack>
        </Box>
      )}
    </Gate>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
