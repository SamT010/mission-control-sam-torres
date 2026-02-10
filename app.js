const STORAGE='missionControlV3';
const columns=[{k:'backlog',l:'Backlog'},{k:'doing',l:'Doing'},{k:'blocked',l:'Blocked'},{k:'done',l:'Done'}];
let tasks=JSON.parse(localStorage.getItem(STORAGE)||'null')||[
{id:'CT-003',title:'Investigar tendencias EUA/MEX marca blanca',priority:'P0',owner:'Sam',status:'doing',detail:'Fuentes + shortlist'},
{id:'CT-004',title:'Ruta SKU MX→US vs Import→MX',priority:'P0',owner:'Sam',status:'backlog',detail:''},
{id:'CT-005',title:'Tabla operativa 20 SKUs',priority:'P0',owner:'Sam',status:'backlog',detail:''}
];
let agents=JSON.parse(localStorage.getItem(STORAGE+'_agents')||'null')||[
{id:'sam',name:'Sam',state:'Working',task:'Investigación de SKUs'},
{id:'buy',name:'Compras',state:'Idle',task:''},
{id:'ops',name:'Ops',state:'Moving',task:'Follow-up carriers'},
{id:'sales',name:'Comercial',state:'Working',task:'Presentación Neto'}
];
let selectedTask=null, selectedAgent='sam';
const board=document.getElementById('board'); const tpl=document.getElementById('cardTpl'); const dialog=document.getElementById('taskDialog');

function save(){localStorage.setItem(STORAGE,JSON.stringify(tasks));localStorage.setItem(STORAGE+'_agents',JSON.stringify(agents));}
function renderTabs(){document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');const tab=b.dataset.tab;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-'+tab).classList.add('active');});}
function card(t){const n=tpl.content.firstElementChild.cloneNode(true);n.querySelector('.id').textContent=t.id;n.querySelector('.title').textContent=t.title;n.querySelector('.meta').textContent=`${t.owner} · ${t.status}`;n.querySelector('.priority').textContent=t.priority;n.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',t.id));n.onclick=()=>openTask(t.id);return n;}
function renderBoard(){board.innerHTML='';columns.forEach(c=>{const col=document.createElement('section');col.className='col';col.innerHTML=`<h3>${c.l}</h3><div class='drop' data-k='${c.k}'></div>`;const drop=col.querySelector('.drop');drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};drop.ondragleave=()=>drop.classList.remove('over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');const id=e.dataTransfer.getData('text/plain');const t=tasks.find(x=>x.id===id);if(t){t.status=c.k;save();renderBoard();}};tasks.filter(t=>t.status===c.k).forEach(t=>drop.append(card(t)));board.append(col);});}
function openTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;selectedTask=id;dTitle.textContent=t.title;dDetail.value=t.detail||'';dAssignee.value=t.owner||'';dStatus.value=t.status;dialog.showModal();}
saveTask.onclick=(e)=>{e.preventDefault();const t=tasks.find(x=>x.id===selectedTask);if(!t)return;t.detail=dDetail.value;t.owner=dAssignee.value||'Sam';t.status=dStatus.value;save();dialog.close();renderBoard();renderOrg();};
addTask.onclick=()=>{const title=taskTitle.value.trim();if(!title)return;const owner=taskAssignee.value.trim()||'Sam';const n=(tasks.map(t=>parseInt((t.id.match(/\d+/)||['0'])[0],10)).sort((a,b)=>b-a)[0]||5)+1;tasks.unshift({id:`CT-${String(n).padStart(3,'0')}`,title,priority:taskPriority.value,owner,status:'backlog',detail:''});taskTitle.value='';taskAssignee.value='';save();renderBoard();renderOrg();};

function renderOffice(){const grid=document.getElementById('officeGrid');grid.innerHTML='';for(let i=0;i<16;i++){const d=document.createElement('div');d.className='desk';d.textContent='Desk';grid.append(d);}agents.forEach((a,idx)=>{const el=document.createElement('div');el.className=`agent ${a.state}`;el.style.gridColumn=String((idx%4)*2+1);el.style.gridRow=String(Math.floor(idx/4)*2+2);el.innerHTML=`<div class='name'>${a.name}</div><div class='state'>${a.state}</div>`;el.onclick=()=>selectAgent(a.id);grid.append(el);});selectAgent(selectedAgent,false);} 
function selectAgent(id,focus=true){selectedAgent=id;const a=agents.find(x=>x.id===id);if(!a)return;agentName.textContent=a.name;agentState.textContent=`Estado: ${a.state}`;agentStatus.value=a.state;agentTask.value=a.task||'';if(focus) agentTask.focus();}
saveAgent.onclick=()=>{const a=agents.find(x=>x.id===selectedAgent);if(!a)return;a.state=agentStatus.value;a.task=agentTask.value;save();renderOffice();renderOrg();};

function renderOrg(){const row=document.getElementById('orgAgents');row.innerHTML='';[...new Set([...agents.map(a=>a.name),...tasks.map(t=>t.owner)])].filter(Boolean).forEach(n=>{const d=document.createElement('div');d.className='agent-node';d.textContent=n;row.append(d);});}

renderTabs();renderBoard();renderOffice();renderOrg();