import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'
import { MantineProvider } from '@mantine/core';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS>
      <App />
    </MantineProvider>
  </React.StrictMode>
)
