import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Box, Heading, Stack, Text } from '@forge/react';
import { view } from '@forge/bridge';

const App = () => {
  const [value, setValue] = useState('');

  useEffect(() => {
    (async () => {
      const ctx = await view.getContext();
      const fieldValue = ctx?.extension?.fieldValue;
      setValue(fieldValue ?? '');
    })();
  }, []);

  return (
    <Box>
      <Stack space="space.200">
        <Heading as="h4">Forge Primitives Custom Field</Heading>
        <Text>Value: {value ? String(value) : 'Not set'}</Text>
        <Text size="small">Source: src/frontend/customFieldView.jsx</Text>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
