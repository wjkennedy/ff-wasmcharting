import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Box, Button, Form, Heading, Stack, Textfield } from '@forge/react';
import { view } from '@forge/bridge';

const App = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const ctx = await view.getContext();
      const existing = ctx?.extension?.gadgetConfiguration?.message || '';
      setMessage(existing);
    })();
  }, []);

  const onSubmit = async () => {
    await view.submit({ message });
  };

  return (
    <Box>
      <Stack space="space.200">
        <Heading as="h4">Edit Gadget</Heading>
        <Form onSubmit={onSubmit}>
          <Stack space="space.150">
            <Textfield label="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
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
