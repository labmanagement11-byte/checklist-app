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
        localStorage.removeItem('airbnbmanager_mobile_session_temp');
        showMobileLoginView();
    }
}

// Refrescar manteniendo sesión
function refreshMobileApp() {
    try {
        const activeTabBtn = document.querySelector('#ownerMobileView .nav-tab.active, #employeeMobileView .nav-tab.active');
        const activeTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : null;
        const session = {
            type: mobileCurrentUserType,
            user: mobileCurrentUser,
            selectedProperty: mobileSelectedProperty,
            activeTab
        };
        localStorage.setItem('airbnbmanager_mobile_session_temp', JSON.stringify(session));
    } catch (e) {
        console.error('No se pudo guardar sesión temporal', e);
    }
    window.location.reload();
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
    loadMobileTasks();
    loadMobileSchedule();
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
    
    // Cargar datos según la tab
    if (tabName === 'tasks') {
        loadMobileTasks();
    } else if (tabName === 'schedule') {
        loadMobileSchedule();
    } else if (tabName === 'inventory') {
        loadMobileInventory();
    } else if (tabName === 'staff') {
        loadMobileStaff();
    } else if (tabName === 'properties') {
        loadMobileProperties();
    } else if (tabName === 'purchase') {
        loadMobilePurchaseList();
    } else if (tabName === 'checks') {
        loadMobileInventoryChecks();
    } else if (tabName === 'requests') {
        loadMobilePurchaseRequests();
    } else if (tabName === 'alerts') {
        loadMobileNotifications();
    }
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
        <div class="stat-card clickable" style="cursor:pointer;" onclick="dashboardNavigate('properties')">
            <div class="stat-value">${totalProperties}</div>
            <div class="stat-label">Casas</div>
        </div>
        <div class="stat-card clickable" style="cursor:pointer;" onclick="dashboardNavigate('staff')">
            <div class="stat-value">${totalStaff}</div>
            <div class="stat-label">Personal</div>
        </div>
        <div class="stat-card clickable" style="cursor:pointer;" onclick="dashboardNavigate('tasks')">
            <div class="stat-value">${totalTasks}</div>
            <div class="stat-label">Tareas</div>
        </div>
        <div class="stat-card clickable" style="cursor:pointer;" onclick="dashboardNavigate('schedule')">
            <div class="stat-value">${scheduledDates.length}</div>
            <div class="stat-label">Programadas</div>
        </div>
    `;
    document.getElementById('dashboardStats').innerHTML = statsHTML;
    
    // Properties List
    const propertiesHTML = Object.entries(properties).map(([key, prop]) => `
        <div class="property-item clickable" style="cursor: pointer; transition: all 0.2s;" onclick="switchMobileTab('properties'); selectPropertyMobile('${key}')" ontouchstart="this.style.transform='scale(0.98)'" ontouchend="this.style.transform='scale(1)'">
            <div class="property-name">🏠 ${prop.name}</div>
            <div class="property-info">
                <span>👥 ${prop.staff ? prop.staff.length : 0} personal</span>
                <span>📦 ${prop.inventory ? Object.keys(prop.inventory).length : 0} categorías</span>
            </div>
        </div>
    `).join('');
    
    document.getElementById('dashboardProperties').innerHTML = propertiesHTML || '<div class="empty-state"><div class="empty-text">No hay casas registradas</div></div>';
}

// Navegación rápida desde el dashboard
function dashboardNavigate(target) {
    if (target === 'properties') {
        switchMobileTab('properties');
        setTimeout(() => {
            const list = document.getElementById('propertiesListMobile');
            if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    } else if (target === 'staff') {
        switchMobileTab('staff');
    } else if (target === 'tasks') {
        switchMobileTab('tasks');
    } else if (target === 'schedule') {
        switchMobileTab('schedule');
        setTimeout(() => {
            showAddScheduleMobile();
        }, 250);
    }
}

// ========== OWNER PROPERTIES ==========

function loadMobileProperties() {
    if (!mobileSelectedProperty) {
        mobileSelectedProperty = Object.keys(properties)[0] || null;
    }
    const propertiesHTML = Object.entries(properties).map(([key, prop]) => `
        <div class="property-item clickable ${mobileSelectedProperty === key ? 'selected' : ''}" onclick="selectPropertyMobile('${key}')" style="cursor: pointer; transition: all 0.2s;" ontouchstart="if(!this.classList.contains('selected')) this.style.transform='scale(0.98)'" ontouchend="this.style.transform='scale(1)'">
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
    // Solo actualizar las vistas activas
    loadMobileProperties();
    
    // Actualizar solo si los contenedores existen y son visibles
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const tabId = activeTab.id;
        if (tabId === 'tab-inventory') {
            loadMobileInventory();
        } else if (tabId === 'tab-staff') {
            loadMobileStaff();
        } else if (tabId === 'tab-tasks') {
            loadMobileTasks();
        } else if (tabId === 'tab-schedule') {
            loadMobileSchedule();
        } else if (tabId === 'tab-properties') {
            loadMobileStaffInline();
        }
    }
    
    // Actualizar dashboard si es necesario
    if (document.getElementById('tab-dashboard')?.classList.contains('active')) {
        renderMobileOwnerDashboard();
    }
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
                    ${items.map(item => {
                        const itemEmoji = getItemEmoji(catKey, item.name || item);
                        return `
                        <div class="clickable" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: transform 0.2s;" ontouchstart="this.style.transform='scale(0.98)'" ontouchend="this.style.transform='scale(1)'">
                            <span style="flex: 1; color: var(--text-primary); font-weight: 600;">${itemEmoji} ${item.name || item} ${item.qty ? `<span style="color: var(--primary); margin-left: 0.5rem;">(${item.qty})</span>` : ''}</span>
                            <button class="btn-icon" onclick="event.stopPropagation(); removeMobileInventoryItem('${catKey}', '${item.id || item}')" style="color: var(--danger); font-size: 1.2rem;">🗑️</button>
                        </div>
                    `;
                    }).join('')}
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

    // Conteo de tareas de la propiedad asignada al empleado
    const staffTasks = cleaningTasks.filter(t => t.propertyId === propId && (!t.assignedTo || t.assignedTo === mobileCurrentUser.staffId));
    const pendingStaffTasks = staffTasks.filter(t => !t.completed);
    const completedStaffTasks = staffTasks.length - pendingStaffTasks.length;

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

    html += `
        <div class="section-card" style="margin-top: 1rem;">
            <div class="section-title">⏱️ Cierre de jornada</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin:0.5rem 0 0.75rem 0;">
                <span class="badge" style="background: var(--warning);">Pendientes: ${pendingStaffTasks.length}</span>
                <span class="badge" style="background: var(--success);">Completadas: ${completedStaffTasks}</span>
            </div>
            <button class="btn btn-primary btn-block" onclick="finalizeMobileWorkDay()" ${staffTasks.length === 0 ? 'disabled' : ''}>Finalizar jornada</button>
        </div>
    `;

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

// Registrar cierre de jornada desde empleado
function finalizeMobileWorkDay() {
    const propId = getMobileSelectedProperty();
    const staff = getMobileCurrentStaff();

    if (!propId || !staff) {
        alert('Selecciona una propiedad para cerrar tu jornada.');
        return;
    }

    const tasksForStaff = cleaningTasks.filter(t => t.propertyId === propId && (!t.assignedTo || t.assignedTo === staff.id));
    const pendingTasks = tasksForStaff.filter(t => !t.completed);
    const completedTasks = tasksForStaff.length - pendingTasks.length;
    const pendingInventory = inventoryChecks.filter(c => c.propertyId === propId && !c.approved);

    const summary = {
        id: `notif_${Date.now()}`,
        propertyId: propId,
        employeeId: staff.id,
        employeeName: staff.name,
        date: new Date().toLocaleDateString('es-ES'),
        time: new Date().toLocaleTimeString('es-ES'),
        pendingTasks: pendingTasks.map(t => t.task || t.taskText || 'Tarea'),
        pendingInventoryCount: pendingInventory.length,
        completedTasksCount: completedTasks,
        totalTasksCount: tasksForStaff.length,
        read: false,
        createdAt: new Date().toISOString()
    };

    workDayNotifications.push(summary);
    saveData();

    renderMobileEmployeeTasks();
    loadMobileNotifications();

    if (pendingTasks.length > 0 || pendingInventory.length > 0) {
        alert('Cierre registrado con pendientes. Dueño/Manager verán el detalle.');
    } else {
        alert('¡Buen trabajo! Cierre registrado sin pendientes.');
    }
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

// ========== HELPER FUNCTIONS ==========

function getItemEmoji(category, itemName) {
    const name = (itemName || '').toLowerCase();
    
    // Emojis por item específico
    const itemEmojis = {
        // Cocina
        'tenedor': '🍴', 'cuchillo': '🔪', 'cuchara': '🥄', 'plato': '🍽️', 'vaso': '🥤', 'copa': '🍷',
        'sarten': '🍳', 'olla': '🍲', 'cafetera': '☕', 'taza': '☕', 'microondas': '📟', 
        'licuadora': '🔌', 'bowl': '🥣', 'tabla': '🪵', 'pyrex': '🍱',
        
        // Habitaciones
        'almohada': '🛏️', 'sabana': '🛏️', 'colcha': '🛏️', 'manta': '🧣', 'cobija': '🧣', 
        'cortina': '🪟', 'lampara': '💡', 'espejo': '🪞', 'perchero': '🪝',
        
        // Baños
        'toalla': '🧻', 'toallon': '🧻', 'jabon': '🧼', 'champu': '🧴', 'shampoo': '🧴',
        'papel': '🧻', 'tapete': '🛁', 'cepillo': '🪥', 'escobilla': '🚽',
        
        // Sala
        'sofa': '🛋️', 'silla': '🪑', 'mesa': '🪑', 'cuadro': '🖼️', 'alfombra': '🧶',
        'control': '📺', 'cojin': '🛋️', 'jarron': '🏺', 'planta': '🪴',
        
        // Comedor  
        'mantel': '🍽️', 'servilleta': '🧻', 'individual': '🍽️', 'salero': '🧂',
        
        // Lavandería
        'detergente': '🧴', 'suavizante': '🧴', 'cloro': '🧪', 'cesto': '🧺',
        'perchas': '👔', 'pinzas': '📎', 'tendedero': '🧺',
        
        // Limpieza
        'escoba': '🧹', 'trapeador': '🧽', 'recogedor': '🪣', 'balde': '🪣', 
        'spray': '🧴', 'guantes': '🧤', 'esponja': '🧽', 'trapo': '🧻',
        'desinfectante': '🧴', 'aromatizante': '🌸', 'bolsa': '🛍️', 'limpiador': '🧴'
    };
    
    // Buscar emoji específico
    for (const [key, emoji] of Object.entries(itemEmojis)) {
        if (name.includes(key)) return emoji;
    }
    
    // Emoji por categoría por defecto
    const categoryEmojis = {
        'cocina': '🍴',
        'habitaciones': '🛏️',
        'banos': '🚿',
        'sala': '🛋️',
        'comedor': '🍽️',
        'lavanderia': '🧺',
        'limpieza': '🧹',
        'exterior': '🌳',
        'seguridad': '🔒',
        'electronica': '📱',
        'decoracion': '🎨'
    };
    
    return categoryEmojis[category] || '📦';
}

// ========== OWNER TASKS MOBILE ==========

function loadMobileTasks() {
    const defaultPropId = getMobileSelectedProperty();
    const contentDiv = document.getElementById('tasksContentMobile');

    if (!contentDiv) return;

    // Selector con opcion Todas las propiedades
    const selectElement = document.getElementById('tasksPropertySelect');
    const propertyEntries = Object.entries(properties || {});
    const selectedValue = selectElement?.value || defaultPropId || '';
    const viewAll = selectedValue === 'all';
    const activePropId = viewAll ? null : (selectedValue || defaultPropId);

    // Asegurar estado de propiedad seleccionada
    if (activePropId) {
        mobileSelectedProperty = activePropId;
    }

    if (selectElement) {
        const propertyOptions = propertyEntries.map(([key, prop]) => 
            `<option value="${key}" ${key === activePropId ? 'selected' : ''}>${prop.name}</option>`
        ).join('');
        selectElement.innerHTML = '<option value="">Selecciona una casa...</option><option value="all" ' + (viewAll ? 'selected' : '') + '>Todas las propiedades</option>' + propertyOptions;
        if (!viewAll && activePropId) {
            selectElement.value = activePropId;
        } else if (viewAll) {
            selectElement.value = 'all';
        }
    }

    if (!activePropId && !viewAll) {
        contentDiv.innerHTML = '<div class="empty-state"><div class="empty-text">Selecciona una casa</div></div>';
        return;
    }

    const tasks = cleaningTasks.filter(t => viewAll ? true : t.propertyId === activePropId);
    const pendingCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.length - pendingCount;

    // Resumen de inventario e informes de cierre
    const inventoryPending = inventoryChecks.filter(c => (viewAll ? true : c.propertyId === activePropId) && !c.approved).length;
    const inventoryDone = inventoryChecks.filter(c => (viewAll ? true : c.propertyId === activePropId) && c.approved).length;
    const lastNotification = [...workDayNotifications]
        .filter(n => viewAll ? true : n.propertyId === activePropId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

    const summaryHTML = `
        <div class="section-card" style="margin-bottom: 1rem;">
            <div class="section-title">📊 Resumen</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                <span class="badge" style="background: var(--warning);">Pendientes: ${pendingCount}</span>
                <span class="badge" style="background: var(--success);">Completadas: ${completedCount}</span>
                <span class="badge" style="background: var(--primary);">Inventario ok: ${inventoryDone}</span>
                <span class="badge" style="background: var(--danger);">Inventario pendientes: ${inventoryPending}</span>
            </div>
            ${lastNotification ? `
            <div style="margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 10px;">
                <div style="font-weight: 700; margin-bottom: 0.35rem;">Último cierre de jornada</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${lastNotification.date} ${lastNotification.time || ''} · ${lastNotification.employeeName || 'Empleado'}</div>
                <div style="margin-top: 0.35rem; font-size: 0.9rem;">
                    Tareas pendientes: ${lastNotification.pendingTasks?.length || 0}${lastNotification.pendingInventoryCount ? ` · Inventario pendiente: ${lastNotification.pendingInventoryCount}` : ''}
                </div>
            </div>` : ''}
        </div>
    `;

    if (tasks.length === 0) {
        contentDiv.innerHTML = summaryHTML + '<div class="empty-state"><div class="empty-text">No hay tareas creadas.<br><br><button class="btn btn-primary" onclick="showAddTaskMobile()">Crear Primera Tarea</button></div></div>';
        return;
    }

    const canComplete = mobileCurrentUserType === 'employee';

    const tasksHTML = tasks.map(task => {
        const prop = properties[task.propertyId];
        const assignedStaff = prop?.staff?.find(s => s.id === task.assignedTo);
        const itemClick = canComplete ? `onclick="toggleMobileTask('${task.id}')"` : '';
        const checkboxAttrs = canComplete
            ? `onclick="event.stopPropagation(); toggleMobileTask('${task.id}')"`
            : 'onclick="event.stopPropagation();" disabled';
        return `
            <div class="task-item clickable ${task.completed ? 'completed' : ''}" ${itemClick} style="cursor: ${canComplete ? 'pointer' : 'default'};">
                <input type="checkbox" ${task.completed ? 'checked' : ''} ${checkboxAttrs}>
                <div class="task-content">
                    <div class="task-title">${task.task}</div>
                    <div class="task-meta">
                        ${getPriorityBadge(task.priority)}
                        ${assignedStaff ? `<span class="badge" style="background: var(--primary);">👤 ${assignedStaff.name}</span>` : '<span class="badge" style="background: var(--warning);">Sin asignar</span>'}
                        ${prop ? `<span class="badge" style="background: var(--secondary);">🏠 ${prop.name}</span>` : ''}
                    </div>
                </div>
                <button class="btn-icon" onclick="event.stopPropagation(); deleteMobileTask('${task.id}')" style="color: var(--danger);">🗑️</button>
            </div>
        `;
    }).join('');

    contentDiv.innerHTML = summaryHTML + tasksHTML;
}

function showAddTaskMobile() {
    const propId = getMobileSelectedProperty();
    const propertyOptions = Object.entries(properties || {}).map(([key, prop]) => 
        `<option value="${key}" ${propId === key ? 'selected' : ''}>${prop.name}</option>`
    ).join('');
    const currentProp = propId ? properties[propId] : null;
    const staffOptions = (currentProp?.staff || []).map(s => 
        `<option value="${s.id}">${s.name} - ${getRoleName(s.role)}</option>`
    ).join('');
    
    const modalBody = `
        <div class="form-group">
            <label class="form-label">Propiedad</label>
            <select id="mobileTaskProperty" class="form-control" onchange="onTaskPropertyChangeMobile()">
                <option value="">Selecciona una casa...</option>
                ${propertyOptions}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Descripción de la Tarea</label>
            <input type="text" id="mobileTaskDesc" class="form-control" placeholder="Ej: Limpiar cocina">
        </div>
        <div class="form-group">
            <label class="form-label">Asignar a</label>
            <select id="mobileTaskStaff" class="form-control">
                <option value="">Sin asignar</option>
                ${staffOptions}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select id="mobileTaskPriority" class="form-control">
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
            </select>
        </div>
        <button class="btn btn-primary btn-block" onclick="saveMobileTask()">Crear Tarea</button>
    `;
    showMobileModal('📋 Nueva Tarea', modalBody);
}

// Cambiar staff al cambiar propiedad en el modal de tarea
function onTaskPropertyChangeMobile() {
    const propSelect = document.getElementById('mobileTaskProperty');
    const staffSelect = document.getElementById('mobileTaskStaff');
    if (!propSelect || !staffSelect) return;
    const propId = propSelect.value;
    const prop = properties[propId];
    const staffOptions = (prop?.staff || []).map(s => `<option value="${s.id}">${s.name} - ${getRoleName(s.role)}</option>`).join('');
    staffSelect.innerHTML = '<option value="">Sin asignar</option>' + staffOptions;
}

function saveMobileTask() {
    const modalPropSelect = document.getElementById('mobileTaskProperty');
    const propId = modalPropSelect ? modalPropSelect.value : getMobileSelectedProperty();
    if (!propId) {
        alert('Selecciona una propiedad');
        return;
    }
    
    const desc = document.getElementById('mobileTaskDesc').value.trim();
    const staffId = document.getElementById('mobileTaskStaff').value;
    const priority = document.getElementById('mobileTaskPriority').value;
    
    if (!desc) {
        alert('Ingresa una descripción');
        return;
    }
    
    const task = {
        id: `task_${Date.now()}`,
        propertyId: propId,
        task: desc,
        assignedTo: staffId || null,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    cleaningTasks.push(task);
    saveData();
    closeMobileModal();
    loadMobileTasks();
    alert('✅ Tarea creada');
}

function deleteMobileTask(taskId) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    cleaningTasks = cleaningTasks.filter(t => t.id !== taskId);
    saveData();
    loadMobileTasks();
}

// ========== OWNER SCHEDULE MOBILE ==========

function loadMobileSchedule() {
    const propId = getMobileSelectedProperty();
    const content = document.getElementById('scheduleContentMobile');
    const propSelect = document.getElementById('schedulePropertySelect');
    const staffFilter = document.getElementById('scheduleStaffFilter');

    if (!propId) {
        if (content) content.innerHTML = '<div class="empty-state"><div class="empty-text">Selecciona una casa</div></div>';
        if (propSelect) {
            const propertyOptions = Object.entries(properties || {}).map(([key, prop]) => `<option value="${key}">${prop.name}</option>`).join('');
            propSelect.innerHTML = '<option value="">Selecciona una casa...</option>' + propertyOptions;
        }
        return;
    }
    
    const propertyOptions = Object.entries(properties).map(([key, prop]) => 
        `<option value="${key}" ${key === propId ? 'selected' : ''}>${prop.name}</option>`
    ).join('');
    if (propSelect) {
        propSelect.innerHTML = '<option value="">Selecciona una casa...</option>' + propertyOptions;
        propSelect.value = propId;
    }

    // Staff filter / assignment select
    const prop = properties[propId];
    const staffOptions = (prop?.staff || []).map(s => `<option value="${s.id}">${s.name} - ${getRoleName(s.role)}</option>`).join('');
    if (staffFilter) {
        const current = staffFilter.value;
        staffFilter.innerHTML = '<option value="">Todos los empleados</option>' + staffOptions;
        if (current && (prop?.staff || []).some(s => s.id === current)) {
            staffFilter.value = current;
        }
    }
    const selectedStaff = staffFilter ? staffFilter.value : '';
    
    const schedules = scheduledDates
        .filter(s => s.propertyId === propId)
        .filter(s => !selectedStaff || s.assignedTo === selectedStaff)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (schedules.length === 0) {
        if (content) content.innerHTML = '<div class="empty-state"><div class="empty-text">No hay fechas agendadas<br><br><button class="btn btn-primary" onclick="showAddScheduleMobile()">Agendar ahora</button></div></div>';
        return;
    }
    
    const scheduleHTML = schedules.map(schedule => {
        const prop = properties[schedule.propertyId];
        const assignedStaff = prop?.staff?.find(s => s.id === schedule.assignedTo);
        const date = new Date(schedule.date);
        const isPast = date < new Date();
        return `
            <div class="calendar-item clickable ${schedule.completed ? 'completed' : ''} ${isPast && !schedule.completed ? 'overdue' : ''}" onclick="toggleMobileSchedule('${schedule.id}')" style="cursor: pointer;">
                <div class="calendar-date">
                    <div style="font-weight: 600;">${formatDateShort(schedule.date)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">${date.toLocaleDateString('es-ES', {weekday: 'short'})}</div>
                </div>
                <div class="calendar-content">
                    <div class="calendar-title">${schedule.type}</div>
                    <div class="calendar-meta">
                        <span>🏠 ${prop?.name || 'Casa'}</span>
                        ${assignedStaff ? `<span>👤 ${assignedStaff.name}</span>` : '<span>⚠️ Sin asignar</span>'}
                    </div>
                </div>
                <input type="checkbox" ${schedule.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleMobileSchedule('${schedule.id}')">
            </div>
        `;
    }).join('');
    
    if (content) content.innerHTML = scheduleHTML;
}

function showAddScheduleMobile() {
    const propSelect = document.getElementById('schedulePropertySelect');
    const currentProp = propSelect ? propSelect.value || getMobileSelectedProperty() : getMobileSelectedProperty();
    const propertyOptions = Object.entries(properties || {}).map(([key, prop]) => `<option value="${key}" ${currentProp === key ? 'selected' : ''}>${prop.name}</option>`).join('');
    const prop = currentProp ? properties[currentProp] : null;
    const staffSelect = document.getElementById('scheduleStaffFilter');
    const presetStaffId = staffSelect ? staffSelect.value : '';
    const staffOptions = (prop?.staff || []).map(s => 
        `<option value="${s.id}" ${presetStaffId === s.id ? 'selected' : ''}>${s.name} - ${getRoleName(s.role)}</option>`
    ).join('');
    
    const today = new Date().toISOString().split('T')[0];
    
    const modalBody = `
        <div class="form-group">
            <label class="form-label">Propiedad</label>
            <select id="mobileScheduleProperty" class="form-control" onchange="onSchedulePropertyChangeMobile()">
                <option value="">Selecciona una casa...</option>
                ${propertyOptions}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" id="mobileScheduleDate" class="form-control" min="${today}">
        </div>
        <div class="form-group">
            <label class="form-label">Tipo</label>
            <select id="mobileScheduleType" class="form-control">
                <option value="limpieza-regular">🧹 Limpieza Regular</option>
                <option value="limpieza-profunda">✨ Limpieza Profunda</option>
                <option value="mantenimiento">🔧 Mantenimiento</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Asignar a</label>
            <select id="mobileScheduleStaff" class="form-control">
                <option value="">Sin asignar</option>
                ${staffOptions}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Turno</label>
            <select id="mobileScheduleTime" class="form-control">
                <option value="">Sin turno</option>
                <option value="mañana">🌅 Mañana</option>
                <option value="tarde">🌇 Tarde</option>
                <option value="noche">🌃 Noche</option>
            </select>
        </div>
        <button class="btn btn-primary btn-block" onclick="saveMobileSchedule()">Agendar</button>
    `;
    showMobileModal('📅 Nueva Fecha', modalBody);
}

function saveMobileSchedule() {
    const propSelect = document.getElementById('mobileScheduleProperty');
    const propId = propSelect ? propSelect.value || getMobileSelectedProperty() : getMobileSelectedProperty();
    if (!propId) {
        alert('Selecciona una propiedad');
        return;
    }
    
    const date = document.getElementById('mobileScheduleDate').value;
    const type = document.getElementById('mobileScheduleType').value;
    const staffId = document.getElementById('mobileScheduleStaff').value;
    const time = document.getElementById('mobileScheduleTime').value;
    
    if (!date) {
        alert('Selecciona una fecha');
        return;
    }
    
    const prop = properties[propId];
    const staff = staffId ? prop.staff?.find(s => s.id === staffId) : null;
    
    const schedule = {
        id: `schedule_${Date.now()}`,
        propertyId: propId,
        date: date,
        type: type,
        assignedTo: staffId || null,
        assignedEmployeeName: staff?.name || null,
        startTime: time || null,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    scheduledDates.push(schedule);
    saveData();
    closeMobileModal();
    loadMobileSchedule();
    alert('✅ Fecha agendada');
}

function onSchedulePropertyChangeMobile() {
    const propSelect = document.getElementById('mobileScheduleProperty');
    const staffSelect = document.getElementById('mobileScheduleStaff');
    if (!propSelect || !staffSelect) return;
    const propId = propSelect.value;
    const prop = properties[propId];
    const staffOptions = (prop?.staff || []).map(s => `<option value="${s.id}">${s.name} - ${getRoleName(s.role)}</option>`).join('');
    staffSelect.innerHTML = '<option value="">Sin asignar</option>' + staffOptions;
}

// ========== MORE OPTIONS MOBILE ==========

function loadMobilePurchaseList() {
    const content = document.getElementById('purchaseContentMobile');
    if (!content) return;
    
    const formHTML = `
        <div class="form-group">
            <label class="form-label">Artículo</label>
            <input type="text" id="mobilePurchaseItem" class="form-control" placeholder="Ej: Detergente">
        </div>
        <div class="form-group">
            <label class="form-label">Cantidad</label>
            <input type="number" id="mobilePurchaseQty" class="form-control" value="1" min="1">
        </div>
        <button class="btn btn-primary btn-block" onclick="addMobilePurchaseItem()" style="margin-bottom: 1.5rem;">Agregar a Lista</button>
    `;
    
    content.innerHTML = formHTML + '<div id="mobilePurchaseList"></div>';
    renderMobilePurchaseList();
}

function showAddPurchaseItemMobile() {
    const item = document.getElementById('mobilePurchaseItem');
    if (item) item.focus();
}

function renderMobilePurchaseList() {
    const list = document.getElementById('mobilePurchaseList');
    if (!list) return;
    
    if (purchaseInventory.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-text">Lista vacía</div></div>';
        return;
    }
    
    list.innerHTML = purchaseInventory.map(item => `
        <div class="clickable" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem;">
            <div>
                <div style="font-weight: 600;">🛒 ${item.item}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">Cantidad: ${item.qty}</div>
            </div>
            <button class="btn-icon" onclick="event.stopPropagation(); deleteMobilePurchaseItem('${item.id}')" style="color: var(--danger);">🗑️</button>
        </div>
    `).join('');
}

function addMobilePurchaseItem() {
    const item = document.getElementById('mobilePurchaseItem').value.trim();
    const qty = parseInt(document.getElementById('mobilePurchaseQty').value) || 1;
    
    if (!item) {
        alert('Ingresa el artículo');
        return;
    }
    
    purchaseInventory.push({
        id: `purchase_${Date.now()}`,
        item: item,
        qty: qty,
        createdAt: new Date().toISOString()
    });
    
    saveData();
    document.getElementById('mobilePurchaseItem').value = '';
    document.getElementById('mobilePurchaseQty').value = '1';
    renderMobilePurchaseList();
}

function deleteMobilePurchaseItem(itemId) {
    purchaseInventory = purchaseInventory.filter(i => i.id !== itemId);
    saveData();
    renderMobilePurchaseList();
}

function loadMobileInventoryChecks() {
    const content = document.getElementById('checksContentMobile');
    if (!content) return;
    
    const checks = inventoryChecks.filter(c => !c.approved);
    
    if (checks.length === 0) {
        content.innerHTML = '<div class="empty-state"><div class="empty-text">No hay verificaciones pendientes</div></div>';
        return;
    }
    
    content.innerHTML = checks.map(check => {
        const prop = properties[check.propertyId];
        return `
            <div class="clickable" style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.75rem;">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">🏠 ${prop?.name || 'Casa'}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    Por: ${check.employeeName || 'Empleado'} - ${new Date(check.createdAt).toLocaleDateString()}
                </div>
                <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">${check.notes || 'Sin notas'}</div>
                <button class="btn btn-sm btn-primary" onclick="approveMobileInventoryCheck('${check.id}')">✓ Aprobar</button>
            </div>
        `;
    }).join('');
}

function approveMobileInventoryCheck(checkId) {
    const check = inventoryChecks.find(c => c.id === checkId);
    if (check) {
        check.approved = true;
        check.approvedAt = new Date().toISOString();
        saveData();
        loadMobileInventoryChecks();
        alert('✅ Verificación aprobada');
    }
}

function loadMobilePurchaseRequests() {
    const container = document.getElementById('requestsContentMobile');
    if (!container) return;
    
    const requests = purchaseRequests.filter(r => !r.approved && !r.rejected);
    
    if (requests.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-text">No hay solicitudes pendientes</div></div>';
        return;
    }
    
    container.innerHTML = requests.map(req => {
        const prop = properties[req.propertyId];
        return `
            <div class="clickable" style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.75rem;">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">📝 ${req.item}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    🏠 ${prop?.name || 'Casa'} - Cantidad: ${req.qty}<br>
                    Por: ${req.employeeName || 'Empleado'} - ${new Date(req.createdAt).toLocaleDateString()}
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button class="btn btn-sm btn-primary" onclick="approveMobilePurchaseRequest('${req.id}')" style="flex: 1;">✓ Aprobar</button>
                    <button class="btn btn-sm btn-secondary" onclick="rejectMobilePurchaseRequest('${req.id}')" style="flex: 1; background: var(--danger);">✗ Rechazar</button>
                </div>
            </div>
        `;
    }).join('');
}

function approveMobilePurchaseRequest(reqId) {
    const req = purchaseRequests.find(r => r.id === reqId);
    if (req) {
        req.approved = true;
        req.approvedAt = new Date().toISOString();
        
        // Agregar a lista de compras
        purchaseInventory.push({
            id: `purchase_${Date.now()}`,
            item: req.item,
            qty: req.qty,
            createdAt: new Date().toISOString()
        });
        
        saveData();
        loadMobilePurchaseRequests();
        alert('✅ Solicitud aprobada y agregada a lista de compras');
    }
}

function rejectMobilePurchaseRequest(reqId) {
    const req = purchaseRequests.find(r => r.id === reqId);
    if (req) {
        req.rejected = true;
        req.rejectedAt = new Date().toISOString();
        saveData();
        loadMobilePurchaseRequests();
        alert('❌ Solicitud rechazada');
    }
}

function loadMobileNotifications() {
    const container = document.getElementById('alertsContentMobile');
    if (!container) return;
    
    const notifications = workDayNotifications.filter(n => !n.read);
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-text">No hay alertas</div></div>';
        return;
    }
    
    container.innerHTML = notifications.map(notif => {
        const prop = properties[notif.propertyId];
        return `
            <div class="clickable" style="padding: 1rem; background: var(--warning); color: #000; border-radius: 8px; margin-bottom: 0.75rem;">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">⚠️ Día cerrado con pendientes</div>
                <div style="font-size: 0.85rem; margin-bottom: 0.5rem;">
                    🏠 ${prop?.name || 'Casa'}<br>
                    👤 ${notif.employeeName} - ${notif.date}
                </div>
                <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">
                    <strong>Tareas pendientes:</strong><br>
                    ${(notif.pendingTasks || []).map(t => `• ${t}`).join('<br>')}
                </div>
                <button class="btn btn-sm" onclick="markMobileNotificationRead('${notif.id}')" style="background: #fff; color: #000; margin-top: 0.5rem;">Marcar como leído</button>
            </div>
        `;
    }).join('');
}

function markMobileNotificationRead(notifId) {
    const notif = workDayNotifications.find(n => n.id === notifId);
    if (notif) {
        notif.read = true;
        saveData();
        loadMobileNotifications();
    }
}

function showNotificationsMobile() {
    loadMobileNotifications();
}

function showNotificationsMobile() {
    loadMobileNotifications();
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos
    loadData();

    // Restaurar sesión si viene de un refresh manual
    const tempSessionRaw = localStorage.getItem('airbnbmanager_mobile_session_temp');
    if (tempSessionRaw) {
        localStorage.removeItem('airbnbmanager_mobile_session_temp');
        try {
            const temp = JSON.parse(tempSessionRaw);
            if (temp?.type && temp?.user) {
                mobileCurrentUserType = temp.type;
                mobileCurrentUser = temp.user;
                mobileSelectedProperty = temp.selectedProperty || getMobileSelectedProperty();
                if (temp.type === 'owner') {
                    showMobileOwnerView();
                    if (temp.activeTab) switchMobileTab(temp.activeTab);
                } else {
                    showMobileEmployeeView();
                    if (temp.activeTab) switchEmployeeMobileTab(temp.activeTab);
                }
                return; // Saltar prefills si restauramos sesión
            }
        } catch (e) {
            console.error('No se pudo restaurar sesión temporal', e);
        }
    }
    
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
