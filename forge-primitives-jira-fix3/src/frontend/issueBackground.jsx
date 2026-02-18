import React from 'react';
import ForgeReconciler, { Text } from '@forge/react';

const App = () => (
  <Text size="small">Issue view background script loaded.</Text>
);

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
