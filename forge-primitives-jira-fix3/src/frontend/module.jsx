import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box,
  Code,
  Heading,
  SectionMessage,
  Stack,
  Text
} from '@forge/react';
import { view } from '@forge/bridge';

const App = () => {
  const [context, setContext] = useState(null);

  useEffect(() => {
    (async () => {
      const ctx = await view.getContext();
      setContext(ctx || {});
    })();
  }, []);

  const ext = context?.extension || {};

  return (
    <Box>
      <Stack space="space.200">
        <Heading as="h4">Forge Module Reference</Heading>
        <Text>This is a minimal reference implementation for the current Jira module.</Text>
        <SectionMessage title="Context snapshot">
          <Stack space="space.100">
            <Text>Module type: <Code>{String(ext?.type || 'unknown')}</Code></Text>
            <Text>Module key: <Code>{String(context?.moduleKey || 'unknown')}</Code></Text>
            {ext?.action && <Text>Action: <Code>{String(ext.action)}</Code></Text>}
            {ext?.entryPoint && <Text>Entry point: <Code>{String(ext.entryPoint)}</Code></Text>}
          </Stack>
        </SectionMessage>
        <Text size="small">Source: src/frontend/module.jsx</Text>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
