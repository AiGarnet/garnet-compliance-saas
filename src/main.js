import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import icon using the proper unplugin-icons format
// Using an iconify icon instead of a direct SVG import to avoid the unplugin-icons SVG loader issue
import { Icon } from '@iconify/react';

// Initialize app
ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(App, null)
  )
); 