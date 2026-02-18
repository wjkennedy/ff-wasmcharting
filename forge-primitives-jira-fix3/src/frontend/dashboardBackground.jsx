import React from 'react';
import ForgeReconciler, { Text } from '@forge/react';

const App = () => (
  <Text size="small">Dashboard background script loaded.</Text>
);

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
