import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ScanProvider } from './context/scan';
import { ThemeProvider } from './context/theme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ScanProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ScanProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
