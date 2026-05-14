const exercises = [
  { id: 'deploy-nginx', title: 'Create nginx deployment', check: { type: 'deployment_exists', name: 'nginx' }, hints: ["kubectl create deployment nginx --image=nginx"] },
  { id: 'delete-pod', title: 'Delete test-pod', setup: { createPod: { name: 'test-pod', image: 'busybox' } }, check: { type: 'pod_absent', name: 'test-pod' }, hints: ["kubectl delete pod test-pod"] },
  { id: 'scale-deployment', title: 'Scale nginx', check: { type: 'deployment_replicas', name: 'nginx', replicas: 3 }, hints: ["kubectl scale deployment nginx --replicas=3"] }
]

export function listExercises(){ return exercises.map(e=>({id:e.id,title:e.title})) }

export function setupExercise(id, engine){
  const ex = exercises.find(e=>e.id===id); if(!ex) return { ok:false, msg:'exercise not found' }
  if(ex.setup && ex.setup.createPod){ const p=ex.setup.createPod; engine.state.pods.push({ name:p.name, status:'Running', image:p.image }) }
  return { ok:true, msg:`exercise ${id} setup complete` }
}

export function grade(id, engine){
  const ex = exercises.find(e=>e.id===id); if(!ex) return { ok:false, msg:'exercise not found' }
  const check = ex.check;
  if(check.type === 'deployment_exists'){
    const f = engine.state.deployments.find(d=>d.name===check.name);
    return f ? { ok:true, msg:`Passed: deployment ${check.name} exists`} : { ok:false, msg:`Failed: deployment ${check.name} not found` }
  }
  if(check.type === 'pod_absent'){
    const f = engine.state.pods.find(p=>p.name===check.name);
    return !f ? { ok:true, msg:`Passed: pod ${check.name} is absent`} : { ok:false, msg:`Failed: pod ${check.name} still present` }
  }
  if(check.type === 'deployment_replicas'){
    const f = engine.state.deployments.find(d=>d.name===check.name);
    if(!f) return { ok:false, msg:`Failed: deployment ${check.name} not found` }
    return f.replicas === check.replicas ? { ok:true, msg:`Passed: deployment ${check.name} has ${check.replicas} replicas` } : { ok:false, msg:`Failed: deployment ${check.name} has ${f.replicas} replicas (expected ${check.replicas})` }
  }
  return { ok:false, msg:'unsupported check' }
}

export function getHints(id){ const ex = exercises.find(e=>e.id===id); return ex ? ex.hints || null : null }
