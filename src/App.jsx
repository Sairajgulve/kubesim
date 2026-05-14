import React, { useEffect, useState } from 'react'
import AnimatedTerminal from './components/AnimatedTerminal'
import Documentation from './components/Documentation'
import Analytics from './components/Analytics'
import { motion } from 'framer-motion'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'

const ANALYTICS_PASS = 'Kubesim@09'

function PlaygroundPage() {
  return (
    <div className="app-body">
      <motion.main 
        className="main-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <AnimatedTerminal />
      </motion.main>
    </div>
  )
}

function DocsPage({ onExecuteCommand }) {
  return (
    <motion.div 
      className="docs-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Documentation onExecuteCommand={onExecuteCommand} />
    </motion.div>
  )
}

function AnalyticsPage() {
  return (
    <div className="analytics-container">
      <Analytics />
    </div>
  )
}

function AnalyticsGate({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = event => {
    event.preventDefault()

    if (password === ANALYTICS_PASS) {
      setError('')
      onUnlock()
      return
    }

    setError('Incorrect password')
  }

  return (
    <div className="analytics-container">
      <motion.div
        className="analytics-gate"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="analytics-panel-title">Private analytics</div>
        <p className="analytics-gate-text">Enter the password to view the analytics route.</p>
        <form className="analytics-gate-form" onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Enter password"
            className="analytics-gate-input"
          />
          <button className="btn analytics-gate-button" type="submit">
            Unlock
          </button>
        </form>
        {error && <div className="analytics-gate-error">{error}</div>}
      </motion.div>
    </div>
  )
}

function AppShell() {
  const [theme, setTheme] = useState(() => localStorage.getItem('kubesim_theme') || 'dark')
  const [analyticsUnlocked, setAnalyticsUnlocked] = useState(() => sessionStorage.getItem('kubesim_analytics_unlocked') === 'true')
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.remove('light','dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('kubesim_theme', theme)
  }, [theme])

  const handleExecuteCommand = cmd => {
    navigate('/')
    setTimeout(() => {
      const event = new CustomEvent('executeCommand', { detail: { command: cmd } })
      window.dispatchEvent(event)
    }, 100)
  }

  return (
    <div className="app-root">
      <motion.header className="app-header" initial={{ y: -24, opacity: 0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.4 }}>
        <div className="header-container">
          <motion.div 
            className="header-brand"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="brand-lockup">
              <img className="brand-logo" src="/logo.svg" alt="KubeSim logo" />
              <div className="brand-copy">
                <h1 className="app-title">KubeSim</h1>
                <p className="app-subtitle">Learn Kubernetes interactively</p>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="header-controls"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NavLink className={({ isActive }) => `btn tab-btn ${isActive ? 'active' : ''}`} to="/">
              Playground
            </NavLink>
            <NavLink className={({ isActive }) => `btn tab-btn ${isActive ? 'active' : ''}`} to="/docs">
              Docs
            </NavLink>
            {analyticsUnlocked && (
              <NavLink className={({ isActive }) => `btn tab-btn ${isActive ? 'active' : ''}`} to="/analytics">
                Analytics
              </NavLink>
            )}
            <div className="theme-divider"></div>
            <motion.button 
              className="btn theme-btn" 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </motion.button>
          </motion.div>
        </div>
      </motion.header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<PlaygroundPage />} />
          <Route path="/docs" element={<DocsPage onExecuteCommand={handleExecuteCommand} />} />
          <Route
            path="/analytics"
            element={analyticsUnlocked ? <AnalyticsPage /> : <AnalyticsGate onUnlock={() => {
              sessionStorage.setItem('kubesim_analytics_unlocked', 'true')
              setAnalyticsUnlocked(true)
            }} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <motion.footer className="app-footer" initial={{ y: 24, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.4 }}>
        <div className="footer-content">
          <span>KubeSim</span>
          <span>•</span>
          <span>Learn Kubernetes interactively with visual feedback</span>
        </div>
      </motion.footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
