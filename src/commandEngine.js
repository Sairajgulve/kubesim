export default class KubeCommandEngine {
  constructor(state, opts = {}) {
    this.onChange = opts.onChange || null
    this.state = (state && state.cluster) ? state.cluster : this._createDefaultState();
  }

  _createDefaultState() {
    return {
      pods: [
        { name: 'web-frontend-1', status: 'Running', owner: 'web-frontend', image: 'nginx:1.27', namespace: 'production' },
        { name: 'web-frontend-2', status: 'Running', owner: 'web-frontend', image: 'nginx:1.27', namespace: 'production' },
        { name: 'web-frontend-3', status: 'Running', owner: 'web-frontend', image: 'nginx:1.27', namespace: 'production' }
      ],
      deployments: [
        { name: 'web-frontend', replicas: 3, ready: 3, available: 3, image: 'nginx:1.27', namespace: 'production' }
      ],
      services: [
        { name: 'web-frontend-svc', owner: 'web-frontend', port: 80, namespace: 'production' }
      ],
      namespaces: ['default', 'production', 'kube-system'],
      currentNamespace: 'production'
    }
  }

  getState() { return { pods: this.state.pods.slice(), deployments: this.state.deployments.slice(), services: this.state.services.slice(), namespaces: this.state.namespaces.slice(), currentNamespace: this.state.currentNamespace } }

  _namespaceFromArgs(args) {
    const namespaceFlag = args.find(a => a === '-n' || a === '--namespace')
    if (namespaceFlag) {
      const flagIndex = args.indexOf(namespaceFlag)
      const explicitNamespace = args[flagIndex + 1]
      if (explicitNamespace) return explicitNamespace
    }
    const equalsFlag = args.find(a => a.startsWith('--namespace='))
    if (equalsFlag) return equalsFlag.split('=')[1]
    return this.state.currentNamespace || 'default'
  }

  _resourceNamespace(resource) {
    return resource.namespace || this.state.currentNamespace || 'default'
  }

  run(raw) {
    const parts = raw.trim().split(/\s+/);
    if (!parts.length) return { output: '' };
    if (parts[0] === 'help') return { output: this.helpText() };
    if (parts[0] === 'kubectl') return this._handleKubectl(parts.slice(1));
    return { output: `Unknown command: ${raw}` };
  }

  helpText(){ return ['Supported: kubectl get/create/describe/delete/logs/scale/rollout/expose/namespace','Also: exercises, setup <id>, check <id>, clear'].join('\n') }

  _handleKubectl(args){
    if (!args.length) return { output: 'kubectl: missing command' };
    const cmd = args[0];
    if (cmd === 'get') return this._kubectlGet(args.slice(1));
    if (cmd === 'create') return this._kubectlCreate(args.slice(1));
    if (cmd === 'describe') return this._kubectlDescribe(args.slice(1));
    if (cmd === 'delete') return this._kubectlDelete(args.slice(1));
    if (cmd === 'logs') return this._kubectlLogs(args.slice(1));
    if (cmd === 'scale') return this._kubectlScale(args.slice(1));
    if (cmd === 'rollout') return this._kubectlRollout(args.slice(1));
    if (cmd === 'expose') return this._kubectlExpose(args.slice(1));
    if (cmd === 'namespace') return this._kubectlNamespace(args.slice(1));
    return { output: `kubectl: unsupported subcommand ${cmd}` };
  }

  _kubectlGet(args){
    const what = args[0];
    const namespace = this._namespaceFromArgs(args)
    if (what === 'pods'){
      const pods = this.state.pods.filter(p => this._resourceNamespace(p) === namespace);
      if (!pods.length) return { output: `No resources found in namespace ${namespace}.` };
      const lines = ['NAME\tSTATUS\tREADY\tNAMESPACE'];
      pods.forEach(p => lines.push(`${p.name}\t${p.status}\t1/1\t${this._resourceNamespace(p)}`));
      return { output: lines.join('\n') };
    }
    if (what === 'deployments'){
      const deployments = this.state.deployments.filter(d => this._resourceNamespace(d) === namespace);
      if (!deployments.length) return { output: `No deployments found in namespace ${namespace}.` };
      const lines = ['NAME\tREADY\tAVAILABLE\tNAMESPACE'];
      deployments.forEach(d => lines.push(`${d.name}\t${d.ready}/${d.replicas}\t${d.available}\t${this._resourceNamespace(d)}`));
      return { output: lines.join('\n') };
    }
    if (what === 'services' || what === 'svc'){
      const services = this.state.services.filter(s => this._resourceNamespace(s) === namespace);
      if (!services.length) return { output: `No services found in namespace ${namespace}.` };
      const lines = ['NAME\tTYPE\tTARGET\tNAMESPACE'];
      services.forEach(s => lines.push(`${s.name}\tClusterIP\t${s.owner}\t${this._resourceNamespace(s)}`));
      return { output: lines.join('\n') };
    }
    if (what === 'namespaces'){
      const lines = ['NAME'];
      this.state.namespaces.forEach(n => lines.push(n));
      return { output: lines.join('\n') };
    }
    return { output: `get: unsupported resource ${what}` };
  }

  _kubectlCreate(args){
    if (args[0] === 'deployment'){
      const name = args[1];
      if (!name) return { output: 'error: name required' };
      const imageArg = args.find(a => a.startsWith('--image='));
      const image = imageArg ? imageArg.split('=')[1] : 'nginx';
      const namespace = this._namespaceFromArgs(args);
      const deployment = { name, replicas:1, ready:0, available:0, image, namespace };
      this.state.deployments.push(deployment);
      const podName = `${name}-pod-1`;
      const pod = { name: podName, status: 'Pending', owner: name, image, namespace };
      this.state.pods.push(pod);
      this._notify();
      setTimeout(() => {
        pod.status = 'Running';
        deployment.ready = 1; deployment.available = 1;
        this._notify();
      }, 700);
      return { output: `deployment.apps/${name} created in namespace ${namespace}` };
    }
    return { output: `create: unsupported resource ${args[0]}` };
  }

  _kubectlDescribe(args){
    const what = args[0];
    const name = args[1];
    if (what === 'pod'){
      const pod = this.state.pods.find(p=>p.name===name);
      if (!pod) return { output: `Error from server (NotFound): pods \"${name}\" not found` };
      return { output: [`Name: ${pod.name}`, `Status: ${pod.status}`, `Containers:`, `  ${pod.image}`, `Owner: ${pod.owner || '-'}`].join('\n') };
    }
    return { output: `describe: unsupported resource ${what}` };
  }

  _kubectlDelete(args){
    const what = args[0];
    const name = args[1];
    const namespace = this._namespaceFromArgs(args)
    if (what === 'pod'){
      const idx = this.state.pods.findIndex(p=>p.name===name && this._resourceNamespace(p) === namespace);
      if (idx===-1) return { output: `Error from server (NotFound): pods \"${name}\" not found` };
      this.state.pods[idx].status = 'Terminating';
      this._notify();
      setTimeout(() => { const i = this.state.pods.findIndex(p=>p.name===name && this._resourceNamespace(p) === namespace); if(i>-1){ this.state.pods.splice(i,1); this._notify() } }, 500);
      return { output: `pod \"${name}\" deleted` };
    }
  
    if (what === 'deployment'){
      const idx = this.state.deployments.findIndex(d=>d.name===name && this._resourceNamespace(d) === namespace);
      if (idx===-1) return { output: `Error from server (NotFound): deployments.apps \"${name}\" not found` };
      const dep = this.state.deployments[idx];
      // Mark associated pods as terminating
      this.state.pods = this.state.pods.map(p => p.owner === dep.name && this._resourceNamespace(p) === namespace ? {...p, status: 'Terminating'} : p);
      // Remove deployment
      this.state.deployments.splice(idx, 1);
      this._notify();
      // Remove pods after delay
      setTimeout(() => { 
        this.state.pods = this.state.pods.filter(p => !(p.owner === dep.name && this._resourceNamespace(p) === namespace));
        this._notify();
      }, 500);
      return { output: `deployment.apps \"${name}\" deleted` };
    }
  
    if (what === 'service' || what === 'svc'){
      const idx = this.state.services.findIndex(s=>s.name===name && this._resourceNamespace(s) === namespace);
      if (idx===-1) return { output: `Error from server (NotFound): services \"${name}\" not found` };
      this.state.services.splice(idx, 1);
      this._notify();
      return { output: `service \"${name}\" deleted` };
    }

    return { output: `delete: unsupported resource ${what}` };
  }

  _kubectlLogs(args){
    const name = args[0];
    const namespace = this._namespaceFromArgs(args)
    if (!name) return { output: 'error: pod name required' };
    const pod = this.state.pods.find(p=>p.name===name && this._resourceNamespace(p) === namespace);
    if (!pod) return { output: `Error from server (NotFound): pods \"${name}\" not found` };
    return { output: [`-- logs for ${name} --`, `Starting container ${pod.image}...`, `Listening on port 80`, `GET / 200 5ms`].join('\n') };
  }

  _kubectlScale(args){
    if (args[0] !== 'deployment') return { output: 'scale: only deployment supported in simulator' };
    const name = args[1];
    const namespace = this._namespaceFromArgs(args)
    const repArg = args.find(a=>a.startsWith('--replicas='));
    const replicas = repArg ? parseInt(repArg.split('=')[1],10) : 1;
    const dep = this.state.deployments.find(d=>d.name===name && this._resourceNamespace(d) === namespace);
    if (!dep) return { output: `Error from server (NotFound): deployments.apps \"${name}\" not found` };
    dep.replicas = replicas; dep.ready = replicas; dep.available = replicas;
    this.state.pods = this.state.pods.filter(p=>!(p.owner===name && this._resourceNamespace(p) === namespace));
    for(let i=1;i<=replicas;i++) this.state.pods.push({ name:`${name}-pod-${i}`, status:'Running', owner:name, image:dep.image, namespace });
    this._notify();
    return { output: `deployment.apps/${name} scaled` };
  }

  _kubectlRollout(args){
    if (args[0] !== 'status') return { output: 'rollout: only status supported in simulator' };
    const name = args[1];
    const dep = this.state.deployments.find(d=>d.name===name);
    if (!dep) return { output: `Error from server (NotFound): deployments.apps \"${name}\" not found` };
    return { output: `deployment \"${name}\" successfully rolled out` };
  }

  _kubectlExpose(args){
    if (args[0] !== 'deployment') return { output: 'expose: only deployment supported in simulator' };
    const name = args[1];
    const namespace = this._namespaceFromArgs(args)
    const svcArg = args.find(a => a.startsWith('--name='));
    const svcName = svcArg ? svcArg.split('=')[1] : `${name}-svc`;
    const dep = this.state.deployments.find(d => d.name === name && this._resourceNamespace(d) === namespace);
    if (!dep) return { output: `Error from server (NotFound): deployments.apps \"${name}\" not found` };
    const svc = { name: svcName, owner: name, port: 80, namespace };
    this.state.services.push(svc);
    this._notify();
    return { output: `service/${svcName} exposed in namespace ${namespace}` };
  }

  _kubectlNamespace(args){
    // support: kubectl create namespace NAME
    if (args[0] === 'create'){
      const name = args[1];
      if (!name) return { output: 'error: namespace name required' };
      if (!this.state.namespaces.includes(name)) this.state.namespaces.push(name);
      this._notify();
      return { output: `namespace/${name} created` };
    }
    return { output: `namespace: unsupported ${args[0]}` };
  }

  _notify() { if (this.onChange) this.onChange(this.getState()) }
}