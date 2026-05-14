import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function Pod({ pod, innerRef }){
  const statusColorMap = {
    'Pending': '#f39c12',
    'Running': '#10b981',
    'Terminating': '#ef4444'
  }
  
  const statusColor = statusColorMap[pod.status] || '#8892a3'
  
  return (
    <motion.div 
      ref={innerRef} 
      layout 
      initial={{ scale: 0.8, opacity: 0, y: 10 }} 
      animate={{ scale: 1, opacity: 1, y: 0 }} 
      exit={{ scale: 0.6, opacity: 0, y: -10 }} 
      transition={{ 
        type: 'spring', 
        stiffness: 350,
        damping: 30,
        mass: 1
      }} 
      className={`pod ${pod.status.toLowerCase()}`}
      style={{ '--running': statusColor }}
    >
      <motion.div 
        className="pod-name" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {pod.name}
      </motion.div>
      <motion.div 
        className="pod-meta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{ color: statusColor }}
      >
        {pod.status}
      </motion.div>
      {pod.status === 'Pending' && (
        <motion.div
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}

function Deployment({ dep }){
  return (
    <motion.div 
      className="deployment" 
      initial={{ x: -15, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: -15, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.div 
        className="dep-name"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {dep.name}
      </motion.div>
      <motion.div 
        className="dep-meta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {dep.replicas} replicas active
      </motion.div>
    </motion.div>
  )
}

export default function ClusterView({ state, onSelect, action }){
  const deployments = state?.deployments || [];
  const pods = state?.pods || [];
  const services = state?.services || [];
  const namespaces = state?.namespaces || [];
  const currentNamespace = state?.currentNamespace || 'production';
  const visibleDeployments = deployments.filter(d => (d.namespace || currentNamespace) === currentNamespace);
  const visiblePods = pods.filter(p => (p.namespace || currentNamespace) === currentNamespace);
  const visibleServices = services.filter(s => (s.namespace || currentNamespace) === currentNamespace);
  const containerRef = useRef(null)
  const apiRef = useRef(null)
  const namespaceRef = useRef(null)
  const deploymentRefs = useRef({})
  const podRefs = useRef({})
  const svcRefs = useRef({})
  const [lines, setLines] = useState([])
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(()=>{
    // Compute connector lines between API server, namespace, deployments, services, and pods
    const c = containerRef.current
    if(!c) return
    const apiRect = apiRef.current?.getBoundingClientRect()
    const namespaceRect = namespaceRef.current?.getBoundingClientRect()
    const base = c.getBoundingClientRect()
    const newLines = []

    visibleDeployments.forEach(d => {
      const dr = deploymentRefs.current[d.name]?.getBoundingClientRect()
      if (namespaceRect && dr) {
        newLines.push({
          from: { x: namespaceRect.left - base.left + namespaceRect.width / 2, y: namespaceRect.bottom - base.top - 6 },
          to: { x: dr.left - base.left + dr.width / 2, y: dr.top - base.top + 4 },
          id: `ns-${d.name}`,
          highlight: action?.targets?.includes(d.name),
          duration: 0.8
        })
      }
    })
    
    if (apiRect && namespaceRect) {
      newLines.push({
        from: { x: apiRect.left - base.left + apiRect.width / 2, y: apiRect.bottom - base.top },
        to: { x: namespaceRect.left - base.left + namespaceRect.width / 2, y: namespaceRect.top - base.top + 6 },
        id: 'api-namespace',
        highlight: false,
        duration: 0.8
      })
    }

    visibleServices.forEach(s => {
      const sr = svcRefs.current[s.name]?.getBoundingClientRect()
      if(!sr) return
      visiblePods.filter(p=>p.owner===s.owner).forEach(p=>{
        const pr = podRefs.current[p.name]?.getBoundingClientRect()
        if(pr) newLines.push({ 
          from: { x: sr.left - base.left + sr.width/2, y: sr.top - base.top + sr.height/2 }, 
          to: { x: pr.left - base.left + pr.width/2, y: pr.top - base.top + pr.height/2 }, 
          id:`svc-${s.name}-${p.name}`, 
          highlight: action?.targets?.includes(s.name) || action?.targets?.includes(p.name),
          duration: 0.8
        })
      })
    })

    visiblePods.forEach(p => {
      const pr = podRefs.current[p.name]?.getBoundingClientRect()
      const dr = deploymentRefs.current[p.owner]?.getBoundingClientRect()
      if (pr && dr) {
        newLines.push({
          from: { x: dr.left - base.left + dr.width / 2, y: dr.bottom - base.top - 2 },
          to: { x: pr.left - base.left + pr.width / 2, y: pr.top - base.top + 2 },
          id: `dep-${p.name}`,
          highlight: action?.targets?.includes(p.name) || action?.targets?.includes(p.owner),
          duration: 0.8
        })
      }
    })
    setLines(newLines)
    if(action?.targets?.length) setPulseKey(k => k+1)
  }, [visibleDeployments, visiblePods, visibleServices, action])

  return (
    <div className="cluster-view" ref={containerRef} style={{position:'relative'}}>
      <div className="cluster-legend">
        <div className="cluster-legend-title">Live cluster map</div>
        <div className="cluster-legend-note">Namespace-scoped demo: <strong>{currentNamespace}</strong></div>
        <div className="cluster-legend-row">
          <span className="cluster-chip">API → namespace</span>
          <span className="cluster-chip">Namespace → deployment</span>
          <span className="cluster-chip">Service → pods</span>
        </div>
        <div className="cluster-legend-row">
          <span className="cluster-chip cluster-chip--muted">Showing namespace: {currentNamespace}</span>
          <span className="cluster-chip cluster-chip--muted">Namespaces available: {namespaces.length}</span>
        </div>
      </div>

      <motion.div 
        ref={apiRef} 
        className="api-server"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="api-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          API Server
        </motion.div>
        <motion.div 
          style={{fontSize:12,color:'var(--muted)'}}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          kube-apiserver (simulated)
        </motion.div>
      </motion.div>
      <div style={{height:12}} />
      
      <motion.div 
        className="namespace"
        ref={namespaceRef}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="namespace-summary">
          <div>
            <motion.div 
              className="ns-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              namespace: {currentNamespace}
            </motion.div>
            <div className="namespace-meta">Contains deployments, services, and pods for the demo app.</div>
          </div>
          <div className="namespace-badge">managed scope</div>
        </div>

        <div className="namespace-flow">
          <div className="namespace-flow-step">
            <div className="namespace-flow-label">1. Desired state</div>
            <div className="namespace-flow-value">Deployment defines how many pods should run</div>
          </div>
          <div className="namespace-flow-step">
            <div className="namespace-flow-label">2. Traffic</div>
            <div className="namespace-flow-value">Service points users to the right pods</div>
          </div>
          <div className="namespace-flow-step">
            <div className="namespace-flow-label">3. Running instances</div>
            <div className="namespace-flow-value">Pods are the actual workload containers</div>
          </div>
        </div>
        
        <div className="cluster-lane">
          <div className="cluster-lane-header">
            <span>Deployments</span>
            <span>{visibleDeployments.length} active</span>
          </div>
          <div className="cluster-lane-body dep-list">
            {visibleDeployments.length ? visibleDeployments.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <div ref={el => { deploymentRefs.current[d.name] = el }}>
                  <Deployment dep={d} />
                </div>
              </motion.div>
            )) : <div className="lane-empty">No deployments in this namespace.</div>}
          </div>
        </div>
        
        <div className="cluster-lane">
          <div className="cluster-lane-header">
            <span>Services</span>
            <span>{visibleServices.length} exposed</span>
          </div>
          <div className="cluster-lane-body service-list">
            {visibleServices.length ? visibleServices.map((s, i) => (
              <motion.div 
                key={s.name} 
                ref={el => svcRefs.current[s.name]=el} 
                className="deployment service-card" 
                style={{minWidth:120,cursor:'default'}}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.3 + i * 0.08 }}
              >
                <div className="dep-name">{s.name}</div>
                <div className="dep-meta">Routes to {s.owner}</div>
              </motion.div>
            )) : <div className="lane-empty">No services in this namespace.</div>}
          </div>
        </div>
        
        <div className="cluster-lane">
          <div className="cluster-lane-header">
            <span>Pods</span>
            <span>{visiblePods.length} running units</span>
          </div>
          <motion.div 
            className="cluster-lane-body pod-list pod-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {visiblePods.length ? visiblePods.map((p, i) => (
              <motion.div 
                key={p.name} 
                onClick={() => onSelect && onSelect(p)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.06 }}
              >
                <Pod pod={p} innerRef={el => { podRefs.current[p.name] = el }} />
              </motion.div>
            )) : <div className="lane-empty">No pods in this namespace.</div>}
          </motion.div>
        </div>
      </motion.div>

      {/* SVG Network Lines */}
      <svg style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 217, 214, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 217, 214, 0.1)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {lines.map(l => (
          <motion.g key={`${l.id}-${pulseKey}`}>
            {/* Base line */}
            <line 
              x1={l.from.x} 
              y1={l.from.y} 
              x2={l.to.x} 
              y2={l.to.y} 
              stroke={l.highlight ? 'rgba(0, 217, 214, 0.8)' : 'rgba(0, 217, 214, 0.15)'} 
              strokeWidth={l.highlight ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'all 0.3s ease' }}
            />

            {/* Glow effect on highlight */}
            {l.highlight && (
              <motion.line
                x1={l.from.x}
                y1={l.from.y}
                x2={l.to.x}
                y2={l.to.y}
                stroke="rgba(0, 217, 214, 0.6)"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0}
                animate={{ opacity: [0.6, 0] }}
                transition={{ 
                  duration: l.duration,
                  ease: 'easeOut',
                  repeat: 0
                }}
                filter="url(#glow)"
              />
            )}
            
            {/* Animated pulse dot */}
            {l.highlight && (
              <motion.circle
                cx={l.from.x}
                cy={l.from.y}
                r={3}
                fill="rgba(0, 217, 214, 0.8)"
                animate={{
                  cx: [l.from.x, l.to.x],
                  cy: [l.from.y, l.to.y],
                  opacity: [1, 0]
                }}
                transition={{
                  duration: l.duration,
                  ease: 'easeInOut'
                }}
              />
            )}
            
            {/* Target highlight circle */}
            {l.highlight && (
              <motion.circle
                cx={l.to.x}
                cy={l.to.y}
                r={8}
                fill="none"
                stroke="rgba(0, 217, 214, 0.8)"
                strokeWidth={1.5}
                animate={{
                  r: [8, 12],
                  opacity: [0.8, 0]
                }}
                transition={{
                  duration: l.duration,
                  ease: 'easeOut'
                }}
              />
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
