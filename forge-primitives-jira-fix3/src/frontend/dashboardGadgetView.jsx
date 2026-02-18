import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Box, Heading, Stack, Text } from '@forge/react';
import { view } from '@forge/bridge';

const App = () => {
  const [config, setConfig] = useState({});

  useEffect(() => {
    (async () => {
      const ctx = await view.getContext();
      setConfig(ctx?.extension?.gadgetConfiguration || {});
    })();
  }, []);

  return (
    <Box>
      <Stack space="space.200">
        <Heading as="h4">Forge Primitives Dashboard Gadget</Heading>
        <Text>Message: {config.message || 'Not set'}</Text>
        <Text size="small">Source: src/frontend/dashboardGadgetView.jsx</Text>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
