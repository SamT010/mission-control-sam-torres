const STORAGE='missionControlV4';
const columns=[{k:'backlog',l:'Backlog'},{k:'doing',l:'Doing'},{k:'blocked',l:'Blocked'},{k:'done',l:'Done'}];
let tasks=JSON.parse(localStorage.getItem(STORAGE+'_tasks')||'null')||[
{id:'CT-003',title:'Investigar tendencias EUA/MEX marca blanca',priority:'P0',owner:'Sam',status:'doing',detail:'Fuentes + shortlist'},
{id:'CT-004',title:'Ruta SKU MX→US vs Import→MX',priority:'P0',owner:'Sam',status:'backlog',detail:''},
{id:'CT-005',title:'Tabla operativa 20 SKUs',priority:'P0',owner:'Sam',status:'backlog',detail:''}
];
let agents=JSON.parse(localStorage.getItem(STORAGE+'_agents')||'null')||[
{id:'sam',name:'Sam',sprite:'⚙️',state:'Working',task:'Investigación de SKUs',x:40,y:90},
{id:'ops',name:'Ops',sprite:'🚚',state:'Moving',task:'Follow-up carriers',x:140,y:180},
{id:'buy',name:'Compras',sprite:'📦',state:'Idle',task:'',x:260,y:120},
{id:'sales',name:'Comercial',sprite:'📈',state:'Working',task:'Presentación Neto',x:320,y:230}
];
let chat=JSON.parse(localStorage.getItem(STORAGE+'_chat')||'null')||[];
let timeline=JSON.parse(localStorage.getItem(STORAGE+'_timeline')||'null')||[];
let selectedTask=null, selectedAgent='sam';

const board=document.getElementById('board'); const tpl=document.getElementById('cardTpl'); const dialog=document.getElementById('taskDialog');
const officeGrid=document.getElementById('officeGrid');

function stamp(){return new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});} 
function pushTimeline(msg){timeline.unshift(`[${stamp()}] ${msg}`);timeline=timeline.slice(0,120);} 
function save(){localStorage.setItem(STORAGE+'_tasks',JSON.stringify(tasks));localStorage.setItem(STORAGE+'_agents',JSON.stringify(agents));localStorage.setItem(STORAGE+'_chat',JSON.stringify(chat));localStorage.setItem(STORAGE+'_timeline',JSON.stringify(timeline));}

function renderTabs(){document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');const tab=b.dataset.tab;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-'+tab).classList.add('active');});}

function card(t){const n=tpl.content.firstElementChild.cloneNode(true);n.querySelector('.id').textContent=t.id;n.querySelector('.title').textContent=t.title;n.querySelector('.meta').textContent=`${t.owner} · ${t.status}`;n.querySelector('.priority').textContent=t.priority;n.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',t.id));n.onclick=()=>openTask(t.id);return n;}
function renderBoard(){board.innerHTML='';columns.forEach(c=>{const col=document.createElement('section');col.className='col';col.innerHTML=`<h3>${c.l}</h3><div class='drop' data-k='${c.k}'></div>`;const drop=col.querySelector('.drop');drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};drop.ondragleave=()=>drop.classList.remove('over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');const id=e.dataTransfer.getData('text/plain');const t=tasks.find(x=>x.id===id);if(t){t.status=c.k;pushTimeline(`Task ${t.id} moved to ${c.l}`);save();renderBoard();renderTimeline();}};tasks.filter(t=>t.status===c.k).forEach(t=>drop.append(card(t)));board.append(col);});}
function openTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;selectedTask=id;dTitle.textContent=t.title;dDetail.value=t.detail||'';dAssignee.value=t.owner||'';dStatus.value=t.status;dialog.showModal();}
saveTask.onclick=(e)=>{e.preventDefault();const t=tasks.find(x=>x.id===selectedTask);if(!t)return;t.detail=dDetail.value;t.owner=dAssignee.value||'Sam';t.status=dStatus.value;pushTimeline(`Task ${t.id} updated by ${t.owner}`);save();dialog.close();renderBoard();renderOrg();renderTimeline();};
addTask.onclick=()=>{const title=taskTitle.value.trim();if(!title)return;const owner=taskAssignee.value.trim()||'Sam';const n=(tasks.map(t=>parseInt((t.id.match(/\d+/)||['0'])[0],10)).sort((a,b)=>b-a)[0]||5)+1;tasks.unshift({id:`CT-${String(n).padStart(3,'0')}`,title,priority:taskPriority.value,owner,status:'backlog',detail:''});pushTimeline(`Task CT-${String(n).padStart(3,'0')} created`);taskTitle.value='';taskAssignee.value='';save();renderBoard();renderOrg();renderTimeline();};

function renderOffice(){officeGrid.innerHTML='';for(let i=0;i<24;i++){const d=document.createElement('div');d.className='desk';if(i%6===0)d.textContent='Desk';officeGrid.append(d);}agents.forEach(a=>{const el=document.createElement('div');el.className=`agent ${a.state}`;el.style.left=a.x+'px';el.style.top=a.y+'px';el.innerHTML=`<div class='sprite'>${a.sprite||'🙂'}</div><div class='name'>${a.name}</div><div class='state'>${a.state}</div>`;el.onclick=()=>selectAgent(a.id);officeGrid.append(el);});selectAgent(selectedAgent,false);} 
function selectAgent(id,focus=true){selectedAgent=id;const a=agents.find(x=>x.id===id);if(!a)return;agentName.textContent=a.name;agentState.textContent=`Estado: ${a.state}`;agentStatus.value=a.state;agentTask.value=a.task||'';if(focus) agentTask.focus();}
saveAgent.onclick=()=>{const a=agents.find(x=>x.id===selectedAgent);if(!a)return;a.state=agentStatus.value;a.task=agentTask.value;pushTimeline(`${a.name} set to ${a.state}`);save();renderOffice();renderOrg();renderTimeline();};

function stepMovement(){agents.forEach(a=>{if(a.state==='Moving'){a.x=Math.max(10,Math.min(officeGrid.clientWidth-50,a.x+(Math.random()*60-30)));a.y=Math.max(10,Math.min(officeGrid.clientHeight-50,a.y+(Math.random()*60-30)));}});save();renderOffice();}

function renderChat(){const feed=document.getElementById('chatFeed');feed.innerHTML='';chat.slice(-40).forEach(m=>{const d=document.createElement('div');d.className='chat-item';d.innerHTML=`<b>${m.who}</b> <span>${m.at}</span><br/>${m.text}`;feed.append(d)});feed.scrollTop=feed.scrollHeight;}
sendChat.onclick=()=>{const txt=chatInput.value.trim();if(!txt)return;const a=agents.find(x=>x.id===selectedAgent)||agents[0];chat.push({who:a.name,at:stamp(),text:txt});pushTimeline(`Chat message from ${a.name}`);chatInput.value='';save();renderChat();renderTimeline();};

function renderTimeline(){const box=document.getElementById('timeline');box.innerHTML='';timeline.slice(0,60).forEach(t=>{const d=document.createElement('div');d.className='timeline-item';d.textContent=t;box.append(d)});} 
function renderOrg(){const row=document.getElementById('orgAgents');row.innerHTML='';[...new Set([...agents.map(a=>a.name),...tasks.map(t=>t.owner)])].filter(Boolean).forEach(n=>{const d=document.createElement('div');d.className='agent-node';d.textContent=n;row.append(d);});}

renderTabs();renderBoard();renderOffice();renderOrg();renderChat();renderTimeline();
setInterval(stepMovement, 2500);
