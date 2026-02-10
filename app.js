const TASKS_KEY='mc_v6_tasks';
const AGENTS_KEY='mc_v6_agents';

let tasks=JSON.parse(localStorage.getItem(TASKS_KEY)||'null')||[
  {id:'CT-003',title:'Investigar tendencias EUA/MEX marca blanca',priority:'P0',owner:'Sam',status:'doing',detail:'Fuentes + shortlist'},
  {id:'CT-004',title:'Ruta SKU MX→US vs Import→MX',priority:'P0',owner:'Sam',status:'backlog',detail:''},
  {id:'CT-005',title:'Tabla operativa 20 SKUs',priority:'P0',owner:'Sam',status:'backlog',detail:''}
];

let agents=JSON.parse(localStorage.getItem(AGENTS_KEY)||'null')||[
  {id:'sam',name:'Sam',emoji:'⚙️',state:'Working',task:'Investigación SKU',x:260,y:180,color:'#9ad1ff'},
  {id:'henry',name:'Henry',emoji:'🤖',state:'Working',task:'Council prep',x:320,y:250,color:'#9cff9c'},
  {id:'alex',name:'Alex',emoji:'🧠',state:'Idle',task:'',x:120,y:320,color:'#d4a0ff'},
  {id:'codex',name:'Codex',emoji:'🧡',state:'Moving',task:'Automatizando pipeline',x:460,y:290,color:'#ffb173'},
  {id:'flash',name:'Flash',emoji:'🟢',state:'Moving',task:'Follow-ups',x:420,y:430,color:'#80ffbf'}
];

const columns=[['backlog','Backlog'],['doing','Doing'],['blocked','Blocked'],['done','Done']];
let current='sam', selectedTask=null;
const canvas=document.getElementById('officeCanvas');

function save(){localStorage.setItem(TASKS_KEY,JSON.stringify(tasks));localStorage.setItem(AGENTS_KEY,JSON.stringify(agents));}
function byId(id){return agents.find(a=>a.id===id)}

function initTabs(){
  const tabs=[...document.querySelectorAll('.tab[data-tab]')];
  tabs.forEach(b=>b.addEventListener('click',()=>{
    tabs.forEach(x=>x.classList.remove('active')); b.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    const view=document.getElementById('view-'+b.dataset.tab);
    if(view) view.classList.add('active');
  }));
}

function renderKanban(){
  const root=document.getElementById('kanban');
  root.innerHTML='';
  root.style.display='grid';root.style.gridTemplateColumns='repeat(4,minmax(220px,1fr))';root.style.gap='10px';root.style.padding='10px';
  columns.forEach(([k,label])=>{
    const col=document.createElement('section'); col.className='col';
    col.innerHTML=`<h3>${label}</h3><div class='drop' data-k='${k}'></div>`;
    const drop=col.querySelector('.drop');
    drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};
    drop.ondragleave=()=>drop.classList.remove('over');
    drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');const id=e.dataTransfer.getData('text/plain');const t=tasks.find(x=>x.id===id);if(t){t.status=k;save();renderKanban();}};
    tasks.filter(t=>t.status===k).forEach(t=>drop.append(taskCard(t)));
    root.append(col);
  });
}

function taskCard(t){
  const n=document.createElement('article'); n.className='card'; n.draggable=true;
  n.innerHTML=`<div class='row'><strong class='id'>${t.id}</strong><span class='priority'>${t.priority}</span></div><h3 class='title'>${t.title}</h3><p class='meta'>${t.owner} · ${t.status}</p>`;
  n.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',t.id));
  n.addEventListener('click',()=>openTask(t.id));
  return n;
}

function openTask(id){
  const t=tasks.find(x=>x.id===id); if(!t) return; selectedTask=id;
  dTitle.textContent=t.title; dDetail.value=t.detail||''; dAssignee.value=t.owner||''; dStatus.value=t.status;
  document.getElementById('taskDialog').showModal();
}

document.getElementById('saveTask').onclick=(e)=>{
  e.preventDefault();
  const t=tasks.find(x=>x.id===selectedTask); if(!t) return;
  t.detail=dDetail.value; t.owner=dAssignee.value||'Sam'; t.status=dStatus.value;
  save(); document.getElementById('taskDialog').close(); renderKanban();
};

document.getElementById('addTask').onclick=()=>{
  const title=taskTitle.value.trim(); if(!title) return;
  const owner=taskAssignee.value.trim()||'Sam';
  const n=(tasks.map(t=>parseInt((t.id.match(/\d+/)||['0'])[0],10)).sort((a,b)=>b-a)[0]||5)+1;
  tasks.unshift({id:`CT-${String(n).padStart(3,'0')}`,title,priority:taskPriority.value,owner,status:'backlog',detail:''});
  taskTitle.value=''; taskAssignee.value=''; save(); renderKanban();
};

function renderOffice(){
  canvas.querySelectorAll('.agent').forEach(n=>n.remove());
  agents.forEach(a=>{
    const n=document.createElement('div'); n.className=`agent ${a.state}`;
    n.style.left=a.x+'px'; n.style.top=a.y+'px';
    n.innerHTML=`<span>${a.emoji}</span><span class='name' style='color:${a.color}'>${a.name}</span>`;
    n.onclick=()=>select(a.id);
    canvas.append(n);
  });
  const sam=byId('sam'); if(sam) document.getElementById('samPill').textContent=sam.state;
}

function renderPicker(){
  agentPick.innerHTML=''; agents.forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name;agentPick.append(o)});
}
function select(id){current=id; const a=byId(id); if(!a) return; agentPick.value=id; agentState.value=a.state; agentTask.value=a.task||''; bubbleLabel.textContent=`${a.name} - ${a.task||'No task'}`;}

saveAgent.onclick=()=>{const a=byId(current); if(!a) return; a.state=agentState.value; a.task=agentTask.value.trim(); save(); renderOffice(); select(current);};
agentPick.onchange=()=>select(agentPick.value);

function roam(){
  const w=canvas.clientWidth-60,h=canvas.clientHeight-70;
  agents.forEach(a=>{if(a.state==='Moving'){a.x=Math.max(20,Math.min(w,a.x+(Math.random()*90-45)));a.y=Math.max(90,Math.min(h,a.y+(Math.random()*90-45)));}});
  save(); renderOffice();
}
setInterval(roam,2200);

initTabs(); renderKanban(); renderPicker(); renderOffice(); select(current);