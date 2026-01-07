const PASS = "leave";
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

let DEFAULT_DATA = [];
fetch('employees.json').then(res => res.json()).then(data => {
    DEFAULT_DATA = data;
    leaveData = JSON.parse(localStorage.getItem('epicLeaveDB')) || DEFAULT_DATA;
    render();
});

let leaveData = [];

function toggleAdmin() {
    if(document.body.classList.contains('admin-mode')){
        document.body.classList.remove('admin-mode');
        document.getElementById('adminBtn').innerText = "Admin Login";
    } else {
        if(prompt("Enter Password:")===PASS){
            document.body.classList.add('admin-mode');
            document.getElementById('adminBtn').innerText = "Logout Admin";
        }
    }
    render();
}

function saveEntry(){
    const idx = parseInt(document.getElementById('editIndex').value);
    const entry = {
        name: document.getElementById('newName').value,
        role: document.getElementById('newRole').value,
        team: document.getElementById('newTeam').value,
        start: document.getElementById('newStart').value,
        end: document.getElementById('newEnd').value,
        remark: "PLANNED"
    };
    if(!entry.name||!entry.start||!entry.end) return alert("Missing fields");
    if(new Date(entry.start) > new Date(entry.end)) return alert("Start date cannot be after end date");
    if(idx===-1) leaveData.push(entry); else leaveData[idx]=entry;
    document.getElementById('editIndex').value="-1";
    document.getElementById('formTitle').innerText="Add New Leave Entry";
    document.getElementById('saveBtn').innerText="SAVE ENTRY";
    document.getElementById('newName').value='';
    saveAndRender();
}

function editEntry(index){
    const emp = leaveData[index];
    document.getElementById('newName').value=emp.name;
    document.getElementById('newRole').value=emp.role;
    document.getElementById('newTeam').value=emp.team;
    document.getElementById('newStart').value=emp.start;
    document.getElementById('newEnd').value=emp.end;
    document.getElementById('editIndex').value=index;
    document.getElementById('formTitle').innerText="Editing: "+emp.name;
    document.getElementById('saveBtn').innerText="UPDATE ENTRY";
    window.scrollTo({top:0,behavior:'smooth'});
}

function removeEntry(index){
    if(confirm(`Delete ${leaveData[index].name}'s record?`)){
        leaveData.splice(index,1);
        saveAndRender();
    }
}

function resetData(){
    if(confirm("This will delete all custom changes. Revert to original?")){
        leaveData = [...DEFAULT_DATA];
        saveAndRender();
    }
}

function saveAndRender(){
    localStorage.setItem('epicLeaveDB',JSON.stringify(leaveData));
    render();
}

function getOverlaps(current, all){
    return all.filter(other=>{
        if(current===other) return false;
        if(current.team!==other.team || current.role!==other.role) return false;
        return new Date(current.start)<=new Date(other.end) && new Date(other.start)<=new Date(current.end);
    });
}

function calculateAvailability(){
    const teams = [...new Set(leaveData.map(e=>e.team))];
    const stats = document.getElementById('availabilityStats');
    stats.innerHTML='';
    teams.forEach(team=>{
        const teamMembers = leaveData.filter(e=>e.team===team).length + 5;
        const monthLeaves = Array(12).fill(0);
        leaveData.filter(e=>e.team===team).forEach(emp=>{
            const start = new Date(emp.start).getMonth();
            const end = new Date(emp.end).getMonth();
            for(let i=start;i<=end;i++) monthLeaves[i]++;
        });
        let teamHtml=`<div class="mb-4"><h4 class="text-[11px] font-black text-emerald-500">${team}</h4><div class="flex gap-1 mt-1">`;
        monthLeaves.forEach((leaves,i)=>{
            const avail = Math.max(0,100-(leaves*20));
            teamHtml+=`<div class="flex-1 h-8 flex flex-col items-center justify-center rounded bg-slate-800 border border-slate-700">
                <span class="text-[7px] text-slate-500">${months[i][0]}</span>
                <span class="text-[9px] font-bold ${avail<70?'text-red-500':'text-emerald-400'}">${avail}%</span>
            </div>`;
        });
        teamHtml+=`</div></div>`;
        stats.innerHTML+=teamHtml;
    });
}

function render(){
    const teamFilter=document.getElementById('teamFilter').value;
    const search=document.getElementById('nameSearch').value.toLowerCase();
    const body=document.getElementById('chartBody');
    const confPanel=document.getElementById('conflictPanel');
    const confList=document.getElementById('conflictList');
    body.innerHTML=''; confList.innerHTML=''; let hasConflicts=false;
    leaveData.forEach((emp,index)=>{
        const conflicts=getOverlaps(emp,leaveData);
        const isConflicted=conflicts.length>0;
        if(isConflicted){ hasConflicts=true;
            if(!confList.innerHTML.includes(emp.name)){
                confList.innerHTML+=`<div class="bg-red-950/40 p-2 rounded text-[10px] border border-red-800 flex justify-between">
                    <span><strong>${emp.name}</strong> clashes with ${conflicts[0].name}</span>
                </div>`;
            }
        }
        if((teamFilter==='All'||emp.team===teamFilter)&&emp.name.toLowerCase().includes(search)){
            const start=new Date(emp.start), end=new Date(emp.end);
            const left=((start-new Date('2026-01-01'))/(1000*60*60*24)/365)*100;
            const width=((end-start)/(1000*60*60*24)/365)*100;
            const row=document.createElement('div');
            row.className='gantt-container border-b border-slate-800/40 items-center transition-colors hover:bg-slate-800/20';
            row.innerHTML=`
            <div class="p-3 border-r border-slate-800 flex justify-between items-center group">
                <div>
                    <div class="text-[11px] font-bold ${isConflicted?'text-red-500':'text-slate-200'}">${emp.name}</div>
                    <div class="text-[8px] text-slate-500 uppercase font-black">${emp.role}</div>
                </div>
                <div class="admin-only flex gap-2">
                    <button onclick="editEntry(${index})" class="text-blue-400 hover:text-white transition-colors">✏️</button>
                    <button onclick="removeEntry(${index})" class="text-red-500 hover:text-white transition-colors">✕</button>
                </div>
            </div>
            <div class="relative h-12 w-full flex items-center px-1">
                <div class="absolute inset-0 flex pointer-events-none opacity-5">
                    ${Array(12).fill(0).map(()=>`<div class="flex-1 border-r border-slate-400"></div>`).join('')}
                </div>
                <div class="leave-bar absolute h-7 rounded-md border border-white/10 shadow-lg flex items-center px-3 group cursor-help transition-all hover:scale-[1.01]"
                    style="left:${left}%; width:${width}%; background:${isConflicted?'linear-gradient(to right,#7f1d1d,#ef4444)':'linear-gradient(to right,#064e3b,#10b981)'}">
                    <span class="text-[8px] font-black text-white truncate uppercase">${isConflicted?'⚠️ CONFLICT':(emp.remark||'VACATION')}</span>
                    <div class="tooltip hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-slate-900 text-[10px] font-bold p-2 rounded shadow-2xl z-50 whitespace-nowrap">
                        ${emp.name} (${emp.team})<br/>${emp.start} TO ${emp.end}
                    </div>
                </div>
            </div>`;
            body.appendChild(row);
        }
    });
    confPanel.style.display=hasConflicts?'block':'none';
    calculateAvailability();
}
