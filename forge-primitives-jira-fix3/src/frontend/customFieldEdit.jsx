import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Box, Button, Form, Heading, Stack, Textfield } from '@forge/react';
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

  const onSubmit = async () => {
    await view.submit(value);
  };

  return (
    <Box>
      <Stack space="space.200">
        <Heading as="h4">Edit Forge Primitives Field</Heading>
        <Form onSubmit={onSubmit}>
          <Stack space="space.150">
            <Textfield label="Value" value={value} onChange={(e) => setValue(e.target.value)} />
            <Button appearance="primary" type="submit">Save</Button>
          </Stack>
        </Form>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
