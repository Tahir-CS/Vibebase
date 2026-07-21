"use client";

import { FormEvent, useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  environment: string;
  token: null | { id?: string; prefix: string; scopes: string[]; status: string; pendingReveal: boolean };
  resources: { collections: Array<{ id: string; name: string; documentCount: number }>; buckets: Array<{ id: string; name: string }> };
  deployment: null | { status: string; url: string; logs: string[]; updatedAt: string };
  auditEvents: Array<{ actionId: string; actionType: string; message: string; status: string; timestamp: string }>;
};

type Dashboard = {
  founder: { name: string; email: string } | null;
  projects: Array<{ id: string; name: string; environment: string }>;
  selectedProject: Project | null;
};

type View = "overview" | "build" | "activity" | "settings";

const emptyDashboard: Dashboard = { founder: null, projects: [], selectedProject: null };
const navItems: Array<{ id: View; label: string; hint: string }> = [
  { id: "overview", label: "Overview", hint: "Your handoff" },
  { id: "build", label: "Build status", hint: "Backend surface" },
  { id: "activity", label: "Agent activity", hint: "Every action" },
  { id: "settings", label: "Workspace", hint: "Key controls" }
];

export default function HomePage() {
  const [signedIn, setSignedIn] = useState(false);
  const [persistentMode, setPersistentMode] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void resolveMode();
  }, []);

  useEffect(() => {
    if (signedIn && authResolved) void loadDashboard(selectedProjectId);
  }, [signedIn, selectedProjectId, authResolved]);

  async function resolveMode() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const payload = await response.json();
      if (payload.data?.founder) {
        setPersistentMode(true);
        setSignedIn(true);
      } else if (response.status !== 503 && payload.data !== null) {
        setPersistentMode(true);
      }
    } finally {
      setAuthResolved(true);
    }
  }

  async function loadDashboard(projectId?: string | null) {
    setLoading(true);
    setError(null);
    try {
      const base = persistentMode ? "/api/founder/dashboard" : "/api/demo/dashboard";
      const path = projectId ? base + "?projectId=" + encodeURIComponent(projectId) : base;
      const response = await fetch(path, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Unable to load your workspace.");
      setDashboard(payload.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load your workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!persistentMode) {
      setSignedIn(true);
      setNotice("Demo workspace unlocked. Your scoped key is ready to reveal.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(authMode === "signup" ? "/api/auth/signup" : "/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(authMode === "signup" ? { name: authName, email: authEmail, password: authPassword } : { email: authEmail, password: authPassword })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Unable to continue.");
      if (payload.data?.initialToken) setToken(payload.data.initialToken);
      setSignedIn(true);
      setAuthPassword("");
      setNotice(payload.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  async function revealSeedToken() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/seed", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Unable to prepare the demo.");
      if (payload.data.token) setToken(payload.data.token);
      setNotice(payload.message);
      await loadDashboard(selectedProjectId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to prepare the demo.");
    } finally {
      setLoading(false);
    }
  }

  async function rotateKey() {
    const project = dashboard.selectedProject;
    if (!project || !persistentMode) {
      setNotice("In local demo mode, restart the demo to issue a fresh key.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/founder/projects/" + encodeURIComponent(project.id) + "/tokens", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Unable to rotate the agent key.");
      setToken(payload.data.token);
      setNotice(payload.message);
      await loadDashboard(project.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to rotate the agent key.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(label + " copied. Keep it out of source control and screenshots.");
    } catch {
      setError("Clipboard access is unavailable. Select the value manually.");
    }
  }

  if (!authResolved) {
    return <main className="auth-page"><div className="auth-loading"><Brand /><span>Waking your workspace</span></div></main>;
  }

  if (!signedIn) {
    const isSignup = authMode === "signup";
    return <main className="auth-page">
      <div className="auth-noise" aria-hidden="true" />
      <section className="auth-stage">
        <div className="auth-intro">
          <Brand />
          <div className="intro-copy">
            <span className="eyebrow light">A safer way to build</span>
            <h1>Give your agent<br /><em>the keys to move.</em></h1>
            <p>One scoped VibeBase key is all your coding agent needs to shape the backend, auth, storage, and deployment. You stay in control of the story.</p>
          </div>
          <div className="auth-promise"><span className="promise-ring">01</span><span>Provider credentials never leave VibeBase.</span></div>
        </div>
        <section className="auth-panel">
          <div className="auth-panel-top">
            <div><span className="eyebrow">Founder access</span><h2>{isSignup ? "Start with one calm handoff." : "Welcome back."}</h2></div>
            <div className={passwordFocused ? "guardian guardian-guarding" : "guardian"} aria-label={passwordFocused ? "The VibeBase guardian is protecting your password" : "VibeBase guardian"}>
              <span className="guardian-eye left" /><span className="guardian-eye right" /><span className="guardian-smile" /><span className="guardian-hand hand-left" /><span className="guardian-hand hand-right" />
            </div>
          </div>
          <p className="auth-subtitle">{isSignup ? "We create your private workspace automatically. No setup wizard, no infrastructure dashboard." : "Your workspace, key controls, and agent history are waiting."}</p>
          <form className="auth-form" onSubmit={submitAuth}>
            {isSignup ? <label className="field"><span>Your name</span><input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Ariana Shah" autoComplete="name" required={persistentMode} /></label> : null}
            <label className="field"><span>Email address</span><input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@company.com" type="email" autoComplete="email" required={persistentMode} /></label>
            <label className="field password-field"><span>Password</span><input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} placeholder={persistentMode ? "12 characters or more" : "Anything for the local demo"} type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} required={persistentMode} /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></label>
            <button className="button auth-submit" disabled={loading}>{loading ? "Opening workspace..." : isSignup ? "Create my workspace" : "Enter VibeBase"} <span aria-hidden="true">-&gt;</span></button>
          </form>
          <button className="auth-switch" type="button" onClick={() => setAuthMode(isSignup ? "signin" : "signup")}>{isSignup ? "Already have a workspace? Sign in" : "New founder? Create your workspace"}</button>
          {error ? <div className="message error" role="alert">{error}</div> : null}
          <div className="auth-footnote"><span className="proof-signal" /> {persistentMode ? "Encrypted HTTP-only session. Provider credentials stay server-side." : "Local demo mode. Your demo workspace is ready in one click."}</div>
        </section>
      </section>
    </main>;
  }

  const project = dashboard.selectedProject;
  const agentSetup = token ? "VIBEBASE_API_TOKEN=" + token + "\nVIBEBASE_API_URL=http://localhost:3000/api" : null;
  const resourceCount = (project?.resources.collections.length ?? 0) + (project?.resources.buckets.length ?? 0);

  return <main className="app-shell">
    <div className="app-frame">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-name"><span>Workspace</span><strong>{project?.name ?? "Loading..."}</strong><small>Private by default</small></div>
        <nav className="nav" aria-label="Workspace navigation">
          {navItems.map((item, index) => <button className={activeView === item.id ? "nav-item active" : "nav-item"} key={item.id} onClick={() => setActiveView(item.id)}><span className="nav-number">0{index + 1}</span><span><strong>{item.label}</strong><small>{item.hint}</small></span></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="founder-chip"><span>{(dashboard.founder?.name ?? "F").slice(0, 1).toUpperCase()}</span><div><strong>{dashboard.founder?.name ?? "Founder"}</strong><small>{persistentMode ? "Self-hosted account" : "Local demo"}</small></div></div>
          <div className="adapter-note"><span className="status-dot" /><span><strong>Control plane on</strong><br />Appwrite + Dokploy stay hidden</span></div>
        </div>
      </aside>
      <section className="workspace-content">
        <header className="topbar"><div><span className="eyebrow">VibeBase / {activeView}</span><p>{activeView === "overview" ? "Founder control plane" : activeView === "build" ? "What your agent is shaping" : activeView === "activity" ? "A readable record of change" : "Key and workspace controls"}</p></div><div className="topbar-actions"><span className="environment-pill"><i /> {project?.environment ?? "local"}</span><button className="icon-button" onClick={() => void loadDashboard(selectedProjectId)} aria-label="Refresh workspace" disabled={loading}>Refresh</button></div></header>
        {error ? <div className="message error" role="alert">{error}</div> : null}
        {notice ? <div className="message success">{notice}</div> : null}
        {!project ? <section className="empty-workspace"><span className="eyebrow">Preparing your workspace</span><h2>VibeBase is connecting your agent surface.</h2><p>Refresh once the local control plane is ready.</p></section> : null}
        {project && activeView === "overview" ? <Overview project={project} token={token} loading={loading} onReveal={revealSeedToken} onCopy={copy} agentSetup={agentSetup} onNavigate={setActiveView} persistentMode={persistentMode} /> : null}
        {project && activeView === "build" ? <BuildStatus project={project} resourceCount={resourceCount} /> : null}
        {project && activeView === "activity" ? <Activity project={project} /> : null}
        {project && activeView === "settings" ? <Settings project={project} token={token} loading={loading} persistentMode={persistentMode} onRotate={rotateKey} onCopy={copy} /> : null}
        {project ? <footer className="workspace-footer"><span>{resourceCount} resources tracked</span><span>{project.auditEvents.length} agent events</span><span>One scoped workspace</span></footer> : null}
      </section>
    </div>
  </main>;
}

function Overview({ project, token, loading, onReveal, onCopy, agentSetup, onNavigate, persistentMode }: { project: Project; token: string | null; loading: boolean; onReveal: () => Promise<void>; onCopy: (value: string, label: string) => Promise<void>; agentSetup: string | null; onNavigate: (view: View) => void; persistentMode: boolean }) {
  return <div className="view-stack overview-view">
    <section className="handoff-hero">
      <div className="hero-lattice" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="hero-copy"><span className="eyebrow light">Your agent's starting point</span><h1>Give this key to<br /><em>your coding agent.</em></h1><p>It will handle the backend work. You keep the one place to see what changed, why it changed, and what is ready next.</p></div>
      <div className="hero-key-card">
        <div className="key-card-head"><span>VibeBase agent key</span><span className="key-live"><i /> Scoped</span></div>
        {token ? <><code>{token}</code><div className="key-actions"><button className="button light-button" onClick={() => void onCopy(token, "Agent key")}>Copy key</button><button className="text-button" onClick={() => agentSetup && void onCopy(agentSetup, "Agent setup")}>Copy setup</button></div><small>Shown in this session only. Never share provider credentials.</small></> : <><div className="key-placeholder"><span>vb_</span><i /><i /><i /></div><p>{project.token?.pendingReveal ? "Your scoped key is ready. Reveal it once, then hand it to the agent." : "For your safety, the full key is not stored in the dashboard. Rotate one from Workspace when needed."}</p>{project.token?.pendingReveal && !persistentMode ? <button className="button light-button" onClick={() => void onReveal()} disabled={loading}>Reveal my agent key</button> : null}</>}
      </div>
    </section>
    <section className="briefing-strip"><div><span className="eyebrow">The handoff</span><strong>Founder approves. Agent builds. VibeBase records.</strong></div><button className="text-button" onClick={() => onNavigate("activity")}>See agent history -&gt;</button></section>
    <section className="signal-grid">
      <article className="signal-card agent-signal"><span className="card-label">Agent status</span><h3>{project.token?.status === "active" ? "Ready to build" : "Key needed"}</h3><p>{project.token?.status === "active" ? "Project-scoped access is active." : "Issue a scoped key before handoff."}</p><span className="status-line"><i /> Waiting for your prompt</span></article>
      <article className="signal-card"><span className="card-label">Backend</span><h3>{project.resources.collections.length} data spaces</h3><p>{project.resources.collections.map((item) => item.name).join(", ") || "Your agent will define the first collection."}</p><button className="card-link" onClick={() => onNavigate("build")}>Inspect backend -&gt;</button></article>
      <article className="signal-card"><span className="card-label">Deployment</span><h3 className="status-heading"><i /> {project.deployment?.status ?? "Not connected"}</h3><p>{project.deployment?.url ?? "Your agent can connect a deployment target."}</p><button className="card-link" onClick={() => onNavigate("build")}>View delivery -&gt;</button></article>
    </section>
    <section className="overview-bottom"><article className="agent-prompt-card"><div><span className="eyebrow">Give your agent a direction</span><h2>"Set up the backend for my app."</h2><p>Ask in plain English. The agent translates the work into scoped VibeBase actions.</p></div><div className="prompt-terminal"><span>$</span> create a secure app backend <i>ready</i></div></article><article className="mini-activity"><div className="section-heading"><div><span className="eyebrow">Latest signal</span><h2>Agent activity</h2></div><button className="text-button" onClick={() => onNavigate("activity")}>Open trail</button></div>{project.auditEvents.slice(0, 2).map((event) => <EventLine event={event} key={event.actionId} />)}</article></section>
  </div>;
}

function BuildStatus({ project, resourceCount }: { project: Project; resourceCount: number }) {
  return <div className="view-stack"><section className="page-hero"><span className="eyebrow">Backend surface</span><h1>Your agent's build map.</h1><p>{resourceCount ? "Every connected resource is shown here as a simple health signal, not an infrastructure console." : "There is nothing to configure here. Hand the key to your agent and this map will fill in as it builds."}</p></section><section className="build-grid"><ResourcePanel title="Database" label="Data spaces" items={project.resources.collections.map((item) => item.name + " / " + item.documentCount + " documents")} empty="No data spaces yet. Your agent can create the schema." accent="blue" /><ResourcePanel title="Storage" label="Buckets" items={project.resources.buckets.map((item) => item.name)} empty="No buckets yet. Files stay behind scoped storage rules." accent="orange" /><ResourcePanel title="Auth" label="Access layer" items={["Protected through VibeBase policy", "Provider credentials are hidden"]} empty="" accent="green" /><article className="resource-panel deployment-resource"><div className="resource-icon">04</div><span className="card-label">Delivery</span><h2>{project.deployment?.status ?? "Awaiting target"}</h2><p>{project.deployment?.url ?? "The agent can attach a narrow deployment target when it is ready."}</p><div className="compact-logs">{project.deployment?.logs.length ? project.deployment.logs.slice(-3).map((log, index) => <span key={log + index}>{log}</span>) : <span>No deployment logs yet.</span>}</div></article></section><section className="analytics-panel"><div><span className="eyebrow">Workspace signal</span><h2>Build activity, at a glance.</h2><p>These are control-plane signals, not app-user analytics.</p></div><div className="signal-bars" aria-label="Recent agent activity visualization">{[36, 58, 44, 75, 50, 92, 68].map((height, index) => <span key={index} style={{ height: height + "%" }} />)}</div><div className="analytics-stat"><strong>{project.auditEvents.length}</strong><span>recorded actions</span></div></section></div>;
}

function Activity({ project }: { project: Project }) {
  return <div className="view-stack"><section className="page-hero activity-hero"><span className="eyebrow">Agent activity</span><h1>Nothing happens<br /><em>off the record.</em></h1><p>Every VibeBase write is tied to your workspace, a scope, a timestamp, and an action ID. Secrets stay redacted.</p></section><section className="activity-board"><div className="activity-filter"><span><i /> Live audit trail</span><small>{project.auditEvents.length} events in this workspace</small></div><div className="full-timeline">{project.auditEvents.length ? project.auditEvents.map((event) => <EventLine event={event} key={event.actionId} detailed />) : <div className="timeline-empty">When your agent makes a scoped change, the story appears here.</div>}</div></section></div>;
}

function Settings({ project, token, loading, persistentMode, onRotate, onCopy }: { project: Project; token: string | null; loading: boolean; persistentMode: boolean; onRotate: () => Promise<void>; onCopy: (value: string, label: string) => Promise<void> }) {
  return <div className="view-stack"><section className="page-hero"><span className="eyebrow">Workspace controls</span><h1>Keep the handoff<br />intentional.</h1><p>VibeBase created this private workspace when you joined. The agent operates it; you control the key and the visibility.</p></section><section className="settings-grid"><article className="settings-card"><span className="card-label">Active workspace</span><h2>{project.name}</h2><p>Local environment with one project-scoped agent boundary.</p><div className="setting-row"><span>Environment</span><strong>{project.environment}</strong></div><div className="setting-row"><span>Provider access</span><strong>Server-side only</strong></div></article><article className="settings-card key-settings"><span className="card-label">Agent key</span><h2>{project.token?.status === "active" ? "Scoped and active" : "No active key"}</h2><p>{token ? "A new key is visible in this session. Copy it now and then remove it from view." : "Keys are never stored in the browser. Create a fresh key only when your agent needs it."}</p><div className="settings-actions">{token ? <button className="button primary" onClick={() => void onCopy(token, "Agent key")}>Copy visible key</button> : null}<button className="button secondary" onClick={() => void onRotate()} disabled={loading}>{persistentMode ? "Rotate agent key" : "How demo keys work"}</button></div></article><article className="settings-card safety-card"><span className="card-label">Safety posture</span><h2>One key. One workspace.</h2><ul><li>Provider admin keys are never exposed.</li><li>Writes are scope checked and audited.</li><li>Deployment secrets remain redacted.</li></ul></article></section></div>;
}

function ResourcePanel({ title, label, items, empty, accent }: { title: string; label: string; items: string[]; empty: string; accent: string }) {
  return <article className={"resource-panel " + accent}><div className="resource-icon">{title.slice(0, 2).toUpperCase()}</div><span className="card-label">{label}</span><h2>{title}</h2>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{empty}</p>}</article>;
}

function EventLine({ event, detailed = false }: { event: Project["auditEvents"][number]; detailed?: boolean }) {
  return <div className={event.status === "failed" ? "event-line failed" : "event-line"}><span className="event-dot" /><div><strong>{humanize(event.actionType)}</strong><p>{event.message}</p>{detailed ? <small>{new Date(event.timestamp).toLocaleString()} <b>Action</b> {event.actionId}</small> : null}</div>{!detailed ? <time>{relativeTime(event.timestamp)}</time> : <span className="event-status">{event.status}</span>}</div>;
}

function Brand() {
  return <div className="brand-line"><span className="brand-mark"><i /><i /><i /></span><span>VibeBase</span><small>LOCAL</small></div>;
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(".", " / ");
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
}
