// --- HELPER FUNCTIONS ---
function formatAMPM(time24h) {
    if (!time24h) return "";
    let [hours, minutes] = time24h.split(':');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; 
    return `${hours}:${minutes} ${ampm}`;
}
// 1. GLOBAL STATE
let today = new Date(); // April 6, 2026
let currentViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let appointments = JSON.parse(localStorage.getItem('capminds_apps')) || [];
let editingId = null;

// 2. ELEMENT VARIABLES
let modal, appointmentForm, bookBtn, calendarDays, monthYearText;
let navCalendar, navDashboard, calendarPage, dashboardPage;

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    modal = document.getElementById('appointment-modal');
    appointmentForm = document.getElementById('appointment-form');
    
    // FIXED: ID updated to match your HTML
    bookBtn = document.getElementById('book-appointment-btn'); 
    
    calendarDays = document.getElementById('calendar-days');
    monthYearText = document.getElementById('current-month-year');
    
    navCalendar = document.getElementById('nav-calendar');
    navDashboard = document.getElementById('nav-dashboard');
    calendarPage = document.getElementById('calendar-page');
    dashboardPage = document.getElementById('dashboard-page');

    renderCalendar();
    setupEventListeners();
});

// 4. CALENDAR RENDERING
function renderCalendar() {
    if (!calendarDays) return;
    calendarDays.innerHTML = '';
    
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    // FIXED: Format now shows "April 2026" only
    const options = { month: 'long', year: 'numeric' };
    monthYearText.innerText = currentViewDate.toLocaleDateString('en-US', options);
    
    // --- MONDAY ALIGNMENT & GRID CALCULATION ---
    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Fill empty slots for previous month days
    for (let x = 0; x < firstDayIndex; x++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'inactive-day');
        calendarDays.appendChild(emptyDiv);
    }

    // Render actual days
    for (let i = 1; i <= lastDay; i++) {
        const isToday = i === today.getDate() && 
                        month === today.getMonth() && 
                        year === today.getFullYear();
        
        createDayDiv(i, month, year, isToday);
    }
}

function createDayDiv(day, month, year, isToday) {
    const div = document.createElement('div');
    div.classList.add('calendar-day');
    if (isToday) div.classList.add('selected-day');

    div.innerHTML = `<span class="day-number" style="font-weight:600; color:#4a5568;">${day}</span>`;

    // Filter appointments for this specific day
    const dayApps = appointments.filter(app => {
        const appDate = new Date(app.date);
        return appDate.getDate() === day && 
               appDate.getMonth() === month &&
               appDate.getFullYear() === year;
    });

    // Find this inside createDayDiv
dayApps.forEach(app => {
    const appDate = new Date(app.date);
    const comparisonDate = new Date("2026-04-07");
    
    // Logic to show Scheduled or Arrived on calendar
    const label = appDate < comparisonDate ? "Arrived" : "Scheduled";
    const cssClass = appDate < comparisonDate ? "status-arrived" : "status-future";

    const appEl = document.createElement('div');
    appEl.classList.add(cssClass); // Now dynamic!
    
    appEl.innerHTML = `
        <div>
            <span class="arrived-text">${app.patientName}</span> (${label})
            <div style="font-size: 0.65rem; opacity: 0.8;">${formatAMPM(app.time)}</div>
        </div>
        <div style="cursor:pointer; display:flex; gap:4px;">
            <span onclick="event.stopPropagation(); openEditModal(${app.id})">✏️</span>
            <span onclick="event.stopPropagation(); deleteAppointment(${app.id})">🗑️</span>
        </div>
    `;
    div.appendChild(appEl);
});

    calendarDays.appendChild(div);
}

// 5. MODAL ACTIONS
function openModal() {
    editingId = null;
    appointmentForm.reset();
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    editingId = null;
}

function saveAppointment(e) {
    e.preventDefault();
    const formData = new FormData(appointmentForm);
    
    const appData = {
        id: editingId || Date.now(),
        patientName: formData.get('patientName'),
        doctorName: formData.get('doctorName'),
        hospitalName: formData.get('hospitalName'),
        specialty: formData.get('specialty'),
        date: formData.get('date'),
        time: formData.get('time'),
        reason: formData.get('reason'),
        status: 'Arrived' // Defaulting to Arrived for your design
    };

    if (editingId) {
        appointments = appointments.map(app => app.id === editingId ? appData : app);
    } else {
        appointments.push(appData);
    }

    localStorage.setItem('capminds_apps', JSON.stringify(appointments));
    closeModal();
    renderCalendar();
    renderTable();
}

// 6. DASHBOARD ACTIONS
// 6. DASHBOARD ACTIONS - UPDATED TO MATCH FIGMA
function renderTable(filteredApps = appointments) {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const comparisonDate = new Date("2026-04-07");

    filteredApps.forEach(app => {
        const appDate = new Date(app.date);
        let statusText = "";
        let statusClass = "";

        if (appDate < comparisonDate) {
            statusText = "Arrived";
            statusClass = "status-arrived";
        } else if (appDate.getTime() === comparisonDate.getTime()) {
            statusText = "Today";
            statusClass = "status-today";
        } else {
            statusText = "Scheduled";
            statusClass = "status-future";
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.patientName}</td>
            <td>${app.doctorName}</td>
            <td>${app.hospitalName}</td>
            <td>${app.specialty}</td>
            <td>${app.date}</td>
            <td style="color: #4285f4; font-weight: 500;">
                ${formatAMPM(app.time)} - 12:15 PM
            </td> 
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="action-cell" style="text-align: center;">
                <i data-lucide="edit-3" class="edit-icon" style="width: 16px; height: 16px; cursor: pointer; margin-right: 8px;" onclick="openEditModal(${app.id})"></i>
                <i data-lucide="trash-2" class="delete-icon" style="width: 16px; height: 16px; cursor: pointer;" onclick="deleteAppointment(${app.id})"></i>
            </td>
        `;
        tableBody.appendChild(row);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}
// 7. LISTENERS
function setupEventListeners() {
    // Navigation
    navCalendar.onclick = () => {
        calendarPage.style.display = 'block';
        dashboardPage.style.display = 'none';
        navCalendar.classList.add('active');
        navDashboard.classList.remove('active');
    };

    navDashboard.onclick = () => {
        calendarPage.style.display = 'none';
        dashboardPage.style.display = 'block';
        navDashboard.classList.add('active');
        navCalendar.classList.remove('active');
        renderTable();
    };

    // Buttons
    if (bookBtn) bookBtn.onclick = openModal;
    if (appointmentForm) appointmentForm.onsubmit = saveAppointment;
    
    // Calendar Nav
    document.getElementById('prev-month').onclick = () => {
        currentViewDate.setMonth(currentViewDate.getMonth() - 1);
        renderCalendar();
    };
    document.getElementById('next-month').onclick = () => {
        currentViewDate.setMonth(currentViewDate.getMonth() + 1);
        renderCalendar();
    };
    document.getElementById('today-btn').onclick = () => {
        currentViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
        renderCalendar();
    };

    // Close Modal
    window.onclick = (e) => { if (e.target == modal) closeModal(); };
    // Add this inside the bottom of setupEventListeners function
    const patientSearch = document.querySelector('input[placeholder="Patient Search"]');
    const doctorSearch = document.querySelector('input[placeholder="Doctor Search"]');

    if (patientSearch && doctorSearch) {
        const filterData = () => {
            const pValue = patientSearch.value.toLowerCase();
            const dValue = doctorSearch.value.toLowerCase();
            
            const filtered = appointments.filter(app => 
                app.patientName.toLowerCase().includes(pValue) && 
                app.doctorName.toLowerCase().includes(dValue)
            );
            renderTable(filtered);
        };

        patientSearch.addEventListener('input', filterData);
        doctorSearch.addEventListener('input', filterData);
    }
}

// Helper Functions
function deleteAppointment(id) {
    if (confirm("Delete this appointment?")) {
        appointments = appointments.filter(app => app.id !== id);
        localStorage.setItem('capminds_apps', JSON.stringify(appointments));
        renderCalendar();
        renderTable();
    }
}

function openEditModal(id) {
    const app = appointments.find(a => a.id === id);
    if (app) {
        editingId = id;
        Object.keys(app).forEach(key => {
            if (appointmentForm.elements[key]) appointmentForm.elements[key].value = app[key];
        });
        modal.style.display = 'flex';
    }
}
// SIDEBAR TOGGLE LOGIC
const sidebarToggle = document.getElementById('sidebar-toggle');
if (sidebarToggle) {
    sidebarToggle.onclick = () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    };
}