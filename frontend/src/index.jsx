import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import App from './App.jsx';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider>
        <ModalsProvider>
          <Notifications position="top-right" />
          <App />
        </ModalsProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
);
