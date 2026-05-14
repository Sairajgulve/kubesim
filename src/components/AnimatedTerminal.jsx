import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import CommandEngine from '../commandEngine'
import { setupExercise, grade, getHints } from '../grader'
import ClusterView from './ClusterView'

function TerminalLine({ line }){
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard?.writeText(line.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  
  if(line.type === "command"){
    return (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 10px',
          marginBottom: '6px',
          marginTop: '4px',
          borderLeft: '3px solid var(--accent)',
          paddingLeft: '12px',
          color: 'var(--accent-light)',
          fontWeight: 600,
          background: 'rgba(0, 217, 214, 0.08)',
          borderRadius: '6px',
          marginRight: '4px'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>$</span>
        <code style={{ flex: 1, fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace", fontSize: '12px' }}>{line.text}</code>
        <motion.button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            minWidth: '50px',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
          whileHover={{ scale: 1.05, borderColor: 'var(--accent)', color: 'var(--accent-light)' }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? 'Copied' : 'Copy'}
        </motion.button>
      </motion.div>
    )
  }
  
  const isError = line.text.includes('Error') || line.text.includes('error')
  const isSuccess = line.text.includes('✓') || line.text.includes('✅') || line.text.includes('created') || line.text.includes('deleted')
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        padding: '3px 0',
        paddingLeft: '4px',
        color: isError ? 'var(--error)' : isSuccess ? 'var(--success)' : 'var(--text)',
        fontWeight: isSuccess ? 600 : 400,
        fontSize: '12px',
        lineHeight: '1.5',
        fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace"
      }}
    >
      {line.text || '\u00A0'}
    </motion.div>
  )
}

export default function AnimatedTerminal(){
  const [lines, setLines] = useState([
    { text: "Welcome to KubeSim", type: "info" },
    { text: "Type 'help' or try an exercise.", type: "info" },
    { text: "", type: "info" }
  ])
  const [input, setInput] = useState('')
  const [visualState, setVisualState] = useState({ pods: [], deployments: [], services: [], namespaces: ['default'] })
  const [detail, setDetail] = useState(null)
  const [action, setAction] = useState(null)
  const outRef = useRef(null)
  const [isRunning, setIsRunning] = useState(false)

  // load saved state (cluster + terminal lines) from localStorage so user runs persist across refresh
  const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('kubesim_storage') || 'null') : null
  const [engine] = useState(() => new CommandEngine(saved && saved.cluster ? { cluster: saved.cluster } : {}, { onChange: (s) => setVisualState(s) }))

  useEffect(()=>{ 
    if(outRef.current) {
      setTimeout(() => {
        outRef.current.scrollTop = outRef.current.scrollHeight
      }, 50)
    }
  },[lines])

  // restore terminal lines if present
  useEffect(() => {
    if (saved && saved.lines && saved.lines.length) {
      setLines(saved.lines)
    }
    if (saved && saved.cluster) {
      // visualState will be updated via engine.onChange, but set initial quickly
      setVisualState(saved.cluster)
    }
  }, [])

  // persist cluster and terminal lines to localStorage
  useEffect(() => {
    try {
      const data = { cluster: visualState, lines }
      localStorage.setItem('kubesim_storage', JSON.stringify(data))
    } catch (e) {
      // ignore storage errors
    }
  }, [visualState, lines])

  function append(text, type = "output"){ 
    const newLines = text.split('\n').map(t => ({ text: t, type }))
    setLines(l => [...l, ...newLines]) 
  }

  function run(cmd){
    if(!cmd || isRunning) return
    setIsRunning(true)
    
    setLines(l => [...l, { text: cmd, type: "command" }])
    
    if (cmd === 'clear') { 
      setLines([])
      setIsRunning(false)
      return 
    }
    
    if (cmd === 'help') {
      append('Available commands:')
      append('  kubectl get pods - list all pods')
      append('  kubectl create deployment <name> --image=<image> - create deployment')
      append('  kubectl scale deployment <name> --replicas=<n> - scale deployment')
      append('  kubectl delete pod <name> - delete a pod')
      append('  kubectl logs <pod> - view pod logs')
      append('  kubectl expose deployment <name> --port=80 --target-port=8080 - expose service')
      append('  kubectl describe pod <name> - get pod details')
      append('  setup <exercise-id> - initialize exercise')
      append('  check <exercise-id> - check exercise completion')
      append('  hint <exercise-id> - get hints')
      append('', 'info')
      setIsRunning(false)
      return
    }
    
    
    if (cmd.startsWith('setup ')) { 
      const id=cmd.split(/\s+/)[1]
      const res=setupExercise(id, engine)
      append(res.msg, 'info')
      append('', 'info')
      setIsRunning(false)
      return 
    }
    
    if (cmd.startsWith('check ')) { 
      const id=cmd.split(/\s+/)[1]
      const res=grade(id, engine)
      append(res.msg, res.passed ? 'success' : 'error')
      append('', 'info')
      setIsRunning(false)
      return 
    }
    
    if (cmd.startsWith('hint ')) { 
      const id=cmd.split(/\s+/)[1]
      const h=getHints(id)
      if(!h) append('No hints available', 'warning')
      else h.forEach(s=>append('  > '+s, 'info'))
      append('', 'info')
      setIsRunning(false)
      return 
    }
    
    const res = engine.run(cmd)
    if (res.output) append(res.output, 'output')
    append('', 'info')
    
    const lower = cmd.toLowerCase()
    let targets = []
    
    if (lower.startsWith('kubectl create deployment')) {
      const parts = cmd.split(/\s+/)
      const name = parts[2]
      targets = [`${name}-pod-1`]
    } else if (lower.startsWith('kubectl scale')) {
      const parts = cmd.split(/\s+/)
      const name = parts[2]
      targets = engine.getState().pods.filter(p => p.owner === name).map(p => p.name)
    } else if (lower.startsWith('kubectl logs')){
      const parts = cmd.split(/\s+/)
      targets = [parts[2] || parts[1]]
    } else if (lower.startsWith('kubectl delete pod')){
      const parts = cmd.split(/\s+/)
      targets = [parts[2] || parts[1]]
    } else if (lower.startsWith('kubectl expose')){
      const parts = cmd.split(/\s+/)
      const dep = parts[2]
      const svcArg = parts.find(a=>a.startsWith('--name='))
      const svc = svcArg ? svcArg.split('=')[1] : `${dep}-svc`
      targets = [svc, ...engine.getState().pods.filter(p=>p.owner===dep).map(p=>p.name)]
    } else if (lower.startsWith('kubectl get')) {
      targets = ['api']
    }
    
    if (targets.length) {
      setAction({ type: 'api', targets })
      setTimeout(()=>{
        setAction(null)
        setIsRunning(false)
      }, 900)
    } else {
      setIsRunning(false)
    }
  }

  return (
    <motion.div 
      className="terminal-box" 
      initial={{ scale:0.98, opacity:0 }} 
      animate={{ scale:1, opacity:1 }} 
      transition={{ duration:0.4, ease: 'easeOut' }}
    >
      <motion.div 
        style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="badge">Interactive CLI</div>
        <motion.div 
          style={{color:'var(--accent-light)',fontSize:13,fontWeight:500}}
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Animated kubectl playground
        </motion.div>
      </motion.div>
      
      <div className="terminal-split" style={{display:'grid',gridTemplateColumns:'65% 35%',gap:12,flex:1,minHeight:0}}>
        <motion.div 
          style={{overflow:'auto',fontSize:'13px',minWidth:0,minHeight:0,height:'100%'}}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ClusterView state={visualState} onSelect={(p)=>setDetail(p)} action={action} />
        </motion.div>

        <motion.div style={{display:'flex',flexDirection:'column',minHeight:0}} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div style={{flex:1, minHeight:0, overflow:'auto'}} className="term-output" ref={outRef}>
            {lines.map((l,i)=>(<TerminalLine key={i} line={l} />))}
          </div>

          <motion.div 
            className="term-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{marginTop:12}}
          >
            <input 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyDown={e=>{ 
                if(e.key==='Enter'){ 
                  run(input)
                  setInput('') 
                } 
              }} 
              placeholder={isRunning ? "Running command..." : "Type command and press Enter"}
              disabled={isRunning}
              style={{ opacity: isRunning ? 0.5 : 1 }}
            />
            <div className="term-controls">
              <motion.button 
                className="btn" 
                onClick={()=>{ run(input); setInput('') }}
                disabled={isRunning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Run
              </motion.button>
              <motion.button 
                className="btn" 
                onClick={()=>{ run('help') }}
                disabled={isRunning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Help
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {detail && (
        <motion.div 
          style={{marginTop:12}}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="details-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,color:'var(--text)',fontSize:14}}>Pod Details</div>
              <motion.button 
                onClick={() => setDetail(null)}
                style={{background:'transparent',border:'1px solid var(--border)',color:'var(--muted)',width:28,height:28,borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:600}}
                whileHover={{color:'var(--accent)',borderColor:'var(--accent)'}}
                whileTap={{scale:0.9}}
              >
                ×
              </motion.button>
            </div>
            <motion.div 
              className="detail-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="detail-key">Name</div>
              <div className="detail-val">{detail.name}</div>
            </motion.div>
            <motion.div 
              className="detail-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="detail-key">Status</div>
              <div className="detail-val">{detail.status}</div>
            </motion.div>
            <motion.div 
              className="detail-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="detail-key">Image</div>
              <div className="detail-val">{detail.image}</div>
            </motion.div>
            <motion.div 
              className="detail-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="detail-key">Owner</div>
              <div className="detail-val">{detail.owner || '-'}</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
