const STORAGE='missionControlV2';
const UI='missionControlUI';
const columns=[{key:'backlog',label:'Backlog'},{key:'doing',label:'Doing'},{key:'blocked',label:'Blocked'},{key:'done',label:'Done'}];
const seed=[
{id:'CT-003',title:'Investigar tendencias EUA/MEX abarrotes marca blanca',priority:'P0',owner:'Sam',status:'doing',detail:'Fuentes + oportunidades ruta MX→US e Import→MX'},
{id:'CT-004',title:'Definir ruta por SKU: MX→US vs Import→MX',priority:'P0',owner:'Sam',status:'backlog',detail:''},
{id:'CT-005',title:'Entregar tabla operativa (20 SKUs)',priority:'P0',owner:'Sam',status:'backlog',detail:''},
{id:'CT-009',title:'SOP onboarding 3PL/carrier (2 semanas)',priority:'P1',owner:'Sam',status:'backlog',detail:''},
{id:'CT-012',title:'Arreglar pairing Telegram',priority:'P0',owner:'Sam',status:'done',detail:'Completado'}
];

let tasks=JSON.parse(localStorage.getItem(STORAGE)||'null')||seed;
let ui=JSON.parse(localStorage.getItem(UI)||'null')||{samState:'Working'};
let selectedId=null;

const board=document.getElementById('board');
const tpl=document.getElementById('cardTpl');
const dialog=document.getElementById('taskDialog');

function save(){localStorage.setItem(STORAGE,JSON.stringify(tasks));localStorage.setItem(UI,JSON.stringify(ui));}
function card(t){
  const node=tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.id').textContent=t.id;
  node.querySelector('.title').textContent=t.title;
  node.querySelector('.meta').textContent=`Asignado: ${t.owner||'N/A'} · Estado: ${t.status}`;
  const p=node.querySelector('.priority'); p.textContent=t.priority; p.classList.add(t.priority);
  node.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',t.id));
  node.addEventListener('click',()=>openTask(t.id));
  return node;
}
function renderBoard(){
  board.innerHTML='';
  columns.forEach(c=>{
    const col=document.createElement('section'); col.className='col';
    col.innerHTML=`<h2>${c.label}</h2><div class="drop" data-status="${c.key}"></div>`;
    const drop=col.querySelector('.drop');
    drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('over')});
    drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
    drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('over');const id=e.dataTransfer.getData('text/plain');const t=tasks.find(x=>x.id===id);if(t){t.status=c.key;save();renderAll();}});
    tasks.filter(t=>t.status===c.key).forEach(t=>drop.append(card(t)));
    board.append(col);
  });
}
function renderProgress(){
  const list=document.getElementById('progressList');
  const doing=tasks.filter(t=>t.status==='doing');
  list.innerHTML='';
  if(!doing.length){list.innerHTML='<p>No hay tareas en progreso.</p>';return;}
  doing.forEach(t=>list.append(card(t)));
}
function renderOffice(){
  document.getElementById('samDeskState').textContent=ui.samState;
  document.getElementById('samStatusPill').textContent=`Sam: ${ui.samState}`;
  document.getElementById('samStateSelect').value=ui.samState;
}
function renderOrg(){
  const row=document.getElementById('agentRow');
  const owners=[...new Set(tasks.map(t=>t.owner).filter(Boolean))];
  row.innerHTML='';
  owners.forEach(o=>{const d=document.createElement('div');d.className='node agent';d.textContent=`Agente/Owner: ${o}`;row.appendChild(d)});
}
function renderAll(){renderBoard();renderProgress();renderOffice();renderOrg();}

function openTask(id){
  const t=tasks.find(x=>x.id===id); if(!t) return; selectedId=id;
  dTitle.textContent=t.title; dId.value=t.id; dPriority.value=t.priority; dAssignee.value=t.owner||''; dStatus.value=t.status; dDetail.value=t.detail||'';
  dialog.showModal();
}

document.getElementById('addTask').onclick=()=>{
  const title=taskTitle.value.trim(); const owner=taskAssignee.value.trim()||'Sam'; const priority=taskPriority.value;
  if(!title) return;
  const n=(tasks.map(t=>parseInt((t.id.match(/\d+/)||['0'])[0],10)).sort((a,b)=>b-a)[0]||13)+1;
  tasks.unshift({id:`CT-${String(n).padStart(3,'0')}`,title,priority,owner,status:'backlog',detail:''});
  taskTitle.value=''; taskAssignee.value=''; save(); renderAll();
};
document.getElementById('reset').onclick=()=>{tasks=[...seed];ui.samState='Working';save();renderAll();};

document.getElementById('saveTask').onclick=(e)=>{
  e.preventDefault();
  const t=tasks.find(x=>x.id===selectedId); if(!t) return;
  t.priority=dPriority.value; t.owner=dAssignee.value.trim()||'Sam'; t.status=dStatus.value; t.detail=dDetail.value;
  save(); dialog.close(); renderAll();
};

document.getElementById('updateSamState').onclick=()=>{ui.samState=document.getElementById('samStateSelect').value;save();renderOffice();};

document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); btn.classList.add('active');
  const tab=btn.dataset.tab;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(`view-${tab}`).classList.add('active');
  document.getElementById('toolbarKanban').style.display=tab==='kanban'?'flex':'none';
});

renderAll();
