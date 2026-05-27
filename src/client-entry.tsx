/**
 * Client-only entry point for Vercel SPA deployment.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import './styles.css';

const router = getRouter();

// Remove the initial loading skeleton once JS is ready
const splash = document.getElementById('splash');
if (splash) splash.remove();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
