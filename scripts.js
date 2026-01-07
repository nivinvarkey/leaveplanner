// -------------------------- STORAGE --------------------------
let leaveData = JSON.parse(localStorage.getItem('leaves')) || [];
let departments = JSON.parse(localStorage.getItem('departments')) || [];
let managers = JSON.parse(localStorage.getItem('managers')) || [];

// -------------------------- COMMON FUNCTIONS --------------------------
function saveDB() {
    localStorage.setItem('leaves', JSON.stringify(leaveData));
    localStorage.setItem('departments', JSON.stringify(departments));
    localStorage.setItem('managers', JSON.stringify(managers));
}

function formatDate(d) {
    const dt = new Date(d);
    return dt.toISOString().split('T')[0];
}

function getOverlaps(current) {
    return leaveData.filter(other => {
        if (current === other) return false;
        if (current.team !== other.team || current.role !== other.role) return false;
        return new Date(current.start) <= new Date(other.end) && new Date(other.start) <= new Date(current.end);
    });
}

// -------------------------- EMPLOYEE --------------------------
function addLeaveEmployee(name, role, team, start, end, remark="PLANNED") {
    if(!name || !start || !end) return alert("Missing fields");
    if(new Date(start) > new Date(end)) return alert("Start date after end");
    leaveData.push({name, role, team, start, end, remark});
    saveDB();
    alert("Leave added!");
}

// -------------------------- MANAGER --------------------------
function loginManager(id, pass) {
    const mgr = managers.find(m => m.id === id && m.password === pass);
    if(!mgr) return false;
    return mgr.department;
}

function renderManager(dept) {
    const body = document.getElementById('chartBody');
    body.innerHTML = '';
    leaveData.filter(e => e.team && deptTeams(dept).includes(e.team))
             .forEach((emp,index) => {
        const conflicts = getOverlaps(emp);
        const isConflicted = conflicts.length>0;
        const row = document.createElement('div');
        row.className='gantt-container border-b border-slate-800/40 items-center';
        const start=new Date(emp.start);
        const end=new Date(emp.end);
        const left = ((start - new Date('2026-01-01'))/(1000*60*60*24)/365)*100;
        const width = ((end-start)/(1000*60*60*24)/365)*100;
        row.innerHTML = `
            <div class="p-3 border-r border-slate-800 flex justify-between items-center">
                <div>
                    <div class="text-[11px] font-bold ${isConflicted?'text-red-500':'text-slate-200'}">${emp.name}</div>
                    <div class="text-[8px] text-slate-500 uppercase font-black">${emp.role}</div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editManagerEntry(${index})" class="text-blue-400 hover:text-white">✏️</button>
                    <button onclick="removeManagerEntry(${index})" class="text-red-500 hover:text-white">✕</button>
                </div>
            </div>
            <div class="relative h-12 w-full flex items-center px-1">
                <div class="absolute inset-0 flex pointer-events-none opacity-5">
                    ${Array(12).fill(0).map(()=>`<div class="flex-1 border-r border-slate-400"></div>`).join('')}
                </div>
                <div class="leave-bar absolute h-7 rounded-md border border-white/10 shadow-lg flex items-center px-3"
                     style="left:${left}%;width:${width}%;background:${isConflicted?'linear-gradient(to right,#7f1d1d,#ef4444)':'linear-gradient(to right,#064e3b,#10b981)'}">
                    <span class="text-[8px] font-black text-white truncate uppercase">${emp.remark||'VACATION'}</span>
                </div>
            </div>
        `;
        body.appendChild(row);
    });
}

function deptTeams(dept) {
    const d = departments.find(x=>x.name===dept);
    return d ? d.teams : [];
}

function editManagerEntry(idx){
    const emp = leaveData[idx];
    const n = prompt("Edit Name",emp.name);
    if(!n) return;
    emp.name = n;
    saveDB();
    renderManager(emp.team); // re-render
}

function removeManagerEntry(idx){
    if(confirm(`Delete ${leaveData[idx].name}?`)){
        leaveData.splice(idx,1);
        saveDB();
        location.reload();
    }
}

// -------------------------- ADMIN --------------------------
function loginAdmin(pass){
    return pass==="admin"; // default admin password
}

function addDepartment(name){
    if(!name) return;
    departments.push({name,teams:[]});
    saveDB();
    alert("Department added");
}

function addTeam(dept,team){
    const d = departments.find(x=>x.name===dept);
    if(d && !d.teams.includes(team)){
        d.teams.push(team);
        saveDB();
        alert("Team added");
    }
}

function addManager(id, password, dept){
    if(!id || !password || !dept) return;
    managers.push({id,password,department:dept});
    saveDB();
    alert("Manager added");
}
