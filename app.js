const TASKS_KEY='mc_v8_tasks';
const AGENTS_KEY='mc_v8_agents';

const tasksDefault=[
{id:'CT-003',title:'Investigar tendencias EUA/MEX marca blanca',priority:'P0',owner:'Sam',status:'doing',detail:'Fuentes + shortlist'},
{id:'CT-004',title:'Ruta SKU MX→US vs Import→MX',priority:'P0',owner:'Sam',status:'backlog',detail:''},
{id:'CT-005',title:'Tabla operativa 20 SKUs',priority:'P0',owner:'Sam',status:'backlog',detail:''}
];

const agentsDefault=[
{id:'sam',name:'Sam',role:'AI Operator',status:'Working',task:'Investigación SKU',x:250,y:190,color:'#6fb2ff',desk:0},
{id:'henry',name:'Henry',role:'Research Agent',status:'Moving',task:'Build council prep',x:110,y:300,color:'#7ee787',desk:1},
{id:'codex',name:'Codex',role:'Coding Agent',status:'Idle',task:'',x:410,y:270,color:'#ffb86c',desk:2},
{id:'flash',name:'Flash',role:'Ops Agent',status:'Moving',task:'Follow-ups',x:320,y:360,color:'#80ffbf',desk:3}
];

let tasks=JSON.parse(localStorage.getItem(TASKS_KEY)||'null')||tasksDefault;
let agents=JSON.parse(localStorage.getItem(AGENTS_KEY)||'null')||agentsDefault;
let selectedTask=null, selectedAgent=agents[0]?.id||null;
const cols=[['backlog','Backlog'],['doing','Doing'],['blocked','Blocked'],['done','Done']];
const deskSpots=[{x:70,y:122},{x:180,y:122},{x:290,y:122},{x:400,y:122},{x:510,y:122},{x:620,y:122}];

const $=id=>document.getElementById(id);
function save(){localStorage.setItem(TASKS_KEY,JSON.stringify(tasks));localStorage.setItem(AGENTS_KEY,JSON.stringify(agents));}
function byId(id){return agents.find(a=>a.id===id)}

function initTabs(){const tabs=[...document.querySelectorAll('.tab[data-tab]')];tabs.forEach(b=>b.onclick=()=>{tabs.forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));const view=$('view-'+b.dataset.tab);if(view)view.classList.add('active');});}

function renderKanban(){const root=$('kanban');root.innerHTML='';cols.forEach(([k,label])=>{const col=document.createElement('section');col.className='col';col.innerHTML=`<h3>${label}</h3><div class='drop' data-k='${k}'></div>`;const drop=col.querySelector('.drop');drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};drop.ondragleave=()=>drop.classList.remove('over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');const id=e.dataTransfer.getData('text/plain');const t=tasks.find(x=>x.id===id);if(t){t.status=k;save();renderKanban();}};tasks.filter(t=>t.status===k).forEach(t=>drop.append(taskCard(t)));root.append(col);});}
function taskCard(t){const n=document.createElement('article');n.className='card';n.draggable=true;n.innerHTML=`<div class='row'><strong class='id'>${t.id}</strong><span class='priority'>${t.priority}</span></div><h3 class='title'>${t.title}</h3><p class='meta'>${t.owner} · ${t.status}</p>`;n.ondragstart=e=>e.dataTransfer.setData('text/plain',t.id);n.onclick=()=>openTask(t.id);return n;}
function openTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;selectedTask=id;$('dTitle').textContent=t.title;$('dDetail').value=t.detail||'';$('dAssignee').value=t.owner||'';$('dStatus').value=t.status;$('taskDialog').showModal();}
$('saveTask').onclick=(e)=>{e.preventDefault();const t=tasks.find(x=>x.id===selectedTask);if(!t)return;t.detail=$('dDetail').value;t.owner=$('dAssignee').value||'Sam';t.status=$('dStatus').value;save();$('taskDialog').close();renderKanban();renderOrg();};
$('addTask').onclick=()=>{const title=$('taskTitle').value.trim();if(!title)return;const owner=$('taskAssignee').value.trim()||'Sam';const n=(tasks.map(t=>parseInt((t.id.match(/\d+/)||['0'])[0],10)).sort((a,b)=>b-a)[0]||5)+1;tasks.unshift({id:`CT-${String(n).padStart(3,'0')}`,title,priority:$('taskPriority').value,owner,status:'backlog',detail:''});$('taskTitle').value='';$('taskAssignee').value='';save();renderKanban();renderOrg();};

function renderDesks(){const map=$('officeMap');map.querySelectorAll('.desk').forEach(n=>n.remove());deskSpots.forEach((p)=>{const d=document.createElement('div');d.className='desk';d.style.left=p.x+'px';d.style.top=p.y+'px';d.innerHTML='<div class="monitor"></div>';map.append(d);});}
function targetPos(agent){if(agent.status==='Working'){const d=deskSpots[agent.desk % deskSpots.length];return {x:d.x+24,y:d.y+34};}
  if(agent.status==='Idle') return {x:70+(agent.desk*95)%650,y:290+((agent.desk%2)*70)};
  return {x:140+Math.random()*520,y:250+Math.random()*180};
}
function renderOffice(){const map=$('officeMap');map.querySelectorAll('.agent').forEach(n=>n.remove());renderDesks();agents.forEach(a=>{const el=document.createElement('div');el.className=`agent ${a.status}`;el.style.left=a.x+'px';el.style.top=a.y+'px';el.innerHTML=`<div class='head'></div><div class='body' style='background:${a.color}'></div><div class='name'>${a.name}</div>`;el.onclick=()=>selectAgent(a.id);map.append(el);});const sam=agents.find(a=>a.name.toLowerCase()==='sam');if(sam)$('samPill').textContent=`Sam: ${sam.status}`;if(selectedAgent)selectAgent(selectedAgent,false);}
function selectAgent(id,fill=true){selectedAgent=id;const a=byId(id);if(!a)return;$('selName').textContent=a.name;$('selMeta').textContent=`Role: ${a.role}`;$('speech').textContent=`${a.name} - ${a.task||'Sin tarea'}`;if(fill){$('agentState').value=a.status;$('agentTask').value=a.task||'';}}
$('saveAgent').onclick=()=>{const a=byId(selectedAgent);if(!a)return;a.status=$('agentState').value;a.task=$('agentTask').value.trim();const t=targetPos(a);a.x=t.x;a.y=t.y;save();renderOffice();renderAgentsTable();};

function renderAgentsTable(){const root=$('agentsTable');root.innerHTML='';agents.forEach(a=>{const r=document.createElement('div');r.className='rowitem';r.innerHTML=`<b>${a.name}</b><span>${a.role}</span><span>agent</span><span>${a.status}</span><button data-id='${a.id}'>Seleccionar</button>`;r.querySelector('button').onclick=()=>{selectAgent(a.id);document.querySelector(".tab[data-tab='office']").click();};root.append(r);});}
$('addAgent').onclick=()=>{const name=$('aName').value.trim();const role=$('aRole').value.trim();if(!name||!role)return;const id='a'+Math.random().toString(36).slice(2,8);agents.push({id,name,role,status:'Idle',task:'',x:120+Math.random()*500,y:320,color:'#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'),desk:agents.length%deskSpots.length});$('aName').value='';$('aRole').value='';save();renderAgentsTable();renderOffice();renderOrg();};

function renderOrg(){const root=$('orgAgents');root.innerHTML='';const names=[...new Set(agents.map(a=>a.name).concat(tasks.map(t=>t.owner)))].filter(Boolean);names.forEach(n=>{const d=document.createElement('div');d.className='org-node';d.textContent=n;root.append(d);});}

function roam(){agents.forEach(a=>{if(a.status==='Moving'){const t=targetPos(a);a.x=t.x;a.y=t.y;}});save();renderOffice();}

initTabs();renderKanban();renderOffice();renderAgentsTable();renderOrg();setInterval(roam,2600);
