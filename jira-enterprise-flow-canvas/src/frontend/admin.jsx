import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box,
  Button,
  Heading,
  Inline,
  Label,
  SectionMessage,
  Stack,
  Text,
  Textfield
} from '@forge/react';
import { invoke } from '@forge/bridge';

function AdminApp() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamField, setTeamField] = useState('');
  const [pointsField, setPointsField] = useState('');
  const [ttl, setTtl] = useState('900');
  const [maxIssues, setMaxIssues] = useState('2000');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const cfg = await invoke('getAdminConfig');
      setIsAdmin(!!cfg?.isAdmin);
      setTeamField(cfg?.fieldMapping?.team || '');
      setPointsField(cfg?.fieldMapping?.points || '');
      setTtl(String(cfg?.cacheTtlSeconds || 900));
      setMaxIssues(String(cfg?.maxIssuesPerQuery || 2000));
      setLoading(false);
    })();
  }, []);

  async function save() {
    setMessage('');
    try {
      await invoke('saveAdminConfig', {
        fieldMapping: { team: teamField, points: pointsField },
        cacheTtlSeconds: Number(ttl),
        maxIssuesPerQuery: Number(maxIssues)
      });
      setMessage('Saved.');
    } catch (error) {
      setMessage(`Save failed: ${error.message}`);
    }
  }

  if (loading) return <Text>Loading...</Text>;
  if (!isAdmin) {
    return (
      <SectionMessage title="Insufficient permissions">
        <Text>Only configured app admins can update Flow Canvas settings.</Text>
      </SectionMessage>
    );
  }

  return (
    <Box>
      <Heading as="h4">Enterprise Flow Canvas Admin</Heading>
      <Stack space="space.200">
        <Label labelFor="teamField">Team field id (optional custom field id)</Label>
        <Textfield id="teamField" value={teamField} onChange={(e) => setTeamField(e.target.value)} />

        <Label labelFor="pointsField">Story points field id (optional)</Label>
        <Textfield id="pointsField" value={pointsField} onChange={(e) => setPointsField(e.target.value)} />

        <Label labelFor="ttl">Cache TTL seconds (60-3600)</Label>
        <Textfield id="ttl" value={ttl} onChange={(e) => setTtl(e.target.value)} />

        <Label labelFor="maxIssues">Max issues per query (100-5000)</Label>
        <Textfield id="maxIssues" value={maxIssues} onChange={(e) => setMaxIssues(e.target.value)} />

        <Inline space="space.100">
          <Button appearance="primary" onClick={save}>Save config</Button>
          {message ? <Text>{message}</Text> : null}
        </Inline>
      </Stack>
    </Box>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
