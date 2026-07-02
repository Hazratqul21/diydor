import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { captureRef } from './lib/auth';
import './index.css';

// Referal kodi (?ref=...) ni router query'ni o'chirmasidan oldin saqlaymiz
captureRef();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
