// --- Credenciales del propietario (deben coincidir con app.js) ---
const OWNER_CREDENTIALS = {
    username: 'jonathan',
    password: 'galindo123',
    name: 'Jonathan Galindo'
};

// Mobile App Logic - redesigned for hamburger layout
// Relies on shared data/state from app.js


// --- Refuerzo: Siempre mostrar login si no hay sesión válida ---
function forceMobileLoginIfNoSession() {
    restoreMobileSession && restoreMobileSession();
    if (!mobileCurrentUserType || !mobileCurrentUser) {
        document.getElementById('mobile-login-view').style.display = 'block';
        document.getElementById('mobile-owner-view').style.display = 'none';
        document.getElementById('mobile-employee-view').style.display = 'none';
        document.getElementById('mobile-manager-view').style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', forceMobileLoginIfNoSession);

// Refuerzo: también al terminar el splash/video
window.skipToLoginMobile = function() {
    if (typeof mobileVideoSkipped !== 'undefined') mobileVideoSkipped = true;
    const welcomeView = document.getElementById('mobile-welcome-video');
    const loginView = document.getElementById('mobile-login-view');
    const video = document.getElementById('welcomeVideoMobile');
    if (video) video.pause();
    if (welcomeView) welcomeView.style.display = 'none';
    if (loginView) loginView.style.display = 'block';
    // Forzar login si no hay sesión
    forceMobileLoginIfNoSession();
};

const MOBILE_SESSION_KEY = 'airbnbmanager_mobile_session';
const TASK_NOTIFICATIONS_KEY = 'airbnbmanager_task_notifications';
let mobileCurrentUserType = null; // owner | manager | employee
let mobileCurrentUser = null;
let mobileSelectedProperty = null;
let mobileActiveSection = 'dashboard';
let mobileActiveScheduleId = null; // track focused schedule for task filtering
let mobilePendingScheduleId = null; // temp holder when navigating from schedule to tasks
let taskNotifications = []; // Notificaciones de tareas completadas por empleados

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

// Inicializar datos de demostración cuando no hay datos en localStorage
function initializeDemoData() {
    // Crear propiedad de ejemplo
    const demoPropertyId = 'prop_demo_' + Date.now();
    properties[demoPropertyId] = {
        id: demoPropertyId,
        name: 'Casa Demo - Configura tus propiedades',
        address: 'Esta es una propiedad de ejemplo. El propietario debe agregar propiedades reales.',
        staff: [
            {
                id: 'staff_manager_demo',
                name: 'Manager Demo',
                username: 'manager',
                password: 'demo123',
                role: 'manager'
            },
            {
                id: 'staff_employee_demo',
                name: 'Empleado Demo',
                username: 'empleado',
                password: 'demo123',
                role: 'employee'
            }
        ],
        inventory: {}
    };
    
    // Normalizar inventario para la propiedad demo
    normalizeInventory(properties[demoPropertyId]);
    
    // Guardar datos
    saveData();
    
    console.log('Datos de demostración inicializados. Usuarios de prueba: manager/demo123, empleado/demo123');
    
    // Mostrar mensaje informativo
    setTimeout(() => {
        if (mobileCurrentUserType === 'owner') {
            showToast('⚠️ Primera vez en este dispositivo. Configura tus propiedades y personal real.', false);
        } else {
            showToast('ℹ️ Datos de ejemplo cargados. Solicita acceso al propietario para obtener la información real.', false);
        }
    }, 500);
}

function ensureAllInventoriesNormalized() {
    try {
        Object.values(properties || {}).forEach(normalizeInventory);
        saveData();
    } catch (e) {
        console.error('No se pudo normalizar inventarios', e);
    }
}

// --- FIX: Versión corregida de updateCategoryFiltersForProperty ---
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
// --- FIN FIX ---

// ---------- Session & Login ----------
// Busca staff por credenciales y rol esperado (manager/employee)
function findStaffByCredentials(username, password, expectedRole) {
    const propIds = Object.keys(properties);
    for (const propId of propIds) {
        const prop = properties[propId];
        const staff = (prop.staff || []).find(s => {
            if (s.username !== username || s.password !== password) return false;
            if (expectedRole === 'manager') return s.role === 'manager';
            // Para ingreso como empleado, permitir roles de limpieza o mantenimiento
            if (expectedRole === 'employee') return s.role === 'employee' || s.role === 'maintenance';
            return false;
        });
        if (staff) {
            return { property: prop, staff };
        }
    }
    return null;
}

function mobileLogin() {
    loadData();
    
    // Si no hay propiedades, crear datos de ejemplo para permitir acceso
    if (Object.keys(properties).length === 0) {
        initializeDemoData();
    }
    
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
        return showToast('Usuario o contraseña incorrectos. Contacta al administrador para verificar tus credenciales.', true);
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
        case 'users':
            loadMobileUsers();
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
    if (section === 'emp-end-day') loadEndDaySummary();
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
    if (section === 'mgr-users') loadManagerUsers();
}

// ---------- Owner View ----------
function showMobileOwnerView(skipLoad) {
    document.getElementById('mobile-login-view').style.display = 'none';
    document.getElementById('mobile-owner-view').style.display = 'flex';
    document.getElementById('mobile-employee-view').style.display = 'none';
    document.getElementById('mobile-manager-view').style.display = 'none';
    document.getElementById('mobile-owner-name').textContent = mobileCurrentUser?.name || 'Propietario';
    updateUserHeaderDisplay();
    updatePropertySelectors();
    
    // Mostrar opción de sincronización solo para propietario
    const syncOption = document.querySelector('.menu-item.owner-only[data-section="sync"]');
    if (syncOption) syncOption.style.display = 'flex';
    
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
        loadOwnerNotifications();
    }
}

function loadDashboardStats() {
    const propSelect = document.getElementById('dashboard-property-select');
    const target = document.getElementById('dashboard-stats');
    if (!propSelect || !target) return;
    const propId = propSelect.value || mobileSelectedProperty;
    if (!propSelect.value && mobileSelectedProperty) propSelect.value = mobileSelectedProperty;
    const tasks = cleaningTasks.filter(t => !propId || t.propertyId === propId);
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const schedules = scheduledDates.filter(s => !propId || s.propertyId === propId).length;
    const purchases = purchaseInventory.filter(p => !propId || p.propertyId === propId).length;
    const staffCount = Object.values(properties || {}).reduce((acc, prop) => {
        if (propId && prop.id !== propId) return acc;
        return acc + (prop.staff ? prop.staff.length : 0);
    }, 0);

    target.innerHTML = `
        <div class="stat-card" onclick="showMobileSection('tasks')">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${completedTasks}</div>
            <div class="stat-label">Tareas completadas</div>
        </div>
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
    if (!propId) {
        container.innerHTML = '<div class="empty-state"><p>Selecciona una propiedad</p></div>';
        return;
    }
    // Limpiar listener anterior si existe
    if (typeof mobileInventoryUnsubscribe === 'function') mobileInventoryUnsubscribe();
    // Escuchar inventario en tiempo real desde Firestore
    mobileInventoryUnsubscribe = window.db.collection('inventoryChecks')
        .where('propertyId', '==', propId)
        .onSnapshot(snapshot => {
            const inventory = {};
            snapshot.forEach(doc => {
                const item = doc.data();
                if (!inventory[item.categoryKey]) inventory[item.categoryKey] = [];
                inventory[item.categoryKey].push(item);
            });
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
                            <div class="item-qty-edit">
                                <input type="number" min="0" value="${it.qty ?? 0}" onchange="updateInventoryItemQtyMobile('${propId}','${catKey}','${it.id}', this.value)" style="width: 60px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                                <button class="btn-icon" onclick="deleteInventoryItemMobile('${propId}','${catKey}','${it.id}')" style="background: #ff4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;">🗑️</button>
                            </div>
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
        });
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
    const item = { id: `${category}-${Date.now()}`, propertyId: propId, categoryKey: category, name, qty };
    window.db.collection('inventoryChecks').add(item).then(() => {
        closeModal('modal-add-inventory');
        showToast('Artículo agregado');
    });
}

function deleteInventoryItemMobile(propId, catKey, itemId) {
    window.db.collection('inventoryChecks')
        .where('propertyId', '==', propId)
        .where('categoryKey', '==', catKey)
        .where('id', '==', itemId)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
            showToast('Artículo eliminado');
        });
}

function resetInventoryVerification() {
    if (!mobileSelectedProperty) return showToast('Selecciona propiedad');
    window.db.collection('inventoryChecks')
        .where('propertyId', '==', mobileSelectedProperty)
        .get()
        .then(snapshot => {
            const batch = window.db.batch();
            snapshot.forEach(doc => batch.delete(doc.ref));
            batch.commit().then(() => {
                showToast('Verificación reseteada');
            });
        });
}

function setMobileInventoryCheck(catKey, itemId, realQty) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    const checkData = {
        id: checkId,
        propertyId: propId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        realQty: parseInt(realQty, 10) || 0,
        status: 'pending',
        comment: '',
        checkDate: new Date().toISOString()
    };
    window.db.collection('inventoryChecks').doc(checkId).set(checkData);
}

function setMobileInventoryStatus(catKey, itemId, status) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    const realQtyInput = document.getElementById(`real_${catKey}_${itemId}`);
    const realQty = realQtyInput ? parseInt(realQtyInput.value, 10) || 0 : 0;
    const checkData = {
        id: checkId,
        propertyId: propId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        realQty: realQty,
        status: status,
        comment: '',
        checkDate: new Date().toISOString()
    };
    window.db.collection('inventoryChecks').doc(checkId).set(checkData);
    loadEmployeeInventory();
}

function setMobileInventoryComment(catKey, itemId, comment) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    window.db.collection('inventoryChecks').doc(checkId).update({
        comment,
        checkDate: new Date().toISOString()
    });
}

// ---------- Session & Login ----------
function mobileLogin() {
    loadData();
    
    // Si no hay propiedades, crear datos de ejemplo para permitir acceso
    if (Object.keys(properties).length === 0) {
        initializeDemoData();
    }
    
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
        return showToast('Usuario o contraseña incorrectos. Contacta al administrador para verificar tus credenciales.', true);
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
        case 'users':
            loadMobileUsers();
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
    if (section === 'emp-end-day') loadEndDaySummary();
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
    if (section === 'mgr-users') loadManagerUsers();
}

// ---------- Owner View ----------
function showMobileOwnerView(skipLoad) {
    document.getElementById('mobile-login-view').style.display = 'none';
    document.getElementById('mobile-owner-view').style.display = 'flex';
    document.getElementById('mobile-employee-view').style.display = 'none';
    document.getElementById('mobile-manager-view').style.display = 'none';
    document.getElementById('mobile-owner-name').textContent = mobileCurrentUser?.name || 'Propietario';
    updateUserHeaderDisplay();
    updatePropertySelectors();
    
    // Mostrar opción de sincronización solo para propietario
    const syncOption = document.querySelector('.menu-item.owner-only[data-section="sync"]');
    if (syncOption) syncOption.style.display = 'flex';
    
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
        loadOwnerNotifications();
    }
}

function loadDashboardStats() {
    const propSelect = document.getElementById('dashboard-property-select');
    const target = document.getElementById('dashboard-stats');
    if (!propSelect || !target) return;
    const propId = propSelect.value || mobileSelectedProperty;
    if (!propSelect.value && mobileSelectedProperty) propSelect.value = mobileSelectedProperty;
    const tasks = cleaningTasks.filter(t => !propId || t.propertyId === propId);
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const schedules = scheduledDates.filter(s => !propId || s.propertyId === propId).length;
    const purchases = purchaseInventory.filter(p => !propId || p.propertyId === propId).length;
    const staffCount = Object.values(properties || {}).reduce((acc, prop) => {
        if (propId && prop.id !== propId) return acc;
        return acc + (prop.staff ? prop.staff.length : 0);
    }, 0);

    target.innerHTML = `
        <div class="stat-card" onclick="showMobileSection('tasks')">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${completedTasks}</div>
            <div class="stat-label">Tareas completadas</div>
        </div>
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
    if (!propId) {
        container.innerHTML = '<div class="empty-state"><p>Selecciona una propiedad</p></div>';
        return;
    }
    // Limpiar listener anterior si existe
    if (typeof mobileInventoryUnsubscribe === 'function') mobileInventoryUnsubscribe();
    // Escuchar inventario en tiempo real desde Firestore
    mobileInventoryUnsubscribe = window.db.collection('inventoryChecks')
        .where('propertyId', '==', propId)
        .onSnapshot(snapshot => {
            const inventory = {};
            snapshot.forEach(doc => {
                const item = doc.data();
                if (!inventory[item.categoryKey]) inventory[item.categoryKey] = [];
                inventory[item.categoryKey].push(item);
            });
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
                            <div class="item-qty-edit">
                                <input type="number" min="0" value="${it.qty ?? 0}" onchange="updateInventoryItemQtyMobile('${propId}','${catKey}','${it.id}', this.value)" style="width: 60px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                                <button class="btn-icon" onclick="deleteInventoryItemMobile('${propId}','${catKey}','${it.id}')" style="background: #ff4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;">🗑️</button>
                            </div>
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
        });
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
    const item = { id: `${category}-${Date.now()}`, propertyId: propId, categoryKey: category, name, qty };
    window.db.collection('inventoryChecks').add(item).then(() => {
        closeModal('modal-add-inventory');
        showToast('Artículo agregado');
    });
}

function deleteInventoryItemMobile(propId, catKey, itemId) {
    window.db.collection('inventoryChecks')
        .where('propertyId', '==', propId)
        .where('categoryKey', '==', catKey)
        .where('id', '==', itemId)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
            showToast('Artículo eliminado');
        });
}

function resetInventoryVerification() {
    if (!mobileSelectedProperty) return showToast('Selecciona propiedad');
    window.db.collection('inventoryChecks')
        .where('propertyId', '==', mobileSelectedProperty)
        .get()
        .then(snapshot => {
            const batch = window.db.batch();
            snapshot.forEach(doc => batch.delete(doc.ref));
            batch.commit().then(() => {
                showToast('Verificación reseteada');
            });
        });
}

function setMobileInventoryCheck(catKey, itemId, realQty) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    const checkData = {
        id: checkId,
        propertyId: propId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        realQty: parseInt(realQty, 10) || 0,
        status: 'pending',
        comment: '',
        checkDate: new Date().toISOString()
    };
    window.db.collection('inventoryChecks').doc(checkId).set(checkData);
}

function setMobileInventoryStatus(catKey, itemId, status) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    const realQtyInput = document.getElementById(`real_${catKey}_${itemId}`);
    const realQty = realQtyInput ? parseInt(realQtyInput.value, 10) || 0 : 0;
    const checkData = {
        id: checkId,
        propertyId: propId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        realQty: realQty,
        status: status,
        comment: '',
        checkDate: new Date().toISOString()
    };
    window.db.collection('inventoryChecks').doc(checkId).set(checkData);
    loadEmployeeInventory();
}

function setMobileInventoryComment(catKey, itemId, comment) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    window.db.collection('inventoryChecks').doc(checkId).update({
        comment,
        checkDate: new Date().toISOString()
    });
}

// ---------- Session & Login ----------
function mobileLogin() {
    loadData();
    
    // Si no hay propiedades, crear datos de ejemplo para permitir acceso
    if (Object.keys(properties).length === 0) {
        initializeDemoData();
    }
    
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
        return showToast('Usuario o contraseña incorrectos. Contacta al administrador para verificar tus credenciales.', true);
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
        case 'users':
            loadMobileUsers();
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
    if (section === 'emp-end-day') loadEndDaySummary();
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
    if (section === 'mgr-users') loadManagerUsers();
}

// ---------- Owner View ----------
function showMobileOwnerView(skipLoad) {
    document.getElementById('mobile-login-view').style.display = 'none';
    document.getElementById('mobile-owner-view').style.display = 'flex';
    document.getElementById('mobile-employee-view').style.display = 'none';
    document.getElementById('mobile-manager-view').style.display = 'none';
    document.getElementById('mobile-owner-name').textContent = mobileCurrentUser?.name || 'Propietario';
    updateUserHeaderDisplay();
    updatePropertySelectors();
    
    // Mostrar opción de sincronización solo para propietario
    const syncOption = document.querySelector('.menu-item.owner-only[data-section="sync"]');
    if (syncOption) syncOption.style.display = 'flex';
    
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
        loadOwnerNotifications();
    }
}

function loadDashboardStats() {
    const propSelect = document.getElementById('dashboard-property-select');
    const target = document.getElementById('dashboard-stats');
    if (!propSelect || !target) return;
    const propId = propSelect.value || mobileSelectedProperty;
    if (!propSelect.value && mobileSelectedProperty) propSelect.value = mobileSelectedProperty;
    const tasks = cleaningTasks.filter(t => !propId || t.propertyId === propId);
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const schedules = scheduledDates.filter(s => !propId || s.propertyId === propId).length;
    const purchases = purchaseInventory.filter(p => !propId || p.propertyId === propId).length;
    const staffCount = Object.values(properties || {}).reduce((acc, prop) => {
        if (propId && prop.id !== propId) return acc;
        return acc + (prop.staff ? prop.staff.length : 0);
    }, 0);

    target.innerHTML = `
        <div class="stat-card" onclick="showMobileSection('tasks')">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${completedTasks}</div>
            <div class="stat-label">Tareas completadas</div>
        </div>
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

let mobileInventoryUnsubscribe = null;
function loadMobileInventory() {
    const propId = document.getElementById('inventory-property-select')?.value || mobileSelectedProperty;
    const rawCategory = document.getElementById('inventory-category-select')?.value || '';
    const category = normalizeCategoryFilter(rawCategory);
    if (propId) mobileSelectedProperty = propId;
    const container = document.getElementById('inventory-list');
    if (!container) return;
    if (!propId) {
        container.innerHTML = '<div class="empty-state"><p>Selecciona una propiedad</p></div>';
        return;
    }
    // Limpiar listener anterior si existe
    if (typeof mobileInventoryUnsubscribe === 'function') mobileInventoryUnsubscribe();
    // Escuchar inventario en tiempo real desde Firestore
    mobileInventoryUnsubscribe = window.db.collection('inventoryChecks')
        .where('propertyId', '==', propId)
        .onSnapshot(snapshot => {
            const inventory = {};
            snapshot.forEach(doc => {
                const item = doc.data();
                if (!inventory[item.categoryKey]) inventory[item.categoryKey] = [];
                inventory[item.categoryKey].push(item);
            });
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
                            <div class="item-qty-edit">
                                <input type="number" min="0" value="${it.qty ?? 0}" onchange="updateInventoryItemQtyMobile('${propId}','${catKey}','${it.id}', this.value)" style="width: 60px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                                <button class="btn-icon" onclick="deleteInventoryItemMobile('${propId}','${catKey}','${it.id}')" style="background: #ff4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;">🗑️</button>
                            </div>
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
        });
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
    const item = { id: `${category}-${Date.now()}`, propertyId: propId, categoryKey: category, name, qty };
    window.db.collection('inventoryChecks').add(item).then(() => {
        closeModal('modal-add-inventory');
        showToast('Artículo agregado');
    });
}

function deleteInventoryItemMobile(propId, catKey, itemId) {
    window.db.collection('inventoryChecks')
        .where('propertyId', '==', propId)
        .where('categoryKey', '==', catKey)
        .where('id', '==', itemId)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
            showToast('Artículo eliminado');
        });
}

function resetInventoryVerification() {
    if (!mobileSelectedProperty) return showToast('Selecciona propiedad');
    window.db.collection('inventoryChecks')
        .where('propertyId', '==', mobileSelectedProperty)
        .get()
        .then(snapshot => {
            const batch = window.db.batch();
            snapshot.forEach(doc => batch.delete(doc.ref));
            batch.commit().then(() => {
                showToast('Verificación reseteada');
            });
        });
}

function setMobileInventoryCheck(catKey, itemId, realQty) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    const checkData = {
        id: checkId,
        propertyId: propId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        realQty: parseInt(realQty, 10) || 0,
        status: 'pending',
        comment: '',
        checkDate: new Date().toISOString()
    };
    window.db.collection('inventoryChecks').doc(checkId).set(checkData);
}

function setMobileInventoryStatus(catKey, itemId, status) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    const realQtyInput = document.getElementById(`real_${catKey}_${itemId}`);
    const realQty = realQtyInput ? parseInt(realQtyInput.value, 10) || 0 : 0;
    const checkData = {
        id: checkId,
        propertyId: propId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: mobileCurrentUser.staffId,
        employeeName: mobileCurrentUser.name,
        realQty: realQty,
        status: status,
        comment: '',
        checkDate: new Date().toISOString()
    };
    window.db.collection('inventoryChecks').doc(checkId).set(checkData);
    loadEmployeeInventory();
}

function setMobileInventoryComment(catKey, itemId, comment) {
    const propId = mobileSelectedProperty;
    const checkId = `check_${propId}_${catKey}_${itemId}_${mobileCurrentUser.staffId}`;
    window.db.collection('inventoryChecks').doc(checkId).update({
        comment,
        checkDate: new Date().toISOString()
    });
}