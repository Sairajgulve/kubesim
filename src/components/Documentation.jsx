import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const docsContent = [
  {
    id: 'intro',
    title: 'Kubernetes Fundamentals',
    sections: [
      {
        heading: 'What Kubernetes actually does',
        content: 'Kubernetes is the control plane for containerized systems. It continuously reconciles the desired state you declare with the actual state running across nodes. Instead of manually starting containers, restarting failed processes, or wiring traffic yourself, you describe the intent and Kubernetes performs the orchestration loop for you.',
        icon: '■'
      },
      {
        heading: 'The mental model to remember',
        content: 'Think in layers: cluster, nodes, workloads, network, storage, and policy. A cluster is a pool of machines, a node is a machine running kubelet and a container runtime, a Pod is the smallest deployable workload, and Services provide a stable network identity in front of changing pods.',
        icon: '◆'
      },
      {
        heading: 'Why teams adopt Kubernetes',
        content: 'It gives you repeatable deployment, healing, scaling, service discovery, rollout control, and resource governance in one platform. That matters when a system grows beyond a few containers and you need reliable automation instead of ad hoc scripts.',
        icon: '●'
      },
      {
        heading: 'Desired state in practice',
        content: 'You define Deployments, Services, ConfigMaps, Secrets, and policies as code. Kubernetes stores that desired state and controllers work to make reality match it. This declarative approach is why YAML manifests are central to production operations.',
        icon: '↺'
      }
    ]
  },
  {
    id: 'cluster-architecture',
    title: 'Cluster Architecture',
    command: 'kubectl get nodes',
    description: 'Learn how the control plane and worker nodes cooperate, and how that affects scheduling, failure handling, and troubleshooting.',
    example: 'kubectl describe node <node-name>',
    useCases: [
      'Understanding scheduling decisions',
      'Diagnosing cluster-wide failures',
      'Reading node pressure and capacity signals'
    ],
    sections: [
      {
        heading: 'Control plane components',
        content: 'The API server accepts all requests, etcd stores cluster state, the scheduler chooses nodes for pending pods, and controllers continuously reconcile state. When any one of these components is unhealthy, the cluster may still run workloads but behavior becomes degraded.',
        icon: '⟐'
      },
      {
        heading: 'Worker node internals',
        content: 'Each node runs kubelet, kube-proxy, a container runtime such as containerd, and the pod networking stack. The kubelet talks to the API server and ensures the pods assigned to that node are created, monitored, and reported correctly.',
        icon: '▣'
      },
      {
        heading: 'Why etcd matters',
        content: 'etcd is the source of truth for the cluster. If it is slow or unavailable, updates become unreliable, controllers stall, and the cluster can appear frozen. In production, etcd backup and quorum health are critical operational concerns.',
        icon: '⌁'
      }
    ]
  },
  {
    id: 'pods',
    title: 'Pods and Workloads',
    command: 'kubectl get pods -o wide',
    description: 'Pods are the atomic unit of scheduling. Learn how they are created, why they fail, and how to design them properly.',
    example: 'kubectl describe pod nginx-pod-1',
    useCases: [
      'Packaging one or more tightly coupled containers',
      'Running sidecars for logging or proxying',
      'Debugging application startup and runtime issues'
    ],
    sections: [
      {
        heading: 'Lifecycle and phases',
        content: 'Pods move through Pending, Running, Succeeded, Failed, and Unknown. Pending often means scheduling or image-pull delays. Running means the containers started, but that does not guarantee the app is healthy unless probes are configured.',
        icon: '↺'
      },
      {
        heading: 'Init containers and sidecars',
        content: 'Init containers prepare the environment before the main app starts; sidecars run alongside the app for logging, proxying, or syncing. This is the standard way to compose pod behavior without baking too much logic into one image.',
        icon: '⊞'
      },
      {
        heading: 'Probes',
        content: 'Readiness probes control traffic routing, liveness probes trigger restarts, and startup probes give slow applications time to boot before liveness begins. Getting probe thresholds wrong is a common cause of flapping pods in production.',
        icon: '◎'
      },
      {
        heading: 'Good pod design',
        content: 'Keep pods small, single-purpose, and stateless where possible. Use environment variables and mounted configuration instead of baking secrets or environment-specific values into images. Assume any pod can be rescheduled at any time.',
        icon: '◈'
      }
    ]
  },
  {
    id: 'deployments',
    title: 'Deployments and Rollouts',
    command: 'kubectl create deployment web --image=nginx',
    description: 'Deployments are the standard controller for stateless applications. They manage ReplicaSets, rollouts, scaling, and rollback workflows.',
    example: 'kubectl rollout status deployment/web',
    useCases: [
      'Web applications and APIs',
      'Background workers that can be replicated',
      'Progressive delivery and controlled rollouts'
    ],
    sections: [
      {
        heading: 'ReplicaSets under the hood',
        content: 'A Deployment owns ReplicaSets, and ReplicaSets own pods. When you update a Deployment, Kubernetes creates a new ReplicaSet and gradually shifts pod replicas from the old version to the new one according to the rollout strategy.',
        icon: '≣'
      },
      {
        heading: 'Rolling update strategy',
        content: 'The default strategy replaces old pods gradually so the app remains available. maxUnavailable and maxSurge control how many pods can be removed or added during the update. These numbers should be chosen with your availability budget in mind.',
        icon: '↻'
      },
      {
        heading: 'Rollback workflow',
        content: 'If a rollout introduces a bad image or config, `kubectl rollout undo deployment/<name>` restores a prior template revision. That makes Deployments safer than manual pod management because version history is built into the controller.',
        icon: '↶'
      },
      {
        heading: 'Production advice',
        content: 'Always pair Deployments with readiness probes, resource requests, and sensible rollout limits. A Deployment that is technically available but unhealthy under traffic is a common real-world failure mode.',
        icon: '▤'
      }
    ]
  },
  {
    id: 'services',
    title: 'Services and Traffic Flow',
    command: 'kubectl expose deployment web --port=80 --target-port=8080',
    description: 'Services give pods stable DNS names and virtual IPs so traffic can reach workloads even as pods are replaced.',
    example: 'kubectl get svc -o wide',
    useCases: [
      'Stable access to changing pods',
      'Internal service discovery',
      'Load balancing and external exposure'
    ],
    sections: [
      {
        heading: 'ClusterIP, NodePort, LoadBalancer',
        content: 'ClusterIP is the default internal-only service, NodePort exposes a port on each node, and LoadBalancer asks the cloud provider for an external load balancer. The right choice depends on whether the traffic is internal, local, or internet-facing.',
        icon: '◄►'
      },
      {
        heading: 'Service discovery and DNS',
        content: 'Pods can resolve Services via built-in cluster DNS. That is why applications should talk to service names, not pod IPs. The service name stays stable even when back-end pods are rescheduled or scaled.',
        icon: '⌂'
      },
      {
        heading: 'Headless services',
        content: 'When you need direct discovery of individual pod endpoints, headless Services return each pod IP instead of a single virtual IP. They are useful for stateful systems and custom service discovery patterns.',
        icon: '⋯'
      },
      {
        heading: 'Ingress versus Service',
        content: 'A Service is a stable backend abstraction, while Ingress handles HTTP routing rules at the edge. In practice you often use both: Ingress routes requests, and the Service forwards them to the correct pod set.',
        icon: '⟜'
      }
    ]
  },
  {
    id: 'networking',
    title: 'Networking and Connectivity',
    command: 'kubectl port-forward pod/web-1 8080:80',
    description: 'Understand how packets move through a Kubernetes cluster, how the networking model works, and where to debug connectivity problems.',
    example: 'kubectl exec -it web-1 -- sh',
    useCases: [
      'Troubleshooting application reachability',
      'Testing service-to-service communication',
      'Validating DNS and policy behavior'
    ],
    sections: [
      {
        heading: 'CNI and pod IPs',
        content: 'Each pod receives its own IP address through the Container Network Interface plugin. The network model assumes pods can talk to each other across nodes without NAT tricks, which is why CNI correctness is foundational.',
        icon: '⟢'
      },
      {
        heading: 'Network policies',
        content: 'NetworkPolicies define which pods can talk to which other pods. Without them, many clusters allow all pod-to-pod traffic by default. With them, you can enforce least-privilege network access just like you do with RBAC for API access.',
        icon: '⊛'
      },
      {
        heading: 'Debugging connectivity',
        content: 'Use `kubectl exec` to inspect DNS, curl services from inside a pod, and confirm that the target port is actually listening. Check events, service selectors, endpoints, and probes when traffic does not arrive where expected.',
        icon: '◌'
      },
      {
        heading: 'Port-forward as a debugging tool',
        content: 'Port-forward is excellent for local testing because it bypasses external networking and maps a local port directly to a pod. It is not a long-term production exposure mechanism, but it is a powerful developer workflow.',
        icon: '↣'
      }
    ]
  },
  {
    id: 'storage',
    title: 'Configuration and Storage',
    command: 'kubectl get configmap,secret,pvc',
    description: 'Configuration and persistence are essential for real workloads. Learn how to separate config from images and attach durable storage to apps that need it.',
    example: 'kubectl describe pvc data-volume',
    useCases: [
      'Environment-specific app configuration',
      'Secrets management',
      'Persistent databases and file storage'
    ],
    sections: [
      {
        heading: 'ConfigMaps',
        content: 'ConfigMaps hold non-sensitive configuration such as flags, URLs, and feature toggles. Mount them as files or expose them as environment variables so the same container image can run across environments.',
        icon: '▦'
      },
      {
        heading: 'Secrets',
        content: 'Secrets store sensitive values like passwords and tokens. They should be encrypted at rest where possible and consumed carefully through volume mounts or environment variables. Always treat them as credentials, not just another config object.',
        icon: '◍'
      },
      {
        heading: 'PersistentVolumes and Claims',
        content: 'A PersistentVolume is the storage resource, while a PersistentVolumeClaim is the workload’s request for storage. This decouples application manifests from the underlying storage implementation and makes scheduling portable.',
        icon: '⟡'
      },
      {
        heading: 'Stateful workloads',
        content: 'Databases, queues, and systems with stable identity usually need StatefulSets rather than Deployments. They provide stable pod names, persistent volumes, and ordered rollout semantics that stateful apps rely on.',
        icon: '▥'
      }
    ]
  },
  {
    id: 'security',
    title: 'Security and Access Control',
    command: 'kubectl get sa,role,rolebinding',
    description: 'Security in Kubernetes is layered: namespaces, RBAC, service accounts, image controls, pod security, and runtime constraints all work together.',
    example: 'kubectl auth can-i create pods --as=system:serviceaccount:default:app',
    useCases: [
      'Limiting API access by role',
      'Protecting secrets and credentials',
      'Hardening workload runtime behavior'
    ],
    sections: [
      {
        heading: 'RBAC basics',
        content: 'RBAC controls what users and service accounts can do against the Kubernetes API. Roles define permissions inside a namespace, ClusterRoles define permissions across the cluster, and bindings attach those permissions to identities.',
        icon: '⌘'
      },
      {
        heading: 'Service accounts',
        content: 'Every pod runs with a service account unless you disable it. Pods using the API should use a dedicated, minimal account instead of the default one. That principle narrows the blast radius of compromised workloads.',
        icon: '◉'
      },
      {
        heading: 'SecurityContext',
        content: 'Use SecurityContext to drop Linux capabilities, prevent privilege escalation, set read-only root filesystems, and run as non-root users. These settings reduce the damage a compromised container can do on the node.',
        icon: '⟢'
      },
      {
        heading: 'Pod Security mindset',
        content: 'Production clusters should enforce baseline hardening. The goal is simple: only grant the permissions and privileges that a workload truly needs. The more restrictive the default posture, the fewer surprises you will have later.',
        icon: '◇'
      }
    ]
  },
  {
    id: 'operations',
    title: 'Debugging and Operations',
    command: 'kubectl get events --sort-by=.metadata.creationTimestamp',
    description: 'Learn the operational workflow you actually use when production is broken: inspect, isolate, verify, and only then change.',
    example: 'kubectl logs pod-name --previous',
    useCases: [
      'Investigating failed rollouts',
      'Finding crash-loop causes',
      'Tracing why traffic or scheduling is failing'
    ],
    sections: [
      {
        heading: 'The troubleshooting sequence',
        content: 'Start with events, then describe the object, then inspect logs, then verify the service selector and endpoints, then check resources and probes. A structured workflow prevents random guesswork and saves time under pressure.',
        icon: '↻'
      },
      {
        heading: 'Logs and previous logs',
        content: 'Logs tell you what the application said. If a container restarted, `kubectl logs --previous` can reveal the last crash. This is often the fastest way to identify startup failures, bad configs, or missing dependencies.',
        icon: '▤'
      },
      {
        heading: 'Events matter',
        content: 'Events often explain scheduling, image pull, probe, or storage errors long before the app logs do. They are one of the most underused debugging tools in the platform.',
        icon: '✦'
      },
      {
        heading: 'When to use exec',
        content: 'Use `kubectl exec` to inspect the runtime environment from inside the pod: DNS, files, environment variables, local ports, and process state. It is the closest you can get to the failing app without logging into the node.',
        icon: '⟟'
      }
    ]
  },
  {
    id: 'production',
    title: 'Production Readiness',
    command: 'kubectl top pods',
    description: 'Good Kubernetes systems are not just functional; they are observable, resource-aware, and resilient under load.',
    example: 'kubectl rollout status deployment/web',
    useCases: [
      'Capacity planning',
      'Autoscaling strategy',
      'High availability design'
    ],
    sections: [
      {
        heading: 'Requests and limits',
        content: 'Requests are what the scheduler uses for placement, while limits cap how much a container can consume. Setting requests without thinking about actual load leads to poor packing; omitting them makes scheduling unpredictable and noisy.',
        icon: '▰'
      },
      {
        heading: 'Autoscaling',
        content: 'Horizontal Pod Autoscaling reacts to CPU, memory, or custom metrics and adds replicas when demand rises. It works best when requests are accurate and the application is stateless enough to scale horizontally.',
        icon: '↗'
      },
      {
        heading: 'Availability',
        content: 'A production workload should survive node failure, rolling updates, and temporary traffic spikes. That means multiple replicas, readiness gates, anti-affinity where appropriate, and graceful shutdown handling.',
        icon: '◈'
      },
      {
        heading: 'Release discipline',
        content: 'Use small changes, health checks, rollouts, and rollback plans. Kubernetes gives you the mechanics, but the operational discipline still belongs to the team deploying the system.',
        icon: '⚙'
      }
    ]
  },
  {
    id: 'commands',
    title: 'Essential Commands',
    description: 'A practical command library with commands you can copy, try, and use as a launchpad for real cluster work.',
    commands: [
      { name: 'List Pods', cmd: 'kubectl get pods -o wide', desc: 'See pod names, status, IPs, and nodes.' },
      { name: 'Inspect a Pod', cmd: 'kubectl describe pod pod-name', desc: 'Read scheduling, events, and container details.' },
      { name: 'Follow Logs', cmd: 'kubectl logs pod-name -f', desc: 'Stream container output in real time.' },
      { name: 'Create a Deployment', cmd: 'kubectl create deployment app --image=nginx', desc: 'Start a managed stateless workload.' },
      { name: 'Scale a Deployment', cmd: 'kubectl scale deployment app --replicas=5', desc: 'Increase or decrease desired capacity.' },
      { name: 'Expose a Service', cmd: 'kubectl expose deployment app --port=80 --target-port=8080', desc: 'Create a stable network endpoint.' },
      { name: 'Rollout Status', cmd: 'kubectl rollout status deployment/app', desc: 'Watch a rollout progress to completion.' },
      { name: 'Delete a Deployment', cmd: 'kubectl delete deployment app', desc: 'Remove a deployment and its managed pods.' },
      { name: 'Port Forward', cmd: 'kubectl port-forward pod-name 8000:8080', desc: 'Map local traffic to a pod for debugging.' },
      { name: 'Work with Namespaces', cmd: 'kubectl get pods --namespace=production', desc: 'Limit the command to a specific namespace.' }
    ]
  }
]

function DocSection({ section, onTryCommand }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="doc-section"
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24, marginTop: 4 }}>{section.icon}</span>
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text)', fontSize: 15, fontWeight: 700 }}>
            {section.heading}
          </h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
            {section.content}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function DocsGuidePanel({ selected }) {
  const commandCount = selected.commands ? selected.commands.length : selected.command ? 1 : 0
  const sectionCount = selected.sections ? selected.sections.length : 0
  const useCaseCount = selected.useCases ? selected.useCases.length : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(180deg, rgba(0, 217, 214, 0.08), rgba(0, 217, 214, 0.02))',
        border: '1px solid rgba(0, 217, 214, 0.2)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(180px, 0.8fr)',
        gap: 14,
        alignItems: 'stretch'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
          Guided reading flow
        </div>
        <h2 style={{ margin: '0 0 8px 0', color: 'var(--text)', fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
          {selected.title}
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, maxWidth: 780 }}>
          Read this page in order: start with the summary, move through the concepts, then use the commands to try the idea in the playground. The goal is not just to memorize kubectl syntax, but to understand what each object is doing and why.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>Read</span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>Copy</span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>Try</span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>Observe</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Sections</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{sectionCount}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Commands</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{commandCount}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Use cases</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{useCaseCount}</div>
        </div>
      </div>
    </motion.div>
  )
}

function CommandCard({ cmd, onTry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 12,
        minWidth: 0
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {cmd.name}
        </div>
        <code style={{ 
          display: 'block',
          background: 'rgba(0, 217, 214, 0.08)',
          padding: '6px 8px',
          borderRadius: 6,
          margin: '6px 0',
          fontSize: 12,
          color: 'var(--accent-light)',
          fontWeight: 500,
          fontFamily: "'SF Mono', Monaco, monospace",
          wordBreak: 'break-all'
        }}>
          {cmd.cmd}
        </code>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {cmd.desc}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <motion.button
          onClick={() => navigator.clipboard?.writeText(cmd.cmd)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Copy
        </motion.button>
        <motion.button
          onClick={() => onTry(cmd.cmd)}
          style={{
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function Documentation({ onExecuteCommand }) {
  const [selectedId, setSelectedId] = useState('intro')
  const selected = docsContent.find(d => d.id === selectedId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '260px minmax(0, 1fr)',
        gap: 18,
        width: '100%',
        maxWidth: 1800,
        margin: '0 auto',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Sidebar Navigation */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 14,
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Topics
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          {docsContent.map((doc, i) => (
            <motion.button
              key={doc.id}
              onClick={() => setSelectedId(doc.id)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 6,
                borderRadius: 8,
                border: selectedId === doc.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                background: selectedId === doc.id ? 'rgba(0, 217, 214, 0.1)' : 'var(--surface)',
                color: selectedId === doc.id ? 'var(--accent-light)' : 'var(--text)',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: selectedId === doc.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              whileHover={{ scale: 1.02, background: 'var(--card-light)' }}
              whileTap={{ scale: 0.98 }}
            >
              {doc.title}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 20,
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
            <DocsGuidePanel selected={selected} />

            {selected.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}
              >
                {selected.description}
              </motion.p>
            )}

            {selected.command && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{
                    background: 'rgba(0, 217, 214, 0.08)',
                    border: '1px solid rgba(0, 217, 214, 0.2)',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 0
                }}
              >
                <code style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: "'SF Mono', Monaco, monospace",
                  color: 'var(--accent-light)',
                    fontWeight: 600,
                    minWidth: 0,
                    wordBreak: 'break-word'
                }}>
                  {selected.command}
                </code>
                <motion.button
                  onClick={() => navigator.clipboard?.writeText(selected.command)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Copy
                </motion.button>
                <motion.button
                  onClick={() => onExecuteCommand(selected.command)}
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Command
                </motion.button>
              </motion.div>
            )}

            {selected.useCases && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ marginBottom: 16 }}
              >
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                  Use Cases
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  {selected.useCases.map((uc, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                    >
                      {uc}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {selected.sections && selected.sections.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 style={{ margin: '16px 0 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                  Learn More
                </h4>
                {selected.sections.map((section, i) => (
                  <DocSection
                    key={i}
                    section={section}
                    onTryCommand={onExecuteCommand}
                  />
                ))}
              </motion.div>
            )}

            {selected.commands && selected.commands.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 style={{ margin: '16px 0 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                  Try These Commands
                </h4>
                {selected.commands.map((cmd, i) => (
                  <motion.div
                    key={cmd.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                  >
                    <CommandCard cmd={cmd} onTry={onExecuteCommand} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selected.example && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 16
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 6 }}>
                  Example Command
                </div>
                <code style={{
                  display: 'block',
                  fontSize: 12,
                  fontFamily: "'SF Mono', Monaco, monospace",
                  color: 'var(--success)',
                  wordBreak: 'break-all'
                }}>
                  {selected.example}
                </code>
              </motion.div>
            )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
