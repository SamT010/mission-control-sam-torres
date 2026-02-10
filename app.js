const TASKS_KEY='mc_v7_tasks';
const WORKERS_KEY='mc_v7_workers';
const tasksDefault=[
{id:'CT-003',title:'Investigar tendencias EUA/MEX marca blanca',priority:'P0',owner:'Sam',status:'doing',detail:'Fuentes + shortlist'},
{id:'CT-004',title:'Ruta SKU MX→US vs Import→MX',priority:'P0',owner:'Sam',status:'backlog',detail:''},
{id:'CT-005',title:'Tabla operativa 20 SKUs',priority:'P0',owner:'Sam',status:'backlog',detail:''}
];
const workersDefault=[
{id:'sam',name:'Sam',role:'AI Operator',type:'agent',status:'Working',task:'Investigación SKU',x:250,y:190,color:'#6fb2ff'},
{id:'sourcing',name:'Sourcing-1',role:'Sourcing',type:'human',status:'Moving',task:'Contactar proveedores',x:110,y:300,color:'#7ee787'},
{id:'ops',name:'Ops-1',role:'Logística',type:'human',status:'Working',task:'Tarifas transporte',x:410,y:270,color:'#ffb86c'}
];
let tasks=JSON.parse(localStorage.getItem(TASKS_KEY)||'null')||tasksDefault;
let workers=JSON.parse(localStorage.getItem(WORKERS_KEY)||'null')||workersDefault;
let selectedTask=null, selectedWorker=workers[0]?.id||null;
const cols=[['backlog','Backlog'],['doing','Doing'],['blocked','Blocked'],['done','Done']];

function save(){localStorage.setItem(TASKS_KEY,JSON.stringify(tasks));localStorage.setItem(WORKERS_KEY,JSON.stringify(workers));}
const $=id=>document.getElementById(id);
function workerById(id){return workers.find(w=>w.id===id)}

function initTabs(){const tabs=[...document.querySelectorAll('.tab[data-tab]')];tabs.forEach(b=>b.onclick=()=>{tabs.forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));const view=$('view-'+b.dataset.tab);if(view)view.classList.add('active');});}

function renderKanban(){const root=$('kanban');root.innerHTML='';cols.forEach(([k,label])=>{const col=document.createElement('section');col.className='col';col.innerHTML=`<h3>${label}</h3><div class='drop' data-k='${k}'></div>`;const drop=col.querySelector('.drop');drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};drop.ondragleave=()=>drop.classList.remove('over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');const id=e.dataTransfer.getData('text/plain');const t=tasks.find(x=>x.id===id);if(t){t.status=k;save();renderKanban();}};tasks.filter(t=>t.status===k).forEach(t=>drop.append(taskCard(t)));root.append(col);});}
function taskCard(t){const n=document.createElement('article');n.className='card';n.draggable=true;n.innerHTML=`<div class='row'><strong class='id'>${t.id}</strong><span class='priority'>${t.priority}</span></div><h3 class='title'>${t.title}</h3><p class='meta'>${t.owner} · ${t.status}</p>`;n.ondragstart=e=>e.dataTransfer.setData('text/plain',t.id);n.onclick=()=>openTask(t.id);return n;}
function openTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;selectedTask=id;$('dTitle').textContent=t.title;$('dDetail').value=t.detail||'';$('dAssignee').value=t.owner||'';$('dStatus').value=t.status;$('taskDialog').showModal();}
$('saveTask').onclick=(e)=>{e.preventDefault();const t=tasks.find(x=>x.id===selectedTask);if(!t)return;t.detail=$('dDetail').value;t.owner=$('dAssignee').value||'Sam';t.status=$('dStatus').value;save();$('taskDialog').close();renderKanban();renderOrg();};
$('addTask').onclick=()=>{const title=$('taskTitle').value.trim();if(!title)return;const owner=$('taskAssignee').value.trim()||'Sam';const n=(tasks.map(t=>parseInt((t.id.match(/\d+/)||['0'])[0],10)).sort((a,b)=>b-a)[0]||5)+1;tasks.unshift({id:`CT-${String(n).padStart(3,'0')}`,title,priority:$('taskPriority').value,owner,status:'backlog',detail:''});$('taskTitle').value='';$('taskAssignee').value='';save();renderKanban();renderOrg();};

function renderOffice(){const map=$('officeMap');map.querySelectorAll('.worker,.desk').forEach(n=>n.remove());for(let i=0;i<6;i++){const d=document.createElement('div');d.className='desk';d.style.left=(80+i*110)+'px';d.style.top='120px';map.append(d);}workers.forEach(w=>{const el=document.createElement('div');el.className=`worker ${w.status}`;el.style.left=w.x+'px';el.style.top=w.y+'px';el.innerHTML=`<div class='head'></div><div class='body' style='background:${w.color}'></div><div class='name'>${w.name}</div>`;el.onclick=()=>selectWorker(w.id);map.append(el);});const sam=workers.find(w=>w.name.toLowerCase().includes('sam'));if(sam)$('samPill').textContent=`Sam: ${sam.status}`;if(selectedWorker)selectWorker(selectedWorker,false);}
function selectWorker(id,updateInputs=true){selectedWorker=id;const w=workerById(id);if(!w)return;$('selName').textContent=w.name;$('selMeta').textContent=`${w.role} · ${w.type}`;$('speech').textContent=`${w.name} - ${w.task||'Sin tarea'}`;if(updateInputs){$('workerState').value=w.status;$('workerTask').value=w.task||'';}}
$('saveWorker').onclick=()=>{const w=workerById(selectedWorker);if(!w)return;w.status=$('workerState').value;w.task=$('workerTask').value.trim();save();renderOffice();renderWorkersTable();};

function renderWorkersTable(){const root=$('workersTable');root.innerHTML='';workers.forEach(w=>{const r=document.createElement('div');r.className='rowitem';r.innerHTML=`<b>${w.name}</b><span>${w.role}</span><span>${w.type}</span><span>${w.status}</span><button data-id='${w.id}'>Seleccionar</button>`;r.querySelector('button').onclick=()=>{selectWorker(w.id);document.querySelector(".tab[data-tab='office']").click();};root.append(r);});}
$('addWorker').onclick=()=>{const name=$('wName').value.trim();const role=$('wRole').value.trim();if(!name||!role)return;const id='w'+Math.random().toString(36).slice(2,8);workers.push({id,name,role,type:$('wType').value,status:'Idle',task:'',x:80+Math.random()*420,y:240+Math.random()*220,color:'#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')});$('wName').value='';$('wRole').value='';save();renderWorkersTable();renderOffice();renderOrg();};

function renderOrg(){const root=$('orgWorkers');root.innerHTML='';const names=[...new Set(workers.map(w=>w.name).concat(tasks.map(t=>t.owner)))].filter(Boolean);names.forEach(n=>{const d=document.createElement('div');d.className='org-node';d.textContent=n;root.append(d);});}

function roam(){const map=$('officeMap');const maxX=map.clientWidth-60,maxY=map.clientHeight-70;workers.forEach(w=>{if(w.status==='Moving'){w.x=Math.max(20,Math.min(maxX,w.x+(Math.random()*80-40)));w.y=Math.max(170,Math.min(maxY,w.y+(Math.random()*70-35)));}});save();renderOffice();}

initTabs();renderKanban();renderOffice();renderWorkersTable();renderOrg();setInterval(roam,2200);
