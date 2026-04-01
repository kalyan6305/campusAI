import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Migrate: remove any token stored in localStorage from previous sessions.
// Now tokens live in sessionStorage and are cleared when the tab is closed.
localStorage.removeItem('access_token');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

