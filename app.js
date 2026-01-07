/* ============================================
File: app.js
Description: Main JS for Leave Planner 2026 - Hybrid Calendar + Gantt + Conflict
============================================ */

// APP CORE
class LeavePlannerApp {
    constructor() {
        this.employees = [];
        this.ganttEngine = new GanttEngine(this);
        this.conflictEngine = new ConflictEngine(this);
        this.calendar = new CalendarRenderer(this);
        this.loadEmployees();
    }

    async loadEmployees() {
        const response = await fetch('employees.json');
        this.employees = await response.json();
        this.render();
    }

    render() {
        document.getElementById('app').innerHTML = '';
        this.calendar.renderCalendar(2026);
        this.conflictEngine.update();
        this.ganttEngine.bindEvents();
    }
}

// CALENDAR RENDERER
class CalendarRenderer {
    constructor(app) { this.app = app; }

    renderCalendar(year) {
        const container = document.getElementById('app');
        const monthsWrapper = document.createElement('div');
        monthsWrapper.className = 'grid grid-cols-3 gap-6';

        for (let m=0;m<12;m++) {
            const monthBox = document.createElement('div');
            monthBox.className='border p-3 rounded-xl cursor-pointer hover:shadow-lg';
            monthBox.innerHTML=`<h3 class='font-semibold mb-2'>${this.getMonthName(m)}</h3>`;
            monthBox.addEventListener('click',()=>this.openMonthDetail(year,m));
            monthsWrapper.appendChild(monthBox);
        }
        container.appendChild(monthsWrapper);
    }

    openMonthDetail(year, monthIndex){
        const modal = document.createElement('div');
        modal.className='modal';
        const box = document.createElement('div');
        box.className='modal-box';
        box.innerHTML=`<h2 class='text-xl font-bold mb-4'>${this.getMonthName(monthIndex)} ${year}</h2>`;

        const grid = document.createElement('div');
        grid.className='calendar-detail-grid grid grid-cols-7 gap-2 text-center text-sm';

        const days = new Date(year, monthIndex+1,0).getDate();
        for(let d=1;d<=days;d++){
            const dayCell=document.createElement('div');
            dayCell.className='day-cell';
            dayCell.textContent=d;
            dayCell.dataset.date=`${year}-${monthIndex+1}-${d}`;
            grid.appendChild(dayCell);
        }

        const closeBtn=document.createElement('button');
        closeBtn.textContent='Close';
        closeBtn.className='mt-4 px-4 py-2 bg-red-500 text-white rounded';
        closeBtn.addEventListener('click',()=>modal.remove());

        box.appendChild(grid); box.appendChild(closeBtn); modal.appendChild(box);
        document.body.appendChild(modal);

        // Render leave bars
        this.app.ganttEngine.renderLeaveBars(monthIndex,year);
    }

    getMonthName(m){ return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]; }
}

// GANTT ENGINE
class GanttEngine {
    constructor(app){ this.app=app; }
    bindEvents(){ /* handled in CalendarRenderer */ }
    renderLeaveBars(monthIndex,year){
        const modalGrid=document.querySelector('.calendar-detail-grid');
        if(!modalGrid) return;
        modalGrid.querySelectorAll('.leave-bar').forEach(b=>b.remove());
        this.app.employees.forEach(emp=>{
            (emp.leaves||[]).forEach(leave=>{
                const start=new Date(leave.start), end=new Date(leave.end);
                if(start.getMonth()<=monthIndex && end.getMonth()>=monthIndex){
                    const startDay=start.getMonth()===monthIndex?start.getDate():1;
                    const endDay=end.getMonth()===monthIndex?end.getDate():new Date(year,monthIndex+1,0).getDate();
                    for(let d=startDay;d<=endDay;d++){
                        const cell=modalGrid.querySelector(`.day-cell[data-date='${year}-${monthIndex+1}-${d}']`);
                        if(cell){
                            const bar=document.createElement('div');
                            bar.className='leave-bar';
                            bar.title=`${emp.name}: ${leave.start} → ${leave.end}`;
                            cell.appendChild(bar);
                        }
                    }
                }
            });
        });
    }
}

// CONFLICT ENGINE
class ConflictEngine{
    constructor(app){ this.app=app; this.conflictPanel=null; }
    calculateConflicts(){
        if(!this.conflictPanel){
            this.conflictPanel=document.createElement('div');
            this.conflictPanel.className='conflict-panel';
            const title=document.createElement('h3'); title.textContent='⚠️ Conflicts / Low Availability'; title.className='font-bold mb-3';
            this.list=document.createElement('div'); this.conflictPanel.appendChild(title); this.conflictPanel.appendChild(this.list);
            document.getElementById('app').appendChild(this.conflictPanel);
        }else{this.list.innerHTML='';}
        const allLeaves=[];
        this.app.employees.forEach(emp=>(emp.leaves||[]).forEach(l=>allLeaves.push({emp,start:new Date(l.start),end:new Date(l.end)})));
        const teams=[...new Set(this.app.employees.map(e=>e.team))];
        teams.forEach(team=>{
            const teamEmps=this.app.employees.filter(e=>e.team===team);
            teamEmps.forEach(emp=>{
                (emp.leaves||[]).forEach(leave=>{
                    const conflicts=allLeaves.filter(o=>o.emp.id!==emp.id && o.emp.team===emp.team && leave.start<=o.end && o.start<=leave.end);
                    conflicts.forEach(c=>{
                        const div=document.createElement('div'); div.textContent=`${emp.name} overlaps with ${c.emp.name} (${emp.team})`; div.className='text-red-600 text-sm mb-1';
                        this.list.appendChild(div);
                    });
                });
            });
        });
    }
    update(){this.calculateConflicts();}
}

// START APP
window.addEventListener('DOMContentLoaded',()=>{new LeavePlannerApp();});
