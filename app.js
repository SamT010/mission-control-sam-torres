const AGENTS_KEY='mc_v5_agents';
let agents=JSON.parse(localStorage.getItem(AGENTS_KEY)||'null')||[
  {id:'sam',name:'Sam',emoji:'⚙️',state:'Working',task:'Investigación SKU',x:260,y:180,color:'#9ad1ff'},
  {id:'henry',name:'Henry',emoji:'🤖',state:'Working',task:'Council prep',x:320,y:250,color:'#9cff9c'},
  {id:'alex',name:'Alex',emoji:'🧠',state:'Idle',task:'',x:120,y:320,color:'#d4a0ff'},
  {id:'codex',name:'Codex',emoji:'🧡',state:'Moving',task:'Automatizando pipeline',x:460,y:290,color:'#ffb173'},
  {id:'flash',name:'Flash',emoji:'🟢',state:'Moving',task:'Follow-ups',x:420,y:430,color:'#80ffbf'}
];

const canvas=document.getElementById('officeCanvas');
const pick=document.getElementById('agentPick');
const stateSel=document.getElementById('agentState');
const taskInput=document.getElementById('agentTask');
let current='sam';

function save(){localStorage.setItem(AGENTS_KEY,JSON.stringify(agents));}
function byId(id){return agents.find(a=>a.id===id)}

function renderTabs(){document.querySelectorAll('.tab[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-'+b.dataset.tab).classList.add('active');});}

function renderOffice(){canvas.querySelectorAll('.agent').forEach(n=>n.remove());
  agents.forEach(a=>{
    const n=document.createElement('div');n.className=`agent ${a.state}`;n.style.left=a.x+'px';n.style.top=a.y+'px';n.innerHTML=`<span>${a.emoji}</span><span class='name' style='color:${a.color}'>${a.name}</span>`;
    n.onclick=()=>select(a.id);
    canvas.append(n);
  });
  const sam=byId('sam'); if(sam) document.getElementById('samPill').textContent=sam.state;
}

function renderPicker(){pick.innerHTML='';agents.forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name;pick.append(o)});pick.value=current;}
function select(id){current=id;const a=byId(id);if(!a) return;pick.value=id;stateSel.value=a.state;taskInput.value=a.task||'';document.getElementById('bubbleLabel').textContent=`${a.name} - ${a.task||'No task'}`;}

document.getElementById('saveAgent').onclick=()=>{const a=byId(current);if(!a)return;a.state=stateSel.value;a.task=taskInput.value.trim();save();renderOffice();select(current);};
pick.onchange=()=>select(pick.value);

function roam(){const w=canvas.clientWidth-60,h=canvas.clientHeight-70;agents.forEach(a=>{if(a.state==='Moving'){a.x=Math.max(20,Math.min(w,a.x+(Math.random()*90-45)));a.y=Math.max(90,Math.min(h,a.y+(Math.random()*90-45)));}});save();renderOffice();}
setInterval(roam,2200);

renderTabs();renderPicker();renderOffice();select(current);
