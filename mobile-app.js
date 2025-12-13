// ====== MOBILE APP - AIRBNBMANAGER ======

// Estado Mobile
let mobileCurrentUser = null;
let mobileCurrentUserType = null;
let mobileSelectedProperty = null;
let mobileTheme = localStorage.getItem('airbnbmanager_mobile_theme') || 'light';

// Inicializar tema
if (mobileTheme === 'dark') {
    document.body.classList.add('dark-theme');
}

// ========== LOGIN FUNCTIONS ==========

function updateMobileLoginForm() {
    const userType = document.getElementById('userType').value;
    document.getElementById('ownerLoginGroup').style.display = userType === 'owner' ? 'block' : 'none';
    document.getElementById('staffLoginGroup').style.display = (userType === 'manager' || userType === 'employee') ? 'block' : 'none';
}

function mobileLogin() {
    const userType = document.getElementById('userType').value;
    
    if (!userType) {
        alert('Selecciona un tipo de usuario');
        return;
    }
    
    if (userType === 'owner') {
        const username = document.getElementById('ownerUsername').value.trim();
        const password = document.getElementById('ownerPassword').value;
        const remember = document.getElementById('rememberOwnerMobile').checked;
        
        if (username === OWNER_CREDENTIALS.username && password === OWNER_CREDENTIALS.password) {
            mobileCurrentUser = OWNER_CREDENTIALS;
            mobileCurrentUserType = 'owner';
            
            if (remember) {
                localStorage.setItem('airbnbmanager_mobile_owner_creds', JSON.stringify({ username, password }));
            }
            
            showMobileOwnerView();
        } else {
            alert('❌ Usuario o contraseña incorrectos');
        }
    } else {
        const username = document.getElementById('staffUsername').value.trim();
        const password = document.getElementById('staffPassword').value;
        const remember = document.getElementById('rememberStaffMobile').checked;
        
        // Buscar staff en propiedades
        let staffFound = null;
        for (const propKey in properties) {
            const prop = properties[propKey];
            if (prop.staff) {
                const staff = prop.staff.find(s => s.username === username && s.password === password);
                if (staff) {
                    staffFound = { ...staff, propertyId: propKey, propertyName: prop.name };
                    break;
                }
            }
        }
        
        if (staffFound) {
            mobileCurrentUser = staffFound;
            mobileCurrentUserType = staffFound.role;
            mobileSelectedProperty = staffFound.propertyId;
            
            if (remember) {
                localStorage.setItem('airbnbmanager_mobile_staff_creds', JSON.stringify({ username, password }));
            }
            
            showMobileEmployeeView();
        } else {
            alert('❌ Usuario o contraseña incorrectos');
        }
    }
}

function mobileLogout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
        mobileCurrentUser = null;
        mobileCurrentUserType = null;
        mobileSelectedProperty = null;
        showMobileLoginView();
    }
}

// ========== VIEW SWITCHING ==========

function showMobileLoginView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('loginView').classList.add('active');
}

function showMobileOwnerView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('ownerMobileView').classList.add('active');
    renderMobileOwnerDashboard();
}

function showMobileEmployeeView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('employeeMobileView').classList.add('active');
    renderMobileEmployeeTasks();
}

// ========== TAB NAVIGATION ==========

function switchMobileTab(tabName) {
    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

function switchEmployeeMobileTab(tabName) {
    // Update tabs
    document.querySelectorAll('[data-tab]').forEach(tab => {
        if (tab.parentElement.classList.contains('mobile-nav-tabs')) {
            tab.classList.remove('active');
        }
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`emp-tab-${tabName}`).classList.add('active');
}

// ========== OWNER DASHBOARD ==========

function renderMobileOwnerDashboard() {
    document.getElementById('ownerMobileName').textContent = mobileCurrentUser.name;
    
    // Stats
    const totalProperties = Object.keys(properties).length;
    const totalStaff = Object.values(properties).reduce((sum, p) => sum + (p.staff ? p.staff.length : 0), 0);
    const totalTasks = cleaningTasks.length;
    
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalProperties}</div>
            <div class="stat-label">Casas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalStaff}</div>
            <div class="stat-label">Personal</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalTasks}</div>
            <div class="stat-label">Tareas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${scheduledDates.length}</div>
            <div class="stat-label">Programadas</div>
        </div>
    `;
    document.getElementById('dashboardStats').innerHTML = statsHTML;
    
    // Properties List
    const propertiesHTML = Object.entries(properties).map(([key, prop]) => `
        <div class="property-item">
            <div class="property-name">🏠 ${prop.name}</div>
            <div class="property-info">
                <span>👥 ${prop.staff ? prop.staff.length : 0} personal</span>
                <span>📦 ${prop.inventory ? Object.keys(prop.inventory).length : 0} categorías</span>
            </div>
        </div>
    `).join('');
    
    document.getElementById('dashboardProperties').innerHTML = propertiesHTML || '<div class="empty-state"><div class="empty-text">No hay casas registradas</div></div>';
}

// ========== OWNER PROPERTIES ==========

function loadMobileProperties() {
    const propertiesHTML = Object.entries(properties).map(([key, prop]) => `
        <div class="property-item" onclick="selectPropertyMobile('${key}')">
            <div class="property-name">🏠 ${prop.name}</div>
            <div class="property-info">
                <span>📍 ${prop.address || 'Sin dirección'}</span>
                <span>👥 ${prop.staff ? prop.staff.length : 0} personal</span>
            </div>
        </div>
    `).join('');
    
    document.getElementById('propertiesListMobile').innerHTML = propertiesHTML || '<div class="empty-state"><div class="empty-text">No hay casas registradas</div></div>';
}

function selectPropertyMobile(propId) {
    mobileSelectedProperty = propId;
    loadMobileInventory();
    loadMobileStaff();
}

function showAddPropertyMobile() {
    alert('Función para agregar casa - implementar en modal');
}

// ========== OWNER INVENTORY ==========

function loadMobileInventory() {
    // Cargar selector de propiedades
    const propertyOptions = Object.entries(properties).map(([key, prop]) => 
        `<option value="${key}">${prop.name}</option>`
    ).join('');
    
    document.getElementById('inventoryPropertySelect').innerHTML = 
        '<option value="">Selecciona una casa...</option>' + propertyOptions;
    
    if (!mobileSelectedProperty) return;
    
    const prop = properties[mobileSelectedProperty];
    if (!prop || !prop.inventory) {
        document.getElementById('inventoryContentMobile').innerHTML = 
            '<div class="empty-state"><div class="empty-text">No hay inventario</div></div>';
        return;
    }
    
    let inventoryHTML = '<div class="inventory-categories">';
    
    for (const [catKey, items] of Object.entries(prop.inventory)) {
        const categoryInfo = INVENTORY_CATEGORIES[catKey] || { name: catKey, icon: '📦' };
        inventoryHTML += `
            <div class="category-section">
                <div class="category-header" onclick="toggleMobileCategory(this)">
                    <span class="category-icon">${categoryInfo.icon}</span>
                    <span class="category-name">${categoryInfo.name}</span>
                    <span class="category-count">${items.length}</span>
                </div>
                <div class="category-items">
                    ${items.map(item => `<span class="item-chip">✓ ${item}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    inventoryHTML += '</div>';
    document.getElementById('inventoryContentMobile').innerHTML = inventoryHTML;
}

function toggleMobileCategory(headerElement) {
    const itemsDiv = headerElement.nextElementSibling;
    itemsDiv.classList.toggle('expanded');
}

// ========== OWNER STAFF ==========

function loadMobileStaff() {
    // Cargar selector de propiedades
    const propertyOptions = Object.entries(properties).map(([key, prop]) => 
        `<option value="${key}">${prop.name}</option>`
    ).join('');
    
    document.getElementById('staffPropertySelect').innerHTML = 
        '<option value="">Selecciona una casa...</option>' + propertyOptions;
    
    if (!mobileSelectedProperty) return;
    
    const prop = properties[mobileSelectedProperty];
    if (!prop || !prop.staff || prop.staff.length === 0) {
        document.getElementById('staffContentMobile').innerHTML = 
            '<div class="empty-state"><div class="empty-text">No hay personal registrado</div></div>';
        return;
    }
    
    const staffHTML = prop.staff.map(staff => {
        const roleEmoji = staff.role === 'manager' ? '👨‍💼' : staff.role === 'employee' ? '👷' : '👥';
        const roleText = {
            'manager': 'Manager',
            'employee': 'Empleado',
            'maintenance': 'Mantenimiento'
        }[staff.role] || staff.role;
        
        return `
            <div class="staff-item">
                <div class="staff-avatar">${staff.name.charAt(0).toUpperCase()}</div>
                <div class="staff-info">
                    <div class="staff-name">${staff.name}</div>
                    <div class="staff-role">${roleEmoji} ${roleText}</div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('staffContentMobile').innerHTML = staffHTML;
}

// ========== EMPLOYEE TASKS ==========

function renderMobileEmployeeTasks() {
    document.getElementById('employeeSubtitle').textContent = 
        `${mobileCurrentUser.name} - ${mobileCurrentUser.propertyName || ''}`;
    
    const tasks = cleaningTasks.filter(task => task.propertyId === mobileSelectedProperty);
    
    if (tasks.length === 0) {
        document.getElementById('employeeTasksContent').innerHTML = `
            <h2 class="section-title">✓ Mis Tareas</h2>
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <div class="empty-title">¡Todo listo!</div>
                <div class="empty-text">No hay tareas pendientes</div>
            </div>
        `;
        return;
    }
    
    const tasksHTML = tasks.map((task, idx) => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-content">
                <div class="task-name">${task.name}</div>
                <div class="task-area">📍 ${task.section || 'General'}</div>
            </div>
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleMobileTask(${idx})">
        </div>
    `).join('');
    
    document.getElementById('employeeTasksContent').innerHTML = `
        <h2 class="section-title">✓ Mis Tareas</h2>
        <div class="mt-1">
            ${tasksHTML}
        </div>
    `;
}

function toggleMobileTask(taskIndex) {
    cleaningTasks[taskIndex].completed = !cleaningTasks[taskIndex].completed;
    saveData();
    renderMobileEmployeeTasks();
}

// ========== EMPLOYEE CALENDAR ==========

function renderMobileCalendar() {
    const schedulesByType = {};
    scheduledDates.forEach(date => {
        if (!schedulesByType[date.type]) {
            schedulesByType[date.type] = [];
        }
        schedulesByType[date.type].push(date);
    });
    
    let calendarHTML = '';
    
    for (const [type, dates] of Object.entries(schedulesByType)) {
        const typeEmoji = type === 'limpieza-regular' ? '🧹' : type === 'limpieza-profunda' ? '✨' : '🔧';
        const typeLabel = type === 'limpieza-regular' ? 'Limpieza Regular' : type === 'limpieza-profunda' ? 'Limpieza Profunda' : 'Mantenimiento';
        
        calendarHTML += `
            <div class="category-section" style="margin-bottom: 1rem;">
                <div class="category-header">
                    <span class="category-icon">${typeEmoji}</span>
                    <span class="category-name">${typeLabel}</span>
                </div>
                <div class="category-items expanded" style="padding: 1rem;">
                    ${dates.map(date => `
                        <div class="item-chip">
                            📅 ${new Date(date.date).toLocaleDateString('es-ES')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    document.getElementById('employeeCalendarContent').innerHTML = calendarHTML || 
        '<div class="empty-state"><div class="empty-text">No hay fechas programadas</div></div>';
}

// ========== EMPLOYEE PROFILE ==========

function renderMobileProfile() {
    const profileHTML = `
        <div class="staff-item" style="flex-direction: column; border: none; background: transparent;">
            <div class="staff-avatar" style="width: 80px; height: 80px; font-size: 2.5rem;">
                ${mobileCurrentUser.name.charAt(0).toUpperCase()}
            </div>
            <div class="staff-info" style="text-align: center; width: 100%;">
                <div class="staff-name" style="font-size: 1.25rem; margin: 1rem 0 0.5rem;">${mobileCurrentUser.name}</div>
                <div class="staff-role" style="margin-bottom: 1.5rem;">
                    ${mobileCurrentUser.role === 'manager' ? '👨‍💼 Manager' : 
                      mobileCurrentUser.role === 'employee' ? '👷 Empleado' : '👥 Personal'}
                </div>
                <div style="text-align: left; background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                    <div style="margin-bottom: 0.75rem;">
                        <span style="color: var(--text-secondary); font-size: 0.875rem;">Usuario</span>
                        <div style="font-weight: 600; margin-top: 0.25rem;">${mobileCurrentUser.username}</div>
                    </div>
                    <div>
                        <span style="color: var(--text-secondary); font-size: 0.875rem;">Propiedad</span>
                        <div style="font-weight: 600; margin-top: 0.25rem;">${mobileCurrentUser.propertyName || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('employeeProfileContent').innerHTML = profileHTML;
}

// ========== THEME ==========

function toggleMobileTheme() {
    document.body.classList.toggle('dark-theme');
    mobileTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('airbnbmanager_mobile_theme', mobileTheme);
    
    const btn = document.getElementById('themeMobileToggle') || 
                document.querySelectorAll('[onclick*="toggleMobileTheme"]')[0];
    if (btn) btn.textContent = mobileTheme === 'dark' ? '☀️' : '🌙';
}

// ========== MODAL ==========

function showMobileModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('mobileModal').classList.add('active');
}

function closeMobileModal() {
    document.getElementById('mobileModal').classList.remove('active');
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos
    loadData();
    
    // Verificar si hay sesión guardada
    const savedOwnerCreds = localStorage.getItem('airbnbmanager_mobile_owner_creds');
    const savedStaffCreds = localStorage.getItem('airbnbmanager_mobile_staff_creds');
    
    if (savedOwnerCreds) {
        const creds = JSON.parse(savedOwnerCreds);
        document.getElementById('userType').value = 'owner';
        document.getElementById('ownerUsername').value = creds.username;
        document.getElementById('ownerPassword').value = creds.password;
        updateMobileLoginForm();
    } else if (savedStaffCreds) {
        const creds = JSON.parse(savedStaffCreds);
        document.getElementById('userType').value = 'employee';
        document.getElementById('staffUsername').value = creds.username;
        document.getElementById('staffPassword').value = creds.password;
        updateMobileLoginForm();
    }
    
    // Renderizar vistas de empleado cuando se cargan
    if (document.getElementById('employeeCalendarContent')) {
        renderMobileCalendar();
        renderMobileProfile();
    }
    
    // Cargar propiedades cuando se abre la vista de owner
    if (document.getElementById('propertiesListMobile')) {
        loadMobileProperties();
    }
});

// Cerrar modal tocando el overlay
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('mobileModal');
    const overlay = modal ? modal.querySelector('.modal-overlay') : null;
    if (overlay) {
        overlay.addEventListener('click', closeMobileModal);
    }
});
