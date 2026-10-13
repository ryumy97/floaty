import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@floaty/demo-app';
import '@floaty/demo-app/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
