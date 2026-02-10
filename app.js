/* ===== Mission Control v9 — app.js ===== */

const TASKS_KEY = 'mc_v8_tasks';
const AGENTS_KEY = 'mc_v8_agents';
const LOG_KEY = 'mc_v9_log';
const LOG_MAX = 200;

/* --- Default data --- */
const tasksDefault = [
  { id: 'CT-003', title: 'Research USA/MEX white-label trends', priority: 'P0', owner: 'Sam', status: 'doing', detail: 'Sources + shortlist' },
  { id: 'CT-004', title: 'Route SKU MX→US vs Import→MX', priority: 'P0', owner: 'Sam', status: 'backlog', detail: '' },
  { id: 'CT-005', title: 'Ops table for 20 SKUs', priority: 'P0', owner: 'Sam', status: 'backlog', detail: '' }
];

const agentsDefault = [
  { id: 'sam',   name: 'Sam',   role: 'AI Operator',     status: 'Working', task: 'SKU research',       x: 250, y: 190, color: '#6fb2ff', desk: 0 },
  { id: 'henry', name: 'Henry', role: 'Research Agent',   status: 'Moving',  task: 'Build council prep', x: 110, y: 300, color: '#7ee787', desk: 1 },
  { id: 'codex', name: 'Codex', role: 'Coding Agent',     status: 'Idle',    task: '',                   x: 410, y: 270, color: '#ffb86c', desk: 2 },
  { id: 'flash', name: 'Flash', role: 'Ops Agent',        status: 'Moving',  task: 'Follow-ups',         x: 320, y: 360, color: '#80ffbf', desk: 3 }
];

/* --- State --- */
let tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || 'null') || tasksDefault;
let agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || 'null') || agentsDefault;
let activityLog = JSON.parse(localStorage.getItem(LOG_KEY) || 'null') || [];
let selectedTask = null;
let selectedAgent = agents[0]?.id || null;

const cols = [['backlog', 'Backlog'], ['doing', 'Doing'], ['blocked', 'Blocked'], ['done', 'Done']];
const deskSpots = [
  { x: 70, y: 122 }, { x: 180, y: 122 }, { x: 290, y: 122 },
  { x: 400, y: 122 }, { x: 510, y: 122 }, { x: 620, y: 122 }
];

/* --- Helpers --- */
const $ = id => document.getElementById(id);
function save() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
}
function saveLog() { localStorage.setItem(LOG_KEY, JSON.stringify(activityLog)); }
function byId(id) { return agents.find(a => a.id === id); }

/* --- Activity logging --- */
function logActivity(msg, type) {
  const entry = { msg, type: type || 'info', ts: Date.now() };
  activityLog.unshift(entry);
  if (activityLog.length > LOG_MAX) activityLog.length = LOG_MAX;
  saveLog();
  renderMiniLog();
}

function renderMiniLog() {
  const ul = $('miniLog');
  if (!ul) return;
  ul.innerHTML = '';
  activityLog.slice(0, 5).forEach(e => {
    const li = document.createElement('li');
    li.textContent = e.msg;
    ul.append(li);
  });
}

function renderActivity() {
  const root = $('activityFeed');
  if (!root) return;
  root.innerHTML = '';
  if (activityLog.length === 0) {
    root.innerHTML = '<p style="color:var(--muted);padding:10px">No activity yet.</p>';
    return;
  }
  activityLog.forEach(e => {
    const d = document.createElement('div');
    d.className = 'activity-item';
    const date = new Date(e.ts);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    d.innerHTML = `<span class="timestamp">${time}</span><span class="msg">${e.msg}</span>`;
    root.append(d);
  });
}

/* --- Tabs --- */
function initTabs() {
  const tabs = [...document.querySelectorAll('.tab[data-tab]')];
  tabs.forEach(b => b.onclick = () => {
    tabs.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = $('view-' + b.dataset.tab);
    if (view) view.classList.add('active');
    if (b.dataset.tab === 'activity') renderActivity();
  });
}

/* --- Status chip --- */
function updateChip() {
  const working = agents.filter(a => a.status === 'Working').length;
  $('chipLabel').textContent = `${working}/${agents.length} agents working`;
}

/* --- Populate datalists --- */
function populateDataLists() {
  const names = agents.map(a => a.name);
  ['agentNames', 'agentNames2'].forEach(dlId => {
    const dl = $(dlId);
    if (!dl) return;
    dl.innerHTML = '';
    names.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n;
      dl.append(opt);
    });
  });
}

/* --- Kanban --- */
function renderKanban() {
  const root = $('kanban');
  root.innerHTML = '';
  cols.forEach(([k, label]) => {
    const col = document.createElement('section');
    col.className = 'col';
    col.innerHTML = `<h3>${label}</h3><div class='drop' data-k='${k}'></div>`;
    const drop = col.querySelector('.drop');

    drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => {
      e.preventDefault();
      drop.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      const t = tasks.find(x => x.id === id);
      if (t) {
        const prev = t.status;
        t.status = k;
        save();
        renderKanban();
        logActivity(`Task ${t.id} moved from ${prev} to ${k}`, 'task');
      }
    };

    tasks.filter(t => t.status === k).forEach(t => drop.append(taskCard(t)));
    root.append(col);
  });
}

function taskCard(t) {
  const n = document.createElement('article');
  n.className = 'card';
  n.draggable = true;
  const pClass = t.priority ? t.priority.toLowerCase() : 'p2';
  n.innerHTML = `<div class='row'><strong class='id'>${t.id}</strong><span class='priority ${pClass}'>${t.priority}</span></div><h3 class='title'>${t.title}</h3><p class='meta'>${t.owner} · ${t.status}</p>`;
  n.ondragstart = e => e.dataTransfer.setData('text/plain', t.id);
  n.onclick = () => openTask(t.id);
  return n;
}

function openTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  selectedTask = id;
  $('dTitle').textContent = t.title;
  $('dDetail').value = t.detail || '';
  $('dAssignee').value = t.owner || '';
  $('dPriority').value = t.priority || 'P2';
  $('dStatus').value = t.status;
  $('taskDialog').showModal();
}

$('saveTask').onclick = (e) => {
  e.preventDefault();
  const t = tasks.find(x => x.id === selectedTask);
  if (!t) return;
  t.detail = $('dDetail').value;
  t.owner = $('dAssignee').value || 'Sam';
  t.priority = $('dPriority').value;
  t.status = $('dStatus').value;
  save();
  $('taskDialog').close();
  renderKanban();
  renderOrg();
  logActivity(`Task ${t.id} updated (${t.priority}, ${t.status})`, 'task');
};

$('deleteTask').onclick = () => {
  if (!selectedTask) return;
  const t = tasks.find(x => x.id === selectedTask);
  tasks = tasks.filter(x => x.id !== selectedTask);
  save();
  $('taskDialog').close();
  renderKanban();
  renderOrg();
  logActivity(`Task ${t ? t.id : selectedTask} deleted`, 'task');
};

$('addTask').onclick = () => {
  const title = $('taskTitle').value.trim();
  if (!title) return;
  const owner = $('taskAssignee').value.trim() || 'Sam';
  const n = (tasks.map(t => parseInt((t.id.match(/\d+/) || ['0'])[0], 10)).sort((a, b) => b - a)[0] || 5) + 1;
  const id = `CT-${String(n).padStart(3, '0')}`;
  tasks.unshift({ id, title, priority: $('taskPriority').value, owner, status: 'backlog', detail: '' });
  $('taskTitle').value = '';
  $('taskAssignee').value = '';
  save();
  renderKanban();
  renderOrg();
  logActivity(`Task ${id} created: ${title}`, 'task');
};

/* --- Office --- */
function renderDesks() {
  const map = $('officeMap');
  map.querySelectorAll('.desk').forEach(n => n.remove());
  deskSpots.forEach(p => {
    const d = document.createElement('div');
    d.className = 'desk';
    d.style.left = p.x + 'px';
    d.style.top = p.y + 'px';
    d.innerHTML = '<div class="monitor"></div>';
    map.append(d);
  });
}

function targetPos(agent) {
  if (agent.status === 'Working') {
    const d = deskSpots[agent.desk % deskSpots.length];
    return { x: d.x + 24, y: d.y + 34 };
  }
  if (agent.status === 'Idle') {
    return { x: 70 + (agent.desk * 95) % 650, y: 290 + ((agent.desk % 2) * 70) };
  }
  return { x: 140 + Math.random() * 520, y: 250 + Math.random() * 180 };
}

function renderOffice() {
  const map = $('officeMap');
  map.querySelectorAll('.agent').forEach(n => n.remove());
  renderDesks();

  agents.forEach(a => {
    const el = document.createElement('div');
    el.className = `agent ${a.status}`;
    el.style.left = a.x + 'px';
    el.style.top = a.y + 'px';
    el.innerHTML = `<div class='head'></div><div class='body' style='background:${a.color}'></div><div class='name'>${a.name}</div>`;
    el.onclick = () => selectAgent(a.id);
    map.append(el);
  });

  updateChip();
  if (selectedAgent) selectAgent(selectedAgent, false);
}

function selectAgent(id, fill = true) {
  selectedAgent = id;
  const a = byId(id);
  if (!a) return;
  $('selName').textContent = a.name;
  $('selMeta').textContent = `Role: ${a.role}`;
  $('speech').textContent = `${a.name} — ${a.task || 'No task'}`;

  // Update badge
  const badge = $('selBadge');
  badge.textContent = a.status;
  const colors = { Working: '#166534', Moving: '#92400e', Idle: '#475569' };
  badge.style.background = colors[a.status] || '#304784';

  if (fill) {
    $('agentState').value = a.status;
    $('agentTask').value = a.task || '';
  }
}

$('saveAgent').onclick = () => {
  const a = byId(selectedAgent);
  if (!a) return;
  const prevStatus = a.status;
  a.status = $('agentState').value;
  a.task = $('agentTask').value.trim();
  const t = targetPos(a);
  a.x = t.x;
  a.y = t.y;
  save();
  renderOffice();
  renderAgentsTable();
  populateDataLists();
  if (prevStatus !== a.status) {
    logActivity(`${a.name} status: ${prevStatus} → ${a.status}`, 'agent');
  }
  logActivity(`${a.name} updated — task: ${a.task || 'none'}`, 'agent');
};

/* --- Agents table --- */
function renderAgentsTable() {
  const root = $('agentsTable');
  root.innerHTML = '';
  agents.forEach(a => {
    const r = document.createElement('div');
    r.className = 'rowitem';
    r.innerHTML = `<b>${a.name}</b><span>${a.role}</span><span>${a.status}</span><span>${a.task || 'No task'}</span><button data-id='${a.id}'>Select</button>`;
    r.querySelector('button').onclick = () => {
      selectAgent(a.id);
      document.querySelector(".tab[data-tab='office']").click();
    };
    root.append(r);
  });
}

$('addAgent').onclick = () => {
  const name = $('aName').value.trim();
  const role = $('aRole').value.trim();
  if (!name || !role) return;
  const id = 'a' + Math.random().toString(36).slice(2, 8);
  agents.push({
    id, name, role, status: 'Idle', task: '',
    x: 120 + Math.random() * 500, y: 320,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    desk: agents.length % deskSpots.length
  });
  $('aName').value = '';
  $('aRole').value = '';
  save();
  renderAgentsTable();
  renderOffice();
  renderOrg();
  populateDataLists();
  logActivity(`Agent ${name} (${role}) added`, 'agent');
};

/* --- Org chart --- */
function renderOrg() {
  const root = $('orgAgents');
  root.innerHTML = '';
  const names = [...new Set(agents.map(a => a.name).concat(tasks.map(t => t.owner)))].filter(Boolean);
  names.forEach(n => {
    const d = document.createElement('div');
    d.className = 'org-node';
    d.textContent = n;
    root.append(d);
  });
}

/* --- Clear log --- */
$('clearLog').onclick = () => {
  activityLog = [];
  saveLog();
  renderActivity();
  renderMiniLog();
};

/* --- Roaming --- */
function roam() {
  agents.forEach(a => {
    if (a.status === 'Moving') {
      const t = targetPos(a);
      a.x = t.x;
      a.y = t.y;
    }
  });
  save();
  renderOffice();
}

/* --- Init --- */
initTabs();
populateDataLists();
renderKanban();
renderOffice();
renderAgentsTable();
renderOrg();
renderMiniLog();
logActivity('Mission Control v9 initialized', 'system');
setInterval(roam, 2600);
