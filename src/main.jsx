import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const BASE_URL = import.meta.env.BASE_URL;

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main className="fallback"><h1>Roblox External</h1><p>The animated preview could not load. The release files are still available.</p><a href={`${BASE_URL}downloads/RobloxExternal-v11.exe`} download>Download v11</a><a href={`${BASE_URL}downloads/RobloxExternal-v11-source.zip`} download>Download source</a></main> : this.props.children;
  }
}

createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
