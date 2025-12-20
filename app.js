// --- FORMULARIO DE REPORTES PARA EMPLEADO ---
document.addEventListener('DOMContentLoaded', function() {
    const addReportFormEmployee = document.getElementById('addReportFormEmployee');
    const reportTitleEmployee = document.getElementById('reportTitleEmployee');
    const reportTypeEmployee = document.getElementById('reportTypeEmployee');
    const reportDescEmployee = document.getElementById('reportDescEmployee');
    const reportsListEmployee = document.getElementById('reportsListEmployee');

    if (addReportFormEmployee) {
        addReportFormEmployee.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = reportTitleEmployee.value.trim();
            const type = reportTypeEmployee.value;
            const desc = reportDescEmployee.value.trim();
            // Obtener propiedad asignada al empleado
            let propertyId = null;
            try {
                const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
                if (session && session.user && session.user.propertyId) {
                    propertyId = session.user.propertyId;
                }
            } catch {}
            if (!title || !type || !propertyId) return;
            window.db.collection('reports').add({
                title,
                type,
                propertyId,
                desc,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                addReportFormEmployee.reset();
                loadReportsEmployee();
            });
        });
    }

    function loadReportsEmployee() {
        let propertyId = null;
        try {
            const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
            if (session && session.user && session.user.propertyId) {
                propertyId = session.user.propertyId;
            }
        } catch {}
        if (!propertyId) return;
        window.db.collection('reports').where('propertyId', '==', propertyId).orderBy('createdAt', 'desc').get().then(snapshot => {
            let html = '';
            if (snapshot.empty) {
                html = '<p style="color:#888">No hay reportes registrados.</p>';
            } else {
                snapshot.forEach(doc => {
                    const r = doc.data();
                    html += `<div class=\"report-item\">
                        <b>${r.title || 'Reporte'}</b> <span style=\"color:#888\">[${r.type || ''}]</span><br>
                        <small>Propiedad: ${r.propertyId}</small><br>
                        <small>Fecha: ${r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString() : ''}</small><br>
                        <button onclick=\"editReport('${doc.id}')\" style=\"margin-right:0.5rem\">Editar</button>
                        <button onclick=\"deleteReport('${doc.id}')\" style=\"color:#d32f2f\">Eliminar</button>
                    </div>`;
                });
            }
            if (reportsListEmployee) reportsListEmployee.innerHTML = html;
        });
    }

    // Hook para cargar reportes empleado al mostrar panel
    if (document.getElementById('employeeView')) {
        const origShow = window.showEmployeeView;
        window.showEmployeeView = function() {
            if (typeof origShow === 'function') origShow();
            loadReportsEmployee();
        };
    }
});
// --- FORMULARIOS DE REPORTES (Dueño y Manager) ---
document.addEventListener('DOMContentLoaded', function() {
    // Dueño
    const addReportForm = document.getElementById('addReportForm');
    const reportTitle = document.getElementById('reportTitle');
    const reportType = document.getElementById('reportType');
    const reportProperty = document.getElementById('reportProperty');
    const reportDesc = document.getElementById('reportDesc');

    function loadReportFormOptions() {
        if (!reportProperty) return;
        window.db.collection('properties').get().then(snapshot => {
            reportProperty.innerHTML = '<option value="">Asignar a propiedad</option>';
            snapshot.forEach(doc => {
                const p = doc.data();
                reportProperty.innerHTML += `<option value="${doc.id}">${p.name}</option>`;
            });
        });
    }

    if (addReportForm) {
        addReportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = reportTitle.value.trim();
            const type = reportType.value;
            const propertyId = reportProperty.value;
            const desc = reportDesc.value.trim();
            if (!title || !type || !propertyId) return;
            window.db.collection('reports').add({
                title,
                type,
                propertyId,
                desc,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                addReportForm.reset();
                loadReports();
            });
        });
    }

    // Manager
    const addReportFormManager = document.getElementById('addReportFormManager');
    const reportTitleManager = document.getElementById('reportTitleManager');
    const reportTypeManager = document.getElementById('reportTypeManager');
    const reportDescManager = document.getElementById('reportDescManager');

    if (addReportFormManager) {
        addReportFormManager.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = reportTitleManager.value.trim();
            const type = reportTypeManager.value;
            const desc = reportDescManager.value.trim();
            // Obtener propiedad asignada al manager
            let propertyId = null;
            try {
                const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
                if (session && session.user && session.user.propertyId) {
                    propertyId = session.user.propertyId;
                }
            } catch {}
            if (!title || !type || !propertyId) return;
            window.db.collection('reports').add({
                title,
                type,
                propertyId,
                desc,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                addReportFormManager.reset();
                loadReportsManager();
            });
        });
    }

    // Mostrar reportes solo de la propiedad del manager
    function loadReportsManager() {
        let propertyId = null;
        try {
            const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
            if (session && session.user && session.user.propertyId) {
                propertyId = session.user.propertyId;
            }
        } catch {}
        if (!propertyId) return;
        window.db.collection('reports').where('propertyId', '==', propertyId).orderBy('createdAt', 'desc').get().then(snapshot => {
            let html = '';
            if (snapshot.empty) {
                html = '<p style="color:#888">No hay reportes registrados.</p>';
            } else {
                snapshot.forEach(doc => {
                    const r = doc.data();
                    html += `<div class=\"report-item\">
                        <b>${r.title || 'Reporte'}</b> <span style=\"color:#888\">[${r.type || ''}]</span><br>
                        <small>Propiedad: ${r.propertyId}</small><br>
                        <small>Fecha: ${r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString() : ''}</small><br>
                        <button onclick=\"editReport('${doc.id}')\" style=\"margin-right:0.5rem\">Editar</button>
                        <button onclick=\"deleteReport('${doc.id}')\" style=\"color:#d32f2f\">Eliminar</button>
                    </div>`;
                });
            }
            const reportsListManager = document.getElementById('reportsListManager');
            if (reportsListManager) reportsListManager.innerHTML = html;
        });
    }

    // Hook para cargar opciones y reportes al mostrar panel dueño
    if (document.getElementById('ownerView')) {
        const origShow = window.showOwnerView;
        window.showOwnerView = function() {
            if (typeof origShow === 'function') origShow();
            loadReportFormOptions();
        };
    }
    // Hook para cargar reportes manager al mostrar panel
    if (document.getElementById('managerView')) {
        const origShow = window.showManagerView;
        window.showManagerView = function() {
            if (typeof origShow === 'function') origShow();
            loadReportsManager();
        };
    }
});
// --- INVENTARIO PARA MANAGER ---
document.addEventListener('DOMContentLoaded', function() {
    // Formulario y lista para manager
    const addInventoryFormManager = document.getElementById('addInventoryFormManager');
    const inventoryNameManager = document.getElementById('inventoryNameManager');
    const inventoryQtyManager = document.getElementById('inventoryQtyManager');
    const inventoryListManager = document.getElementById('inventoryListManager');

    // Guardar artículo de inventario (manager)
    if (addInventoryFormManager) {
        addInventoryFormManager.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = inventoryNameManager.value.trim();
            const qty = parseInt(inventoryQtyManager.value, 10);
            // Obtener propiedad asignada al manager
            let propertyId = null;
            try {
                const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
                if (session && session.user && session.user.propertyId) {
                    propertyId = session.user.propertyId;
                }
            } catch {}
            if (!name || !qty || !propertyId) return;
            window.db.collection('inventory').add({
                name,
                qty,
                propertyId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                addInventoryFormManager.reset();
                loadInventoryManager();
            });
        });
    }

    // Mostrar inventario solo de la propiedad del manager
    function loadInventoryManager() {
        let propertyId = null;
        try {
            const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
            if (session && session.user && session.user.propertyId) {
                propertyId = session.user.propertyId;
            }
        } catch {}
        if (!propertyId) return;
        window.db.collection('inventory').where('propertyId', '==', propertyId).orderBy('createdAt', 'desc').get().then(snapshot => {
            let html = '';
            if (snapshot.empty) {
                html = '<p style="color:#888">No hay artículos de inventario registrados.</p>';
            } else {
                snapshot.forEach(doc => {
                    const i = doc.data();
                    html += `<div class=\"inventory-item\">
                        <b>${i.name}</b> <span style=\"color:#888\">[${i.qty}]</span><br>
                        <button onclick=\"deleteInventoryItemManager('${doc.id}')\" style=\"color:#d32f2f; background:none; border:none; cursor:pointer;\">Eliminar</button>
                    </div>`;
                });
            }
            if (inventoryListManager) inventoryListManager.innerHTML = html;
        });
    }

    // Eliminar artículo de inventario (manager)
    window.deleteInventoryItemManager = function(id) {
        if (!id) return;
        window.db.collection('inventory').doc(id).delete().then(() => {
            loadInventoryManager();
        });
    };

    // Hook para mostrar inventario manager al mostrar panel
    if (document.getElementById('managerView')) {
        const origShow = window.showManagerView;
        window.showManagerView = function() {
            if (typeof origShow === 'function') origShow();
            loadInventoryManager();
        };
    }
});
// --- AUTOMATIZACIÓN DE INVENTARIO Y REPORTES (Firestore) ---
document.addEventListener('DOMContentLoaded', function() {
    // --- INVENTARIO ---
    const addInventoryForm = document.getElementById('addInventoryForm');
    const inventoryName = document.getElementById('inventoryName');
    const inventoryQty = document.getElementById('inventoryQty');
    const inventoryProperty = document.getElementById('inventoryProperty');
    const inventoryList = document.getElementById('inventoryList');

    // Cargar propiedades en select (solo dueño)
    function loadInventoryFormOptions() {
        if (!inventoryProperty) return;
        window.db.collection('properties').get().then(snapshot => {
            inventoryProperty.innerHTML = '<option value="">Asignar a propiedad</option>';
            snapshot.forEach(doc => {
                const p = doc.data();
                inventoryProperty.innerHTML += `<option value="${doc.id}">${p.name}</option>`;
            });
        });
    }

    // Guardar artículo de inventario en Firestore
    if (addInventoryForm) {
        addInventoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = inventoryName.value.trim();
            const qty = parseInt(inventoryQty.value, 10);
            const propertyId = inventoryProperty.value;
            if (!name || !qty || !propertyId) return;
            window.db.collection('inventory').add({
                name,
                qty,
                propertyId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                addInventoryForm.reset();
                loadInventory();
            });
        });
    }

    // Mostrar inventario según rol
    function loadInventory() {
        let q = window.db.collection('inventory');
        let userRole = null;
        let propertyId = null;
        try {
            const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
            if (session && session.user) {
                userRole = session.type || session.user.role || null;
                if (userRole === 'manager' || userRole === 'employee') {
                    propertyId = session.user.propertyId;
                }
            }
        } catch {}
        if (propertyId) {
            q = q.where('propertyId', '==', propertyId);
        }
        q.orderBy('createdAt', 'desc').get().then(snapshot => {
            let html = '';
            if (snapshot.empty) {
                html = '<p style="color:#888">No hay artículos de inventario registrados.</p>';
            } else {
                snapshot.forEach(doc => {
                    const i = doc.data();
                    html += `<div class="inventory-item">
                        <b>${i.name}</b> <span style=\"color:#888\">[${i.qty}]</span><br>
                        <small>Propiedad: ${i.propertyId}</small>
                    </div>`;
                });
            }
            if (inventoryList) inventoryList.innerHTML = html;
        });
    }

    // Llamar loadInventoryFormOptions y loadInventory al mostrar panel dueño
    if (document.getElementById('ownerView')) {
        const origShow = window.showOwnerView;
        window.showOwnerView = function() {
            if (typeof origShow === 'function') origShow();
            loadInventoryFormOptions();
            loadInventory();
            loadReports();
        };
    }
    // Llamar loadInventory al mostrar panel manager/employee
    if (document.getElementById('managerView')) {
        const origShow = window.showManagerView;
        window.showManagerView = function() {
            if (typeof origShow === 'function') origShow();
            loadInventory();
            loadReports();
        };
    }
    if (document.getElementById('employeeView')) {
        const origShow = window.showEmployeeView;
        window.showEmployeeView = function() {
            if (typeof origShow === 'function') origShow();
            loadInventory();
            loadReports();
        };
    }

    // --- REPORTES ---
    const reportsList = document.getElementById('reportsList');
    function loadReports() {
        let q = window.db.collection('reports');
        let userRole = null;
        let propertyId = null;
        try {
            const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
            if (session && session.user) {
                userRole = session.type || session.user.role || null;
                if (userRole === 'manager' || userRole === 'employee') {
                    propertyId = session.user.propertyId;
                }
            }
        } catch {}
        if (propertyId) {
            q = q.where('propertyId', '==', propertyId);
        }
        q.orderBy('createdAt', 'desc').get().then(snapshot => {
            let html = '';
            if (snapshot.empty) {
                html = '<p style="color:#888">No hay reportes registrados.</p>';
            } else {
                snapshot.forEach(doc => {
                    const r = doc.data();
                    html += `<div class=\"report-item\">
                        <b>${r.title || 'Reporte'}</b> <span style=\"color:#888\">[${r.type || ''}]</span><br>
                        <small>Propiedad: ${r.propertyId}</small><br>
                        <small>Fecha: ${r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString() : ''}</small><br>
                        <button onclick=\"editReport('${doc.id}')\" style=\"margin-right:0.5rem\">Editar</button>
                        <button onclick=\"deleteReport('${doc.id}')\" style=\"color:#d32f2f\">Eliminar</button>
                    </div>`;
                });
            // Función global para eliminar reporte
            window.deleteReport = function(id) {
                if (!id) return;
                if (!confirm('¿Eliminar este reporte?')) return;
                window.db.collection('reports').doc(id).delete().then(() => {
                    if (typeof loadReports === 'function') loadReports();
                    if (typeof loadReportsManager === 'function') loadReportsManager();
                    if (typeof loadReportsEmployee === 'function') loadReportsEmployee();
                });
            };

            // Función global para editar reporte (prompt simple)
            window.editReport = function(id) {
                if (!id) return;
                window.db.collection('reports').doc(id).get().then(doc => {
                    if (!doc.exists) return;
                    const r = doc.data();
                    const nuevoTitulo = prompt('Editar título:', r.title || '');
                    if (nuevoTitulo === null) return;
                    const nuevoTipo = prompt('Editar tipo:', r.type || '');
                    if (nuevoTipo === null) return;
                    const nuevaDesc = prompt('Editar descripción:', r.desc || '');
                    if (nuevaDesc === null) return;
                    window.db.collection('reports').doc(id).update({
                        title: nuevoTitulo,
                        type: nuevoTipo,
                        desc: nuevaDesc
                    }).then(() => {
                        if (typeof loadReports === 'function') loadReports();
                        if (typeof loadReportsManager === 'function') loadReportsManager();
                        if (typeof loadReportsEmployee === 'function') loadReportsEmployee();
                    });
                });
            };
            }
            if (reportsList) reportsList.innerHTML = html;
        });
    }
});
// --- AUTOMATIZACIÓN DE TAREAS (Firestore) ---
document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('addTaskForm');
    const taskTitle = document.getElementById('taskTitle');
    const taskDesc = document.getElementById('taskDesc');
    const taskProperty = document.getElementById('taskProperty');
    const taskUser = document.getElementById('taskUser');
    const tasksList = document.getElementById('tasksList');

    // Cargar propiedades y usuarios en selects (solo dueño)
    function loadTaskFormOptions() {
        if (!taskProperty || !taskUser) return;
        window.db.collection('properties').get().then(snapshot => {
            taskProperty.innerHTML = '<option value="">Asignar a propiedad</option>';
            snapshot.forEach(doc => {
                const p = doc.data();
                taskProperty.innerHTML += `<option value="${doc.id}">${p.name}</option>`;
            });
        });
        window.db.collection('users').get().then(snapshot => {
            taskUser.innerHTML = '<option value="">Asignar a usuario</option>';
            snapshot.forEach(doc => {
                const u = doc.data();
                taskUser.innerHTML += `<option value="${doc.id}">${u.email} (${u.role})</option>`;
            });
        });
    }

    // Guardar tarea en Firestore
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = taskTitle.value.trim();
            const desc = taskDesc.value.trim();
            const propertyId = taskProperty.value;
            const userId = taskUser.value;
            if (!title || !propertyId || !userId) return;
            window.db.collection('tasks').add({
                title,
                desc,
                propertyId,
                userId,
                status: 'pendiente',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                addTaskForm.reset();
                loadTasks();
            });
        });
    }

    // Mostrar tareas según rol
    function loadTasks() {
        let q = window.db.collection('tasks');
        // Detectar usuario y rol
        let userId = null;
        let userRole = null;
        try {
            const session = JSON.parse(localStorage.getItem('airbnbmanager_session'));
            if (session && session.user) {
                userId = session.user.staffId || session.user.id || null;
                userRole = session.type || session.user.role || null;
            }
        } catch {}
        if (userRole === 'manager' || userRole === 'employee') {
            q = q.where('userId', '==', userId);
        }
        q.orderBy('createdAt', 'desc').get().then(snapshot => {
            let html = '';
            if (snapshot.empty) {
                html = '<p style="color:#888">No hay tareas registradas.</p>';
            } else {
                snapshot.forEach(doc => {
                    const t = doc.data();
                    html += `<div class="task-item">
                        <b>${t.title}</b> <span style=\"color:#888\">[${t.status}]</span><br>
                        <small>${t.desc || ''}</small><br>
                        <small>Propiedad: ${t.propertyId} | Usuario: ${t.userId}</small>
                    </div>`;
                });
            }
            if (tasksList) tasksList.innerHTML = html;
        });
    }

    // Llamar loadTaskFormOptions y loadTasks al mostrar panel dueño
    if (document.getElementById('ownerView')) {
        // Hook para cuando se muestra el panel del dueño
        const origShow = window.showOwnerView;
        window.showOwnerView = function() {
            if (typeof origShow === 'function') origShow();
            loadTaskFormOptions();
            loadTasks();
        };
    }
    // Llamar loadTasks al mostrar panel manager/employee
    if (document.getElementById('managerView')) {
        const origShow = window.showManagerView;
        window.showManagerView = function() {
            if (typeof origShow === 'function') origShow();
            loadTasks();
        };
    }
    if (document.getElementById('employeeView')) {
        const origShow = window.showEmployeeView;
        window.showEmployeeView = function() {
            if (typeof origShow === 'function') origShow();
            loadTasks();
        };
    }
});
// --- FIRESTORE: AGREGAR PROPIEDADES Y USUARIOS DESDE EL PANEL DEL DUEÑO ---
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a Firestore
    const db = window.db;
    // --- PROPIEDADES ---
    const addPropertyForm = document.getElementById('addPropertyForm');
    const propertiesList = document.getElementById('propertiesList');
    if (addPropertyForm && db) {
        addPropertyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('propertyName').value.trim();
            const address = document.getElementById('propertyAddress').value.trim();
            if (!name || !address) return;
            await db.collection('properties').add({ name, address, createdAt: new Date() });
            addPropertyForm.reset();
            loadProperties();
        });
    }
    async function loadProperties() {
        if (!db) return;
        const snap = await db.collection('properties').orderBy('createdAt').get();
        let html = '<strong>Propiedades registradas:</strong><ul>';
        snap.forEach(doc => {
            const p = doc.data();
            html += `<li>${p.name} <span style="color:#2563eb;font-size:0.95em">(${p.address})</span></li>`;
        });
        html += '</ul>';
        propertiesList.innerHTML = html;
        // Actualizar selector de propiedades en el form de usuario
        const userProperty = document.getElementById('userProperty');
        if (userProperty) {
            userProperty.innerHTML = '<option value="">Asignar a propiedad</option>';
            snap.forEach(doc => {
                const p = doc.data();
                userProperty.innerHTML += `<option value="${doc.id}">${p.name}</option>`;
            });
        }
    }
    if (propertiesList && db) loadProperties();

    // --- USUARIOS ---
    const addUserForm = document.getElementById('addUserForm');
    const usersList = document.getElementById('usersList');
    if (addUserForm && db) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const role = document.getElementById('userRole').value;
            const propertyId = document.getElementById('userProperty').value;
            if (!name || !email || !role || !propertyId) return;
            await db.collection('users').add({ name, email, role, propertyId, createdAt: new Date() });
            addUserForm.reset();
            loadUsers();
        });
    }
    async function loadUsers() {
        if (!db) return;
        const snap = await db.collection('users').orderBy('createdAt').get();
        let html = '<strong>Usuarios registrados:</strong><ul>';
        snap.forEach(doc => {
            const u = doc.data();
            html += `<li>${u.name} <span style="color:#2563eb;font-size:0.95em">(${u.email}, ${u.role}, Propiedad: ${u.propertyId})</span></li>`;
        });
        html += '</ul>';
        usersList.innerHTML = html;
    }
    if (usersList && db) loadUsers();
});
// Menú hamburguesa: abrir/cerrar en móvil
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', function() {
            navLinks.classList.toggle('open');
        });
        // Cerrar menú al hacer click en un link (en móvil)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    // Cerrar sesión (placeholder)
    const logoutBtn = document.getElementById('navLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Aquí puedes limpiar sesión y mostrar login
            document.getElementById('loginView').style.display = 'flex';
            document.getElementById('ownerView').style.display = 'none';
            document.getElementById('managerView').style.display = 'none';
            document.getElementById('employeeView').style.display = 'none';
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('firebaseLoginForm');
    const loginError = document.getElementById('loginError');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            loginError.style.display = 'none';
            window.auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    document.getElementById('loginView').style.display = 'none';
                    // Lógica: mostrar vista y menú según email (rol)
                    const ownerView = document.getElementById('ownerView');
                    const managerView = document.getElementById('managerView');
                    const employeeView = document.getElementById('employeeView');
                    const navDashboard = document.getElementById('navDashboard');
                    const navTasks = document.getElementById('navTasks');
                    const navInventory = document.getElementById('navInventory');
                    const navReports = document.getElementById('navReports');
                    const navUsers = document.getElementById('navUsers');
                    const navSettings = document.getElementById('navSettings');

                    // Ocultar todo por defecto
                    ownerView.style.display = 'none';
                    managerView.style.display = 'none';
                    employeeView.style.display = 'none';
                    navDashboard.style.display = 'none';
                    navTasks.style.display = 'none';
                    navInventory.style.display = 'none';
                    navReports.style.display = 'none';
                    navUsers.style.display = 'none';
                    navSettings.style.display = 'none';

                    // Consultar usuario en Firestore para obtener rol y propiedad asignada
                    db.collection('users').where('email', '==', email).get().then(snapshot => {
                        let user = null;
                        snapshot.forEach(doc => user = doc.data());
                        if (!user) {
                            // Si no está en la colección, asumir dueño
                            ownerView.style.display = 'block';
                            navDashboard.style.display = 'inline-block';
                            navReports.style.display = 'inline-block';
                            navUsers.style.display = 'inline-block';
                            navSettings.style.display = 'inline-block';
                            return;
                        }
                        if (user.role === 'manager') {
                            managerView.style.display = 'block';
                            navDashboard.style.display = 'inline-block';
                            navTasks.style.display = 'inline-block';
                            navInventory.style.display = 'inline-block';
                            navReports.style.display = 'inline-block';
                            navSettings.style.display = 'inline-block';
                            // Mostrar solo propiedades asignadas
                            db.collection('properties').doc(user.propertyId).get().then(doc => {
                                const p = doc.data();
                                managerView.innerHTML = `<h2>Panel de Manager</h2><div class='dashboard-placeholder'>Propiedad asignada: <b>${p ? p.name : 'N/A'}</b></div>`;
                            });
                        } else if (user.role === 'employee') {
                            employeeView.style.display = 'block';
                            navDashboard.style.display = 'inline-block';
                            navTasks.style.display = 'inline-block';
                            navSettings.style.display = 'inline-block';
                            // Mostrar solo propiedades asignadas
                            db.collection('properties').doc(user.propertyId).get().then(doc => {
                                const p = doc.data();
                                employeeView.innerHTML = `<h2>Panel de Empleado</h2><div class='dashboard-placeholder'>Propiedad asignada: <b>${p ? p.name : 'N/A'}</b></div>`;
                            });
                        } else {
                            // Dueño
                            ownerView.style.display = 'block';
                            navDashboard.style.display = 'inline-block';
                            navReports.style.display = 'inline-block';
                            navUsers.style.display = 'inline-block';
                            navSettings.style.display = 'inline-block';
                        }
                    });
                })
                .catch(error => {
                    loginError.textContent = error.message;
                    loginError.style.display = 'block';
                });
        });
    }
});
    
    // Migrar datos antiguos: convertir 'limpieza' a 'limpieza-regular'
    scheduledDates.forEach(item => {
        if (item.type === 'limpieza') {
            item.type = 'limpieza-regular';
        }
    });
            const newTask = {
                propertyId: selectedProperty,
                sectionKey: 'general',
                taskText: text,
                assignedTo,
                completed: false,
                verified: false,
                notes: ''
            };

    
    deletedInventoryChecks = deletedInventoryChecks.filter(deleted => {
        const deletedTime = new Date(deleted.deletedAt).getTime();
        const timePassed = now - deletedTime;
        return timePassed <= threeDaysMs; // Solo mantener los que no han expirado
    });

async function deleteInventoryReport(propertyId) {
    if (!confirm('⚠️ ¿Eliminar este reporte de inventario? Se guardará un respaldo por 3 días.')) return;

    const checksToDelete = inventoryChecks.filter(c => c.propertyId === propertyId);
    if (checksToDelete.length === 0) {
        alert('No hay verificaciones para eliminar');
        return;
    }

    // Guardar en respaldo en Firestore antes de eliminar
    for (const check of checksToDelete) {
        const backup = {
            ...check,
            deletedAt: new Date().toISOString(),
            deletedBy: currentUser.name
        };
        await saveDeletedInventoryCheckToFirestore(backup);
        await deleteInventoryCheckFromFirestore(check.id);
    }

    // El listener de Firestore actualizará la UI automáticamente
    showDeletedReportsOption();
    alert('✅ Reporte eliminado. Disponible en respaldo por 3 días.');
}

function showDeletedReportsOption() {
    if (deletedInventoryChecks.length === 0) return;
    
    const now = new Date().getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    const validBackups = deletedInventoryChecks.filter(d => {
        const deletedTime = new Date(d.deletedAt).getTime();
        return (now - deletedTime) <= threeDaysMs;
    });
    
    if (validBackups.length > 0) {
        setTimeout(() => {
            if (confirm(`💾 Tienes ${validBackups.length} reporte(s) en respaldo. ¿Restaurar alguno?`)) {
                showRestoreReportDialog();
            }
        }, 500);
    }
}

function showRestoreReportDialog() {
    const now = new Date().getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    const validBackups = deletedInventoryChecks.filter(d => {
        const deletedTime = new Date(d.deletedAt).getTime();
        return (now - deletedTime) <= threeDaysMs;
    });
    
    if (validBackups.length === 0) {
        alert('No hay reportes disponibles en respaldo');
        return;
    }
    
    // Agrupar por propiedad
    const grouped = {};
    validBackups.forEach(backup => {
        if (!grouped[backup.propertyId]) {
            grouped[backup.propertyId] = [];
        }
        grouped[backup.propertyId].push(backup);
    });
    
    let message = '📋 Reportes disponibles en respaldo:\n\n';
    Object.keys(grouped).forEach((propId, index) => {
        const prop = properties[propId];
        const propName = prop?.name || propId;
        const count = grouped[propId].length;
        const firstDeleted = new Date(grouped[propId][0].deletedAt);
        const daysLeft = Math.ceil((threeDaysMs - (now - firstDeleted.getTime())) / (24 * 60 * 60 * 1000));
        
        message += `${index + 1}. ${propName} (${count} items, ${daysLeft} días restantes)\n`;
    });
    
    message += '\n¿Cuál deseas restaurar? (ingresa el número)';
    
    const response = prompt(message);
    if (!response) return;
    
    const selectedIndex = parseInt(response) - 1;
    const propIds = Object.keys(grouped);
    
    if (selectedIndex < 0 || selectedIndex >= propIds.length) {
        alert('❌ Selección inválida');
        return;
    }
    
    const selectedPropId = propIds[selectedIndex];
    restoreInventoryReport(selectedPropId);
}

async function restoreInventoryReport(propertyId) {
    // Restaurar todos los reportes de esta propiedad desde Firestore
    const backupsForProp = deletedInventoryChecks.filter(d => d.propertyId === propertyId);
    if (backupsForProp.length === 0) {
        alert('No se encontró respaldo para restaurar');
        return;
    }

    for (const backup of backupsForProp) {
        const { deletedAt, deletedBy, ...originalData } = backup;
        await saveInventoryCheckToFirestore(originalData);
        if (backup.id) {
            await deleteDeletedInventoryCheckFromFirestore(backup.id);
        }
    }

    // El listener de Firestore actualizará la UI automáticamente
    alert('✅ Reporte restaurado exitosamente');
}

function createDefaultCleaningTasks(propId, propertyName) {
    const tasks = [];
    // Usar tareas personalizadas si existe para esta propiedad
    let taskSets = CLEANING_TASKS;
    if (CUSTOM_TASKS_BY_PROPERTY[propertyName]) {
        taskSets = CUSTOM_TASKS_BY_PROPERTY[propertyName];
    }
    
    Object.keys(taskSets).forEach(sectionKey => {
        const section = taskSets[sectionKey];
        
        // Manejar estructura con subsecciones (como Torre Magna o EPIC D1)
        if (section.sections && Array.isArray(section.sections)) {
            section.sections.forEach(subsection => {
                subsection.tasks.forEach(text => {
                    tasks.push({
                        id: `task_${sectionKey}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        propertyId: propId,
                        sectionKey,
                        subsectionTitle: subsection.title,
                        taskText: text,
                        assignedTo: '',
                        completed: false,
                        verified: false,
                        notes: ''
                    });
                });
            });
        } else if (section.tasks && Array.isArray(section.tasks)) {
            // Estructura plana (como limpieza estándar)
            section.tasks.forEach(text => {
                tasks.push({
                    id: `task_${sectionKey}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    propertyId: propId,
                    sectionKey,
                    taskText: text,
                    assignedTo: '',
                    completed: false,
                    verified: false,
                    notes: ''
                });
            });
        }
    });
    return tasks;
}

// Login
window.updateLoginForm = function updateLoginForm() {
    window.updateLoginForm = updateLoginForm;
    const type = document.getElementById('userType').value;
    const ownerFields = ['ownerUsernameGroup', 'ownerPasswordGroup'];
    const staffFields = ['staffUsernameGroup', 'staffPasswordGroup'];
    const ownerRemember = document.getElementById('ownerRememberGroup');
    const staffRemember = document.getElementById('staffRememberGroup');
    ownerFields.forEach(id => document.getElementById(id).style.display = type === 'owner' ? 'block' : 'none');
    staffFields.forEach(id => document.getElementById(id).style.display = type === 'owner' ? 'none' : type ? 'block' : 'none');
    ownerRemember.style.display = type === 'owner' ? 'flex' : 'none';
    staffRemember.style.display = type === 'owner' ? 'none' : type ? 'flex' : 'none';
    document.getElementById('loginHint').style.display = type === 'owner' ? 'block' : 'none';

    // Prefill saved credentials
    if (type === 'owner' && savedOwnerCreds) {
        document.getElementById('ownerCode').value = savedOwnerCreds.username || '';
        document.getElementById('ownerPassword').value = savedOwnerCreds.password || '';
        document.getElementById('rememberOwner').checked = true;
    }
    if ((type === 'manager' || type === 'employee') && savedStaffCreds) {
        const saved = savedStaffCreds[type] || null;
        if (saved) {
            document.getElementById('staffUsername').value = saved.username || '';
            document.getElementById('staffPassword').value = saved.password || '';
            document.getElementById('rememberStaff').checked = true;
        } else {
            document.getElementById('rememberStaff').checked = false;
        }
    }
}

function login() {
    window.login = login;
    const type = document.getElementById('userType').value;
    if (!type) { alert('Selecciona el tipo de usuario'); return; }

    if (type === 'owner') {
        const user = document.getElementById('ownerCode').value.trim();
        const pass = document.getElementById('ownerPassword').value.trim();
        if (user === OWNER_CREDENTIALS.username && pass === OWNER_CREDENTIALS.password) {
            // Solo permitir login si existen propiedades reales
            if (!properties || Object.keys(properties).length === 0) {
                alert('No existen propiedades registradas. Por favor, registre al menos una propiedad real antes de ingresar.');
                return;
            }
            if (!selectedProperty) {
                selectedProperty = Object.keys(properties)[0] || null;
            }
            currentUserType = 'owner';
            currentUser = { name: OWNER_CREDENTIALS.name, username: user, loginTime: new Date() };
            localStorage.setItem('airbnbmanager_session', JSON.stringify({ type: 'owner', user: currentUser, selectedProperty }));

            // Guardar credenciales si se marcó recordar
            const remember = document.getElementById('rememberOwner').checked;
            if (remember) {
                savedOwnerCreds = { username: user, password: pass };
                localStorage.setItem(STORAGE_KEYS.savedOwnerCreds, JSON.stringify(savedOwnerCreds));
            } else {
                savedOwnerCreds = null;
                localStorage.removeItem(STORAGE_KEYS.savedOwnerCreds);
            }
            mostrarVideoBienvenida(() => {
                showOwnerView();
            });
            return;
        }
        alert('Usuario o contraseña incorrectos para dueño');
        return;
    }

    const username = document.getElementById('staffUsername').value.trim();
    const password = document.getElementById('staffPassword').value.trim();
    if (!username || !password) { alert('Ingresa usuario y contraseña'); return; }

    const match = findStaffByCredentials(username, password, type);
    if (!match) { alert('Credenciales no válidas'); return; }

    currentUserType = type;
    currentUser = {
        staffId: match.staff.id,
        propertyId: match.property.id,
        name: match.staff.name,
        username: match.staff.username,
        role: match.staff.role,
        loginTime: new Date()
    };

    localStorage.setItem('airbnbmanager_session', JSON.stringify({ type, user: currentUser, selectedProperty: currentUser.propertyId }));

    // Guardar credenciales de staff si se marcó recordar
    const rememberStaff = document.getElementById('rememberStaff').checked;
    const existing = savedStaffCreds || {};
    if (rememberStaff) {
        existing[type] = { username, password };
        savedStaffCreds = existing;
        localStorage.setItem(STORAGE_KEYS.savedStaffCreds, JSON.stringify(savedStaffCreds));
    } else {
        if (existing[type]) delete existing[type];
        savedStaffCreds = existing;
        if (Object.keys(existing).length === 0) {
            localStorage.removeItem(STORAGE_KEYS.savedStaffCreds);
        } else {
            localStorage.setItem(STORAGE_KEYS.savedStaffCreds, JSON.stringify(savedStaffCreds));
        }
    }

    if (type === 'manager') {
        mostrarVideoBienvenida(() => {
            showManagerView();
        });
    } else {
        mostrarVideoBienvenida(() => {
            showEmployeeView();
        });
    }
// Muestra el video de bienvenida post-login y luego ejecuta el callback
function mostrarVideoBienvenida(callback) {
    const videoView = document.getElementById('welcomeVideoView');
    const loginView = document.getElementById('loginView');
    const ownerView = document.getElementById('ownerView');
    const managerView = document.getElementById('managerView');
    const employeeView = document.getElementById('employeeView');
    // Ocultar todas las vistas principales
    if (loginView) loginView.style.display = 'none';
    if (ownerView) ownerView.style.display = 'none';
    if (managerView) managerView.style.display = 'none';
    if (employeeView) employeeView.style.display = 'none';
    // Mostrar video
    if (videoView) {
        videoView.style.display = 'flex';
        const video = document.getElementById('welcomeVideo');
        if (video) {
            video.currentTime = 0;
            video.play();
            video.onended = function() {
                videoView.style.display = 'none';
                if (typeof callback === 'function') callback();
            };
        } else {
            // Si no hay video, continuar de inmediato
            videoView.style.display = 'none';
            if (typeof callback === 'function') callback();
        }
    } else {
        if (typeof callback === 'function') callback();
    }
}
}

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

function logout() {
    currentUser = null;
    currentUserType = null;
    selectedProperty = null;
    localStorage.removeItem('airbnbmanager_session');
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('ownerView').style.display = 'none';
    document.getElementById('managerView').style.display = 'none';
    document.getElementById('employeeView').style.display = 'none';
    document.getElementById('userType').value = '';
    updateLoginForm();
}

// Propiedades
function renderProperties() {
    const list = document.getElementById('propertiesList');
    list.innerHTML = '';
    const propIds = Object.keys(properties);
    if (propIds.length === 0) {
        list.innerHTML = '<p style="color:#777;">Sin propiedades registradas</p>';
        return;
    }
    propIds.forEach(propId => {
        const prop = properties[propId];
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '0.5rem';

        const btn = document.createElement('button');
        btn.className = 'property-btn' + (selectedProperty === propId ? ' active' : '');
        btn.textContent = `🏠 ${prop.name}`;
        btn.onclick = () => selectProperty(propId);

        const del = document.createElement('button');
        del.className = 'btn-danger';
        del.textContent = '🗑️';
        del.title = 'Eliminar propiedad';
        del.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Eliminar ${prop.name}?`)) deleteProperty(propId);
        };

        row.appendChild(btn);
        row.appendChild(del);
        list.appendChild(row);
    });
}

function selectProperty(propId) {
    selectedProperty = propId;
    // Actualizar sesión para que permanezca en la misma propiedad tras recargar
    if (currentUserType === 'owner') {
        const session = localStorage.getItem('airbnbmanager_session');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                parsed.selectedProperty = selectedProperty;
                localStorage.setItem('airbnbmanager_session', JSON.stringify(parsed));
            } catch (e) {
                console.error('No se pudo actualizar la sesión', e);
            }
        }
    }
    renderProperties();
    refreshOwnerContent();
}

function deleteProperty(propId) {
    deletePropertyFromFirestore(propId).then(() => {
        cleaningTasks = cleaningTasks.filter(t => t.propertyId !== propId);
        saveData();
        if (!selectedProperty) {
            selectedProperty = Object.keys(properties)[0] || null;
        }
        renderProperties();
        refreshOwnerContent();
    });
}

function showAddProperty() {
    document.getElementById('addPropertyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addPropertyModal').style.display = 'none';
    document.getElementById('propertyNameInput').value = '';
    document.getElementById('propertyAddressInput').value = '';
}

function saveProperty() {
    const name = document.getElementById('propertyNameInput').value.trim();
    const address = document.getElementById('propertyAddressInput').value.trim();
    if (!name || !address) { alert('Completa nombre y dirección'); return; }
        const storedOwnerCreds = localStorage.getItem(STORAGE_KEYS.savedOwnerCreds);
        const storedStaffCreds = localStorage.getItem(STORAGE_KEYS.savedStaffCreds);

    const id = `prop_${Date.now()}`;
    const prop = { id, name, address, staff: [], inventory: {} };
    normalizeInventory(prop);
    savePropertyToFirestore(prop).then(() => {
        cleaningTasks.push(...createDefaultCleaningTasks(id, name));
        if (name === 'EPIC D1') {
            scheduleDeepCleanEvery3Months(id, name);
        }
        savedOwnerCreds = storedOwnerCreds ? JSON.parse(storedOwnerCreds) : null;
        savedStaffCreds = storedStaffCreds ? JSON.parse(storedStaffCreds) : null;
        selectedProperty = id;
        saveData();
        closeModal();
        renderProperties();
        refreshOwnerContent();
    });
}

function refreshOwnerContent() {
    if (!selectedProperty || !properties[selectedProperty]) return;
    const prop = properties[selectedProperty];
    document.getElementById('propertyNameInventory').textContent = prop.name;
    document.getElementById('propertyNameTasks').textContent = prop.name;
    
    // Establecer fecha mínima en calendario (hoy)
    const today = new Date().toISOString().split('T')[0];
    const scheduleDateInput = document.getElementById('scheduleDate');
    if (scheduleDateInput) scheduleDateInput.min = today;
    
    renderInventory();
    renderInventoryChecks();
    renderTasks();
    renderStaff();
    renderPurchaseInventory();
    renderPurchaseHistory();
    renderSchedule();
    renderManagerPurchaseRequests();
    renderOwnerNotifications();
    
    // Hacer las secciones colapsables
    makeOwnerSectionsCollapsible();
}

function makeOwnerSectionsCollapsible() {
    const sections = document.querySelectorAll('#ownerView section.section');
    sections.forEach(section => {
        const h2 = section.querySelector('h2');
        if (!h2) return;
        
        // Si ya tiene el botón colapsable, no hacer nada
        if (section.classList.contains('collapsible-made')) return;
        section.classList.add('collapsible-made');

        // Recuperar estado almacenado por sección (usar id si existe, de lo contrario el texto del h2)
        const storageKey = section.id ? `section-collapsed-${section.id}` : `section-collapsed-${h2.textContent}`;
        const storedState = localStorage.getItem(storageKey);
        const isCollapsed = storedState !== null ? storedState === 'true' : true;
        
        h2.style.cursor = 'pointer';
        h2.style.userSelect = 'none';
        h2.style.padding = '0.5rem';
        h2.style.borderRadius = '4px';
        h2.style.display = 'flex';
        h2.style.alignItems = 'center';
        h2.style.justifyContent = 'space-between';
        
        const toggleIcon = document.createElement('span');
        toggleIcon.style.marginLeft = '0.5rem';
        toggleIcon.textContent = isCollapsed ? '▶️' : '▼';
        h2.appendChild(toggleIcon);
        
        // Crear div para el contenido
        const contentDiv = document.createElement('div');
        contentDiv.className = isCollapsed ? 'section-content collapsed' : 'section-content';
        
        // Mover todos los elementos excepto h2 al contentDiv
        const children = Array.from(section.childNodes);
        children.forEach(el => {
            if (el !== h2) {
                contentDiv.appendChild(el);
            }
        });
        
        section.appendChild(contentDiv);
        
        h2.addEventListener('click', () => {
            const isCurrentlyCollapsed = contentDiv.classList.contains('collapsed');
            contentDiv.classList.toggle('collapsed');
            toggleIcon.textContent = isCurrentlyCollapsed ? '▼' : '▶️';
            localStorage.setItem(storageKey, !isCurrentlyCollapsed);
        });
    });
}

function makeManagerSectionsCollapsible() {
    const sections = document.querySelectorAll('#managerView section.section');
    sections.forEach(section => {
        const h2 = section.querySelector('h2');
        if (!h2) return;
        
        // Si ya tiene el botón colapsable, no hacer nada
        if (section.classList.contains('collapsible-made')) return;
        section.classList.add('collapsible-made');
        
        // Recuperar estado almacenado por sección
        const storageKey = section.id ? `section-collapsed-${section.id}` : `section-collapsed-${h2.textContent}`;
        const storedState = localStorage.getItem(storageKey);
        const isCollapsed = storedState !== null ? storedState === 'true' : true;
        
        h2.style.cursor = 'pointer';
        h2.style.userSelect = 'none';
        h2.style.padding = '0.5rem';
        h2.style.borderRadius = '4px';
        h2.style.display = 'flex';
        h2.style.alignItems = 'center';
        h2.style.justifyContent = 'space-between';
        
        const toggleIcon = document.createElement('span');
        toggleIcon.style.marginLeft = '0.5rem';
        toggleIcon.textContent = isCollapsed ? '▶️' : '▼';
        h2.appendChild(toggleIcon);
        
        // Crear div para el contenido
        const contentDiv = document.createElement('div');
        contentDiv.className = isCollapsed ? 'section-content collapsed' : 'section-content';
        
        // Mover todos los elementos excepto h2 al contentDiv
        const children = Array.from(section.childNodes);
        children.forEach(el => {
            if (el !== h2) {
                contentDiv.appendChild(el);
            }
        });
        
        section.appendChild(contentDiv);
        
        h2.addEventListener('click', () => {
            const isCurrentlyCollapsed = contentDiv.classList.contains('collapsed');
            contentDiv.classList.toggle('collapsed');
            toggleIcon.textContent = isCurrentlyCollapsed ? '▼' : '▶️';
            localStorage.setItem(storageKey, !isCurrentlyCollapsed);
        });
    });
}

// Staff
function addStaffMember() {
    if (!selectedProperty) { alert('Selecciona una propiedad'); return; }
    const name = document.getElementById('staffNameInput').value.trim();
    const role = document.getElementById('staffRoleSelect').value;
    const username = document.getElementById('staffUsernameInput').value.trim();
    const password = document.getElementById('staffPasswordInput').value.trim();
    if (!name || !username || !password) { alert('Completa nombre, usuario y contraseña'); return; }

    // Verificar si ya existe usuario con ese username en Firestore
    const exists = staff.some(s => s.username === username && s.propertyId === selectedProperty);
    if (exists) { alert('Ese usuario ya existe en la propiedad'); return; }

    const prop = properties[selectedProperty];
    const newStaff = {
        propertyId: selectedProperty,
        name,
        role: role,
        username,
        password,
        lastLoginTime: null,
        assignmentType: prop.name === 'EPIC D1' ? (role === 'maintenance' ? 'mantenimiento' : role === 'manager' ? 'ambas' : 'limpieza') : null
    };
    saveStaffToFirestore(newStaff).then(() => {
        document.getElementById('staffNameInput').value = '';
        document.getElementById('staffUsernameInput').value = '';
        document.getElementById('staffPasswordInput').value = '';
    });
}

function removeStaffMember(staffId) {
    if (!selectedProperty) return;
    deleteStaffFromFirestore(staffId);
}

function renderStaff() {
    if (!selectedProperty) return;
    const list = document.getElementById('employeesList');
    const selectOwner = document.getElementById('employeeSelect');
    const selectManager = document.getElementById('managerEmployeeSelect');
    const selectScheduleOwner = document.getElementById('scheduleEmployee');
    const selectScheduleManager = document.getElementById('managerScheduleEmployee');
    list.innerHTML = '';
    selectOwner.innerHTML = '<option value="">Asignar a...</option>';
    selectManager.innerHTML = '<option value="">Asignar a...</option>';
    if (selectScheduleOwner) selectScheduleOwner.innerHTML = '<option value="">Seleccionar empleado...</option>';
    if (selectScheduleManager) selectScheduleManager.innerHTML = '<option value="">Seleccionar empleado...</option>';

    const prop = properties[selectedProperty];
    (prop.staff || []).forEach(member => {
        if (member.role === 'employee' || member.role === 'maintenance') {
            const opt1 = document.createElement('option');
            opt1.value = member.id;
            opt1.textContent = member.name;
            selectOwner.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = member.id;
            opt2.textContent = member.name;
            selectManager.appendChild(opt2);
            
            if (selectScheduleOwner) {
                // Mostrar todos los empleados en calendario para EPIC D1, solo limpieza para otros
                const isEpic = prop.name === 'EPIC D1';
                const shouldShow = isEpic || member.role === 'employee';
                if (shouldShow) {
                    const opt3 = document.createElement('option');
                    opt3.value = member.id;
                    opt3.textContent = member.name;
                    selectScheduleOwner.appendChild(opt3);
                }
            }
            
            if (selectScheduleManager) {
                // Mostrar todos los empleados en calendario para EPIC D1, solo limpieza para otros
                const isEpic = prop.name === 'EPIC D1';
                const shouldShow = isEpic || member.role === 'employee';
                if (shouldShow) {
                    const opt4 = document.createElement('option');
                    opt4.value = member.id;
                    opt4.textContent = member.name;
                    selectScheduleManager.appendChild(opt4);
                }
            }
        }

        const div = document.createElement('div');
        div.className = 'employee-card';
        const last = member.lastLoginTime ? new Date(member.lastLoginTime).toLocaleString() : 'Sin registro';
        
        // Mostrar assignmentType para EPIC D1
        let assignmentDisplay = '';
        if (prop.name === 'EPIC D1' && member.assignmentType) {
            const assignmentLabel = member.assignmentType === 'ambas' ? 'Limpieza + Mantenimiento' :
                                    member.assignmentType === 'limpieza' ? 'Solo Limpieza' : 'Solo Mantenimiento';
            assignmentDisplay = `<div style="margin-top:0.5rem; padding:0.5rem; background:#f0f0f0; border-radius:4px; font-size:0.9rem;"><strong>Asignación:</strong> ${assignmentLabel}</div>`;
        }
        
        div.innerHTML = `
            <h3>${member.name} <small>(${member.role === 'manager' ? 'Manager' : member.role === 'maintenance' ? 'Empleado - Mantenimiento' : 'Empleado - Limpieza'})</small></h3>
            <div class="employee-info">
                <strong>Usuario:</strong> ${member.username}<br>
                <strong>Contraseña:</strong> ${member.password}<br>
                <strong>Última conexión:</strong> ${last}
            </div>
            ${assignmentDisplay}
            <div style="margin-top:0.5rem;">
                <button class="btn-danger" onclick="removeStaffMember('${member.id}')">Eliminar</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// Inventario
function renderInventory() {
    if (!selectedProperty) return;
    const list = document.getElementById('inventoryList');
    list.innerHTML = '';
    const prop = properties[selectedProperty];

    Object.keys(INVENTORY_CATEGORIES).forEach(catKey => {
        const items = prop.inventory[catKey] || [];
        if (items.length === 0) return;

        const section = document.createElement('div');
        section.className = 'cleaning-section';

        const titleBtn = document.createElement('button');
        titleBtn.className = 'section-title-btn collapsed';
        titleBtn.innerHTML = `${INVENTORY_CATEGORIES[catKey].icon} ${INVENTORY_CATEGORIES[catKey].name} <small>(${items.length} items)</small>`;
        titleBtn.onclick = () => toggleSection(titleBtn);

        const content = document.createElement('div');
        content.className = 'section-content collapsed';

        const table = document.createElement('table');
        table.className = 'inventory-table';
        table.innerHTML = `
            <thead><tr><th>Artículo</th><th style="text-align:center;">Cantidad</th><th style="text-align:center;">Acción</th></tr></thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td style="text-align:center;">
                            <input type="number" class="inventory-item-input" min="0" value="${item.qty}" onchange="updateInventoryItemQty('${prop.id}','${catKey}','${item.id}', this.value)" />
                        </td>
                        <td style="text-align:center;">
                            <button class="btn-danger" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="removeInventoryItem('${prop.id}','${catKey}','${item.id}')">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        content.appendChild(table);
        section.appendChild(titleBtn);
        section.appendChild(content);
        list.appendChild(section);
    });
}

function renderInventoryChecks() {
    const list = document.getElementById('inventoryChecksList');
    if (!list) return;
    list.innerHTML = '';
    
    const checks = inventoryChecks.filter(c => c.propertyId === selectedProperty);
    if (checks.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay reportes de verificación</p>';
        return;
    }
    
    // Agregar botón para eliminar reporte
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.style.marginBottom = '1rem';
    deleteBtn.textContent = '🗑️ Eliminar Reporte Completo';
    deleteBtn.onclick = () => deleteInventoryReport(selectedProperty);
    list.appendChild(deleteBtn);
    
    renderInventoryChecksToList(list, checks, selectedProperty);
}

function renderManagerInventoryChecks() {
    const list = document.getElementById('managerInventoryChecksList');
    if (!list) return;
    list.innerHTML = '';
    
    const checks = inventoryChecks.filter(c => c.propertyId === currentUser.propertyId);
    if (checks.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay reportes de verificación</p>';
        return;
    }
    
    // Agregar botón para eliminar reporte
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.style.marginBottom = '1rem';
    deleteBtn.textContent = '🗑️ Eliminar Reporte Completo';
    deleteBtn.onclick = () => deleteInventoryReport(currentUser.propertyId);
    list.appendChild(deleteBtn);
    
    renderInventoryChecksToList(list, checks, currentUser.propertyId);
}

function renderInventoryChecksToList(list, checks, propertyId) {
    const prop = properties[propertyId];
    const groupedByCategory = {};
    
    checks.forEach(check => {
        if (!groupedByCategory[check.categoryKey]) {
            groupedByCategory[check.categoryKey] = [];
        }
        groupedByCategory[check.categoryKey].push(check);
    });
    
    Object.keys(groupedByCategory).forEach(catKey => {
        const categoryChecks = groupedByCategory[catKey];
        const section = document.createElement('div');
        section.className = 'collapsible-section';
        
        const header = document.createElement('button');
        header.className = 'collapsible-section-header';
        const okCount = categoryChecks.filter(c => c.status === 'ok').length;
        const missingCount = categoryChecks.filter(c => c.status === 'missing').length;
        header.innerHTML = `${INVENTORY_CATEGORIES[catKey].icon} ${INVENTORY_CATEGORIES[catKey].name} <small>(✓${okCount} | ✗${missingCount})</small>`;
        
        const content = document.createElement('div');
        content.className = 'collapsible-section-content collapsed';
        
        header.onclick = () => {
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        };
        
        const table = document.createElement('table');
        table.className = 'inventory-table';
        table.style.width = '100%';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Artículo</th>
                    <th style="text-align:center;">Esperado</th>
                    <th style="text-align:center;">Real</th>
                    <th style="text-align:center;">Estado</th>
                    <th>Verificado por</th>
                    <th>Fecha</th>
                    <th style="text-align:center;">Acciones</th>
                </tr>
            </thead>
        `;
        
        const tbody = document.createElement('tbody');
        
        categoryChecks.forEach(check => {
            const items = prop.inventory[catKey] || [];
            const item = items.find(i => i.id === check.itemId);
            if (!item) return;
            
            const date = new Date(check.checkDate);
            const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            const tr = document.createElement('tr');
            tr.style.backgroundColor = check.status === 'missing' ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 255, 0, 0.05)';
            
            let actionsHtml = '';
            if (check.status === 'missing') {
                actionsHtml = `
                    <div style="display:flex; gap:0.25rem; justify-content:center;">
                        <button class="btn-success" style="font-size:0.7rem; padding:0.2rem 0.4rem;" onclick="markInventoryCheckAsResolved('${check.id}')">✅ Resuelto</button>
                        <button class="btn-secondary" style="font-size:0.7rem; padding:0.2rem 0.4rem;" onclick="editInventoryCheckComment('${check.id}')">✏️</button>
                    </div>
                `;
            }
            
            tr.innerHTML = `
                <td>${item.name}</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:center;">${check.realQty}</td>
                <td style="text-align:center;">
                    <span style="font-size:1.2rem;">${check.status === 'ok' ? '✓' : check.status === 'resolved' ? '🔧' : '✗'}</span>
                    ${(check.status === 'missing' || check.status === 'resolved') && check.comment ? `<div style="font-size:0.85rem; color:${check.status === 'resolved' ? '#4CAF50' : '#d32f2f'}; margin-top:0.25rem;">💬 ${check.comment}</div>` : ''}
                </td>
                <td>${check.employeeName}</td>
                <td style="font-size:0.85rem; color:#666;">${dateStr}</td>
                <td style="text-align:center;">${actionsHtml}</td>
            `;
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        content.appendChild(table);
        section.appendChild(header);
        section.appendChild(content);
        list.appendChild(section);
    });
}

function updateInventoryItemQty(propId, catKey, itemId, value) {
    const prop = properties[propId];
    if (!prop) return;
    const items = prop.inventory[catKey] || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    item.qty = Math.max(0, parseInt(value, 10) || 0);
    saveData();
}

function removeInventoryItem(propId, catKey, itemId) {
    const prop = properties[propId];
    if (!prop) return;
    if (!confirm('¿Eliminar este artículo del inventario?')) return;
    prop.inventory[catKey] = (prop.inventory[catKey] || []).filter(i => i.id !== itemId);
    saveData();
    renderInventory();
    renderEmployeeInventory();
    renderManagerInventory();
}

function addInventoryItem() {
    if (!selectedProperty) { alert('Selecciona una propiedad'); return; }
    const cat = document.getElementById('inventoryCategorySelect').value;
    const name = document.getElementById('inventoryNewItemName').value.trim();
    const qty = Math.max(0, parseInt(document.getElementById('inventoryNewItemQty').value, 10) || 0);
    if (!cat || !name) { alert('Elige categoría y nombre'); return; }
    const prop = properties[selectedProperty];
    if (!prop.inventory[cat]) prop.inventory[cat] = [];
    prop.inventory[cat].push({ id: `${cat}-${Date.now()}`, name, qty });
    saveData();
    document.getElementById('inventoryNewItemName').value = '';
    document.getElementById('inventoryNewItemQty').value = '';
    renderInventory();
}

function addCleaningSupply() {
    document.getElementById('inventoryCategorySelect').value = 'lavanderia';
    addInventoryItem();
}

// Inventario de Compra
function addPurchaseItem(source) {
    let name, qty, propertyId;
    
    if (source === 'manager') {
        propertyId = currentUser.propertyId;
        name = document.getElementById('managerPurchaseInput').value.trim();
        qty = Math.max(1, parseInt(document.getElementById('managerPurchaseQty').value, 10) || 1);
    } else {
        if (!selectedProperty) { alert('Selecciona una propiedad'); return; }
        propertyId = selectedProperty;
        name = document.getElementById('purchaseItemName').value.trim();
        qty = Math.max(1, parseInt(document.getElementById('purchaseItemQty').value, 10) || 1);
    }
    
    if (!name) { alert('Ingresa el nombre del artículo'); return; }
    
    const newPurchase = {
        propertyId,
        name,
        qty,
        purchased: false,
        createdDate: new Date().toLocaleString()
    };
    savePurchaseToFirestore(newPurchase).then(() => {
        if (source === 'manager') {
            document.getElementById('managerPurchaseInput').value = '';
            document.getElementById('managerPurchaseQty').value = '1';
        } else {
            document.getElementById('purchaseItemName').value = '';
            document.getElementById('purchaseItemQty').value = '1';
        }
    });
}

function togglePurchaseStatus(purchaseId) {
    const item = purchaseInventory.find(p => p.id === purchaseId);
    if (item) {
        const updated = { ...item, purchased: !item.purchased };
        savePurchaseToFirestore(updated);
        // TODO: registrar en historial en Firestore (próximo paso)
    }
}

function removePurchaseItem(purchaseId) {
    if (!confirm('¿Eliminar este artículo de la lista de compra?')) return;
    deletePurchaseFromFirestore(purchaseId);
}

function renderPurchaseInventory() {
    const list = document.getElementById('purchaseInventoryList');
    if (!list) return;
    list.innerHTML = '';
    
    const items = purchaseInventory.filter(p => p.propertyId === selectedProperty);
    if (items.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay artículos en la lista de compra</p>';
        return;
    }
    
    // Mostrar última compra de aseo si existe
    const lastCleaningPurchase = getLastPurchaseDate(selectedProperty, 'aseo');
    if (lastCleaningPurchase) {
        const lastPurchaseDiv = document.createElement('div');
        lastPurchaseDiv.style.padding = '0.75rem';
        lastPurchaseDiv.style.backgroundColor = 'var(--bg-secondary)';
        lastPurchaseDiv.style.borderRadius = '4px';
        lastPurchaseDiv.style.marginBottom = '1rem';
        lastPurchaseDiv.style.borderLeft = '4px solid #4CAF50';
        lastPurchaseDiv.innerHTML = `<strong>📅 Última compra de aseo:</strong> ${lastCleaningPurchase}`;
        list.appendChild(lastPurchaseDiv);
    }
    
    const pending = items.filter(p => !p.purchased);
    const purchased = items.filter(p => p.purchased);
    
    // Sección colapsable: Por Comprar
    if (pending.length > 0) {
        const section = document.createElement('div');
        section.className = 'cleaning-section';
        
        const titleBtn = document.createElement('button');
        titleBtn.className = 'section-title-btn collapsed';
        titleBtn.innerHTML = `📋 Por Comprar <small>(${pending.length} items)</small>`;
        titleBtn.onclick = () => toggleSection(titleBtn);
        
        const content = document.createElement('div');
        content.className = 'section-content collapsed';
        
        pending.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.innerHTML = `
                <div>
                    <span style="font-weight:600;">${item.name}</span>
                    <span style="color:#999; margin-left:0.5rem;">x${item.qty}</span>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-success" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="togglePurchaseStatus('${item.id}')">✅ Comprado</button>
                    <button class="btn-danger" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="removePurchaseItem('${item.id}')">🗑️</button>
                </div>
            `;
            content.appendChild(row);
        });
        
        section.appendChild(titleBtn);
        section.appendChild(content);
        list.appendChild(section);
    }
    
    // Sección colapsable: Comprados
    if (purchased.length > 0) {
        const section = document.createElement('div');
        section.className = 'cleaning-section';
        
        const titleBtn = document.createElement('button');
        titleBtn.className = 'section-title-btn collapsed';
        titleBtn.innerHTML = `✅ Comprados <small>(${purchased.length} items)</small>`;
        titleBtn.onclick = () => toggleSection(titleBtn);
        
        const content = document.createElement('div');
        content.className = 'section-content collapsed';
        
        purchased.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.style.opacity = '0.6';
            row.innerHTML = `
                <div>
                    <span style="text-decoration:line-through;">${item.name}</span>
                    <span style="color:#999; margin-left:0.5rem;">x${item.qty}</span>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-warning" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="togglePurchaseStatus('${item.id}')">↩️ Pendiente</button>
                    <button class="btn-danger" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="removePurchaseItem('${item.id}')">🗑️</button>
                </div>
            `;
            content.appendChild(row);
        });
        
        section.appendChild(titleBtn);
        section.appendChild(content);
        list.appendChild(section);
    }
}

// Obtener la última fecha de compra para una categoría específica
function getLastPurchaseDate(propertyId, category) {
    const purchases = purchaseHistory
        .filter(h => h.propertyId === propertyId && h.category === category)
        .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    
    if (purchases.length === 0) return null;
    
    const lastDate = new Date(purchases[0].purchaseDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return lastDate.toLocaleDateString('es-ES', options);
}

// Renderizar historial de compras de aseo
function renderPurchaseHistory() {
    const list = document.getElementById('purchaseHistoryList');
    if (!list) return;
    list.innerHTML = '';
    
    const history = purchaseHistory
        .filter(h => h.propertyId === selectedProperty && h.category === 'aseo')
        .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    
    if (history.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay registro de compras de aseo</p>';
        return;
    }
    
    renderPurchaseHistoryToList(list, history);
}

function renderManagerPurchaseHistory() {
    const list = document.getElementById('managerPurchaseHistoryList');
    if (!list) return;
    list.innerHTML = '';
    
    const history = purchaseHistory
        .filter(h => h.propertyId === currentUser.propertyId && h.category === 'aseo')
        .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    
    if (history.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay registro de compras de aseo</p>';
        return;
    }
    
    renderPurchaseHistoryToList(list, history);
}

function renderPurchaseHistoryToList(list, history) {
    const section = document.createElement('div');
    section.className = 'collapsible-section';
    
    const header = document.createElement('button');
    header.className = 'collapsible-section-header';
    header.innerHTML = `📜 Historial de Compras <small>(${history.length})</small>`;
    header.style.color = 'var(--accent-color)';
    
    const content = document.createElement('div');
    content.className = 'collapsible-section-content collapsed';
    
    header.onclick = () => {
        header.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
    };
    
    history.forEach(entry => {
        const date = new Date(entry.purchaseDate);
        const dateStr = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const row = document.createElement('div');
        row.style.padding = '0.5rem 0';
        row.style.borderBottom = '1px solid var(--bg-secondary)';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.innerHTML = `
            <div>
                <span style="font-weight:600;">${entry.itemName}</span>
                <span style="color:#999; margin-left:0.5rem;">x${entry.qty}</span>
                <div style="font-size:0.85rem; color:#666; margin-top:0.25rem;">📅 ${dateStr}</div>
            </div>
            <div style="display:flex; gap:0.3rem;">
                <button class="btn-secondary" style="font-size:0.75rem; padding:0.3rem 0.5rem;" onclick="addPurchaseFromHistory('${entry.id}')">➕ Agregar</button>
                <button class="btn-danger" style="font-size:0.75rem; padding:0.3rem 0.5rem;" onclick="removePurchaseHistory('${entry.id}')">🗑️</button>
            </div>
        `;
        content.appendChild(row);
    });
    
    section.appendChild(header);
    section.appendChild(content);
    list.appendChild(section);
}

function addPurchaseFromHistory(historyId) {
    const entry = purchaseHistory.find(h => h.id === historyId);
    if (!entry) return;
    
    // Verificar si el artículo ya existe en la lista de compra
    const existingItem = purchaseInventory.find(p => 
        p.propertyId === entry.propertyId && 
        p.name.toLowerCase() === entry.itemName.toLowerCase() && 
        !p.purchased
    );
    
    if (existingItem) {
        alert(`⚠️ ${entry.itemName} ya está en la lista de compra`);
        return;
    }
    
    purchaseInventory.push({
        id: `purchase_${Date.now()}`,
        propertyId: entry.propertyId,
        name: entry.itemName,
        qty: entry.qty,
        purchased: false,
        createdDate: new Date().toISOString()
    });
    saveData();
    renderPurchaseInventory();
    renderManagerPurchaseInventory();
    alert(`✅ ${entry.itemName} agregado a la lista de compra`);
}

function removePurchaseHistory(historyId) {
    if (!confirm('¿Eliminar este registro del historial de compras?')) return;
    purchaseHistory = purchaseHistory.filter(h => h.id !== historyId);
    saveData();
    renderPurchaseHistory();
    renderManagerPurchaseHistory();
    alert('✅ Registro eliminado del historial');
}

// Solicitudes de Compra por Empleados
function addPurchaseRequest() {
    const itemName = document.getElementById('employeePurchaseRequestName').value.trim();
    const qty = Math.max(1, parseInt(document.getElementById('employeePurchaseRequestQty').value, 10) || 1);
    const reason = document.getElementById('employeePurchaseRequestReason').value.trim();
    
    if (!itemName) { alert('Ingresa el nombre del artículo'); return; }
    
    // Verificar si el artículo ya existe en la lista de compra
    const existingItem = purchaseInventory.find(p => 
        p.propertyId === currentUser.propertyId && 
        p.name.toLowerCase() === itemName.toLowerCase() && 
        !p.purchased
    );
    
    if (existingItem) {
        alert(`⚠️ ${itemName} ya está en la lista de compra`);
        return;
    }
    
    // Agregar directamente a la lista de compra
    purchaseInventory.push({
        id: `purchase_${Date.now()}`,
        propertyId: currentUser.propertyId,
        name: itemName,
        qty: qty,
        purchased: false,
        createdDate: new Date().toISOString(),
        addedBy: currentUser.name,
        reason: reason
    });
    
    document.getElementById('employeePurchaseRequestName').value = '';
    document.getElementById('employeePurchaseRequestQty').value = '1';
    document.getElementById('employeePurchaseRequestReason').value = '';
    saveData();
    alert(`✅ ${itemName} agregado a la lista de compra`);
}

function renderEmployeePurchaseRequests() {
    const list = document.getElementById('employeePurchaseRequestsList');
    if (!list) return;
    list.innerHTML = '';
    
    const requests = purchaseRequests.filter(r => r.propertyId === currentUser.propertyId);
    if (requests.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay solicitudes de compra</p>';
        return;
    }
    
    const pending = requests.filter(r => r.status === 'pendiente');
    const approved = requests.filter(r => r.status === 'aprobada');
    const purchased = requests.filter(r => r.status === 'comprada');
    
    if (pending.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '⏳ Solicitudes Enviadas';
        header.style.color = 'var(--accent-color)';
        list.appendChild(header);
        
        pending.forEach(req => {
            const date = new Date(req.requestDate);
            const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const row = document.createElement('div');
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-weight:600;">${req.itemName}</span>
                        <span style="color:#999; margin-left:0.5rem;">x${req.qty}</span>
                        <div style="font-size:0.8rem; color:#666;">📅 ${dateStr}</div>
                        ${req.reason ? `<div style="font-size:0.8rem; color:#888;">💬 ${req.reason}</div>` : ''}
                    </div>
                </div>
            `;
            list.appendChild(row);
        });
    }
    
    if (approved.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '✅ Aprobadas';
        header.style.color = 'green';
        header.style.marginTop = '1rem';
        list.appendChild(header);
        
        approved.forEach(req => {
            const row = document.createElement('div');
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.innerHTML = `
                <div>
                    <span style="font-weight:600;">${req.itemName}</span>
                    <span style="color:#999; margin-left:0.5rem;">x${req.qty}</span>
                </div>
            `;
            list.appendChild(row);
        });
    }
    
    if (purchased.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '🎉 Compradas';
        header.style.color = '#4CAF50';
        header.style.marginTop = '1rem';
        list.appendChild(header);
        
        purchased.forEach(req => {
            const row = document.createElement('div');
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.style.opacity = '0.7';
            row.innerHTML = `
                <div>
                    <span style="font-weight:600; text-decoration:line-through;">${req.itemName}</span>
                    <span style="color:#999; margin-left:0.5rem;">x${req.qty}</span>
                </div>
            `;
            list.appendChild(row);
        });
    }
}

// Render solicitudes de compra para manager/dueño
function renderManagerPurchaseRequests() {
    const list = document.getElementById('managerPurchaseRequestsList');
    if (!list) return;
    list.innerHTML = '';
    
    const requests = purchaseRequests.filter(r => r.propertyId === selectedProperty);
    if (requests.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay solicitudes de compra</p>';
        return;
    }
    
    const pending = requests.filter(r => r.status === 'pendiente');
    const approved = requests.filter(r => r.status === 'aprobada');
    const purchased = requests.filter(r => r.status === 'comprada');
    
    if (pending.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '⏳ Solicitudes Pendientes';
        header.style.color = 'var(--accent-color)';
        list.appendChild(header);
        
        pending.forEach(req => {
            const date = new Date(req.requestDate);
            const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const row = document.createElement('div');
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-weight:600; font-size:0.9rem;">👤 ${req.employeeName}</span>
                        <div style="margin-top:0.25rem;">
                            <span style="font-weight:600;">${req.itemName}</span>
                            <span style="color:#999; margin-left:0.5rem;">x${req.qty}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#666;">📅 ${dateStr}</div>
                        ${req.reason ? `<div style="font-size:0.8rem; color:#888;">💬 ${req.reason}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-success" style="font-size:0.75rem; padding:0.3rem 0.5rem;" onclick="approvePurchaseRequest('${req.id}')">✅ Aprobar</button>
                        <button class="btn-danger" style="font-size:0.75rem; padding:0.3rem 0.5rem;" onclick="rejectPurchaseRequest('${req.id}')">❌ Rechazar</button>
                    </div>
                </div>
            `;
            list.appendChild(row);
        });
    }
    
    if (approved.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '✅ Aprobadas (Listas para Comprar)';
        header.style.color = 'green';
        header.style.marginTop = '1rem';
        list.appendChild(header);
        
        approved.forEach(req => {
            const row = document.createElement('div');
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-weight:600;">${req.itemName}</span>
                        <span style="color:#999; margin-left:0.5rem;">x${req.qty}</span>
                        <div style="font-size:0.8rem; color:#666;">👤 ${req.employeeName}</div>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-success" style="font-size:0.75rem; padding:0.3rem 0.5rem;" onclick="markRequestAsPurchased('${req.id}')">🛒 Comprado</button>
                        <button class="btn-danger" style="font-size:0.75rem; padding:0.3rem 0.5rem;" onclick="rejectPurchaseRequest('${req.id}')">🗑️</button>
                    </div>
                </div>
            `;
            list.appendChild(row);
        });
    }
    
    if (purchased.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '🎉 Compradas';
        header.style.color = '#4CAF50';
        header.style.marginTop = '1rem';
        list.appendChild(header);
        
        purchased.forEach(req => {
            const row = document.createElement('div');
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.style.opacity = '0.7';
            row.innerHTML = `
                <div>
                    <span style="font-weight:600; text-decoration:line-through;">${req.itemName}</span>
                    <span style="color:#999; margin-left:0.5rem;">x${req.qty}</span>
                    <div style="font-size:0.8rem; color:#666;">👤 ${req.employeeName}</div>
                </div>
            `;
            list.appendChild(row);
        });
    }
}

function approvePurchaseRequest(requestId) {
    const req = purchaseRequests.find(r => r.id === requestId);
    if (req) {
        req.status = 'aprobada';
        saveData();
        refreshOwnerContent();
    }
}

function rejectPurchaseRequest(requestId) {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    purchaseRequests = purchaseRequests.filter(r => r.id !== requestId);
    saveData();
    refreshOwnerContent();
}

function markRequestAsPurchased(requestId) {
    const req = purchaseRequests.find(r => r.id === requestId);
    if (req) {
        req.status = 'comprada';
        // Registrar en historial de compras
        const now = new Date();
        purchaseHistory.push({
            id: `purchase_history_${Date.now()}`,
            propertyId: req.propertyId,
            itemName: req.itemName,
            qty: req.qty,
            purchaseDate: now.toISOString(),
            category: 'aseo',
            requestId: requestId
        });
        saveData();
        refreshOwnerContent();
    }
}


// Calendario de Limpieza/Mantenimiento
function parseLocalDate(dateString) {
    // Parsear fecha como local sin conversión de timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function addScheduledDate(source) {
    let propertyId, date, type, employeeId, startTime;
    
    if (source === 'manager') {
        propertyId = currentUser.propertyId;
        date = document.getElementById('managerScheduleDate').value;
        type = document.getElementById('managerScheduleType').value;
        employeeId = document.getElementById('managerScheduleEmployee').value;
        startTime = document.getElementById('managerScheduleTime').value;
    } else {
        if (!selectedProperty) { alert('Selecciona una propiedad'); return; }
        propertyId = selectedProperty;
        date = document.getElementById('scheduleDate').value;
        type = document.getElementById('scheduleType').value;
        employeeId = document.getElementById('scheduleEmployee').value;
        startTime = document.getElementById('scheduleTime').value;
    }
    
    if (!date || !type) { alert('Completa la fecha y tipo'); return; }
    
    // Obtener nombre del empleado si fue asignado
    let employeeName = '';
    if (employeeId) {
        const prop = properties[propertyId];
        const employee = prop.staff.find(s => s.id === employeeId);
        if (employee) {
            employeeName = employee.name;
        }
    }
    
    const newSchedule = {
        propertyId,
        date,
        type, // 'limpieza' o 'mantenimiento'
        assignedEmployeeId: employeeId || '',
        assignedEmployeeName: employeeName,
        startTime: startTime || '',
        completed: false,
        completedTime: null, // Hora en que el empleado marcó como completado
        notes: ''
    };
    saveScheduleToFirestore(newSchedule).then(() => {
        if (source === 'manager') {
            document.getElementById('managerScheduleDate').value = '';
            document.getElementById('managerScheduleType').value = 'limpieza-regular';
            document.getElementById('managerScheduleEmployee').value = '';
            document.getElementById('managerScheduleTime').value = '';
        } else {
            document.getElementById('scheduleDate').value = '';
            document.getElementById('scheduleType').value = 'limpieza-regular';
            document.getElementById('scheduleEmployee').value = '';
            document.getElementById('scheduleTime').value = '';
        }
    });
}

function scheduleDeepCleanEvery3Months(propertyId, propertyName) {
    // Crear un evento de calendario para limpieza profunda dentro de 90 días
    const now = new Date();
    const target = new Date(now.getTime());
    target.setDate(target.getDate() + 90);
    const dateStr = target.toISOString().split('T')[0];

    const existing = scheduledDates.find(s => s.propertyId === propertyId && s.notes?.includes('Limpieza profunda'));
    if (existing) return;

    const newSchedule = {
        propertyId,
        date: dateStr,
        type: 'limpieza-profunda',
        assignedEmployeeId: '',
        assignedEmployeeName: '',
        startTime: '',
        completed: false,
        completedTime: null,
        notes: 'Limpieza profunda (cada 3 meses)' + (propertyName ? ` - ${propertyName}` : '')
    };
    saveScheduleToFirestore(newSchedule);
}

function ensureEpicPropertyExists() {
    const existingId = Object.keys(properties).find(pid => {
        const nm = properties[pid]?.name?.trim?.();
        return nm && nm.toLowerCase() === 'epic d1';
    });
    if (existingId) return existingId;

    const id = 'prop_epic_d1';
    const prop = { id, name: 'EPIC D1', address: 'Por definir', staff: [], inventory: {} };
    normalizeInventory(prop);
    properties[id] = prop;
    cleaningTasks.push(...createDefaultCleaningTasks(id, prop.name));
    scheduleDeepCleanEvery3Months(id, prop.name);
    return id;
}

function ensureTorreMagnaPropertyExists() {
    const existingId = Object.keys(properties).find(pid => {
        const nm = properties[pid]?.name?.trim?.();
        return nm && (nm.toLowerCase() === 'torre magna pi' || nm.toLowerCase() === 'torre magna');
    });
    if (existingId) return existingId;

    const id = 'prop_torre_magna';
    const prop = { 
        id, 
        name: 'Torre Magna PI', 
        address: 'Por definir', 
        staff: [
            {
                id: 'staff_jose',
                name: 'Jose',
                role: 'manager',
                username: 'jose',
                password: 'jose123',
                lastLoginTime: null
            },
            {
                id: 'staff_alejandra',
                name: 'Alejandra',
                role: 'employee',
                username: 'alejandra',
                password: 'alejandra123',
                lastLoginTime: null
            },
            {
                id: 'staff_maria',
                name: 'Maria',
                role: 'employee',
                username: 'maria',
                password: 'maria123',
                lastLoginTime: null
            }
        ], 
        inventory: {} 
    };
    normalizeInventory(prop);
    properties[id] = prop;
    cleaningTasks.push(...createDefaultCleaningTasks(id, prop.name));
    return id;
}

function ensureEpicStaffExists() {
    const epicId = Object.keys(properties).find(pid => {
        const nm = properties[pid]?.name?.trim?.();
        return nm && nm.toLowerCase() === 'epic d1';
    });
    
    if (!epicId) return;
    
    const prop = properties[epicId];
    if (!prop.staff) prop.staff = [];
    
    // Verificar si Victor ya existe
    if (!prop.staff.find(s => s.username === 'victor')) {
        prop.staff.push({
            id: 'staff_victor',
            name: 'Victor',
            role: 'mantenimiento',
            username: 'victor',
            password: 'victor123',
            assignmentType: 'mantenimiento',
            lastLoginTime: null
        });
    }
    
    // Verificar si Alejandro ya existe
    if (!prop.staff.find(s => s.username === 'alejandro')) {
        prop.staff.push({
            id: 'staff_alejandro',
            name: 'Alejandro',
            role: 'limpieza',
            username: 'alejandro',
            password: 'alejandro123',
            assignmentType: 'limpieza',
            lastLoginTime: null
        });
    }
}

// Asegurar que Torre Magna tenga siempre staff base (manager + empleados)
function ensureTorreMagnaStaffExists() {
    const propId = Object.keys(properties).find(pid => {
        const nm = properties[pid]?.name?.trim?.();
        return nm && (nm.toLowerCase() === 'torre magna pi' || nm.toLowerCase() === 'torre magna');
    });
    if (!propId) return;

    const prop = properties[propId];
    if (!prop.staff) prop.staff = [];

    const requiredStaff = [
        { id: 'staff_jose', name: 'Jose', role: 'manager', username: 'jose', password: 'jose123' },
        { id: 'staff_alejandra', name: 'Alejandra', role: 'employee', username: 'alejandra', password: 'alejandra123' },
        { id: 'staff_maria', name: 'Maria', role: 'employee', username: 'maria', password: 'maria123' }
    ];

    requiredStaff.forEach(req => {
        const exists = prop.staff.find(s => s.username === req.username);
        if (!exists) {
            prop.staff.push({ ...req, lastLoginTime: null });
        } else {
            // Asegurar que las credenciales se mantengan en caso de datos incompletos
            exists.password = req.password;
            exists.role = req.role;
            exists.name = req.name;
            exists.id = exists.id || req.id;
        }
    });
}

// Garantiza que cada propiedad tenga sus tareas semilla si están vacías
function ensureCleaningTasksSeededForProperty(propId, propName) {
    const hasTasks = cleaningTasks.some(t => t.propertyId === propId);
    if (!hasTasks) {
        cleaningTasks.push(...createDefaultCleaningTasks(propId, propName));
    }
}

// Asegurar que Torre Magna tenga tareas de mantenimiento semilladas
function ensureTorreMagnaMaintenanceTasks() {
    const propId = Object.keys(properties).find(pid => {
        const nm = properties[pid]?.name?.trim?.();
        return nm && (nm.toLowerCase() === 'torre magna pi' || nm.toLowerCase() === 'torre magna');
    });
    if (!propId) return;

    const hasMaintenance = cleaningTasks.some(t => t.propertyId === propId && /mantenimiento/i.test(t.sectionKey || ''));
    if (hasMaintenance) return;

    const maintenanceSection = CUSTOM_TASKS['torre-magna-pi-mantenimiento'];
    if (!maintenanceSection || !maintenanceSection.sections) return;

    const newTasks = [];
    maintenanceSection.sections.forEach(subsection => {
        (subsection.tasks || []).forEach(text => {
            newTasks.push({
                id: `task_${maintenanceSection.name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                propertyId: propId,
                sectionKey: 'torre-magna-pi-mantenimiento',
                subsectionTitle: subsection.title,
                taskText: text,
                assignedTo: '',
                completed: false,
                verified: false,
                notes: ''
            });
        });
    });

    if (newTasks.length > 0) {
        cleaningTasks.push(...newTasks);
        saveData();
    }
}

function toggleScheduleComplete(scheduleId) {
    const item = scheduledDates.find(s => s.id === scheduleId);
    if (item) {
        const updated = { ...item, completed: !item.completed };
        saveScheduleToFirestore(updated);
    }
}

function removeScheduledDate(scheduleId) {
    if (!confirm('¿Eliminar esta fecha programada?')) return;
    deleteScheduleFromFirestore(scheduleId);
}

function markScheduleCompleted(scheduleId) {
    const item = scheduledDates.find(s => s.id === scheduleId);
    if (!item) return;
    
    // Obtener tareas pendientes para esta propiedad y empleado
    const prop = properties[item.propertyId];
    if (!prop) return;
    
    const pendingTasks = cleaningTasks.filter(t => 
        t.propertyId === item.propertyId && 
        t.assignedEmployeeId === item.assignedEmployeeId &&
        t.status === 'pending'
    );
    
    // Obtener revisiones de inventario pendientes
    const pendingInventoryReviews = inventoryChecks.filter(check =>
        check.propertyId === item.propertyId &&
        check.employeeId === item.assignedEmployeeId &&
        !check.approved
    );
    
    // Construir mensaje de pendientes
    let pendingMessage = '';
    if (pendingTasks.length > 0 || pendingInventoryReviews.length > 0) {
        pendingMessage += '⚠️ AÚN HAY PENDIENTES:\n\n';
        
        if (pendingTasks.length > 0) {
            pendingMessage += `📋 TAREAS PENDIENTES (${pendingTasks.length}):\n`;
            pendingTasks.forEach(task => {
                pendingMessage += `  • ${task.taskText}\n`;
            });
            pendingMessage += '\n';
        }
        
        if (pendingInventoryReviews.length > 0) {
            pendingMessage += `📦 INVENTARIO POR REVISAR (${pendingInventoryReviews.length}):\n`;
            pendingInventoryReviews.forEach(review => {
                pendingMessage += `  • ${review.category || 'Revisión'}\n`;
            });
            pendingMessage += '\n';
        }
        
        pendingMessage += '¿Estás seguro de cerrar el día con tareas incompletas?';
        
        if (!confirm(pendingMessage)) {
            return; // Usuario canceló
        }
    }
    
    // Marcar como completado
    item.completed = true;
    item.completedTime = new Date().toISOString();
    
    // Si había pendientes, crear notificación para dueño y manager
    if (pendingTasks.length > 0 || pendingInventoryReviews.length > 0) {
        const notification = {
            id: `notif_${Date.now()}`,
            propertyId: item.propertyId,
            employeeId: item.assignedEmployeeId,
            employeeName: item.assignedEmployeeName,
            date: new Date().toLocaleDateString('es-ES'),
            time: new Date().toLocaleTimeString('es-ES'),
            pendingTasks: pendingTasks.map(t => t.taskText),
            pendingInventoryCount: pendingInventoryReviews.length,
            shift: item.startTime,
            read: false,
            createdAt: new Date().toISOString()
        };
        
        workDayNotifications.push(notification);
    }
    
    saveData();
    renderEmployeeSchedule();
    
    if (pendingTasks.length > 0 || pendingInventoryReviews.length > 0) {
        alert('✅ Día marcado como completado con pendientes.\n\nEl Dueño y Manager serán notificados de las tareas incompletas.');
        renderOwnerNotifications();
        renderManagerNotifications();
    } else {
        alert('✅ Día marcado como completado. El manager y el dueño pueden ver la hora de finalización.');
    }
}

function renderOwnerNotifications() {
    const container = document.getElementById('ownerNotificationsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const unreadCount = workDayNotifications.filter(n => !n.read).length;
    
    if (unreadCount === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center; padding:1rem;">✅ No hay notificaciones pendientes</p>';
        return;
    }
    
    const title = document.createElement('h3');
    title.innerHTML = `⚠️ Notificaciones de Días Cerrados con Pendientes (${unreadCount})`;
    title.style.color = '#d32f2f';
    container.appendChild(title);
    
    workDayNotifications.forEach(notif => {
        if (notif.read) return;
        
        const card = document.createElement('div');
        card.style.background = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)';
        card.style.border = '2px solid #d32f2f';
        card.style.borderRadius = '8px';
        card.style.padding = '1rem';
        card.style.marginBottom = '1rem';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s';
        card.onmouseenter = () => card.style.transform = 'translateX(4px)';
        card.onmouseleave = () => card.style.transform = 'translateX(0)';
        
        let pendingHtml = '';
        if (notif.pendingTasks.length > 0) {
            pendingHtml += `<div style="margin-top:0.5rem;"><strong>📋 Tareas Pendientes:</strong><br>`;
            notif.pendingTasks.forEach(task => {
                pendingHtml += `• ${task}<br>`;
            });
            pendingHtml += '</div>';
        }
        
        if (notif.pendingInventoryCount > 0) {
            pendingHtml += `<div style="margin-top:0.5rem;"><strong>📦 Inventario por revisar:</strong> ${notif.pendingInventoryCount} item(s)</div>`;
        }
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div><strong>👤 ${notif.employeeName}</strong></div>
                    <div style="color:#666; font-size:0.9rem;">📅 ${notif.date} - ⏰ ${notif.time}</div>
                    ${notif.shift ? `<div style="color:#d32f2f; font-weight:600; margin-top:0.3rem;">${formatShift(notif.shift)}</div>` : ''}
                    ${pendingHtml}
                </div>
                <button style="background:#d32f2f; color:white; border:none; padding:0.5rem 1rem; border-radius:4px; cursor:pointer;" onclick="markNotificationAsRead('${notif.id}')">Marcar como leída</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function renderManagerNotifications() {
    const container = document.getElementById('managerNotificationsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filtrar solo notificaciones de la propiedad del manager
    const propertyNotifications = workDayNotifications.filter(n => n.propertyId === currentUser.propertyId && !n.read);
    
    if (propertyNotifications.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center; padding:1rem;">✅ No hay notificaciones pendientes</p>';
        return;
    }
    
    const title = document.createElement('h3');
    title.innerHTML = `⚠️ Alertas - Días Cerrados con Pendientes (${propertyNotifications.length})`;
    title.style.color = '#d32f2f';
    container.appendChild(title);
    
    propertyNotifications.forEach(notif => {
        const card = document.createElement('div');
        card.style.background = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)';
        card.style.border = '2px solid #d32f2f';
        card.style.borderRadius = '8px';
        card.style.padding = '1rem';
        card.style.marginBottom = '1rem';
        
        let pendingHtml = '';
        if (notif.pendingTasks.length > 0) {
            pendingHtml += `<div style="margin-top:0.5rem;"><strong>📋 Tareas Pendientes:</strong><br>`;
            notif.pendingTasks.forEach(task => {
                pendingHtml += `• ${task}<br>`;
            });
            pendingHtml += '</div>';
        }
        
        if (notif.pendingInventoryCount > 0) {
            pendingHtml += `<div style="margin-top:0.5rem;"><strong>📦 Inventario por revisar:</strong> ${notif.pendingInventoryCount} item(s)</div>`;
        }
        
        card.innerHTML = `
            <div>
                <div><strong>👤 ${notif.employeeName}</strong></div>
                <div style="color:#666; font-size:0.9rem;">📅 ${notif.date} - ⏰ ${notif.time}</div>
                ${notif.shift ? `<div style="color:#d32f2f; font-weight:600; margin-top:0.3rem;">${formatShift(notif.shift)}</div>` : ''}
                ${pendingHtml}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function markNotificationAsRead(notificationId) {
    const notif = workDayNotifications.find(n => n.id === notificationId);
    if (notif) {
        notif.read = true;
        saveData();
        renderOwnerNotifications();
        renderManagerNotifications();
    }
}

function formatShift(shift) {
    if (!shift) return '';
    const shifts = {
        'mañana': '🌅 Turno Mañana',
        'tarde': '🌇 Turno Tarde',
        'noche': '🌃 Turno Noche'
    };
    return shifts[shift] || shift;
}

function renderSchedule() {
    const list = document.getElementById('scheduleList');
    if (!list) return;
    list.innerHTML = '';
    
    const items = scheduledDates.filter(s => s.propertyId === selectedProperty).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (items.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay fechas programadas</p>';
        return;
    }
    
    const pending = items.filter(s => !s.completed);
    const completed = items.filter(s => s.completed);
    
    // Sección colapsable: Próximas Fechas
    if (pending.length > 0) {
        const section = document.createElement('div');
        section.className = 'collapsible-section';
        
        const header = document.createElement('button');
        header.className = 'collapsible-section-header';
        header.innerHTML = `📅 Próximas Fechas <small>(${pending.length})</small>`;
        header.style.color = 'var(--accent-color)';
        
        const content = document.createElement('div');
        content.className = 'collapsible-section-content collapsed';
        
        header.onclick = () => {
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        };
        
        pending.forEach(item => {
            const dateObj = parseLocalDate(item.date);
            const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const row = document.createElement('div');
            
            // Determinar color e ícono según tipo de trabajo
            let typeColor, typeIcon, typeName;
            if (item.type === 'limpieza-profunda') {
                typeColor = '#2196F3';
                typeIcon = '🧽';
                typeName = 'Limpieza Profunda';
            } else if (item.type === 'mantenimiento') {
                typeColor = '#FF9800';
                typeIcon = '🔧';
                typeName = 'Mantenimiento';
            } else {
                typeColor = '#4CAF50';
                typeIcon = '🧹';
                typeName = 'Limpieza Regular';
            }
            
            row.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
            row.style.border = `2px solid ${typeColor}`;
            row.style.borderRadius = '12px';
            row.style.padding = '1.2rem';
            row.style.marginBottom = '1rem';
            row.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            row.style.transition = 'transform 0.2s, box-shadow 0.2s';
            row.onmouseenter = () => { row.style.transform = 'translateY(-2px)'; row.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; };
            row.onmouseleave = () => { row.style.transform = 'translateY(0)'; row.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; };
            
            
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                    <div style="flex:1;">
                        <div style="display:inline-block; background:${typeColor}; color:white; padding:0.4rem 1rem; border-radius:20px; font-weight:600; font-size:0.95rem; margin-bottom:0.8rem;">
                            ${typeIcon} ${typeName}
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                            <span style="font-size:1.5rem;">📅</span>
                            <span style="color:#333; font-size:1rem; font-weight:500;">${dateStr}</span>
                        </div>
                        ${item.assignedEmployeeName ? `
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
                            <span style="font-size:1.3rem;">👤</span>
                            <span style="color:#555; font-size:0.95rem;">${item.assignedEmployeeName}</span>
                        </div>` : ''}
                        ${item.startTime ? `
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="color:#d32f2f; font-size:0.95rem; font-weight:600;">${formatShift(item.startTime)}</span>
                        </div>` : ''}
                        ${item.notes ? `
                        <div style="margin-top:0.6rem; padding:0.55rem 0.75rem; background:#e3f2fd; color:#0d47a1; border-radius:8px; font-size:0.9rem; display:flex; gap:0.4rem; align-items:flex-start;">
                            <span>🧾</span><span>${item.notes}</span>
                        </div>` : ''}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        <button class="btn-success" style="padding:0.6rem 1.2rem; font-size:0.9rem; border-radius:8px; white-space:nowrap;" onclick="toggleScheduleComplete('${item.id}')">✅ Completar</button>
                        <button class="btn-danger" style="padding:0.6rem 1.2rem; font-size:0.9rem; border-radius:8px;" onclick="removeScheduledDate('${item.id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
            content.appendChild(row);
        });
        
        section.appendChild(header);
        section.appendChild(content);
        list.appendChild(section);
    }
    
    // Sección colapsable: Completadas
    if (completed.length > 0) {
        const section = document.createElement('div');
        section.className = 'collapsible-section';
        
        const header = document.createElement('button');
        header.className = 'collapsible-section-header';
        header.innerHTML = `✅ Completadas <small>(${completed.length})</small>`;
        header.style.color = 'green';
        
        const content = document.createElement('div');
        content.className = 'collapsible-section-content collapsed';
        
        header.onclick = () => {
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        };
        
        completed.forEach(item => {
            const dateObj = parseLocalDate(item.date);
            const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const row = document.createElement('div');
            
            // Determinar color e ícono según tipo de trabajo
            let typeColor, typeIcon, typeName;
            if (item.type === 'limpieza-profunda') {
                typeColor = '#2196F3';
                typeIcon = '🧽';
                typeName = 'Limpieza Profunda';
            } else if (item.type === 'mantenimiento') {
                typeColor = '#FF9800';
                typeIcon = '🔧';
                typeName = 'Mantenimiento';
            } else {
                typeColor = '#4CAF50';
                typeIcon = '🧹';
                typeName = 'Limpieza Regular';
            }
            
            row.style.background = 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)';
            row.style.border = '2px solid #81C784';
            row.style.borderRadius = '12px';
            row.style.padding = '1.2rem';
            row.style.marginBottom = '1rem';
            row.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            row.style.opacity = '0.85';
            
            let completedTimeHtml = '';
            if (item.completedTime) {
                const completedDate = new Date(item.completedTime);
                const timeStr = completedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                completedTimeHtml = `
                <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; background:#4CAF50; color:white; padding:0.5rem 0.8rem; border-radius:8px; display:inline-flex;">
                    <span style="font-size:1.1rem;">✅</span>
                    <span style="font-size:0.9rem; font-weight:600;">Completado: ${timeStr}</span>
                </div>`;
            }
            
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                    <div style="flex:1;">
                        <div style="display:inline-block; background:#81C784; color:white; padding:0.4rem 1rem; border-radius:20px; font-weight:600; font-size:0.95rem; margin-bottom:0.8rem; text-decoration:line-through;">
                            ${typeIcon} ${typeName}
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                            <span style="font-size:1.3rem;">📅</span>
                            <span style="color:#666; font-size:0.95rem; text-decoration:line-through;">${dateStr}</span>
                        </div>
                        ${item.notes ? `
                        <div style="margin-top:0.4rem; padding:0.45rem 0.6rem; background:#e8f0fe; color:#1a237e; border-radius:6px; font-size:0.85rem; display:inline-flex; gap:0.35rem; align-items:center;">
                            <span>🧾</span><span>${item.notes}</span>
                        </div>` : ''}
                        ${completedTimeHtml}
                    </div>
                    <div>
                        <button class="btn-danger" style="padding:0.6rem 1.2rem; font-size:0.9rem; border-radius:8px;" onclick="removeScheduledDate('${item.id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
            content.appendChild(row);
        });
        
        section.appendChild(header);
        section.appendChild(content);
        list.appendChild(section);
    }
}

// Mostrar calendario en vista empleado
function renderEmployeeSchedule() {
    const list = document.getElementById('employeeScheduleList');
    if (!list) return;
    list.innerHTML = '';
    
    // Mostrar fechas asignadas a este empleado (en la propiedad actual) y que NO estén completadas
    const items = scheduledDates.filter(s => 
        s.propertyId === currentUser.propertyId && 
        s.assignedEmployeeId === currentUser.staffId &&
        !s.completed
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (items.length === 0) {
        list.innerHTML = '<p style="color:#777;">Sin fechas programadas para ti</p>';
        return;
    }
    
    items.forEach(item => {
        const dateObj = parseLocalDate(item.date);
        const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const row = document.createElement('div');
        
        // Determinar color e ícono según tipo de trabajo
        let typeColor, typeIcon, typeName;
        if (item.type === 'limpieza-profunda') {
            typeColor = '#2196F3';
            typeIcon = '🧽';
            typeName = 'Limpieza Profunda';
        } else if (item.type === 'mantenimiento') {
            typeColor = '#FF9800';
            typeIcon = '🔧';
            typeName = 'Mantenimiento';
        } else {
            typeColor = '#4CAF50';
            typeIcon = '🧹';
            typeName = 'Limpieza Regular';
        }
        
        row.style.padding = '0.75rem';
        row.style.borderLeft = `4px solid ${typeColor}`;
        row.style.background = 'var(--bg-secondary)';
        row.style.marginBottom = '0.5rem';
        row.style.borderRadius = '4px';
        
        let extraInfo = '';
        if (item.startTime) {
            extraInfo += `<div style="color:#d32f2f; font-size:0.95rem; margin-top:0.5rem; font-weight:600;">${formatShift(item.startTime)}</div>`;
        }
        
        row.innerHTML = `
            <div style="font-weight:600; color:${typeColor}; font-size:1.1rem;">
                ${typeIcon} ${typeName}
            </div>
            <div style="color:#666; font-size:0.9rem; margin-top:0.25rem;">
                📅 ${dateStr}
            </div>
            ${extraInfo}
            <button onclick="markScheduleCompleted('${item.id}')" style="margin-top:0.75rem; width:100%; padding:0.6rem; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.95rem;">
                ✅ Marcar Día Completado
            </button>
        `;
        list.appendChild(row);
    });
}

// Tareas
function isMaintenanceSection(sectionKey) {
    return /mantenimiento|maintenance/i.test(sectionKey);
}

function getTasksBySection(propId, roleFilter) {
    const grouped = {};
    const prop = properties[propId];
    let taskSets = CLEANING_TASKS;
    
    // Usar tareas personalizadas si existen para la propiedad
    if (prop && CUSTOM_TASKS_BY_PROPERTY[prop.name]) {
        taskSets = CUSTOM_TASKS_BY_PROPERTY[prop.name];
    }
    
    cleaningTasks.filter(t => t.propertyId === propId).forEach(task => {
        const maintenance = isMaintenanceSection(task.sectionKey);
        if (roleFilter) {
            if (roleFilter === 'maintenance' && !maintenance) return;
            if (roleFilter !== 'maintenance' && maintenance) return;
        }
        
        const meta = taskSets[task.sectionKey] || { name: 'General', icon: '🧹' };
        if (!grouped[task.sectionKey]) {
            grouped[task.sectionKey] = { name: meta.name, icon: meta.icon, tasks: [], hasSubsections: meta.sections ? true : false };
        }
        grouped[task.sectionKey].tasks.push(task);
    });
    return grouped;
}

// Función helper para crear tarjetas de tareas con estilo profesional
function createTaskCard(task, status) {
    const row = document.createElement('div');
    row.className = 'task-item';
    
    if (status === 'pending') {
        row.style.background = 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)';
        row.style.border = '2px solid #FFC107';
        row.style.borderRadius = '10px';
        row.style.padding = '1rem';
        row.style.marginBottom = '0.75rem';
        row.style.boxShadow = '0 2px 6px rgba(255, 193, 7, 0.2)';
        row.style.transition = 'transform 0.2s';
        row.onmouseenter = () => { row.style.transform = 'translateX(4px)'; };
        row.onmouseleave = () => { row.style.transform = 'translateX(0)'; };
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                <div style="flex:1; display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:1.8rem;">⏳</span>
                    <span style="color:#333; font-size:1rem; font-weight:500;">${task.taskText}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="background:#FFA726; color:white; padding:0.4rem 0.9rem; border-radius:20px; font-size:0.85rem; font-weight:600; white-space:nowrap;">
                        🕒 Esperando empleado
                    </div>
                    <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')" style="padding:0.5rem 0.9rem; border-radius:8px; font-size:0.9rem;">🗑️</button>
                </div>
            </div>
        `;
    } else if (status === 'completed') {
        row.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
        row.style.border = '2px solid #66BB6A';
        row.style.borderRadius = '10px';
        row.style.padding = '1rem';
        row.style.marginBottom = '0.75rem';
        row.style.boxShadow = '0 2px 6px rgba(102, 187, 106, 0.2)';
        row.style.transition = 'transform 0.2s';
        row.onmouseenter = () => { row.style.transform = 'translateX(4px)'; };
        row.onmouseleave = () => { row.style.transform = 'translateX(0)'; };
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                <div style="flex:1; display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:1.8rem;">✅</span>
                    <span style="color:#555; font-size:1rem; text-decoration:line-through;">${task.taskText}</span>
                </div>
                <div style="display:flex; gap:0.75rem;">
                    <button class="btn-success" onclick="verifyAndCloseTask('${task.id}')" style="padding:0.6rem 1rem; border-radius:8px; font-size:0.9rem; font-weight:600; white-space:nowrap;">✔️ Verificar y Cerrar</button>
                    <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')" style="padding:0.5rem 0.9rem; border-radius:8px; font-size:0.9rem;">🗑️</button>
                </div>
            </div>
        `;
    } else if (status === 'verified') {
        row.style.background = 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';
        row.style.border = '2px solid #BDBDBD';
        row.style.borderRadius = '10px';
        row.style.padding = '1rem';
        row.style.marginBottom = '0.75rem';
        row.style.opacity = '0.75';
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                <div style="flex:1; display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:1.8rem;">✔️</span>
                    <span style="color:#666; font-size:1rem; text-decoration:line-through;">${task.taskText}</span>
                </div>
                <div style="background:#9E9E9E; color:white; padding:0.5rem 1rem; border-radius:20px; font-size:0.9rem; font-weight:600;">
                    🔒 Cerrada
                </div>
            </div>
        `;
    }
    
    return row;
}

function renderTasks() {
    if (!selectedProperty) return;
    const list = document.getElementById('tasksList');
    list.innerHTML = '';
    const tasksBySection = getTasksBySection(selectedProperty, null);
    if (Object.keys(tasksBySection).length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay tareas</p>';
        return;
    }
    Object.keys(tasksBySection).forEach(sectionKey => {
        const section = tasksBySection[sectionKey];
        const pendingTasks = section.tasks.filter(t => !t.completed && !t.verified);
        const completedTasks = section.tasks.filter(t => t.completed && !t.verified);
        const verifiedTasks = section.tasks.filter(t => t.verified);
        
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'cleaning-section';
        const titleBtn = document.createElement('button');
        titleBtn.className = 'section-title-btn collapsed';
        titleBtn.innerHTML = `${section.icon} ${section.name} <small>(⏳${pendingTasks.length} | ✅${completedTasks.length} | ✔️${verifiedTasks.length})</small>`;
        titleBtn.onclick = () => toggleSection(titleBtn);
        const content = document.createElement('div');
        content.className = 'section-content collapsed';
        
        // Agrupar por subsección si existe
        if (section.hasSubsections) {
            const subsectionGroups = {};
            section.tasks.forEach(task => {
                const subTitle = task.subsectionTitle || 'General';
                if (!subsectionGroups[subTitle]) {
                    subsectionGroups[subTitle] = { pending: [], completed: [], verified: [] };
                }
                if (!task.completed && !task.verified) {
                    subsectionGroups[subTitle].pending.push(task);
                } else if (task.completed && !task.verified) {
                    subsectionGroups[subTitle].completed.push(task);
                } else if (task.verified) {
                    subsectionGroups[subTitle].verified.push(task);
                }
            });
            
            // Renderizar cada subsección con el nuevo diseño
            Object.keys(subsectionGroups).forEach(subTitle => {
                const subGroup = subsectionGroups[subTitle];
                const subSection = document.createElement('div');
                subSection.style.marginTop = '1rem';
                
                const subHeader = document.createElement('h5');
                subHeader.textContent = subTitle;
                subHeader.style.color = 'var(--accent-color)';
                subHeader.style.marginBottom = '0.5rem';
                subHeader.style.borderBottom = '1px solid var(--bg-secondary)';
                subHeader.style.paddingBottom = '0.25rem';
                subSection.appendChild(subHeader);
                
                // Tareas pendientes
                subGroup.pending.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.innerHTML = `
                        <div>
                            <span style="color:var(--accent-color); font-weight:600;">⏳</span>
                            <span>${task.taskText}</span>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <span style="color:#999; font-size:0.85rem;">Esperando empleado...</span>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')" style="font-size:0.8rem; padding:0.2rem 0.4rem;">🗑️</button>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                // Tareas completadas
                subGroup.completed.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.innerHTML = `
                        <div>
                            <span style="color:green; font-weight:600;">✅</span>
                            <span style="text-decoration:line-through;">${task.taskText}</span>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn-success" onclick="verifyAndCloseTask('${task.id}')" style="font-size:0.8rem; padding:0.2rem 0.4rem;">✔️ Cerrar</button>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')" style="font-size:0.8rem; padding:0.2rem 0.4rem;">🗑️</button>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                // Tareas verificadas
                subGroup.verified.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.style.opacity = '0.6';
                    row.innerHTML = `
                        <div>
                            <span style="color:#666; font-weight:600;">✔️</span>
                            <span style="text-decoration:line-through; color:#666;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:#666; font-size:0.85rem;">Cerrada</span>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                content.appendChild(subSection);
            });
        } else {
            // Renderizar sin subsecciones
            if (pendingTasks.length > 0) {
                const pendingHeader = document.createElement('h4');
                pendingHeader.textContent = '⏳ Pendientes';
                pendingHeader.style.color = 'var(--accent-color)';
                pendingHeader.style.marginTop = '0.5rem';
                content.appendChild(pendingHeader);
                pendingTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.innerHTML = `
                        <div>
                            <span style="color:var(--accent-color); font-weight:600;">⏳</span>
                            <span>${task.taskText}</span>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <span style="color:#999;">Esperando empleado...</span>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')">🗑️</button>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
            
            if (completedTasks.length > 0) {
                const completedHeader = document.createElement('h4');
                completedHeader.textContent = '✅ Completadas (Verificar)';
                completedHeader.style.color = 'green';
                completedHeader.style.marginTop = '1rem';
                content.appendChild(completedHeader);
                completedTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    let completedTimeHtml = '';
                    if (task.completedTime) {
                        const completedDate = new Date(task.completedTime);
                        const timeStr = completedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                        completedTimeHtml = `<span style="color:#4CAF50; font-weight:600;">${timeStr}</span>`;
                    }
                    const employeeName = task.assignedEmployeeName || 'Sin asignar';
                    row.innerHTML = `
                        <div>
                            <span style="color:green; font-weight:600;">✅</span>
                            <span style="text-decoration:line-through;">${task.taskText}</span>
                            <span style="color:#888; margin-left:0.5rem;">(${employeeName})</span>
                            ${completedTimeHtml ? `<span style="margin-left:0.5rem;">⏰ ${completedTimeHtml}</span>` : ''}
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn-success" onclick="verifyAndCloseTask('${task.id}')">✔️ Verificar y Cerrar</button>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')">🗑️</button>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
            
            if (verifiedTasks.length > 0) {
                const verifiedHeader = document.createElement('h4');
                verifiedHeader.textContent = '✔️ Verificadas y Cerradas';
                verifiedHeader.style.color = '#666';
                verifiedHeader.style.marginTop = '1rem';
                content.appendChild(verifiedHeader);
                verifiedTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.opacity = '0.6';
                    row.innerHTML = `
                        <div>
                            <span style="color:#666; font-weight:600;">✔️</span>
                            <span style="text-decoration:line-through; color:#666;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:#666; font-size:0.9rem;">Cerrada</span>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
        }
        
        sectionDiv.appendChild(titleBtn);
        sectionDiv.appendChild(content);
        list.appendChild(sectionDiv);
    });
}

function addTask() {
    if (!selectedProperty) { alert('Selecciona una propiedad'); return; }
    const text = document.getElementById('taskInput').value.trim();
    const assignedTo = document.getElementById('employeeSelect').value;
    if (!text) { alert('Describe la tarea'); return; }
    cleaningTasks.push({
        id: `task_${Date.now()}`,
        propertyId: selectedProperty,
        sectionKey: 'general',
        taskText: text,
        assignedTo,
        completed: false,
        verified: false,
        notes: ''
    });
    document.getElementById('taskInput').value = '';
    document.getElementById('employeeSelect').value = '';
    saveData();
    renderTasks();
}

function managerAddTask() {
    const text = document.getElementById('managerTaskInput').value.trim();
    const assignedTo = document.getElementById('managerEmployeeSelect').value;
    if (!text) { alert('Describe la tarea'); return; }
    if (!currentUser || !currentUser.propertyId) return;
    cleaningTasks.push({
        id: `task_${Date.now()}`,
        propertyId: currentUser.propertyId,
        sectionKey: 'general',
        taskText: text,
        assignedTo,
        completed: false,
        verified: false,
        notes: ''
    });
    document.getElementById('managerTaskInput').value = '';
    document.getElementById('managerEmployeeSelect').value = '';
    saveData();
    renderManagerTasks();
}

function deleteCleaningTask(taskId) {
    const openSections = getOpenSections();
    cleaningTasks = cleaningTasks.filter(t => t.id !== taskId);
    saveData();
    renderTasks();
    renderEmployeeTasks();
    renderManagerTasks();
    restoreOpenSections(openSections);
}

function updateTaskStatus(taskId, done) {
    const openSections = getOpenSections();
    const task = cleaningTasks.find(t => t.id === taskId);
    if (!task) return;
    task.completed = !!done;
    saveData();
    // Solo actualizar la vista del empleado sin recargar todo
    renderEmployeeTasks();
    restoreOpenSections(openSections);
}

function verifyAndCloseTask(taskId) {
    if (!confirm('¿Verificar y cerrar esta tarea?')) return;
    const openSections = getOpenSections();
    const task = cleaningTasks.find(t => t.id === taskId);
    if (!task) return;
    task.verified = true;
    saveData();
    renderTasks();
    renderEmployeeTasks();
    renderManagerTasks();
    restoreOpenSections(openSections);
}

function reinitializeCleaning(propertyId) {
    const targetPropertyId = propertyId || (currentUserType === 'manager' ? (currentUser ? currentUser.propertyId : null) : selectedProperty);
    if (!targetPropertyId) { alert('Selecciona una propiedad'); return; }
    const propName = properties[targetPropertyId]?.name || 'la propiedad';
    if (!confirm(`🔄 ¿Reiniciar las tareas de limpieza de ${propName}? Todas las tareas volverán a estado pendiente.`)) return;
    
    // Resetear todas las tareas de esta propiedad a estado inicial (no completadas, no verificadas)
    cleaningTasks.forEach(task => {
        if (task.propertyId === targetPropertyId) {
            task.completed = false;
            task.verified = false;
            task.completedBy = null;
            task.completedAt = null;
            task.verifiedBy = null;
            task.verifiedAt = null;
        }
    });
    
    saveData();
    if (currentUserType === 'manager') {
        renderManagerTasks();
    } else if (currentUserType === 'employee') {
        renderEmployeeTasks();
    } else {
        renderTasks();
    }
    alert('✅ Tareas de limpieza reiniciadas. Todas están pendientes nuevamente.');
}

function resetInventoryChecksForReview(propertyId) {
    const targetPropertyId = propertyId || (currentUserType === 'manager' ? (currentUser ? currentUser.propertyId : null) : selectedProperty);
    if (!targetPropertyId) { alert('Selecciona una propiedad'); return; }
    const propName = properties[targetPropertyId]?.name || 'la propiedad';
    const confirmMsg = `🧾 ¿Reiniciar la verificación de inventario de ${propName}? Se borrarán las revisiones previas, pero se mantienen las cantidades esperadas para que el personal vuelva a validar.`;
    if (!confirm(confirmMsg)) return;
    
    // Borrar todas las verificaciones de inventario de esta propiedad, conservando las cantidades asignadas
    inventoryChecks = inventoryChecks.filter(check => check.propertyId !== targetPropertyId);
    
    saveData();
    if (currentUserType === 'manager') {
        renderManagerInventoryChecks();
        renderManagerInventory();
    } else {
        renderInventoryChecks();
        renderInventory();
    }
    alert('✅ Verificación de inventario reiniciada. Las cantidades se mantienen; el personal debe volver a revisar.');
}

// Vistas
function showOwnerView() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('ownerView').style.display = 'block';
    document.getElementById('employeeView').style.display = 'none';
    document.getElementById('managerView').style.display = 'none';
    document.getElementById('ownerName').textContent = OWNER_CREDENTIALS.name;
    if (!selectedProperty) {
        selectedProperty = Object.keys(properties)[0] || null;
    }
    renderProperties();
    refreshOwnerContent();
}

function showEmployeeView() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('ownerView').style.display = 'none';
    document.getElementById('managerView').style.display = 'none';
    document.getElementById('employeeView').style.display = 'block';
    document.getElementById('employeeName').textContent = currentUser.name;
    const prop = properties[currentUser.propertyId];
    const staff = (prop.staff || []).find(s => s.id === currentUser.staffId);
    if (staff) staff.lastLoginTime = new Date();
    document.getElementById('loginTime').textContent = `Ingreso: ${new Date(currentUser.loginTime).toLocaleTimeString()}`;
    document.getElementById('assignedProperty').textContent = `Casa asignada: ${prop.name}`;
    document.getElementById('assignedAddress').textContent = prop.address;
    saveData();
    renderEmployeeSchedule();
    renderEmployeeInventory();
    renderEmployeeTasks();
    renderEmployeePurchaseRequests();
}

function showManagerView() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('ownerView').style.display = 'none';
    document.getElementById('employeeView').style.display = 'none';
    document.getElementById('managerView').style.display = 'block';
    document.getElementById('managerName').textContent = currentUser.name;
    const prop = properties[currentUser.propertyId];
    const staff = (prop.staff || []).find(s => s.id === currentUser.staffId);
    if (staff) staff.lastLoginTime = new Date();
    document.getElementById('managerLoginTime').textContent = `Ingreso: ${new Date(currentUser.loginTime).toLocaleTimeString()}`;
    document.getElementById('managerPropertyName').textContent = prop.name;
    document.getElementById('managerPropertyAddress').textContent = prop.address;
    
    // Establecer fecha mínima en calendario (hoy)
    const today = new Date().toISOString().split('T')[0];
    const managerScheduleDateInput = document.getElementById('managerScheduleDate');
    if (managerScheduleDateInput) managerScheduleDateInput.min = today;
    
    // Poblar selector de empleados para calendario
    const selectScheduleManager = document.getElementById('managerScheduleEmployee');
    if (selectScheduleManager) {
        selectScheduleManager.innerHTML = '<option value="">Seleccionar empleado...</option>';
        (prop.staff || []).forEach(member => {
            if (member.role === 'employee') {
                const opt = document.createElement('option');
                opt.value = member.id;
                opt.textContent = member.name;
                selectScheduleManager.appendChild(opt);
            }
        });
    }
    
    saveData();
    renderManagerInventory();
    renderManagerInventoryChecks();
    renderManagerPurchaseHistory();
    renderManagerTasks();
    renderManagerPurchaseInventory();
    renderManagerSchedule();
    renderManagerPurchaseRequests();
    renderManagerNotifications();
    
    // Hacer las secciones colapsables (minimizadas por defecto)
    makeManagerSectionsCollapsible();
}

function renderManagerPurchaseInventory() {
    const list = document.getElementById('managerPurchaseInventoryList');
    if (!list) return;
    list.innerHTML = '';
    
    const items = purchaseInventory.filter(p => p.propertyId === currentUser.propertyId);
    if (items.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay artículos en la lista de compra</p>';
        return;
    }
    
    // Mostrar última compra de aseo si existe
    const lastCleaningPurchase = getLastPurchaseDate(currentUser.propertyId, 'aseo');
    if (lastCleaningPurchase) {
        const lastPurchaseDiv = document.createElement('div');
        lastPurchaseDiv.style.padding = '0.75rem';
        lastPurchaseDiv.style.backgroundColor = 'var(--bg-secondary)';
        lastPurchaseDiv.style.borderRadius = '4px';
        lastPurchaseDiv.style.marginBottom = '1rem';
        lastPurchaseDiv.style.borderLeft = '4px solid #4CAF50';
        lastPurchaseDiv.innerHTML = `<strong>📅 Última compra de aseo:</strong> ${lastCleaningPurchase}`;
        list.appendChild(lastPurchaseDiv);
    }
    
    const pending = items.filter(p => !p.purchased);
    const purchased = items.filter(p => p.purchased);
    
    if (pending.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '📋 Por Comprar';
        header.style.color = 'var(--accent-color)';
        list.appendChild(header);
        
        pending.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.innerHTML = `
                <div>
                    <span style="font-weight:600;">${item.name}</span>
                    <span style="color:#999; margin-left:0.5rem;">x${item.qty}</span>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-success" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="togglePurchaseStatus('${item.id}')">✅ Comprado</button>
                    <button class="btn-danger" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="removePurchaseItem('${item.id}')">🗑️</button>
                </div>
            `;
            list.appendChild(row);
        });
    }
    
    if (purchased.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '✅ Comprados';
        header.style.color = 'green';
        header.style.marginTop = '1rem';
        list.appendChild(header);
        
        purchased.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '0.5rem';
            row.style.borderBottom = '1px solid var(--bg-secondary)';
            row.style.opacity = '0.6';
            row.innerHTML = `
                <div>
                    <span style="text-decoration:line-through;">${item.name}</span>
                    <span style="color:#999; margin-left:0.5rem;">x${item.qty}</span>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-warning" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="togglePurchaseStatus('${item.id}')">↩️ Pendiente</button>
                    <button class="btn-danger" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="removePurchaseItem('${item.id}')">🗑️</button>
                </div>
            `;
            list.appendChild(row);
        });
    }
}

function renderManagerSchedule() {
    const list = document.getElementById('managerScheduleList');
    if (!list) return;
    list.innerHTML = '';
    
    const items = scheduledDates.filter(s => s.propertyId === currentUser.propertyId).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (items.length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay fechas programadas</p>';
        return;
    }
    
    const pending = items.filter(s => !s.completed);
    const completed = items.filter(s => s.completed);
    
    if (pending.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '📅 Próximas Fechas';
        header.style.color = 'var(--accent-color)';
        list.appendChild(header);
        
        pending.forEach(item => {
            const dateObj = parseLocalDate(item.date);
            const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const row = document.createElement('div');
            
            // Determinar color e ícono según tipo de trabajo
            let typeColor, typeIcon, typeName;
            if (item.type === 'limpieza-profunda') {
                typeColor = '#2196F3';
                typeIcon = '🧽';
                typeName = 'Limpieza Profunda';
            } else if (item.type === 'mantenimiento') {
                typeColor = '#FF9800';
                typeIcon = '🔧';
                typeName = 'Mantenimiento';
            } else {
                typeColor = '#4CAF50';
                typeIcon = '🧹';
                typeName = 'Limpieza Regular';
            }
            
            row.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
            row.style.border = `2px solid ${typeColor}`;
            row.style.borderRadius = '12px';
            row.style.padding = '1.2rem';
            row.style.marginBottom = '1rem';
            row.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            row.style.transition = 'transform 0.2s, box-shadow 0.2s';
            row.onmouseenter = () => { row.style.transform = 'translateY(-2px)'; row.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; };
            row.onmouseleave = () => { row.style.transform = 'translateY(0)'; row.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; };
            
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                    <div style="flex:1;">
                        <div style="display:inline-block; background:${typeColor}; color:white; padding:0.4rem 1rem; border-radius:20px; font-weight:600; font-size:0.95rem; margin-bottom:0.8rem;">
                            ${typeIcon} ${typeName}
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                            <span style="font-size:1.5rem;">📅</span>
                            <span style="color:#333; font-size:1rem; font-weight:500;">${dateStr}</span>
                        </div>
                        ${item.assignedEmployeeName ? `
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
                            <span style="font-size:1.3rem;">👤</span>
                            <span style="color:#555; font-size:0.95rem;">${item.assignedEmployeeName}</span>
                        </div>` : ''}
                        ${item.startTime ? `
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="color:#d32f2f; font-size:0.95rem; font-weight:600;">${formatShift(item.startTime)}</span>
                        </div>` : ''}
                        ${item.notes ? `
                        <div style="margin-top:0.6rem; padding:0.55rem 0.75rem; background:#e3f2fd; color:#0d47a1; border-radius:8px; font-size:0.9rem; display:flex; gap:0.4rem; align-items:flex-start;">
                            <span>🧾</span><span>${item.notes}</span>
                        </div>` : ''}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        <button class="btn-success" style="padding:0.6rem 1.2rem; font-size:0.9rem; border-radius:8px; white-space:nowrap;" onclick="toggleScheduleComplete('${item.id}')">✅ Completar</button>
                        <button class="btn-danger" style="padding:0.6rem 1.2rem; font-size:0.9rem; border-radius:8px;" onclick="removeScheduledDate('${item.id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
            list.appendChild(row);
        });
    }
    
    if (completed.length > 0) {
        const header = document.createElement('h4');
        header.textContent = '✅ Completadas';
        header.style.color = 'green';
        header.style.marginTop = '1rem';
        list.appendChild(header);
        
        completed.forEach(item => {
            const dateObj = parseLocalDate(item.date);
            const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const row = document.createElement('div');
            row.style.background = 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)';
            row.style.border = '2px solid #81C784';
            row.style.borderRadius = '12px';
            row.style.padding = '1.2rem';
            row.style.marginBottom = '1rem';
            row.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            row.style.opacity = '0.85';
            
            const typeIcon = item.type === 'limpieza' ? '🧹' : '🔧';
            const typeName = item.type === 'limpieza' ? 'Limpieza' : 'Mantenimiento';
            
            let completedTimeHtml = '';
            if (item.completedTime) {
                const completedDate = new Date(item.completedTime);
                const timeStr = completedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                completedTimeHtml = `
                <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; background:#4CAF50; color:white; padding:0.5rem 0.8rem; border-radius:8px; display:inline-flex;">
                    <span style="font-size:1.1rem;">✅</span>
                    <span style="font-size:0.9rem; font-weight:600;">Completado: ${timeStr}</span>
                </div>`;
            }
            
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                    <div style="flex:1;">
                        <div style="display:inline-block; background:#81C784; color:white; padding:0.4rem 1rem; border-radius:20px; font-weight:600; font-size:0.95rem; margin-bottom:0.8rem; text-decoration:line-through;">
                            ${typeIcon} ${typeName}
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                            <span style="font-size:1.3rem;">📅</span>
                            <span style="color:#666; font-size:0.95rem; text-decoration:line-through;">${dateStr}</span>
                        </div>
                        ${item.assignedEmployeeName ? `
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
                            <span style="font-size:1.1rem;">👤</span>
                            <span style="color:#777; font-size:0.9rem;">${item.assignedEmployeeName}</span>
                        </div>` : ''}
                        ${item.notes ? `
                        <div style="margin-top:0.4rem; padding:0.45rem 0.6rem; background:#e8f0fe; color:#1a237e; border-radius:6px; font-size:0.85rem; display:inline-flex; gap:0.35rem; align-items:center;">
                            <span>🧾</span><span>${item.notes}</span>
                        </div>` : ''}
                        ${completedTimeHtml}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        <button class="btn-warning" style="padding:0.6rem 1rem; font-size:0.9rem; border-radius:8px; white-space:nowrap;" onclick="toggleScheduleComplete('${item.id}')">↩️ Reactivar</button>
                        <button class="btn-danger" style="padding:0.6rem 1rem; font-size:0.9rem; border-radius:8px;" onclick="removeScheduledDate('${item.id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
            list.appendChild(row);
        });
    }
}

function renderEmployeeInventory() {
    const list = document.getElementById('employeeInventoryList');
    list.innerHTML = '';
    const prop = properties[currentUser.propertyId];
    
    Object.keys(INVENTORY_CATEGORIES).forEach(catKey => {
        const items = prop.inventory[catKey] || [];
        if (items.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'cleaning-section';
        
        const title = document.createElement('button');
        title.className = 'section-title-btn collapsed';
        title.innerHTML = `${INVENTORY_CATEGORIES[catKey].icon} ${INVENTORY_CATEGORIES[catKey].name} <small>(${items.length} items)</small>`;
        title.onclick = () => toggleSection(title);
        
        const content = document.createElement('div');
        content.className = 'section-content collapsed';
        
        const table = document.createElement('table');
        table.className = 'inventory-table';
        table.style.width = '100%';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Artículo</th>
                <th style="text-align:center;">Esperado</th>
                <th style="text-align:center;">Real</th>
                <th style="text-align:center;">Estado</th>
            </tr>
        `;
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        items.forEach(item => {
            const check = inventoryChecks.find(c => 
                c.propertyId === currentUser.propertyId && 
                c.categoryKey === catKey && 
                c.itemId === item.id
            );
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.name}</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:center;">
                    <input type="number" 
                           id="real_${catKey}_${item.id}" 
                           class="inventory-item-input" 
                           min="0" 
                           value="${check?.realQty ?? item.qty}" 
                           style="width:60px;"
                           onchange="updateInventoryCheck('${catKey}', '${item.id}', this.value)">
                </td>
                <td style="text-align:center;">
                    <div style="display:flex; gap:0.5rem; justify-content:center; align-items:center;">
                        <button class="btn-success ${check?.status === 'ok' ? 'active' : ''}" 
                                style="font-size:0.9rem; padding:0.3rem 0.5rem; ${check?.status === 'ok' ? 'opacity:1;' : 'opacity:0.5;'}" 
                                onclick="setInventoryStatus('${catKey}', '${item.id}', 'ok')">
                            ✓
                        </button>
                        <button class="btn-danger ${check?.status === 'missing' ? 'active' : ''}" 
                                style="font-size:0.9rem; padding:0.3rem 0.5rem; ${check?.status === 'missing' ? 'opacity:1;' : 'opacity:0.5;'}" 
                                onclick="setInventoryStatus('${catKey}', '${item.id}', 'missing')">
                            ✗
                        </button>
                    </div>
                    ${check?.status === 'missing' ? `
                        <div style="margin-top:0.5rem;">
                            <textarea id="comment_${catKey}_${item.id}" 
                                      placeholder="Comentario (falta/roto/dañado)" 
                                      style="width:100%; padding:0.3rem; border:1px solid var(--border-color); border-radius:4px; font-size:0.85rem;"
                                      onchange="updateInventoryComment('${catKey}', '${item.id}', this.value)">${check?.comment || ''}</textarea>
                        </div>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        content.appendChild(table);
        section.appendChild(title);
        section.appendChild(content);
        list.appendChild(section);
    });
    
    if (!list.innerHTML) list.innerHTML = '<p style="color:#777;">Inventario vacío</p>';
}

// Funciones de verificación de inventario por empleados
function updateInventoryCheck(catKey, itemId, realQty) {
    const checkIndex = inventoryChecks.findIndex(c => 
        c.propertyId === currentUser.propertyId && 
        c.categoryKey === catKey && 
        c.itemId === itemId
    );
    
    const checkData = {
        id: checkIndex >= 0 ? inventoryChecks[checkIndex].id : `check_${Date.now()}`,
        propertyId: currentUser.propertyId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: currentUser.staffId,
        employeeName: currentUser.name,
        realQty: parseInt(realQty, 10) || 0,
        status: inventoryChecks[checkIndex]?.status || 'pending',
        comment: inventoryChecks[checkIndex]?.comment || '',
        checkDate: new Date().toISOString()
    };
    
    if (checkIndex >= 0) {
        inventoryChecks[checkIndex] = checkData;
    } else {
        inventoryChecks.push(checkData);
    }
    
    saveData();
}

function setInventoryStatus(catKey, itemId, status) {
    const checkIndex = inventoryChecks.findIndex(c => 
        c.propertyId === currentUser.propertyId && 
        c.categoryKey === catKey && 
        c.itemId === itemId
    );
    
    const realQtyInput = document.getElementById(`real_${catKey}_${itemId}`);
    const realQty = realQtyInput ? parseInt(realQtyInput.value, 10) : 0;
    
    const checkData = {
        id: checkIndex >= 0 ? inventoryChecks[checkIndex].id : `check_${Date.now()}`,
        propertyId: currentUser.propertyId,
        categoryKey: catKey,
        itemId: itemId,
        employeeId: currentUser.staffId,
        employeeName: currentUser.name,
        realQty: realQty,
        status: status,
        comment: inventoryChecks[checkIndex]?.comment || '',
        checkDate: new Date().toISOString()
    };
    
    if (checkIndex >= 0) {
        inventoryChecks[checkIndex] = checkData;
    } else {
        inventoryChecks.push(checkData);
    }
    
    saveData();
    renderEmployeeInventory();
}

function updateInventoryComment(catKey, itemId, comment) {
    const checkIndex = inventoryChecks.findIndex(c => 
        c.propertyId === currentUser.propertyId && 
        c.categoryKey === catKey && 
        c.itemId === itemId
    );
    
    if (checkIndex >= 0) {
        inventoryChecks[checkIndex].comment = comment;
        inventoryChecks[checkIndex].checkDate = new Date().toISOString();
        saveData();
    }
}

function markInventoryCheckAsResolved(checkId) {
    const check = inventoryChecks.find(c => c.id === checkId);
    if (!check) return;
    
    const newComment = prompt('¿Qué se hizo para resolver? (comprar, reparar, etc.)', check.comment || 'Comprado/Reparado');
    if (newComment === null) return;
    
    check.status = 'resolved';
    check.comment = newComment;
    check.checkDate = new Date().toISOString();
    
    saveData();
    renderInventoryChecks();
    renderManagerInventoryChecks();
}

function editInventoryCheckComment(checkId) {
    const check = inventoryChecks.find(c => c.id === checkId);
    if (!check) return;
    
    const newComment = prompt('Editar comentario:', check.comment || '');
    if (newComment === null) return;
    
    check.comment = newComment;
    check.checkDate = new Date().toISOString();
    
    saveData();
    renderInventoryChecks();
    renderManagerInventoryChecks();
}

function renderEmployeeTasks() {
    const container = document.getElementById('employeeTasksList');
    container.innerHTML = '';
    
    // Obtener información del staff
    const prop = properties[currentUser.propertyId];
    const currentStaff = prop?.staff?.find(s => s.id === currentUser.staffId);
    const assignmentType = currentStaff?.assignmentType;
    const isEpic = prop?.name === 'EPIC D1';
    
    // Determinar cómo filtrar las tareas
    let roleFilter = null;
    
    if (isEpic) {
        // Para EPIC D1, no usar roleFilter inicial, filtraremos después por assignmentType
        roleFilter = null;
    } else {
        // Para otras propiedades, usar el role para filtrar
        roleFilter = currentUser.role;
    }
    
    const tasksBySection = getTasksBySection(currentUser.propertyId, roleFilter);
    
    // Filtrar por assignmentType para EPIC D1, o por role para otras propiedades
    if (assignmentType && assignmentType !== 'ambas') {
        const filteredBySection = {};
        Object.keys(tasksBySection).forEach(sectionKey => {
            const isMaintenance = isMaintenanceSection(sectionKey);
            const shouldInclude = (assignmentType === 'mantenimiento' && isMaintenance) ||
                                   (assignmentType === 'limpieza' && !isMaintenance);
            if (shouldInclude) {
                filteredBySection[sectionKey] = tasksBySection[sectionKey];
            }
        });
        // Reemplazar tasksBySection con el filtrado
        Object.keys(tasksBySection).forEach(key => delete tasksBySection[key]);
        Object.assign(tasksBySection, filteredBySection);
    } else if (!isEpic && currentUser.role === 'maintenance') {
        // Para propiedades no-EPIC, si es maintenance, solo mostrar tareas de mantenimiento
        const filteredBySection = {};
        Object.keys(tasksBySection).forEach(sectionKey => {
            const isMaintenance = isMaintenanceSection(sectionKey);
            if (isMaintenance) {
                filteredBySection[sectionKey] = tasksBySection[sectionKey];
            }
        });
        Object.keys(tasksBySection).forEach(key => delete tasksBySection[key]);
        Object.assign(tasksBySection, filteredBySection);
    }
    
    if (Object.keys(tasksBySection).length === 0) {
        container.innerHTML = '<p style="color:#777;">No hay tareas</p>';
        return;
    }
    Object.keys(tasksBySection).forEach(sectionKey => {
        const section = tasksBySection[sectionKey];
        const pendingTasks = section.tasks.filter(t => !t.completed && !t.verified);
        const completedTasks = section.tasks.filter(t => t.completed && !t.verified);
        const verifiedTasks = section.tasks.filter(t => t.verified);
        
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'cleaning-section';
        const title = document.createElement('button');
        title.className = 'section-title-btn collapsed';
        title.innerHTML = `${section.icon} ${section.name} <small>(⏳${pendingTasks.length} | ✅${completedTasks.length} | ✔️${verifiedTasks.length})</small>`;
        title.onclick = () => toggleSection(title);
        const content = document.createElement('div');
        content.className = 'section-content collapsed';
        
        // Agrupar por subsección si existe
        if (section.hasSubsections) {
            const subsectionGroups = {};
            section.tasks.forEach(task => {
                const subTitle = task.subsectionTitle || 'General';
                if (!subsectionGroups[subTitle]) {
                    subsectionGroups[subTitle] = { pending: [], completed: [], verified: [] };
                }
                if (!task.completed && !task.verified) {
                    subsectionGroups[subTitle].pending.push(task);
                } else if (task.completed && !task.verified) {
                    subsectionGroups[subTitle].completed.push(task);
                } else if (task.verified) {
                    subsectionGroups[subTitle].verified.push(task);
                }
            });
            
            // Renderizar cada subsección
            Object.keys(subsectionGroups).forEach(subTitle => {
                const subGroup = subsectionGroups[subTitle];
                const subSection = document.createElement('div');
                subSection.style.marginTop = '1rem';
                
                const subHeader = document.createElement('h5');
                subHeader.textContent = subTitle;
                subHeader.style.color = 'var(--accent-color)';
                subHeader.style.marginBottom = '0.5rem';
                subHeader.style.borderBottom = '1px solid var(--bg-secondary)';
                subHeader.style.paddingBottom = '0.25rem';
                subSection.appendChild(subHeader);
                
                // Tareas pendientes
                subGroup.pending.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.innerHTML = `
                        <div>
                            <span style="color:var(--accent-color); font-weight:600;">⏳</span>
                            <span>${task.taskText}</span>
                        </div>
                        <div>
                            <button class="btn-success" onclick="updateTaskStatus('${task.id}', true)" style="font-size:0.8rem; padding:0.2rem 0.4rem;">✅ Completado</button>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                // Tareas completadas
                subGroup.completed.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.innerHTML = `
                        <div>
                            <span style="color:green; font-weight:600;">✅</span>
                            <span style="text-decoration:line-through;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:green; font-weight:600; font-size:0.85rem;">✅ Esperando verificación</span>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                // Tareas verificadas
                subGroup.verified.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.style.opacity = '0.6';
                    row.innerHTML = `
                        <div>
                            <span style="color:#666; font-weight:600;">✔️</span>
                            <span style="text-decoration:line-through; color:#666;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:#666; font-size:0.85rem;">Cerrada</span>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                content.appendChild(subSection);
            });
        } else {
            // Renderizar sin subsecciones (estructura plana)
            // Pending tasks
            if (pendingTasks.length > 0) {
                const pendingHeader = document.createElement('h4');
                pendingHeader.textContent = '⏳ Pendientes';
                pendingHeader.style.color = 'var(--accent-color)';
                pendingHeader.style.marginTop = '0.5rem';
                content.appendChild(pendingHeader);
                pendingTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.innerHTML = `
                        <div>
                            <span style="color:var(--accent-color); font-weight:600;">⏳</span>
                            <span>${task.taskText}</span>
                        </div>
                        <div>
                            <button class="btn-success" onclick="updateTaskStatus('${task.id}', true)">✅ Completado</button>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
            
            // Completed tasks (waiting verification)
            if (completedTasks.length > 0) {
                const completedHeader = document.createElement('h4');
                completedHeader.textContent = '✅ Completadas (Esperando Verificación)';
                completedHeader.style.color = 'green';
                completedHeader.style.marginTop = '1rem';
                content.appendChild(completedHeader);
                completedTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.innerHTML = `
                        <div>
                            <span style="color:green; font-weight:600;">✅</span>
                            <span style="text-decoration:line-through;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:green; font-weight:600;">✅ Esperando verificación</span>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
            
            // Verified tasks (closed)
            if (verifiedTasks.length > 0) {
                const verifiedHeader = document.createElement('h4');
                verifiedHeader.textContent = '✔️ Verificadas y Cerradas';
                verifiedHeader.style.color = '#666';
                verifiedHeader.style.marginTop = '1rem';
                content.appendChild(verifiedHeader);
                verifiedTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.opacity = '0.6';
                    row.innerHTML = `
                        <div>
                            <span style="color:#666; font-weight:600;">✔️</span>
                            <span style="text-decoration:line-through; color:#666;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:#666; font-size:0.9rem;">Cerrada</span>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
        }
        
        sectionDiv.appendChild(title);
        sectionDiv.appendChild(content);
        container.appendChild(sectionDiv);
    });
}

function renderManagerInventory() {
    const list = document.getElementById('managerInventoryList');
    list.innerHTML = '';
    const prop = properties[currentUser.propertyId];
    Object.keys(INVENTORY_CATEGORIES).forEach(catKey => {
        const items = prop.inventory[catKey] || [];
        if (items.length === 0) return;
        const section = document.createElement('div');
        section.className = 'cleaning-section';
        const title = document.createElement('button');
        title.className = 'section-title-btn';
        title.innerHTML = `${INVENTORY_CATEGORIES[catKey].icon} ${INVENTORY_CATEGORIES[catKey].name} <small>(${items.length} items)</small>`;
        title.onclick = () => toggleSection(title);
        const content = document.createElement('div');
        content.className = 'section-content';
        const table = document.createElement('table');
        table.className = 'inventory-table';
        table.innerHTML = `
            <thead><tr><th>Artículo</th><th style="text-align:center;">Cantidad</th><th style="text-align:center;">Acción</th></tr></thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td style="text-align:center;">
                            <input type="number" class="inventory-item-input" min="0" value="${item.qty}" onchange="updateInventoryItemQty('${prop.id}','${catKey}','${item.id}', this.value)" />
                        </td>
                        <td style="text-align:center;">
                            <button class="btn-danger" style="font-size:0.8rem; padding:0.2rem 0.5rem;" onclick="removeInventoryItem('${prop.id}','${catKey}','${item.id}')">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        content.appendChild(table);
        section.appendChild(title);
        section.appendChild(content);
        list.appendChild(section);
    });
}

function renderManagerTasks() {
    const list = document.getElementById('managerTasksList');
    list.innerHTML = '';
    const tasksBySection = getTasksBySection(currentUser.propertyId, null);
    if (Object.keys(tasksBySection).length === 0) {
        list.innerHTML = '<p style="color:#777;">No hay tareas</p>';
        return;
    }
    Object.keys(tasksBySection).forEach(sectionKey => {
        const section = tasksBySection[sectionKey];
        const pendingTasks = section.tasks.filter(t => !t.completed && !t.verified);
        const completedTasks = section.tasks.filter(t => t.completed && !t.verified);
        const verifiedTasks = section.tasks.filter(t => t.verified);
        
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'cleaning-section';
        const title = document.createElement('button');
        title.className = 'section-title-btn collapsed';
        title.innerHTML = `${section.icon} ${section.name} <small>(⏳${pendingTasks.length} | ✅${completedTasks.length} | ✔️${verifiedTasks.length})</small>`;
        title.onclick = () => toggleSection(title);
        const content = document.createElement('div');
        content.className = 'section-content collapsed';
        
        // Agrupar por subsección si existe
        if (section.hasSubsections) {
            const subsectionGroups = {};
            section.tasks.forEach(task => {
                const subTitle = task.subsectionTitle || 'General';
                if (!subsectionGroups[subTitle]) {
                    subsectionGroups[subTitle] = { pending: [], completed: [], verified: [] };
                }
                if (!task.completed && !task.verified) {
                    subsectionGroups[subTitle].pending.push(task);
                } else if (task.completed && !task.verified) {
                    subsectionGroups[subTitle].completed.push(task);
                } else if (task.verified) {
                    subsectionGroups[subTitle].verified.push(task);
                }
            });
            
            // Renderizar cada subsección con el nuevo diseño
            Object.keys(subsectionGroups).forEach(subTitle => {
                const subGroup = subsectionGroups[subTitle];
                const subSection = document.createElement('div');
                subSection.style.marginTop = '1rem';
                
                const subHeader = document.createElement('h5');
                subHeader.textContent = subTitle;
                subHeader.style.color = 'var(--accent-color)';
                subHeader.style.marginBottom = '0.5rem';
                subHeader.style.borderBottom = '1px solid var(--bg-secondary)';
                subHeader.style.paddingBottom = '0.25rem';
                subSection.appendChild(subHeader);
                
                // Tareas pendientes
                subGroup.pending.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.innerHTML = `
                        <div>
                            <span style="color:var(--accent-color); font-weight:600;">⏳</span>
                            <span>${task.taskText}</span>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <span style="color:#999; font-size:0.85rem;">Esperando empleado...</span>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')" style="font-size:0.8rem; padding:0.2rem 0.4rem;">🗑️</button>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                // Tareas completadas
                subGroup.completed.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.innerHTML = `
                        <div>
                            <span style="color:green; font-weight:600;">✅</span>
                            <span style="text-decoration:line-through;">${task.taskText}</span>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn-success" onclick="verifyAndCloseTask('${task.id}')" style="font-size:0.8rem; padding:0.2rem 0.4rem;">✔️ Cerrar</button>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')" style="font-size:0.8rem; padding:0.2rem 0.4rem;">🗑️</button>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                // Tareas verificadas
                subGroup.verified.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '0.5rem';
                    row.style.opacity = '0.6';
                    row.innerHTML = `
                        <div>
                            <span style="color:#666; font-weight:600;">✔️</span>
                            <span style="text-decoration:line-through; color:#666;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:#666; font-size:0.85rem;">Cerrada</span>
                        </div>
                    `;
                    subSection.appendChild(row);
                });
                
                content.appendChild(subSection);
            });
        } else {
            // Renderizar sin subsecciones
            if (pendingTasks.length > 0) {
                const pendingHeader = document.createElement('h4');
                pendingHeader.textContent = '⏳ Pendientes';
                pendingHeader.style.color = 'var(--accent-color)';
                pendingHeader.style.marginTop = '0.5rem';
                content.appendChild(pendingHeader);
                pendingTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.innerHTML = `
                        <div>
                            <span style="color:var(--accent-color); font-weight:600;">⏳</span>
                            <span>${task.taskText}</span>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <span style="color:#999;">Esperando empleado...</span>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')">🗑️</button>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
            
            if (completedTasks.length > 0) {
                const completedHeader = document.createElement('h4');
                completedHeader.textContent = '✅ Completadas (Verificar)';
                completedHeader.style.color = 'green';
                completedHeader.style.marginTop = '1rem';
                content.appendChild(completedHeader);
                completedTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.innerHTML = `
                        <div>
                            <span style="color:green; font-weight:600;">✅</span>
                            <span style="text-decoration:line-through;">${task.taskText}</span>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn-success" onclick="verifyAndCloseTask('${task.id}')">✔️ Verificar y Cerrar</button>
                            <button class="btn-danger" onclick="deleteCleaningTask('${task.id}')">🗑️</button>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
            
            if (verifiedTasks.length > 0) {
                const verifiedHeader = document.createElement('h4');
                verifiedHeader.textContent = '✔️ Verificadas y Cerradas';
                verifiedHeader.style.color = '#666';
                verifiedHeader.style.marginTop = '1rem';
                content.appendChild(verifiedHeader);
                verifiedTasks.forEach(task => {
                    const row = document.createElement('div');
                    row.className = 'task-item';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.opacity = '0.6';
                    row.innerHTML = `
                        <div>
                            <span style="color:#666; font-weight:600;">✔️</span>
                            <span style="text-decoration:line-through; color:#666;">${task.taskText}</span>
                        </div>
                        <div>
                            <span style="color:#666; font-size:0.9rem;">Cerrada</span>
                        </div>
                    `;
                    content.appendChild(row);
                });
            }
        }
        
        sectionDiv.appendChild(title);
        sectionDiv.appendChild(content);
        list.appendChild(sectionDiv);
    });
}

// Utilidades UI
function toggleSection(btn) {
    btn.classList.toggle('collapsed');
    const content = btn.nextElementSibling;
    if (content) content.classList.toggle('collapsed');
}

function getOpenSections() {
    const openSections = [];
    document.querySelectorAll('.section-title-btn:not(.collapsed)').forEach(btn => {
        const text = btn.textContent.trim();
        openSections.push(text);
    });
    return openSections;
}

function restoreOpenSections(openSections) {
    if (!openSections || openSections.length === 0) return;
    setTimeout(() => {
        document.querySelectorAll('.section-title-btn').forEach(btn => {
            const text = btn.textContent.trim();
            const shouldBeOpen = openSections.some(openText => text.includes(openText.split('<')[0].trim()));
            if (shouldBeOpen && btn.classList.contains('collapsed')) {
                btn.classList.remove('collapsed');
                const content = btn.nextElementSibling;
                if (content) content.classList.remove('collapsed');
            }
        });
    }, 0);
}

// Tema
function toggleTheme() {
    window.toggleTheme = toggleTheme;
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('airbnbmanager_theme', isDark ? 'dark' : 'light');
    updateThemeButtonText();
}

function loadTheme() {
    const theme = localStorage.getItem('airbnbmanager_theme');
    if (theme === 'dark') document.body.classList.add('dark-theme');
}

function updateThemeButtonText() {
    const isDark = document.body.classList.contains('dark-theme');
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.textContent = isDark ? '☀️ Tema Claro' : '🌙 Tema Oscuro';
    });
}

// Inicialización
function populateCategorySelect() {
    const select = document.getElementById('inventoryCategorySelect');
    select.innerHTML = '<option value="">Categoría</option>';
    Object.keys(INVENTORY_CATEGORIES).forEach(catKey => {
        const opt = document.createElement('option');
        opt.value = catKey;
        opt.textContent = INVENTORY_CATEGORIES[catKey].name;
        select.appendChild(opt);
    });
}

function initializeApp() {
    loadData();
    loadPropertiesFromFirestore();
    // Restaurar sesión antes de definir la propiedad seleccionada
    const session = localStorage.getItem('airbnbmanager_session');
    if (session) {
        try {
            const { type, user, selectedProperty: savedProp } = JSON.parse(session);
            currentUserType = type;
            currentUser = user;
            if (type === 'owner' && savedProp) {
                selectedProperty = savedProp;
            } else if ((type === 'manager' || type === 'employee') && user && user.propertyId) {
                selectedProperty = user.propertyId;
                // Actualizar lastLoginTime del staff al restaurar sesión
                const prop = properties[user.propertyId];
                if (prop && prop.staff) {
                    const staff = prop.staff.find(s => s.id === user.staffId);
                    if (staff) {
                        staff.lastLoginTime = new Date();
                    }
                }
            }
        } catch (e) {
            console.error('Error restoring session', e);
            localStorage.removeItem('airbnbmanager_session');
        }
    }
    if (Object.keys(properties).length === 0) {
        // Crear propiedades iniciales
        ensureEpicPropertyExists();
        ensureTorreMagnaPropertyExists();
    } else {
        Object.values(properties).forEach(normalizeInventory);
        ensureEpicPropertyExists();
        ensureTorreMagnaPropertyExists();
    }
    
    // Asegurar que los usuarios estén en sus propiedades
    ensureEpicStaffExists();
    ensureTorreMagnaStaffExists();
    ensureTorreMagnaMaintenanceTasks();

    // Re-sembrar tareas si alguna propiedad quedó sin tareas luego de limpiar datos
    Object.values(properties).forEach(prop => {
        ensureCleaningTasksSeededForProperty(prop.id, prop.name);
    });

    if (!selectedProperty) {
        selectedProperty = Object.keys(properties)[0] || null;
    }
    renderProperties();
    refreshOwnerContent();
    populateCategorySelect();
    saveData();

    // Si ya había sesión, mostrar directamente la vista correspondiente sin mostrar login
    if (currentUserType === 'owner') {
        showOwnerView();
    } else if (currentUserType === 'manager') {
        showManagerView();
    } else if (currentUserType === 'employee') {
        showEmployeeView();
    } else {
        // No hay sesión, mostrar login y actualizar formulario
        updateLoginForm();
        document.getElementById('loginView').style.display = 'block';
        document.getElementById('ownerView').style.display = 'none';
        document.getElementById('employeeView').style.display = 'none';
        document.getElementById('managerView').style.display = 'none';
    }
}

function resetApp() {
    if (confirm('⚠️ Esto eliminará todos los datos y creará casas de demostración nuevas. ¿Continuar?')) {
        localStorage.clear();
        location.reload();
    }
}

// ==================== CLOUD SYNCHRONIZATION ====================

// Generar hash simple de los datos para detectar cambios
function generateDataHash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// Obtener todos los datos actuales
function getAllData() {
    return {
        properties: properties,
        cleaningTasks: cleaningTasks,
        purchaseInventory: purchaseInventory,
        scheduledDates: scheduledDates,
        purchaseHistory: purchaseHistory,
        purchaseRequests: purchaseRequests,
        inventoryChecks: inventoryChecks,
        timestamp: new Date().getTime()
    };
}

// Sincronizar datos a la nube
async function syncToCloud() {
    if (syncInProgress) return;
    
    syncInProgress = true;
    showSyncIndicator();
    const currentData = getAllData();
    const dataHash = generateDataHash(currentData);
    
    // Si no ha cambiado nada, no sincronizar
    if (dataHash === lastKnownDataHash) {
        syncInProgress = false;
        hideSyncIndicator();
        return;
    }
    
    try {
        const syncData = {
            ...currentData,
            syncId: CLOUD_SYNC_CONFIG.gistId,
            lastModified: new Date().toISOString()
        };
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(STORAGE_KEYS.cloudSync, JSON.stringify(syncData));
        lastKnownDataHash = dataHash;
        
        console.log('✅ Datos sincronizados localmente:', new Date().toLocaleTimeString());
        
        // Notificar a otros tabs/ventanas abiertas
        broadcastDataChange();
        
    } catch (error) {
        console.error('Error en sincronización:', error);
    } finally {
        syncInProgress = false;
        hideSyncIndicator();
    }
}

// Sincronizar datos desde la nube
async function syncFromCloud() {
    if (syncInProgress) return;
    
    try {
        const storedSync = localStorage.getItem(STORAGE_KEYS.cloudSync);
        if (!storedSync) return;
        
        const cloudData = JSON.parse(storedSync);
        const cloudHash = generateDataHash(cloudData);
        
        // Si los datos de la nube son diferentes, actualizar
        if (cloudHash !== lastKnownDataHash) {
            properties = cloudData.properties || {};
            cleaningTasks = cloudData.cleaningTasks || [];
            purchaseInventory = cloudData.purchaseInventory || [];
            scheduledDates = cloudData.scheduledDates || [];
            purchaseHistory = cloudData.purchaseHistory || [];
            purchaseRequests = cloudData.purchaseRequests || [];
            inventoryChecks = cloudData.inventoryChecks || [];
            
            lastKnownDataHash = cloudHash;
            
            // Guardar en localStorage individual
            saveDataWithoutSync();
            
            // Actualizar UI si hay usuario logueado
            if (currentUser) {
                refreshAllViews();
            }
            
            console.log('🔄 Datos actualizados desde la nube:', new Date().toLocaleTimeString());
        }
    } catch (error) {
        console.error('Error al sincronizar desde la nube:', error);
    }
}

// Guardar sin triggear sincronización (para evitar loops)
function saveDataWithoutSync() {
    localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(properties));
    localStorage.setItem(STORAGE_KEYS.cleaningTasks, JSON.stringify(cleaningTasks));
    localStorage.setItem(STORAGE_KEYS.purchaseInventory, JSON.stringify(purchaseInventory));
    localStorage.setItem(STORAGE_KEYS.scheduledDates, JSON.stringify(scheduledDates));
    localStorage.setItem(STORAGE_KEYS.purchaseHistory, JSON.stringify(purchaseHistory));
    localStorage.setItem(STORAGE_KEYS.purchaseRequests, JSON.stringify(purchaseRequests));
    localStorage.setItem(STORAGE_KEYS.inventoryChecks, JSON.stringify(inventoryChecks));
    localStorage.setItem(STORAGE_KEYS.deletedInventoryChecks, JSON.stringify(deletedInventoryChecks));
    localStorage.setItem(STORAGE_KEYS.workDayNotifications, JSON.stringify(workDayNotifications));
}

// Refrescar todas las vistas según el tipo de usuario
function refreshAllViews() {
    if (currentUserType === 'owner') {
        renderProperties();
        loadCleaningTasks();
        loadPurchaseInventory();
        loadScheduledDates();
        loadPurchaseHistory();
        loadInventoryChecks();
    } else if (currentUserType === 'manager') {
        loadManagerData();
    } else if (currentUserType === 'employee') {
        loadEmployeeData();
    }
}

// Broadcast cambios a otros tabs/ventanas
function broadcastDataChange() {
    // Usar storage event para notificar a otros tabs
    localStorage.setItem('airbnbmanager_data_update', Date.now().toString());
}

// Escuchar cambios de otros tabs/ventanas
window.addEventListener('storage', function(e) {
    if (e.key === 'airbnbmanager_data_update' || e.key === STORAGE_KEYS.cloudSync) {
        // Otro tab actualizó los datos, sincronizar
        setTimeout(() => {
            syncFromCloud();
        }, 500);
    }
});

// Iniciar sincronización automática
function startAutoSync() {
    if (!CLOUD_SYNC_CONFIG.enabled) return;
    
    // Sincronizar inmediatamente
    syncFromCloud();
    
    // Configurar sincronización periódica
    setInterval(() => {
        if (!syncInProgress) {
            syncFromCloud();
        }
    }, CLOUD_SYNC_CONFIG.checkInterval);
    
    console.log('🔄 Sincronización automática iniciada');
}

// Iniciar sincronización cuando se carga la página
window.addEventListener('load', function() {
    setTimeout(() => {
        startAutoSync();
    }, 2000);
});

// Mostrar/ocultar indicador de sincronización
function showSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
        indicator.style.display = 'inline-block';
    }
}

function hideSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 1000);
    }
}


window.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    updateThemeButtonText();
    initializeApp();
});

// --- FIN DEL ARCHIVO ---
// Exponer funciones globales al final para asegurar disponibilidad
window.updateLoginForm = updateLoginForm;
window.login = login;
window.toggleTheme = toggleTheme;
