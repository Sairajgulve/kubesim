import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const VISITOR_STORAGE_KEY = 'kubesim_visitor_analytics'
const VISITOR_ID_KEY = 'kubesim_visitor_id'
const SESSION_KEY = 'kubesim_visitor_session'

function safeParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function formatRelativeTime(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function formatSeconds(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return `${minutes}m ${remainder}s`
}

function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—'
  return `${Math.max(0, Math.round(ms))} ms`
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function StatCard({ title, value, detail, tone = 'default' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`analytics-stat analytics-${tone}`}
    >
      <div className="analytics-stat-label">{title}</div>
      <div className="analytics-stat-value">{value}</div>
      {detail && <div className="analytics-stat-detail">{detail}</div>}
    </motion.div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="analytics-metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function Analytics() {
  const [snapshot, setSnapshot] = useState(null)
  const [visitorSnapshot, setVisitorSnapshot] = useState(null)
  const registeredVisit = useRef(false)

  useEffect(() => {
    const loadSnapshot = () => {
      const saved = safeParse(localStorage.getItem('kubesim_storage') || 'null', null)
      let visitorData = safeParse(localStorage.getItem(VISITOR_STORAGE_KEY) || 'null', null) || {}

      if (!registeredVisit.current) {
        const visitorId = localStorage.getItem(VISITOR_ID_KEY) || `visitor-${Math.random().toString(36).slice(2, 10)}`
        if (!localStorage.getItem(VISITOR_ID_KEY)) {
          localStorage.setItem(VISITOR_ID_KEY, visitorId)
        }

        const now = new Date().toISOString()
        const sessionId = sessionStorage.getItem(SESSION_KEY) || `session-${Math.random().toString(36).slice(2, 10)}`
        if (!sessionStorage.getItem(SESSION_KEY)) {
          sessionStorage.setItem(SESSION_KEY, sessionId)
        }

        const sessionViews = Number(sessionStorage.getItem(`${SESSION_KEY}_views`) || '0') + 1
        sessionStorage.setItem(`${SESSION_KEY}_views`, `${sessionViews}`)

        visitorData = {
          visitorId,
          sessionId,
          firstSeenAt: visitorData.firstSeenAt || now,
          lastSeenAt: now,
          totalVisits: (visitorData.totalVisits || 0) + 1,
          totalPageViews: (visitorData.totalPageViews || 0) + 1,
          sessionViews,
          referrer: visitorData.referrer || document.referrer || 'Direct',
          path: window.location.pathname,
          language: navigator.language || 'Unknown',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
          screen: `${window.screen.width} × ${window.screen.height}`,
        }

        localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(visitorData))
        registeredVisit.current = true
      }

      const nav = performance.getEntriesByType('navigation')[0]
      const resources = performance.getEntriesByType('resource')
      const memory = performance.memory || null
      const commandLines = saved?.lines?.filter(line => line.type === 'command') || []
      const cluster = saved?.cluster || { pods: [], deployments: [], services: [], namespaces: [] }

      const commandCounts = commandLines.reduce((acc, line) => {
        const key = line.text.split(' ')[0] + (line.text.split(' ')[1] ? ` ${line.text.split(' ')[1]}` : '')
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      const topCommand = Object.entries(commandCounts).sort((a, b) => b[1] - a[1])[0]

      setSnapshot({
        nav,
        resources,
        memory,
        commandCount: commandLines.length,
        linesCount: saved?.lines?.length || 0,
        topCommand,
        cluster,
      })
      setVisitorSnapshot(visitorData)
    }

    loadSnapshot()
    const timer = window.setInterval(loadSnapshot, 3000)
    return () => window.clearInterval(timer)
  }, [])

  const perfSummary = useMemo(() => {
    if (!snapshot?.nav) return null
    const nav = snapshot.nav
    const timings = {
      load: nav.loadEventEnd - nav.startTime,
      dom: nav.domContentLoadedEventEnd - nav.startTime,
      connect: nav.connectEnd - nav.connectStart,
      ttfb: nav.responseStart - nav.requestStart,
    }
    return timings
  }, [snapshot])

  const sessionDuration = useMemo(() => {
    if (!visitorSnapshot?.firstSeenAt) return null
    return (Date.now() - new Date(visitorSnapshot.firstSeenAt).getTime()) / 1000
  }, [visitorSnapshot])

  return (
    <motion.div
      className="analytics-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="analytics-header">
        <div>
          <div className="analytics-eyebrow">Frontend analytics</div>
          <h2>Site performance and usage</h2>
          <p>
            This dashboard is computed entirely in the browser. It combines navigation performance,
            resource loading, and persisted simulator activity so you can see how the app is being used.
          </p>
        </div>
        <div className="analytics-badge">No backend required</div>
      </div>

      <div className="analytics-grid analytics-grid-top">
        <StatCard
          title="Page load"
          value={formatDuration(perfSummary?.load)}
          detail="Navigation timing total"
          tone="accent"
        />
        <StatCard
          title="DOM ready"
          value={formatDuration(perfSummary?.dom)}
          detail="DOMContentLoaded end"
        />
        <StatCard
          title="Time to first byte"
          value={formatDuration(perfSummary?.ttfb)}
          detail="Response start - request start"
        />
        <StatCard
          title="Resources"
          value={snapshot ? `${snapshot.resources.length}` : '—'}
          detail="CSS, JS, images, fonts"
        />
      </div>

      <div className="analytics-grid analytics-grid-top">
        <StatCard
          title="Browser visitors"
          value={visitorSnapshot ? '1' : '—'}
          detail="Unique browser instance"
          tone="accent"
        />
        <StatCard
          title="Total visits"
          value={visitorSnapshot?.totalVisits ?? '—'}
          detail="Page loads in this browser"
        />
        <StatCard
          title="Session views"
          value={visitorSnapshot?.sessionViews ?? '—'}
          detail="Refreshes in current session"
        />
        <StatCard
          title="Session age"
          value={formatSeconds(sessionDuration)}
          detail="Since first local visit"
        />
      </div>

      <div className="analytics-grid analytics-grid-main">
        <section className="analytics-panel">
          <div className="analytics-panel-title">Visitor analytics</div>
          <div className="analytics-panel-body">
            <MetricRow label="Visitor ID" value={visitorSnapshot?.visitorId ?? '—'} />
            <MetricRow label="First seen" value={formatDateTime(visitorSnapshot?.firstSeenAt)} />
            <MetricRow label="Last seen" value={`${formatDateTime(visitorSnapshot?.lastSeenAt)} (${formatRelativeTime(visitorSnapshot?.lastSeenAt)})`} />
            <MetricRow label="Total page views" value={visitorSnapshot?.totalPageViews ?? '—'} />
            <MetricRow label="Current path" value={visitorSnapshot?.path ?? '—'} />
            <MetricRow label="Referrer" value={visitorSnapshot?.referrer ?? '—'} />
            <MetricRow label="Locale" value={visitorSnapshot?.language ?? '—'} />
            <MetricRow label="Timezone" value={visitorSnapshot?.timezone ?? '—'} />
            <MetricRow label="Screen" value={visitorSnapshot?.screen ?? '—'} />
          </div>
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-title">Simulator activity</div>
          <div className="analytics-panel-body">
            <MetricRow label="Commands run" value={snapshot?.commandCount ?? '—'} />
            <MetricRow label="Terminal lines" value={snapshot?.linesCount ?? '—'} />
            <MetricRow label="Namespaces" value={snapshot?.cluster?.namespaces?.length ?? '—'} />
            <MetricRow label="Deployments" value={snapshot?.cluster?.deployments?.length ?? '—'} />
            <MetricRow label="Services" value={snapshot?.cluster?.services?.length ?? '—'} />
            <MetricRow label="Pods" value={snapshot?.cluster?.pods?.length ?? '—'} />
            <MetricRow label="Top command" value={snapshot?.topCommand ? `${snapshot.topCommand[0]} (${snapshot.topCommand[1]})` : '—'} />
          </div>
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-title">Browser / device</div>
          <div className="analytics-panel-body">
            <MetricRow label="Viewport" value={`${window.innerWidth} × ${window.innerHeight}`} />
            <MetricRow label="Online" value={navigator.onLine ? 'Yes' : 'No'} />
            <MetricRow label="Device memory" value={navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unavailable'} />
            <MetricRow label="Hardware threads" value={navigator.hardwareConcurrency || 'Unavailable'} />
            <MetricRow label="JS heap" value={snapshot?.memory ? formatBytes(snapshot.memory.usedJSHeapSize) : 'Unavailable'} />
            <MetricRow label="Total JS heap" value={snapshot?.memory ? formatBytes(snapshot.memory.totalJSHeapSize) : 'Unavailable'} />
          </div>
        </section>
      </div>

      <div className="analytics-panel analytics-wide">
        <div className="analytics-panel-title">Performance notes</div>
        <ul className="analytics-notes">
          <li>Visitor analytics are browser-local, so they reflect this device and tab session.</li>
          <li>Load timing is taken from the Navigation Timing API and updates on refresh.</li>
          <li>Usage data is derived from the simulator state stored in localStorage.</li>
          <li>If the analytics look empty, run a few commands in Playground and refresh the page.</li>
        </ul>
      </div>
    </motion.div>
  )
}