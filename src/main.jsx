import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n/index.js';
import './styles/tokens.css';
import './styles/base.css';
import './app/app.css';
import './sim/sim.css';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import App from './app/App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
