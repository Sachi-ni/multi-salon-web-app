// Import polyfills FIRST (side-effect import) so they execute before any other
// module that depends on them.
import './polyfills';

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
