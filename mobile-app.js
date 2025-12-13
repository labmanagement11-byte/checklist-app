// ====== MOBILE APP - AIRBNBMANAGER ======

// Estado Mobile
let mobileCurrentUser = null;
let mobileCurrentUserType = null;
let mobileSelectedProperty = null;
let mobileTheme = localStorage.getItem('airbnbmanager_mobile_theme') || 'light';

// Helpers de contexto
function getMobileSelectedProperty() {
    return mobileSelectedProperty || mobileCurrentUser?.propertyId || Object.keys(properties)[0] || null;
}

function getMobileCurrentStaff() {
    if (!mobileCurrentUser?.staffId || !mobileCurrentUser?.propertyId) return null;
    const prop = properties[mobileCurrentUser.propertyId];
    return prop?.staff?.find(s => s.id === mobileCurrentUser.staffId) || null;
}

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
        // Limpiar credenciales guardadas
        localStorage.removeItem('airbnbmanager_mobile_owner_creds');
        localStorage.removeItem('airbnbmanager_mobile_staff_creds');
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
    if (!mobileSelectedProperty) {
        mobileSelectedProperty = Object.keys(properties)[0] || null;
    }
    renderMobileOwnerDashboard();
    loadMobileProperties();
    loadMobileStaffInline();
}

function showMobileEmployeeView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('employeeMobileView').classList.add('active');
    if (!mobileSelectedProperty) {
        mobileSelectedProperty = mobileCurrentUser?.propertyId || getMobileSelectedProperty();
    }
    renderMobileEmployeeTasks();
    renderMobileCalendar();
    renderMobileProfile();
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
    if (!mobileSelectedProperty) {
        mobileSelectedProperty = Object.keys(properties)[0] || null;
    }
    const propertiesHTML = Object.entries(properties).map(([key, prop]) => `
        <div class="property-item ${mobileSelectedProperty === key ? 'selected' : ''}" onclick="selectPropertyMobile('${key}')">
            <div class="property-name">🏠 ${prop.name}</div>
            <div class="property-info">
                <span>📍 ${prop.address || 'Sin dirección'}</span>
                <span>👥 ${prop.staff ? prop.staff.length : 0} personal</span>
            </div>
            <button class="btn-icon" onclick="event.stopPropagation(); removePropertyMobile('${key}')" style="color: var(--danger); margin-top: 0.5rem;">🗑️ Eliminar</button>
        </div>
    `).join('');
    
    document.getElementById('propertiesListMobile').innerHTML = propertiesHTML || '<div class="empty-state"><div class="empty-text">No hay casas registradas</div></div>';
}

function removePropertyMobile(propId) {
    if (!confirm('¿Eliminar esta propiedad? Se eliminarán todas sus tareas, personal e inventario.')) return;
    
    // Eliminar tareas relacionadas
    cleaningTasks = cleaningTasks.filter(t => t.propertyId !== propId);
    // Eliminar fechas programadas
    scheduledDates = scheduledDates.filter(s => s.propertyId !== propId);
    // Eliminar propiedad
    delete properties[propId];
    
    // Si era la seleccionada, cambiar a otra
    if (mobileSelectedProperty === propId) {
        mobileSelectedProperty = Object.keys(properties)[0] || null;
    }
    
    saveData();
    loadMobileProperties();
    renderMobileOwnerDashboard();
    alert('✅ Propiedad eliminada');
}

function selectPropertyMobile(propId) {
    mobileSelectedProperty = propId;
    loadMobileInventory();
    loadMobileStaff();
    loadMobileStaffInline();
    renderMobileOwnerDashboard();
    renderMobileEmployeeTasks();
    renderMobileCalendar();
    loadMobileProperties();
}

function showAddPropertyMobile() {
    const modalBody = `
        <div class="form-group">
            <label class="form-label">Nombre de la Casa</label>
            <input type="text" id="mobilePropName" class="form-control" placeholder="Ej: Casa Centro">
        </div>
        <div class="form-group">
            <label class="form-label">Dirección</label>
            <input type="text" id="mobilePropAddress" class="form-control" placeholder="Calle, número, ciudad">
        </div>
        <button class="btn btn-primary btn-block" onclick="saveMobileProperty()">Crear Propiedad</button>
    `;
    showMobileModal('➕ Agregar Casa', modalBody);
}

function saveMobileProperty() {
    const name = document.getElementById('mobilePropName').value.trim();
    const address = document.getElementById('mobilePropAddress').value.trim();
    if (!name || !address) {
        alert('Completa nombre y dirección');
        return;
    }
    const id = `prop_${Date.now()}`;
    const prop = { id, name, address, staff: [], inventory: {} };
    normalizeInventory(prop);
    properties[id] = prop;
    cleaningTasks.push(...createDefaultCleaningTasks(id, name));
    if (name === 'EPIC D1') {
        scheduleDeepCleanEvery3Months(id, name);
    }
    mobileSelectedProperty = id;
    saveData();
    closeMobileModal();
    renderMobileOwnerDashboard();
    loadMobileProperties();
    alert('✅ Casa creada exitosamente');
}

// ========== OWNER INVENTORY ==========

function loadMobileInventory() {
    // Cargar selector de propiedades
    const propertyOptions = Object.entries(properties).map(([key, prop]) => 
        `<option value="${key}">${prop.name}</option>`
    ).join('');
    
    document.getElementById('inventoryPropertySelect').innerHTML = 
        '<option value="">Selecciona una casa...</option>' + propertyOptions;
    
    if (!mobileSelectedProperty) {
        mobileSelectedProperty = getMobileSelectedProperty();
    }
    if (!mobileSelectedProperty) return;
    document.getElementById('inventoryPropertySelect').value = mobileSelectedProperty;
    
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
                <div class="category-header clickable" onclick="toggleMobileCategory(this)">
                    <span class="category-icon">${categoryInfo.icon}</span>
                    <span class="category-name">${categoryInfo.name}</span>
                    <span class="category-count">${items.length}</span>
                </div>
                <div class="category-items">
                    ${items.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.5rem 0.75rem; border-radius: 8px; margin-bottom: 0.5rem;">
                            <span style="flex: 1; color: var(--text-primary); font-weight: 600;">✓ ${item.name || item} ${item.qty ? `(${item.qty})` : ''}</span>
                            <button class="btn-icon" onclick="removeMobileInventoryItem('${catKey}', '${item.id || item}')" style="color: var(--danger); font-size: 1.2rem;">🗑️</button>
                        </div>
                    `).join('')}
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

// ========== ADD INVENTORY ITEM MOBILE ==========

function showAddInventoryItemMobile() {
    if (!mobileSelectedProperty) {
        alert('Primero selecciona una casa');
        return;
    }
    
    const categoryOptions = Object.entries(INVENTORY_CATEGORIES).map(([key, cat]) => 
        `<option value="${key}">${cat.icon} ${cat.name}</option>`
    ).join('');
    
    const modalBody = `
        <div class="form-group">
            <label class="form-label">Categoría</label>
            <select id="mobileInvCategory" class="form-control">
                <option value="">Selecciona...</option>
                ${categoryOptions}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Nombre del Item</label>
            <input type="text" id="mobileInvItemName" class="form-control" placeholder="Ej: Toallas grandes">
        </div>
        <div class="form-group">
            <label class="form-label">Cantidad</label>
            <input type="number" id="mobileInvItemQty" class="form-control" value="1" min="0">
        </div>
        <button class="btn btn-primary btn-block" onclick="saveMobileInventoryItem()">Agregar Item</button>
    `;
    showMobileModal('📦 Agregar Item al Inventario', modalBody);
}

function saveMobileInventoryItem() {
    if (!mobileSelectedProperty) return;
    const category = document.getElementById('mobileInvCategory').value;
    const itemName = document.getElementById('mobileInvItemName').value.trim();
    const qty = parseInt(document.getElementById('mobileInvItemQty').value, 10) || 1;
    
    if (!category || !itemName) {
        alert('Completa categoría y nombre del item');
        return;
    }
    
    const prop = properties[mobileSelectedProperty];
    if (!prop.inventory[category]) {
        prop.inventory[category] = [];
    }
    
    prop.inventory[category].push({
        id: `inv_${Date.now()}`,
        name: itemName,
        qty: qty
    });
    
    saveData();
    closeMobileModal();
    loadMobileInventory();
    alert('✅ Item agregado al inventario');
}

function removeMobileInventoryItem(catKey, itemId) {
    if (!confirm('¿Eliminar este item del inventario?')) return;
    if (!mobileSelectedProperty) return;
    const prop = properties[mobileSelectedProperty];
    if (!prop.inventory[catKey]) return;
    
    prop.inventory[catKey] = prop.inventory[catKey].filter(item => {
        const id = item.id || item;
        return id !== itemId;
    });
    
    saveData();
    loadMobileInventory();
    alert('✅ Item eliminado');
}

// ========== OWNER STAFF ==========

function showAddStaffMobile() {
    if (!mobileSelectedProperty) {
        alert('Primero selecciona una casa');
        return;
    }
    const prop = properties[mobileSelectedProperty];
    const isEpic = prop?.name === 'EPIC D1';
    
    const roleOptions = isEpic ? `
        <option value="manager">👨‍💼 Manager</option>
        <option value="employee">👷 Empleado - Limpieza</option>
        <option value="maintenance">🔧 Empleado - Mantenimiento</option>
    ` : `
        <option value="manager">👨‍💼 Manager</option>
        <option value="employee">👷 Empleado</option>
        <option value="maintenance">🔧 Mantenimiento</option>
    `;
    
    const modalBody = `
        <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" id="mobileStaffName" class="form-control" placeholder="Juan Pérez">
        </div>
        <div class="form-group">
            <label class="form-label">Rol</label>
            <select id="mobileStaffRole" class="form-control">
                <option value="">Selecciona...</option>
                ${roleOptions}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Usuario</label>
            <input type="text" id="mobileStaffUsername" class="form-control" placeholder="juan">
        </div>
        <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" id="mobileStaffPassword" class="form-control" placeholder="****">
        </div>
        <button class="btn btn-primary btn-block" onclick="saveMobileStaff()">Agregar Personal</button>
    `;
    showMobileModal('👥 Agregar Personal', modalBody);
}

function saveMobileStaff() {
    if (!mobileSelectedProperty) return;
    const name = document.getElementById('mobileStaffName').value.trim();
    const role = document.getElementById('mobileStaffRole').value;
    const username = document.getElementById('mobileStaffUsername').value.trim();
    const password = document.getElementById('mobileStaffPassword').value.trim();
    
    if (!name || !role || !username || !password) {
        alert('Completa todos los campos');
        return;
    }
    
    const prop = properties[mobileSelectedProperty];
    const exists = (prop.staff || []).some(s => s.username === username);
    if (exists) {
        alert('Ese usuario ya existe en la propiedad');
        return;
    }
    
    prop.staff.push({
        id: `staff_${Date.now()}`,
        name,
        role: (prop.name === 'EPIC D1' && role !== 'manager') ? 'employee' : role,
        username,
        password,
        lastLoginTime: null,
        assignmentType: prop.name === 'EPIC D1' ? (role === 'maintenance' ? 'mantenimiento' : role === 'manager' ? 'ambas' : 'limpieza') : null
    });
    
    saveData();
    closeMobileModal();
    loadMobileStaff();
    loadMobileStaffInline();
    alert('✅ Personal agregado exitosamente');
}

function loadMobileStaffInline() {
    const propertyOptions = Object.entries(properties).map(([key, prop]) => 
        `<option value="${key}" ${mobileSelectedProperty === key ? 'selected' : ''}>${prop.name}</option>`
    ).join('');
    
    document.getElementById('staffPropertySelectInline').innerHTML = 
        '<option value="">Selecciona una casa...</option>' + propertyOptions;
    
    if (!mobileSelectedProperty) {
        mobileSelectedProperty = getMobileSelectedProperty();
    }
    if (!mobileSelectedProperty) return;
    
    const prop = properties[mobileSelectedProperty];
    if (!prop || !prop.staff || prop.staff.length === 0) {
        document.getElementById('staffContentMobileInline').innerHTML = 
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
                <button class="btn-icon" onclick="removeStaffMobile('${staff.id}')" style="color: var(--danger);">🗑️</button>
            </div>
        `;
    }).join('');
    
    document.getElementById('staffContentMobileInline').innerHTML = staffHTML;
}

function removeStaffMobile(staffId) {
    if (!confirm('¿Eliminar este miembro del personal?')) return;
    if (!mobileSelectedProperty) return;
    const prop = properties[mobileSelectedProperty];
    prop.staff = (prop.staff || []).filter(s => s.id !== staffId);
    saveData();
    loadMobileStaff();
    loadMobileStaffInline();
    alert('✅ Personal eliminado');
}

function loadMobileStaff() {
    // Cargar selector de propiedades
    const propertyOptions = Object.entries(properties).map(([key, prop]) => 
        `<option value="${key}">${prop.name}</option>`
    ).join('');
    
    document.getElementById('staffPropertySelect').innerHTML = 
        '<option value="">Selecciona una casa...</option>' + propertyOptions;
    
    if (!mobileSelectedProperty) {
        mobileSelectedProperty = getMobileSelectedProperty();
    }
    if (!mobileSelectedProperty) return;
    document.getElementById('staffPropertySelect').value = mobileSelectedProperty;
    
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
    const propId = getMobileSelectedProperty();
    mobileSelectedProperty = propId;
    const prop = propId ? properties[propId] : null;
    const staff = getMobileCurrentStaff();

    document.getElementById('employeeSubtitle').textContent = 
        `${mobileCurrentUser.name}${prop ? ` - ${prop.name || ''}` : ''}`;

    if (!propId || !prop) {
        document.getElementById('employeeTasksContent').innerHTML = `
            <h2 class="section-title">✓ Mis Tareas</h2>
            <div class="empty-state">
                <div class="empty-icon">ℹ️</div>
                <div class="empty-title">Selecciona una propiedad</div>
                <div class="empty-text">No hay propiedad asignada</div>
            </div>
        `;
        return;
    }

    const isEpic = prop?.name === 'EPIC D1';
    let roleFilter = isEpic ? null : mobileCurrentUser.role;
    let tasksBySection = getTasksBySection(propId, roleFilter);

    // Filtrar por tipo de asignación (limpieza/mantenimiento)
    if (staff?.assignmentType && staff.assignmentType !== 'ambas') {
        const filtered = {};
        Object.entries(tasksBySection).forEach(([key, section]) => {
            const isMaintenance = isMaintenanceSection(key);
            const include = (staff.assignmentType === 'mantenimiento' && isMaintenance) ||
                            (staff.assignmentType === 'limpieza' && !isMaintenance);
            if (include) filtered[key] = section;
        });
        tasksBySection = filtered;
    } else if (!isEpic && mobileCurrentUser.role === 'maintenance') {
        const filtered = {};
        Object.entries(tasksBySection).forEach(([key, section]) => {
            if (isMaintenanceSection(key)) filtered[key] = section;
        });
        tasksBySection = filtered;
    }

    // Filtrar tareas asignadas a este empleado (si assignedTo está definido)
    Object.keys(tasksBySection).forEach(key => {
        const section = tasksBySection[key];
        tasksBySection[key] = {
            ...section,
            tasks: section.tasks.filter(t => !t.assignedTo || t.assignedTo === mobileCurrentUser.staffId)
        };
    });

    let hasTasks = false;
    let html = '<h2 class="section-title">✓ Mis Tareas</h2>';

    Object.entries(tasksBySection).forEach(([key, section]) => {
        if (!section.tasks.length) return;
        hasTasks = true;

        // Agrupar por subsección si aplica
        const groups = {};
        section.tasks.forEach(task => {
            const subTitle = task.subsectionTitle || section.name || 'General';
            if (!groups[subTitle]) groups[subTitle] = [];
            groups[subTitle].push(task);
        });

        html += `
            <div class="section-card clickable">
                <div class="section-header">
                    <h3 class="section-title" style="margin:0; font-size:1rem;">${section.icon || '🧹'} ${section.name || 'General'}</h3>
                    <span class="badge-light">${section.tasks.length} tareas</span>
                </div>`;

        Object.entries(groups).forEach(([subTitle, tasks]) => {
            html += `<div class="subsection-block"><div class="subsection-title">${subTitle}</div>`;
            tasks.forEach(task => {
                const statusIcon = task.verified ? '✔️' : task.completed ? '✅' : '⏳';
                const statusClass = task.verified ? 'done verified' : task.completed ? 'done' : '';
                html += `
                    <div class="task-row clickable ${statusClass}" onclick="toggleMobileTask('${task.id}')">
                        <div class="task-row-main">
                            <div class="task-row-title">${task.taskText || task.name || 'Tarea'}</div>
                            <div class="task-row-sub">${section.name || 'General'}${task.subsectionTitle ? ' · ' + task.subsectionTitle : ''}</div>
                        </div>
                        <div class="task-row-status">${statusIcon}</div>
                    </div>`;
            });
            html += '</div>'; // subsection-block
        });

        html += '</div>'; // section-card
    });

    if (!hasTasks) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <div class="empty-title">¡Todo listo!</div>
                <div class="empty-text">No hay tareas pendientes</div>
            </div>`;
    }

    document.getElementById('employeeTasksContent').innerHTML = html;
}

function toggleMobileTask(taskId) {
    const idx = cleaningTasks.findIndex(t => t.id === taskId || t.id === String(taskId));
    if (idx < 0) return;
    if (cleaningTasks[idx].verified) return; // no cambiar tareas ya verificadas
    cleaningTasks[idx].completed = !cleaningTasks[idx].completed;
    saveData();
    renderMobileEmployeeTasks();
}

// ========== EMPLOYEE CALENDAR ==========

function toggleMobileSchedule(scheduleId) {
    toggleScheduleComplete(scheduleId);
    renderMobileCalendar();
}

function renderMobileCalendar() {
    const propId = getMobileSelectedProperty();
    mobileSelectedProperty = propId;
    const staffId = mobileCurrentUser?.staffId;
    const canSeeAll = mobileCurrentUserType === 'owner' || mobileCurrentUserType === 'manager';

    const schedulesByType = {};
    scheduledDates
        .filter(date => !propId || date.propertyId === propId)
        .filter(date => canSeeAll || !date.assignedEmployeeId || date.assignedEmployeeId === staffId)
        .forEach(date => {
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
                <div class="category-header clickable">
                    <span class="category-icon">${typeEmoji}</span>
                    <span class="category-name">${typeLabel}</span>
                    <span class="category-count">${dates.length}</span>
                </div>
                <div class="category-items expanded" style="padding: 0.5rem 1rem 1rem 1rem;">
                    ${dates.map(date => {
                        const localDate = parseLocalDate(date.date);
                        const dayStr = localDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
                        const assignee = date.assignedEmployeeName ? ` · ${date.assignedEmployeeName}` : '';
                        const statusIcon = date.completed ? '✅' : '⏳';
                        const statusClass = date.completed ? 'done' : '';
                        return `
                            <div class="task-row clickable ${statusClass}" onclick="toggleMobileSchedule('${date.id}')">
                                <div class="task-row-main">
                                    <div class="task-row-title">${dayStr}</div>
                                    <div class="task-row-sub">${typeLabel}${assignee}</div>
                                </div>
                                <div class="task-row-status">${statusIcon}</div>
                            </div>
                        `;
                    }).join('')}
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
    
    // Prellenar credenciales guardadas pero NO hacer auto-login
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
