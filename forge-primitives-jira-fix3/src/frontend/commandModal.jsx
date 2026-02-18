import React from 'react';
import ForgeReconciler, { Box, Heading, Stack, Text } from '@forge/react';

const App = () => (
  <Box>
    <Stack space="space.200">
      <Heading as="h4">Forge Primitives Command</Heading>
      <Text>This modal is a minimal reference implementation for the Jira command palette module.</Text>
      <Text size="small">Source: src/frontend/commandModal.jsx</Text>
    </Stack>
  </Box>
);

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
