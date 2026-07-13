import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ErrorBoundary } from 'shared-ui';
import 'shared-ui/style.css';
import './print.css';

import { MLBlocksProvider } from 'mlblocks';
import 'mlblocks/style.css';

// Side-effect: register this app's tensor vocabulary with mlblocks' registry.
import './training/params';

import App from './App';
import { StepKeyProvider } from './stepKey';
import { PinnedPanelsProvider } from 'mlblocks';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* MLBlocksProvider = the web renderer's primitives + ViewSettings
          (which mounts antd's ConfigProvider), replacing the app-side
          ViewSettingsProvider it grew out of. */}
      <MLBlocksProvider>
        <ErrorBoundary>
          <StepKeyProvider>
            <PinnedPanelsProvider>
              <App />
            </PinnedPanelsProvider>
          </StepKeyProvider>
        </ErrorBoundary>
      </MLBlocksProvider>
    </BrowserRouter>
  </React.StrictMode>
);
