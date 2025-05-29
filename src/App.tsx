import { useState } from 'react'
import './App.css'
import { formatDate } from './utils/date-utils'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const today = formatDate(new Date())

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Garnet AI</h1>
        <nav className="main-nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'data' ? 'active' : ''}
            onClick={() => setActiveTab('data')}
          >
            Data Importer
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="app-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Dashboard</h2>
            <p className="text-sm text-gray-500">Today: {today}</p>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Data Overview</h3>
                <p>Total records: 0</p>
                <p>Last import: N/A</p>
              </div>
              <div className="dashboard-card">
                <h3>Recent Activity</h3>
                <p>No recent activity</p>
              </div>
              <div className="dashboard-card">
                <h3>Quick Actions</h3>
                <button className="action-button">Import Data</button>
                <button className="action-button">Export Report</button>
                <a 
                  href="/dashboard" 
                  className="action-button"
                  style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}
                >
                  Advanced Dashboard
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-importer">
            <h2>Data Importer</h2>
            <p>Upload your data files here for processing.</p>
            <button className="upload-button">Upload Files</button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings">
            <h2>Settings</h2>
            <p>Configure your application settings.</p>
            <form className="settings-form">
              <div className="form-group">
                <label>API Endpoint</label>
                <input type="text" placeholder="https://api.example.com" />
              </div>
              <button type="submit">Save Settings</button>
            </form>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2023 Garnet AI. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App 