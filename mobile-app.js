// Mobile App Logic - redesigned for hamburger layout
// Relies on shared data/state from app.js

const MOBILE_SESSION_KEY = 'airbnbmanager_mobile_session';
let mobileCurrentUserType = null; // owner | manager | employee
let mobileCurrentUser = null;
let mobileSelectedProperty = null;
let mobileActiveSection = 'dashboard';
let mobileActiveScheduleId = null; // track focused schedule for task filtering
let mobilePendingScheduleId = null; // temp holder when navigating from schedule to tasks

// Base task templates for EPIC jobs so employees can see concrete steps
const EPIC_TASK_TEMPLATES = {
    limpieza_regular: [
        'Barrido y trapeado general',
        'Superficies cocina limpias',
        'Baños ordenados y desinfectados',
        'Habitaciones ventiladas y camas tendidas',
        'Basura retirada en todas las áreas'
    ],
    limpieza_profunda: [
        'Desempolvar y aspirar muebles y rincones',
        'Limpieza profunda de cocina (electrodomésticos, campana)',
        'Desinfección completa de baños (paredes, juntas, vidrios)',
        'Lavado y cambio de blancos / protectores',
        'Limpieza detallada de ventanas y marcos'
    ],
    mantenimiento: [
        'Revisar bombillos y reemplazar quemados',
        'Revisar plomería y fugas',
        'Ajustar manijas/cerraduras sueltas',
        'Probar electrodomésticos y reportar fallas',
        'Verificar detectores y extintores'
    ]
};

function ensureAllInventoriesNormalized() {
    try {
        Object.values(properties || {}).forEach(normalizeInventory);
        saveData();
    } catch (e) {
        console.error('No se pudo normalizar inventarios', e);
    }
}

// ---------- Session & Login ----------
function mobileLogin() {
    loadData();
    ensureAllInventoriesNormalized();
    const type = document.getElementById('mobile-login-type').value;
    const username = document.getElementById('mobile-username').value.trim();
    const password = document.getElementById('mobile-password').value.trim();
    const remember = document.getElementById('mobile-remember').checked;

    if (!type || !username || !password) {
        return showToast('Completa usuario y contraseña');
    }

    if (type === 'owner') {
        if (username === OWNER_CREDENTIALS.username && password === OWNER_CREDENTIALS.password) {
            mobileCurrentUserType = 'owner';
            mobileCurrentUser = { name: OWNER_CREDENTIALS.name, username, loginTime: new Date().toISOString() };
            mobileSelectedProperty = mobileSelectedProperty || Object.keys(properties)[0] || null;
            persistMobileSession(remember);
            showMobileOwnerView();
            return;
        }
        return showToast('Credenciales incorrectas', true);
    }

    // staff login
    const match = findStaffByCredentials(username, password, type);
    if (!match) {
        return showToast('Credenciales no válidas', true);
    }

    mobileCurrentUserType = type;
    mobileCurrentUser = {
        staffId: match.staff.id,
        propertyId: match.property.id,
        name: match.staff.name,
        username: match.staff.username,
        role: match.staff.role,
        loginTime: new Date().toISOString()
    };
    mobileSelectedProperty = match.property.id;
    persistMobileSession(remember);

    if (type === 'manager') {
        showMobileManagerView();
    } else {
        showMobileEmployeeView();
    }
}

function persistMobileSession(remember) {
    const payload = {
        type: mobileCurrentUserType,
        user: mobileCurrentUser,
        selectedProperty: mobileSelectedProperty,
        remember: !!remember
    };
    localStorage.setItem(MOBILE_SESSION_KEY, JSON.stringify(payload));
}

function restoreMobileSession() {
    const raw = localStorage.getItem(MOBILE_SESSION_KEY);
    if (!raw) return false;
    try {
        ensureAllInventoriesNormalized();
        const session = JSON.parse(raw);
        if (!session?.type || !session?.user) return false;
        mobileCurrentUserType = session.type;
        mobileCurrentUser = session.user;
        mobileSelectedProperty = session.selectedProperty || null;
        if (mobileCurrentUserType === 'owner') {
            showMobileOwnerView(true);
        } else if (mobileCurrentUserType === 'manager') {
            showMobileManagerView(true);
        } else {
            showMobileEmployeeView(true);
        }
        return true;
    } catch (e) {
        console.error('No se pudo restaurar sesión', e);
        return false;
    }
}

function mobileLogout() {
    mobileCurrentUser = null;
    mobileCurrentUserType = null;
    mobileSelectedProperty = null;
    localStorage.removeItem(MOBILE_SESSION_KEY);
    document.getElementById('mobile-login-view').style.display = 'flex';
    document.getElementById('mobile-owner-view').style.display = 'none';
    document.getElementById('mobile-employee-view').style.display = 'none';
    document.getElementById('mobile-manager-view').style.display = 'none';
}

function refreshMobileApp() {
    // Guardar sesión temporal para restaurar después del reload
    const temp = {
        type: mobileCurrentUserType,
        user: mobileCurrentUser,
        selectedProperty: mobileSelectedProperty
    };
    localStorage.setItem('airbnbmanager_mobile_session_temp', JSON.stringify(temp));
    location.reload();
}

// ---------- Menu Toggles ----------
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-side-menu');
    const overlay = document.getElementById('menu-overlay');
    const btn = document.querySelector('#mobile-owner-view .hamburger-btn');
    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    overlay.classList.toggle('open', !isOpen);
    btn?.classList.toggle('active', !isOpen);
}

function toggleEmployeeMenu() {
    const menu = document.getElementById('employee-side-menu');
    const overlay = document.getElementById('employee-menu-overlay');
    const btn = document.querySelector('#mobile-employee-view .hamburger-btn');
    const open = menu.classList.contains('open');
    menu.classList.toggle('open', !open);
    overlay.classList.toggle('open', !open);
    btn?.classList.toggle('active', !open);
}

function toggleManagerMenu() {
    const menu = document.getElementById('manager-side-menu');
    const overlay = document.getElementById('manager-menu-overlay');
    const btn = document.querySelector('#mobile-manager-view .hamburger-btn');
    const open = menu.classList.contains('open');
    menu.classList.toggle('open', !open);
    overlay.classList.toggle('open', !open);
    btn?.classList.toggle('active', !open);
}

// ---------- Navigation ----------
function showMobileSection(section) {
    mobileActiveSection = section;
    document.querySelectorAll('#mobile-owner-view .content-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('#mobile-side-menu .menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    toggleMobileMenu();
    // Lazy load sections
    switch (section) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'properties':
            loadPropertiesList();
            break;
        case 'inventory':
            loadMobileInventory();
            break;
        case 'inventory-checks':
            loadInventoryChecks();
            break;
        case 'purchase':
            loadMobilePurchaseList();
            break;
        case 'purchase-history':
            loadPurchaseHistory();
            break;
        case 'schedule':
            loadMobileSchedule();
            break;
        case 'tasks':
            loadMobileTasks();
            break;
        case 'notifications':
            loadMobileNotifications();
            break;
        case 'staff':
            loadMobileStaff();
            break;
    }
}

function showEmployeeSection(section) {
    document.querySelectorAll('#mobile-employee-view .content-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('#employee-side-menu .menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section.replace('section-',''));
    });
    toggleEmployeeMenu();
    if (section === 'emp-schedule') {
        mobileActiveScheduleId = null; // viewing calendar resets filter
        loadEmployeeSchedule();
    }
    if (section === 'emp-inventory') loadEmployeeInventory();
    if (section === 'emp-tasks') {
        mobileActiveScheduleId = mobilePendingScheduleId || null; // apply pending schedule filter if any
        mobilePendingScheduleId = null;
        loadEmployeeTasks();
    }
    if (section === 'emp-purchase') loadEmployeePurchaseRequests();
}

function showManagerSection(section) {
    document.querySelectorAll('#mobile-manager-view .content-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('#manager-side-menu .menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section.replace('section-',''));
    });
    toggleManagerMenu();
    if (section === 'mgr-inventory') loadManagerInventory();
    if (section === 'mgr-inventory-checks') loadManagerInventoryChecks();
    if (section === 'mgr-purchase') loadManagerPurchase();
    if (section === 'mgr-purchase-history') loadManagerPurchaseHistory();
    if (section === 'mgr-schedule') loadManagerSchedule();
    if (section === 'mgr-tasks') loadManagerTasks();
    if (section === 'mgr-notifications') loadManagerNotifications();
    if (section === 'mgr-staff') loadManagerStaff();
}

// ---------- Owner View ----------
function showMobileOwnerView(skipLoad) {
    document.getElementById('mobile-login-view').style.display = 'none';
    document.getElementById('mobile-owner-view').style.display = 'flex';
    document.getElementById('mobile-employee-view').style.display = 'none';
    document.getElementById('mobile-manager-view').style.display = 'none';
    document.getElementById('mobile-owner-name').textContent = mobileCurrentUser?.name || 'Propietario';
    updatePropertySelectors();
    if (!skipLoad) {
        loadDashboardStats();
        loadPropertiesList();
        loadMobileInventory();
        loadInventoryChecks();
        loadMobilePurchaseList();
        loadPurchaseHistory();
        loadMobileSchedule();
        loadMobileTasks();
        loadMobileNotifications();
        loadMobileStaff();
    }
}

function loadDashboardStats() {
    const propSelect = document.getElementById('dashboard-property-select');
    const target = document.getElementById('dashboard-stats');
    if (!propSelect || !target) return;
    const propId = propSelect.value || mobileSelectedProperty;
    if (!propSelect.value && mobileSelectedProperty) propSelect.value = mobileSelectedProperty;
    const tasks = cleaningTasks.filter(t => !propId || t.propertyId === propId);
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const schedules = scheduledDates.filter(s => !propId || s.propertyId === propId).length;
    const purchases = purchaseInventory.filter(p => !propId || p.propertyId === propId).length;
    const staffCount = Object.values(properties || {}).reduce((acc, prop) => {
        if (propId && prop.id !== propId) return acc;
        return acc + (prop.staff ? prop.staff.length : 0);
    }, 0);

    target.innerHTML = `
        <div class="stat-card" onclick="showMobileSection('tasks')">
            <div class="stat-icon">📝</div>
            <div class="stat-value">${pendingTasks}</div>
            <div class="stat-label">Tareas pendientes</div>
        </div>
        <div class="stat-card" onclick="showMobileSection('schedule')">
            <div class="stat-icon">📅</div>
            <div class="stat-value">${schedules}</div>
            <div class="stat-label">Fechas agendadas</div>
        </div>
        <div class="stat-card" onclick="showMobileSection('purchase')">
            <div class="stat-icon">🛒</div>
            <div class="stat-value">${purchases}</div>
            <div class="stat-label">Items compra</div>
        </div>
        <div class="stat-card" onclick="showMobileSection('staff')">
            <div class="stat-icon">👥</div>
            <div class="stat-value">${staffCount}</div>
            <div class="stat-label">Personal</div>
        </div>`;
}

function loadPropertiesList() {
    const container = document.getElementById('properties-list');
    if (!container) return;
    container.innerHTML = '';
    const entries = Object.values(properties || {});
    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏠</div><p>Sin propiedades</p></div>';
        return;
    }
    container.innerHTML = entries.map(prop => `
        <div class="property-card">
            <div class="property-icon">🏠</div>
            <div class="property-info">
                <div class="property-name">${prop.name}</div>
                <div class="property-address">${prop.address || ''}</div>
            </div>
            <div class="property-actions">
                <button title="Seleccionar" onclick="setMobileProperty('${prop.id}')">✅</button>
                <button title="Eliminar" onclick="deletePropertyMobile('${prop.id}')">🗑️</button>
            </div>
        </div>`).join('');
}

function setMobileProperty(propId) {
    mobileSelectedProperty = propId;
    updatePropertySelectors();
    loadDashboardStats();
    loadMobileInventory();
    loadInventoryChecks();
    loadMobilePurchaseList();
    loadPurchaseHistory();
    loadMobileSchedule();
    loadMobileTasks();
    loadMobileNotifications();
    loadMobileStaff();
}

function deletePropertyMobile(propId) {
    if (!confirm('¿Eliminar esta propiedad?')) return;
    delete properties[propId];
    cleaningTasks = cleaningTasks.filter(t => t.propertyId !== propId);
    scheduledDates = scheduledDates.filter(s => s.propertyId !== propId);
    purchaseInventory = purchaseInventory.filter(p => p.propertyId !== propId);
    purchaseHistory = purchaseHistory.filter(p => p.propertyId !== propId);
    inventoryChecks = inventoryChecks.filter(c => c.propertyId !== propId);
    saveData();
    mobileSelectedProperty = Object.keys(properties)[0] || null;
    updatePropertySelectors();
    loadPropertiesList();
    loadDashboardStats();
}

function showAddPropertyModal() {
    fillPropertyOptions('new-staff-property');
    document.getElementById('modal-add-property').classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

function addNewProperty() {
    const name = document.getElementById('new-property-name').value.trim();
    const address = document.getElementById('new-property-address').value.trim();
    if (!name || !address) return showToast('Completa nombre y dirección');
    const id = `prop_${Date.now()}`;
    const prop = { id, name, address, staff: [], inventory: {} };
    normalizeInventory(prop);
    properties[id] = prop;
    cleaningTasks.push(...createDefaultCleaningTasks(id, name));
    saveData();
    mobileSelectedProperty = id;
    closeModal('modal-add-property');
    updatePropertySelectors();
    loadPropertiesList();
    loadMobileTasks();
    showToast('Propiedad creada');
}

// ---------- Inventory ----------
function updatePropertySelectors() {
    const selects = [
        'dashboard-property-select', 'inventory-property-select', 'inventory-checks-property-select',
        'purchase-property-select', 'purchase-history-property-select', 'schedule-property-select',
        'tasks-property-select', 'notifications-property-select', 'staff-property-filter'
    ];
    selects.forEach(id => fillPropertyOptions(id));
    if (mobileSelectedProperty) {
        selects.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = mobileSelectedProperty;
        });
        // Staff-dependent selectors for current property
        fillStaffOptions('schedule-employee', mobileSelectedProperty);
        fillStaffOptions('new-task-assignee', mobileSelectedProperty);
        fillStaffOptions('mgr-schedule-employee', mobileSelectedProperty);
        fillStaffOptions('mgr-new-task-assignee', mobileSelectedProperty);
        // Update category filters according to property (e.g., hide Terraza in Torre Magna)
        updateCategoryFiltersForProperty(mobileSelectedProperty);
    }
    // Manager/employee badges
    const mgrBadge = document.getElementById('mgr-property-name');
    if (mgrBadge && mobileCurrentUserType === 'manager') {
        const prop = properties[mobileSelectedProperty];
        mgrBadge.textContent = prop ? prop.name : '';
    }
    const empProp = document.getElementById('emp-assigned-property');
    if (empProp && mobileCurrentUserType === 'employee') {
        const prop = properties[mobileSelectedProperty];
        empProp.textContent = prop ? prop.name : '';
    }
}

function updateCategoryFiltersForProperty(propId) {
    const propName = properties[propId]?.name || '';
    const isTorreMagna = propName.trim().toLowerCase() === 'torre magna pi' || propName.trim().toLowerCase() === 'torre magna';
    const categorySelectIds = ['inventory-category-select','emp-inventory-category','mgr-inventory-category'];
    categorySelectIds.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const opts = Array.from(sel.options);
        const idxTerraza = opts.findIndex(o => (o.text || o.value || '').toLowerCase() === 'terraza');
        if (isTorreMagna) {
            if (idxTerraza >= 0) sel.remove(idxTerraza);
        } else {
            if (idxTerraza < 0) {
                const opt = document.createElement('option');
                opt.value = 'Terraza';
                opt.text = 'Terraza';
                sel.appendChild(opt);
            }
        }
    });
}

function fillPropertyOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const entries = Object.values(properties || {});
    select.innerHTML = '<option value="">Seleccione propiedad</option>' + entries.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function loadMobileInventory() {
    const propId = document.getElementById('inventory-property-select')?.value || mobileSelectedProperty;
    const rawCategory = document.getElementById('inventory-category-select')?.value || '';
    const category = normalizeCategoryFilter(rawCategory);
    if (propId) mobileSelectedProperty = propId;
    const container = document.getElementById('inventory-list');
    if (!container) return;
    if (!propId || !properties[propId]) {
        container.innerHTML = '<div class="empty-state"><p>Selecciona una propiedad</p></div>';
        return;
    }
    const prop = properties[propId];
    const inventory = prop.inventory || {};
    const groups = Object.keys(inventory)
        .filter(catKey => {
            if (!category) return true;
            return catKey === category;
        })
        .map(catKey => {
            const catName = INVENTORY_CATEGORIES[catKey]?.name || catKey;
            const itemsHtml = (inventory[catKey] || []).map(it => `
                <div class="inventory-item">
                    <div class="item-info">
                        <div class="item-name">${it.name}</div>
                        <div class="item-details">${catName}</div>
                    </div>
                    <div class="item-qty">${it.qty ?? 0}</div>
                </div>
            `).join('');
            return `
                <div class="inventory-zone">
                    <h3 class="zone-title">${catName}</h3>
                    <div class="inventory-grid">${itemsHtml || '<div class="empty-state"><p>Sin items</p></div>'}</div>
                </div>
            `;
        });
    if (!groups.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin items en esta categoría</p></div>';
        return;
    }
    container.innerHTML = groups.join('');
}

function showAddInventoryModal() {
    document.getElementById('modal-add-inventory').classList.add('open');
}

function addInventoryItem() {
    const propId = mobileSelectedProperty || document.getElementById('inventory-property-select')?.value;
    const name = document.getElementById('new-item-name').value.trim();
    const qty = Math.max(0, parseInt(document.getElementById('new-item-qty').value, 10) || 0);
    const category = document.getElementById('new-item-category').value;
    if (!propId) return showToast('Selecciona propiedad', true);
    if (!name || !category) return showToast('Completa nombre y categoría', true);
    const prop = properties[propId];
    if (!prop.inventory[category]) prop.inventory[category] = [];
    prop.inventory[category].push({ id: `${category}-${Date.now()}`, name, qty });
    saveData();
    closeModal('modal-add-inventory');
    loadMobileInventory();
    showToast('Artículo agregado');
}

function resetInventoryVerification() {
    if (!mobileSelectedProperty) return showToast('Selecciona propiedad');
    inventoryChecks = inventoryChecks.filter(c => c.propertyId !== mobileSelectedProperty);
    saveData();
    showToast('Verificación reseteada');
}

function loadInventoryChecks() {
    const propId = document.getElementById('inventory-checks-property-select')?.value || mobileSelectedProperty;
    const container = document.getElementById('inventory-checks-list');
    if (!container) return;
    if (!propId) {
        container.innerHTML = '<div class="empty-state"><p>Selecciona una propiedad</p></div>';
        return;
    }
    const checks = inventoryChecks.filter(c => c.propertyId === propId);
    if (!checks.length) {
        container.innerHTML = '<div class="empty-state"><p>No hay verificaciones</p></div>';
        return;
    }
    container.innerHTML = checks.map(c => `
        <div class="check-item">
            <div class="check-date">${new Date(c.createdAt || c.date || Date.now()).toLocaleDateString('es-ES')}</div>
            <div class="check-employee">${c.employeeName || 'Empleado'}</div>
            <div class="check-status">${c.approved ? 'Aprobado' : 'Pendiente'}</div>
        </div>`).join('');
}

// ---------- Purchase ----------
function loadMobilePurchaseList() {
    const propId = document.getElementById('purchase-property-select')?.value || mobileSelectedProperty;
    if (propId) mobileSelectedProperty = propId;
    const container = document.getElementById('purchase-list');
    if (!container) return;
    const items = purchaseInventory.filter(p => !propId || p.propertyId === propId);
    if (!items.length) {
        container.innerHTML = '<div class="empty-state"><p>Lista vacía</p></div>';
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="purchase-item">
            <input type="checkbox" class="purchase-checkbox" ${item.purchased ? 'checked' : ''} onclick="togglePurchaseStatus('${item.id}')">
            <div class="purchase-info">
                <div class="purchase-name">${item.name || item.item}</div>
                <div class="purchase-details">Cant: ${item.qty || 1}</div>
            </div>
            <div class="purchase-urgency ${item.urgency === 'urgente' ? 'urgency-urgente' : 'urgency-normal'}">${item.urgency || 'normal'}</div>
        </div>`).join('');
}

function loadPurchaseHistory() {
    const propId = document.getElementById('purchase-history-property-select')?.value || mobileSelectedProperty;
    const container = document.getElementById('purchase-history-list');
    if (!container) return;
    const history = purchaseHistory.filter(h => !propId || h.propertyId === propId);
    if (!history.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin historial</p></div>';
        return;
    }
    container.innerHTML = history.map(h => `
        <div class="history-item">
            <div class="history-date">${new Date(h.purchaseDate || Date.now()).toLocaleString('es-ES')}</div>
            <div class="history-content">${h.itemName || h.name} · ${h.qty || 1}</div>
        </div>`).join('');
}

// ---------- Schedule ----------
function loadMobileSchedule() {
    const propId = document.getElementById('schedule-property-select')?.value || mobileSelectedProperty;
    if (propId) mobileSelectedProperty = propId;
    fillStaffOptions('schedule-employee', propId);
    const list = document.getElementById('schedule-list');
    if (!list) return;
    if (!propId) {
        list.innerHTML = '<div class="empty-state"><p>Selecciona una propiedad</p></div>';
        return;
    }
    const items = scheduledDates.filter(s => s.propertyId === propId).sort((a,b)=> new Date(a.date)-new Date(b.date));
    if (!items.length) {
        list.innerHTML = '<div class="empty-state"><p>Sin fechas agendadas</p></div>';
        return;
    }
    list.innerHTML = items.map(s => {
        const staff = (properties[propId]?.staff || []).find(st => st.id === s.assignedTo);
        const epicValue = s.epicType || 'limpieza_regular';
        const hasEpic = s.type === 'epic' || !!s.epicType;
        const typeLabel = s.type === 'descanso' ? 'descanso' : hasEpic ? 'EPIC D1' : s.type;
        const epicLabel = hasEpic ? formatEpicType(epicValue) : '';
        return `
            <div class="schedule-entry">
                <div class="entry-info">
                    <div class="entry-date">${formatDateShort(s.date)}</div>
                    <div class="entry-details">${staff ? staff.name : 'Sin asignar'} · ${s.shift || s.startTime || 'turno libre'}</div>
                    ${epicLabel ? `<div class="entry-epic">${epicLabel}</div>` : ''}
                </div>
                <span class="entry-type ${s.type === 'descanso' ? 'type-descanso' : 'type-trabajo'}">${typeLabel}</span>
                <div class="entry-actions">
                    <button class="btn-secondary btn-small" onclick="openEditSchedule('${s.id}')">✏️ Editar</button>
                    <button class="btn-warning btn-small" onclick="resetTasksForSchedule('${s.id}')">↻ Tareas</button>
                </div>
            </div>`;
    }).join('');
}

function addMobileSchedule() {
    const propId = document.getElementById('schedule-property-select')?.value || mobileSelectedProperty;
    const date = document.getElementById('schedule-date').value;
    const type = document.getElementById('schedule-type').value;
    const employeeId = document.getElementById('schedule-employee').value;
    const shift = document.getElementById('schedule-shift').value;
    const epicType = document.getElementById('schedule-epic-type')?.value || 'limpieza_regular';
    if (!propId) return showToast('Selecciona propiedad', true);
    if (!date) return showToast('Selecciona fecha', true);
    const prop = properties[propId];
    const staff = (prop?.staff || []).find(s => s.id === employeeId);
    scheduledDates.push({
        id: `schedule_${Date.now()}`,
        propertyId: propId,
        date,
        type,
        assignedTo: employeeId || null,
        assignedEmployeeName: staff?.name || null,
        shift,
        epicType,
        completed: false
    });
    saveData();
    loadMobileSchedule();
    showToast('Fecha agregada');
}

function formatEpicType(val) {
    if (val === 'limpieza_profunda') return 'Limpieza Profunda';
    if (val === 'mantenimiento') return 'Mantenimiento';
    return 'Limpieza Regular';
}

function openEditSchedule(id) {
    const s = scheduledDates.find(x => x.id === id);
    if (!s) return;
    document.getElementById('edit-schedule-id').value = s.id;
    document.getElementById('edit-schedule-date').value = s.date;
    document.getElementById('edit-schedule-type').value = s.type;
    document.getElementById('edit-schedule-shift').value = s.shift || 'completo';
    document.getElementById('edit-schedule-epic-type').value = s.epicType || 'limpieza_regular';
    // fill employee options for current property
    const sel = document.getElementById('edit-schedule-employee');
    const options = (properties[s.propertyId]?.staff || []).map(st => `<option value="${st.id}">${st.name}</option>`).join('');
    sel.innerHTML = '<option value="">Sin asignar</option>' + options;
    sel.value = s.assignedTo || '';
    document.getElementById('modal-edit-schedule').classList.add('open');
}

function ensureTasksForSchedule(schedule) {
    if (!schedule) return [];
    const epicKey = schedule.epicType || 'limpieza_regular';
    const template = EPIC_TASK_TEMPLATES[epicKey] || EPIC_TASK_TEMPLATES.limpieza_regular;
    const existing = cleaningTasks.filter(t => t.scheduleId === schedule.id);
    if (existing.length) return existing;
    const propId = schedule.propertyId;
    const assignedTo = schedule.assignedTo || null;
    const assignedEmployeeName = schedule.assignedEmployeeName || null;
    const created = template.map((text, idx) => ({
        id: `task_${schedule.id}_${idx}`,
        propertyId: propId,
        sectionKey: 'limpieza',
        taskText: text,
        subsectionTitle: `EPIC D1 · ${formatEpicType(epicKey)}`,
        scheduleId: schedule.id,
        assignedTo,
        assignedEmployeeName,
        completed: false,
        createdAt: new Date().toISOString()
    }));
    cleaningTasks.push(...created);
    saveData();
    return created;
}

function handleEmployeeScheduleClick(scheduleId) {
    const s = scheduledDates.find(x => x.id === scheduleId);
    if (!s) return;
    mobileSelectedProperty = s.propertyId;
    mobilePendingScheduleId = s.id;
    ensureTasksForSchedule(s);
    showEmployeeSection('emp-tasks');
    loadEmployeeTasks();
    showToast('Tareas cargadas para este turno');
}

function saveEditedSchedule() {
    const id = document.getElementById('edit-schedule-id').value;
    const sIdx = scheduledDates.findIndex(x => x.id === id);
    if (sIdx < 0) return;
    const s = scheduledDates[sIdx];
    s.date = document.getElementById('edit-schedule-date').value || s.date;
    s.type = document.getElementById('edit-schedule-type').value || s.type;
    s.assignedTo = document.getElementById('edit-schedule-employee').value || null;
    const staff = (properties[s.propertyId]?.staff || []).find(st => st.id === s.assignedTo);
    s.assignedEmployeeName = staff?.name || null;
    s.shift = document.getElementById('edit-schedule-shift').value || s.shift;
    s.epicType = document.getElementById('edit-schedule-epic-type').value || s.epicType || 'limpieza_regular';
    if (s.type !== 'descanso' && cleaningTasks.filter(t => t.scheduleId === s.id).length === 0) {
        ensureTasksForSchedule(s);
    }
    saveData();
    closeModal('modal-edit-schedule');
    loadMobileSchedule();
    loadManagerSchedule();
    loadEmployeeSchedule();
    showToast('Trabajo actualizado');
}

// ---------- Tasks ----------
function isMaintenanceTask(task) {
    const key = (task.sectionKey || task.type || '').toLowerCase();
    return key.includes('mantenimiento') || key.includes('mant') || key === 'mantenimiento';
}

function loadMobileTasks() {
    const propId = document.getElementById('tasks-property-select')?.value || mobileSelectedProperty;
    const typeFilter = document.getElementById('tasks-type-filter')?.value || '';
    if (propId) mobileSelectedProperty = propId;
    fillStaffOptions('new-task-assignee', propId);
    const limpiezaDiv = document.getElementById('tasks-limpieza-list');
    const mantenimientoDiv = document.getElementById('tasks-mantenimiento-list');
    if (!limpiezaDiv || !mantenimientoDiv) return;
    const tasks = cleaningTasks.filter(t => !propId || t.propertyId === propId).filter(t => {
        if (!typeFilter) return true;
        return typeFilter === 'mantenimiento' ? isMaintenanceTask(t) : !isMaintenanceTask(t);
    });
    const clean = tasks.filter(t => !isMaintenanceTask(t));
    const maint = tasks.filter(t => isMaintenanceTask(t));
    limpiezaDiv.innerHTML = renderTaskList(clean);
    mantenimientoDiv.innerHTML = renderTaskList(maint);
}

function renderTaskList(list) {
    if (!list.length) return '<div class="empty-state"><p>Sin tareas</p></div>';
    return list.map(t => `
        <div class="task-item">
            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTaskComplete('${t.id}')">
            <div class="task-content">
                <div class="task-name ${t.completed ? 'completed' : ''}">${t.taskText || t.task || 'Tarea'}</div>
                <div class="task-meta">${t.subsectionTitle || t.sectionKey || ''}</div>
            </div>
        </div>`).join('');
}

function resetTasksForSchedule(scheduleId) {
    const schedule = scheduledDates.find(s => s.id === scheduleId);
    if (!schedule) return showToast('Turno no encontrado', true);
    const tasks = cleaningTasks.filter(t => t.scheduleId === scheduleId);
    if (tasks.length === 0 && schedule.type !== 'descanso') {
        ensureTasksForSchedule(schedule);
    } else {
        tasks.forEach(t => t.completed = false);
        saveData();
    }
    loadMobileTasks?.();
    loadManagerTasks?.();
    loadEmployeeTasks?.();
    showToast('Tareas reiniciadas para el turno');
}

function toggleTaskComplete(taskId) {
    const idx = cleaningTasks.findIndex(t => t.id === taskId);
    if (idx < 0) return;
    cleaningTasks[idx].completed = !cleaningTasks[idx].completed;
    saveData();
    loadMobileTasks();
    loadManagerTasks?.();
    loadEmployeeTasks?.();
}

function addMobileTask() {
    const propId = document.getElementById('tasks-property-select')?.value || mobileSelectedProperty;
    const text = document.getElementById('new-task-input').value.trim();
    const type = document.getElementById('new-task-type').value;
    const assignee = document.getElementById('new-task-assignee').value;
    if (!propId) return showToast('Selecciona propiedad', true);
    if (!text) return showToast('Describe la tarea', true);
    const prop = properties[propId];
    const staff = (prop?.staff || []).find(s => s.id === assignee);
    cleaningTasks.push({
        id: `task_${Date.now()}`,
        propertyId: propId,
        sectionKey: type,
        taskText: text,
        assignedTo: assignee || null,
        assignedEmployeeName: staff?.name || null,
        completed: false,
        createdAt: new Date().toISOString()
    });
    saveData();
    document.getElementById('new-task-input').value = '';
    loadMobileTasks();
    showToast('Tarea creada');
}

function reinitializeTasks() {
    const propId = document.getElementById('tasks-property-select')?.value || mobileSelectedProperty;
    if (!propId) return showToast('Selecciona propiedad');
    if (!confirm('Reiniciar tareas a lista base?')) return;
    const prop = properties[propId];
    cleaningTasks = cleaningTasks.filter(t => t.propertyId !== propId);
    cleaningTasks.push(...createDefaultCleaningTasks(propId, prop?.name || ''));
    saveData();
    loadMobileTasks();
}

function toggleTaskGroup(key) {
    const group = document.getElementById(key.startsWith('emp') ? key : `tasks-${key}`);
    if (!group) return;
    group.classList.toggle('collapsed');
}

// ---------- Notifications ----------
function loadMobileNotifications() {
    const propId = document.getElementById('notifications-property-select')?.value || mobileSelectedProperty;
    const container = document.getElementById('notifications-list');
    if (!container) return;
    const list = workDayNotifications.filter(n => !propId || n.propertyId === propId);
    if (!list.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin notificaciones</p></div>';
        return;
    }
    container.innerHTML = list.map(n => `
        <div class="notification-item">
            <div class="notification-date">${n.date || new Date(n.createdAt||Date.now()).toLocaleDateString('es-ES')}</div>
            <div class="notification-content">${n.message || 'Cierre de jornada'} · ${n.employeeName || ''}</div>
        </div>`).join('');
}

function sendMobileNotification() {
    const propId = document.getElementById('notifications-property-select')?.value || mobileSelectedProperty;
    const text = document.getElementById('new-notification').value.trim();
    if (!propId) return showToast('Selecciona propiedad', true);
    if (!text) return showToast('Escribe mensaje', true);
    workDayNotifications.push({
        id: `notif_${Date.now()}`,
        propertyId: propId,
        message: text,
        date: new Date().toLocaleString('es-ES'),
        createdAt: new Date().toISOString(),
        read: false
    });
    saveData();
    document.getElementById('new-notification').value = '';
    loadMobileNotifications();
    showToast('Notificación enviada');
}

// ---------- Staff ----------
function loadMobileStaff() {
    const propId = document.getElementById('staff-property-filter')?.value || '';
    const container = document.getElementById('staff-list');
    if (!container) return;
    const entries = Object.values(properties || {});
    const staff = entries.flatMap(p => (p.staff || []).map(s => ({...s, propertyName: p.name, propertyId: p.id})))
        .filter(s => !propId || s.propertyId === propId);
    if (!staff.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin personal</p></div>';
        return;
    }
    container.innerHTML = staff.map(s => `
        <div class="staff-card">
            <div class="staff-avatar">${s.name.charAt(0).toUpperCase()}</div>
            <div class="staff-info">
                <div class="staff-name">${s.name}</div>
                <div class="staff-role">${getRoleName(s.role)}</div>
                <div class="staff-property">${s.propertyName}</div>
            </div>
        </div>`).join('');
}

function showAddStaffModal() {
    fillPropertyOptions('new-staff-property');
    document.getElementById('modal-add-staff').classList.add('open');
}

function addNewStaff() {
    const name = document.getElementById('new-staff-name').value.trim();
    const username = document.getElementById('new-staff-username').value.trim();
    const password = document.getElementById('new-staff-password').value.trim();
    const role = document.getElementById('new-staff-role').value;
    const propId = document.getElementById('new-staff-property').value;
    if (!name || !username || !password || !propId) return showToast('Completa todos los campos', true);
    const prop = properties[propId];
    if (!prop.staff) prop.staff = [];
    prop.staff.push({ id: `staff_${Date.now()}`, name, username, password, role });
    saveData();
    closeModal('modal-add-staff');
    loadMobileStaff();
    updatePropertySelectors();
    showToast('Empleado agregado');
}

// ---------- Employee View ----------
function showMobileEmployeeView(skipLoad) {
    document.getElementById('mobile-login-view').style.display = 'none';
    document.getElementById('mobile-owner-view').style.display = 'none';
    document.getElementById('mobile-manager-view').style.display = 'none';
    document.getElementById('mobile-employee-view').style.display = 'flex';
    document.getElementById('mobile-employee-name').textContent = mobileCurrentUser?.name || 'Empleado';
    document.getElementById('menu-employee-property').textContent = properties[mobileSelectedProperty]?.name || '';
    document.getElementById('emp-login-time').textContent = new Date(mobileCurrentUser.loginTime || Date.now()).toLocaleTimeString('es-ES');
    document.getElementById('menu-login-time').textContent = new Date(mobileCurrentUser.loginTime || Date.now()).toLocaleTimeString('es-ES');
    document.getElementById('emp-assigned-property').textContent = properties[mobileSelectedProperty]?.name || '';
    document.getElementById('emp-shift-info').textContent = 'Completo';
    if (!skipLoad) {
        loadEmployeeDashboard();
        loadEmployeeSchedule();
        loadEmployeeInventory();
        loadEmployeeTasks();
        loadEmployeePurchaseRequests();
    }
}

function loadEmployeeSchedule() {
    const propId = mobileSelectedProperty;
    const list = document.getElementById('emp-schedule-list');
    if (!list) return;
    const items = scheduledDates.filter(s => s.propertyId === propId && (!s.assignedTo || s.assignedTo === mobileCurrentUser.staffId));
    if (!items.length) {
        list.innerHTML = '<div class="empty-state"><p>Sin horarios</p></div>';
        return;
    }
    list.innerHTML = items.map(s => {
        const epicValue = s.epicType || 'limpieza_regular';
        const hasEpic = s.type === 'epic' || !!s.epicType;
        const epicLabel = hasEpic ? formatEpicType(epicValue) : '';
        const typeLabel = s.type === 'descanso' ? 'descanso' : hasEpic ? `EPIC D1 · ${epicLabel}` : s.type;
        return `
            <div class="schedule-entry clickable" data-sid="${s.id}" style="cursor:pointer;">
                <div class="entry-info">
                    <div class="entry-date">${formatDateShort(s.date)}</div>
                    <div class="entry-details">${typeLabel} · ${s.shift || 'turno'}</div>
                </div>
                <span class="entry-type ${s.type === 'descanso' ? 'type-descanso' : 'type-trabajo'}">${typeLabel}</span>
            </div>`;
    }).join('');
    setTimeout(() => {
        const cards = list.querySelectorAll('.schedule-entry.clickable[data-sid]');
        cards.forEach(card => {
            card.style.cursor = 'pointer';
            const handleClick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleEmployeeScheduleClick(card.dataset.sid);
            };
            card.addEventListener('click', handleClick);
            card.addEventListener('touchend', handleClick);
        });
    }, 100);
}

function loadEmployeeInventory() {
    const propId = mobileSelectedProperty;
    const rawCategory = document.getElementById('emp-inventory-category')?.value || '';
    const category = normalizeCategoryFilter(rawCategory);
    const container = document.getElementById('emp-inventory-list');
    if (!container) return;
    const prop = properties[propId];
    if (!prop) {
        container.innerHTML = '<div class="empty-state"><p>Sin propiedad</p></div>';
        return;
    }
    const inventory = prop.inventory || {};
    const groups = Object.keys(inventory)
        .filter(catKey => {
            if (!category) return true;
            return catKey === category;
        })
        .map(catKey => {
            const catName = INVENTORY_CATEGORIES[catKey]?.name || catKey;
            const itemsHtml = (inventory[catKey] || []).map(it => `
                <div class="inventory-item">
                    <div class="item-info">
                        <div class="item-name">${it.name}</div>
                        <div class="item-details">${catName}</div>
                    </div>
                    <div class="item-qty">${it.qty ?? 0}</div>
                </div>
            `).join('');
            return `
                <div class="inventory-zone">
                    <h3 class="zone-title">${catName}</h3>
                    <div class="inventory-grid">${itemsHtml || '<div class="empty-state"><p>Sin items</p></div>'}</div>
                </div>
            `;
        });
    if (!groups.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin items</p></div>';
        return;
    }
    container.innerHTML = groups.join('');
}

function submitPurchaseRequest() {
    const item = document.getElementById('emp-purchase-item').value.trim();
    const qty = Math.max(1, parseInt(document.getElementById('emp-purchase-qty').value, 10) || 1);
    const urgency = document.getElementById('emp-purchase-urgency').value;
    const reason = document.getElementById('emp-purchase-reason').value.trim();
    if (!item) return showToast('Ingresa artículo');
    purchaseRequests.push({
        id: `preq_${Date.now()}`,
        propertyId: mobileSelectedProperty,
        item,
        qty,
        urgency,
        reason,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        approved: false,
        rejected: false,
        createdAt: new Date().toISOString()
    });
    saveData();
    document.getElementById('emp-purchase-item').value = '';
    document.getElementById('emp-purchase-qty').value = '1';
    document.getElementById('emp-purchase-reason').value = '';
    loadEmployeePurchaseRequests();
    showToast('Solicitud enviada');
}

function loadEmployeePurchaseRequests() {
    const container = document.getElementById('emp-purchase-requests');
    if (!container) return;
    const list = purchaseRequests.filter(r => r.propertyId === mobileSelectedProperty && r.employeeId === mobileCurrentUser.staffId);
    if (!list.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin solicitudes</p></div>';
        return;
    }
    container.innerHTML = list.map(r => `<div class="request-item"><div><strong>${r.item}</strong> · x${r.qty}</div><div class="request-status status-${r.approved?'approved':r.rejected?'rejected':'pending'}">${r.approved?'Aprobada':r.rejected?'Rechazada':'Pendiente'}</div></div>`).join('');
}

function loadEmployeeTasks() {
    const propId = mobileSelectedProperty;
    const tasks = cleaningTasks.filter(t => t.propertyId === propId && (!t.assignedTo || t.assignedTo === mobileCurrentUser.staffId))
        .filter(t => !mobileActiveScheduleId || t.scheduleId === mobileActiveScheduleId);
    const clean = tasks.filter(t => !isMaintenanceTask(t));
    const maint = tasks.filter(t => isMaintenanceTask(t));
    document.getElementById('emp-tasks-limpieza-list').innerHTML = renderTaskList(clean);
    document.getElementById('emp-tasks-mantenimiento-list').innerHTML = renderTaskList(maint);
}

function finishWorkDay() {
    const propId = mobileSelectedProperty;
    const tasks = cleaningTasks.filter(t => t.propertyId === propId && (!t.assignedTo || t.assignedTo === mobileCurrentUser.staffId));
    const pending = tasks.filter(t => !t.completed);
    const summary = {
        id: `notif_${Date.now()}`,
        propertyId: propId,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        date: new Date().toLocaleDateString('es-ES'),
        time: new Date().toLocaleTimeString('es-ES'),
        pendingTasks: pending.map(t => t.taskText || t.task || 'Tarea'),
        pendingInventoryCount: inventoryChecks.filter(c => c.propertyId === propId && !c.approved).length,
        read: false,
        createdAt: new Date().toISOString()
    };
    workDayNotifications.push(summary);
    saveData();
    loadMobileNotifications();
    showToast('Jornada finalizada');
}

// ---------- Manager View ----------
function showMobileManagerView(skipLoad) {
    document.getElementById('mobile-login-view').style.display = 'none';
    document.getElementById('mobile-owner-view').style.display = 'none';
    document.getElementById('mobile-employee-view').style.display = 'none';
    document.getElementById('mobile-manager-view').style.display = 'flex';
    document.getElementById('mobile-manager-name').textContent = mobileCurrentUser?.name || 'Gerente';
    document.getElementById('menu-manager-property').textContent = properties[mobileCurrentUser.propertyId]?.name || '';
    document.getElementById('mgr-property-name').textContent = properties[mobileCurrentUser.propertyId]?.name || '';
    mobileSelectedProperty = mobileCurrentUser.propertyId;
    updatePropertySelectors();
    if (!skipLoad) {
        loadManagerDashboard();
        loadManagerInventory();
        loadManagerInventoryChecks();
        loadManagerPurchase();
        loadManagerPurchaseHistory();
        loadManagerSchedule();
        loadManagerTasks();
        loadManagerNotifications();
        loadManagerStaff();
    }
}

function loadManagerDashboard() {
    const container = document.getElementById('mgr-dashboard-stats');
    if (!container) return;
    const tasks = cleaningTasks.filter(t => t.propertyId === mobileSelectedProperty);
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const staff = properties[mobileSelectedProperty]?.staff || [];
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${completed}</div>
            <div class="stat-label">Tareas completadas</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value">${pending}</div>
            <div class="stat-label">Tareas pendientes</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">${staff.length}</div>
            <div class="stat-label">Personal asignado</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-value">${purchaseInventory.filter(p => p.propertyId === mobileSelectedProperty).length}</div>
            <div class="stat-label">Items en compra</div>
        </div>
    `;
}

function loadManagerInventory() {
    const container = document.getElementById('mgr-inventory-list');
    if (!container) return;
    const prop = properties[mobileSelectedProperty];
    if (!prop) return;
    const rawCategory = document.getElementById('mgr-inventory-category')?.value || '';
    const category = normalizeCategoryFilter(rawCategory);
    const inventory = prop.inventory || {};
    const groups = Object.keys(inventory)
        .filter(catKey => {
            if (!category) return true;
            return catKey === category;
        })
        .map(catKey => {
            const catName = INVENTORY_CATEGORIES[catKey]?.name || catKey;
            const itemsHtml = (inventory[catKey] || []).map(it => `
                <div class="inventory-item">
                    <div class="item-info">
                        <div class="item-name">${it.name}</div>
                        <div class="item-details">${catName}</div>
                    </div>
                    <div class="item-qty">${it.qty ?? 0}</div>
                </div>
            `).join('');
            return `
                <div class="inventory-zone">
                    <h3 class="zone-title">${catName}</h3>
                    <div class="inventory-grid">${itemsHtml || '<div class="empty-state"><p>Sin items</p></div>'}</div>
                </div>
            `;
        });
    container.innerHTML = groups.join('');
}

// Map UI labels to internal category keys
function normalizeCategoryFilter(val) {
    const v = (val || '').toLowerCase();
    if (!v) return '';
    const map = {
        'habitacion': 'habitaciones',
        'habitaciones': 'habitaciones',
        'baño': 'banos',
        'banos': 'banos',
        'cocina': 'cocina',
        'sala': 'sala',
        'comedor': 'comedor',
        'lavanderia': 'lavanderia',
        'limpieza': 'limpieza',
        'terraza': 'terraza',
        'exterior': 'terraza' // if used as synonym
    };
    // Also match display names from INVENTORY_CATEGORIES
    const nameToKey = Object.entries(INVENTORY_CATEGORIES).reduce((acc,[key,obj])=>{ acc[(obj.name||'').toLowerCase()] = key; return acc; },{});
    return map[v] || nameToKey[v] || '';
}

function showAddInventoryModalManager() { showAddInventoryModal(); }
function resetManagerInventoryVerification() { resetInventoryVerification(); loadManagerInventoryChecks(); }
function loadManagerInventoryChecks() {
    const container = document.getElementById('mgr-inventory-checks-list');
    if (!container) return;
    const checks = inventoryChecks.filter(c => c.propertyId === mobileSelectedProperty);
    container.innerHTML = checks.map(c => `<div class="check-item"><div class="check-date">${new Date(c.createdAt||Date.now()).toLocaleDateString('es-ES')}</div><div class="check-employee">${c.employeeName||'Empleado'}</div><div class="check-status">${c.approved?'Aprobado':'Pendiente'}</div></div>`).join('') || '<div class="empty-state"><p>Sin verificaciones</p></div>';
}

function loadManagerPurchase() {
    const container = document.getElementById('mgr-purchase-list');
    if (!container) return;
    const items = purchaseInventory.filter(p => p.propertyId === mobileSelectedProperty);
    container.innerHTML = items.map(item => `<div class="purchase-item"><input type="checkbox" class="purchase-checkbox" ${item.purchased?'checked':''} onclick="togglePurchaseStatus('${item.id}')"><div class="purchase-info"><div class="purchase-name">${item.name||item.item}</div><div class="purchase-details">x${item.qty||1}</div></div></div>`).join('') || '<div class="empty-state"><p>Lista vacía</p></div>';
}

function togglePurchaseStatus(itemId) {
    const item = purchaseInventory.find(p => p.id === itemId);
    if (item) {
        item.purchased = !item.purchased;
        saveData();
        loadManagerPurchase();
    }
}

function loadManagerPurchaseHistory() {
    const container = document.getElementById('mgr-purchase-history-list');
    if (!container) return;
    const list = purchaseHistory.filter(h => h.propertyId === mobileSelectedProperty);
    container.innerHTML = list.map(h => `<div class="history-item"><div class="history-date">${new Date(h.purchaseDate||Date.now()).toLocaleString('es-ES')}</div><div class="history-content">${h.itemName||h.name} · ${h.qty||1}</div></div>`).join('') || '<div class="empty-state"><p>Sin historial</p></div>';
}

function addManagerSchedule() {
    const propId = mobileSelectedProperty;
    const date = document.getElementById('mgr-schedule-date').value;
    const type = document.getElementById('mgr-schedule-type').value;
    const employeeId = document.getElementById('mgr-schedule-employee').value;
    const shift = document.getElementById('mgr-schedule-shift').value;
    const epicType = document.getElementById('mgr-schedule-epic-type')?.value || 'limpieza_regular';
    if (!propId) return showToast('Selecciona propiedad');
    if (!date) return showToast('Selecciona fecha');
    const prop = properties[propId];
    const staff = (prop?.staff || []).find(s => s.id === employeeId);
    scheduledDates.push({
        id: `schedule_${Date.now()}`,
        propertyId: propId,
        date,
        type,
        assignedTo: employeeId || null,
        assignedEmployeeName: staff?.name || null,
        shift,
        epicType,
        completed: false
    });
    saveData();
    document.getElementById('mgr-schedule-date').value = '';
    loadManagerSchedule();
    showToast('Fecha agregada');
}

function loadManagerSchedule() {
    const container = document.getElementById('mgr-schedule-list');
    if (!container) return;
    const list = scheduledDates.filter(s => s.propertyId === mobileSelectedProperty).sort((a,b)=> new Date(a.date)-new Date(b.date));
    container.innerHTML = list.map(s => {
        const epicValue = s.epicType || 'limpieza_regular';
        const hasEpic = s.type === 'epic' || !!s.epicType;
        const typeLabel = s.type === 'descanso' ? 'descanso' : hasEpic ? 'EPIC D1' : s.type;
        const epicLabel = hasEpic ? formatEpicType(epicValue) : '';
        return `
            <div class="schedule-entry">
                <div class="entry-info">
                    <div class="entry-date">${formatDateShort(s.date)}</div>
                    <div class="entry-details">${s.assignedEmployeeName || 'Sin asignar'} · ${s.shift || 'turno'}</div>
                    ${epicLabel ? `<div class="entry-epic">${epicLabel}</div>` : ''}
                </div>
                <span class="entry-type ${s.type==='descanso'?'type-descanso':'type-trabajo'}">${typeLabel}</span>
                <div class="entry-actions">
                    <button class="btn-secondary btn-small" onclick="openEditSchedule('${s.id}')">✏️ Editar</button>
                    <button class="btn-warning btn-small" onclick="resetTasksForSchedule('${s.id}')">↻ Tareas</button>
                </div>
            </div>`;
    }).join('') || '<div class="empty-state"><p>Sin agenda</p></div>';
    const staffSel = document.getElementById('mgr-schedule-employee');
    if (staffSel) {
        const options = (properties[mobileSelectedProperty]?.staff||[]).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        staffSel.innerHTML = '<option value="">Sin asignar</option>' + options;
    }
}

function addManagerTask() {
    const text = document.getElementById('mgr-new-task-input').value.trim();
    const type = document.getElementById('mgr-new-task-type').value;
    const assignee = document.getElementById('mgr-new-task-assignee').value;
    if (!text) return showToast('Describe la tarea');
    const prop = properties[mobileSelectedProperty];
    const staff = (prop?.staff || []).find(s => s.id === assignee);
    cleaningTasks.push({
        id: `task_${Date.now()}`,
        propertyId: mobileSelectedProperty,
        sectionKey: type,
        taskText: text,
        assignedTo: assignee || null,
        assignedEmployeeName: staff?.name || null,
        completed: false,
        createdAt: new Date().toISOString()
    });
    saveData();
    document.getElementById('mgr-new-task-input').value = '';
    loadManagerTasks();
    showToast('Tarea creada');
}

function reinitializeManagerTasks() {
    mobileSelectedProperty = mobileSelectedProperty || mobileCurrentUser.propertyId;
    reinitializeTasks();
    loadManagerTasks();
}

function loadManagerTasks() {
    const containerClean = document.getElementById('mgr-tasks-limpieza-list');
    const containerMaint = document.getElementById('mgr-tasks-mantenimiento-list');
    if (!containerClean || !containerMaint) return;
    const tasks = cleaningTasks.filter(t => t.propertyId === mobileSelectedProperty);
    const clean = tasks.filter(t => !isMaintenanceTask(t));
    const maint = tasks.filter(t => isMaintenanceTask(t));
    containerClean.innerHTML = renderTaskList(clean);
    containerMaint.innerHTML = renderTaskList(maint);
}

function sendManagerNotification() {
    const text = document.getElementById('mgr-new-notification').value.trim();
    if (!text) return showToast('Escribe mensaje');
    workDayNotifications.push({
        id: `notif_${Date.now()}`,
        propertyId: mobileSelectedProperty,
        message: text,
        date: new Date().toLocaleString('es-ES'),
        createdAt: new Date().toISOString(),
        read: false
    });
    saveData();
    document.getElementById('mgr-new-notification').value = '';
    loadManagerNotifications();
    showToast('Notificación enviada');
}

function loadManagerNotifications() {
    const container = document.getElementById('mgr-notifications-list');
    if (!container) return;
    const list = workDayNotifications.filter(n => n.propertyId === mobileSelectedProperty);
    container.innerHTML = list.map(n => `<div class="notification-item"><div class="notification-date">${n.date || new Date(n.createdAt||Date.now()).toLocaleDateString('es-ES')}</div><div class="notification-content">${n.message || 'Aviso'} · ${n.employeeName||''}</div></div>`).join('') || '<div class="empty-state"><p>Sin notificaciones</p></div>';
}

function loadManagerStaff() {
    const container = document.getElementById('mgr-staff-list');
    if (!container) return;
    const staff = properties[mobileSelectedProperty]?.staff || [];
    container.innerHTML = staff.map(s => `<div class="staff-card"><div class="staff-avatar">${s.name.charAt(0).toUpperCase()}</div><div class="staff-info"><div class="staff-name">${s.name}</div><div class="staff-role">${getRoleName(s.role)}</div></div></div>`).join('') || '<div class="empty-state"><p>Sin personal</p></div>';
}

function showAddStaffModalManager() { showAddStaffModal(); }

// ---------- Helpers ----------
function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function getRoleName(role) {
    if (role === 'manager') return 'Gerente';
    if (role === 'maintenance') return 'Mantenimiento';
    return 'Empleado';
}

function fillStaffOptions(selectId, propId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const staff = (properties[propId]?.staff || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    select.innerHTML = '<option value="">Sin asignar</option>' + staff;
}

function showToast(msg, error) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (error ? ' error' : '');
    setTimeout(() => el.className = 'toast', 2500);
}

// ---------- Employee View Additional Functions ----------
function loadEmployeeDashboard() {
    const container = document.getElementById('emp-dashboard-stats');
    if (!container) return;
    const tasks = cleaningTasks.filter(t => t.propertyId === mobileSelectedProperty && (!t.assignedTo || t.assignedTo === mobileCurrentUser.staffId));
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const today = new Date().toLocaleDateString('es-ES');
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${completed}</div>
            <div class="stat-label">Completadas</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value">${pending}</div>
            <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-value">${inventoryChecks.filter(c => c.propertyId === mobileSelectedProperty && c.employeeId === mobileCurrentUser.staffId).length}</div>
            <div class="stat-label">Verificadas</div>
        </div>
    `;
}

function completeMobileTask(taskId) {
    const task = cleaningTasks.find(t => t.id === taskId);
    if (task) {
        task.completed = true;
        saveData();
        loadEmployeeTasks();
        showToast('Tarea marcada como completada');
    }
}

function deleteTask(taskId) {
    cleaningTasks = cleaningTasks.filter(t => t.id !== taskId);
    saveData();
    loadMobileTasks();
    showToast('Tarea eliminada');
}

function loadMobileNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    const notifications = workDayNotifications.filter(n => n.propertyId === mobileSelectedProperty);
    if (!notifications.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin notificaciones</p></div>';
        return;
    }
    container.innerHTML = notifications.map(n => `
        <div class="notification-item">
            <div class="notification-date">${n.date || new Date(n.createdAt || Date.now()).toLocaleDateString('es-ES')}</div>
            <div class="notification-content">${n.message || n.employeeName || 'Notificación'}</div>
        </div>`).join('');
}

function sendMobileNotification() {
    const text = document.getElementById('new-notification')?.value.trim();
    if (!text) return showToast('Escribe un mensaje');
    workDayNotifications.push({
        id: `notif_${Date.now()}`,
        propertyId: mobileSelectedProperty,
        message: text,
        date: new Date().toLocaleString('es-ES'),
        createdAt: new Date().toISOString(),
        read: false
    });
    saveData();
    document.getElementById('new-notification').value = '';
    loadMobileNotifications();
    showToast('Notificación enviada');
}
// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    ensureAllInventoriesNormalized();
    const restored = restoreMobileSession();
    if (!restored) {
        document.getElementById('mobile-login-view').style.display = 'flex';
    }
    updatePropertySelectors();
    // Delegate clicks for employee schedule cards in case inline handlers fail
    const empScheduleList = document.getElementById('emp-schedule-list');
    if (empScheduleList) {
        empScheduleList.addEventListener('click', (e) => {
            const card = e.target.closest('.schedule-entry.clickable[data-sid]');
            if (card) handleEmployeeScheduleClick(card.dataset.sid);
        });
        empScheduleList.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const card = e.target.closest('.schedule-entry.clickable[data-sid]');
                if (card) handleEmployeeScheduleClick(card.dataset.sid);
            }
        });
    }
});
