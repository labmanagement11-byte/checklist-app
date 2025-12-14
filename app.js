// AirbnbManager - lógica principal
// Estado global
const OWNER_CREDENTIALS = {
    username: 'jonathan',
    password: 'galindo123',
    name: 'Jonathan Galindo'
};

let currentUser = null;
let currentUserType = null; // 'owner' | 'manager' | 'employee'
let selectedProperty = null;
let properties = {};
let cleaningTasks = [];
let purchaseInventory = []; // Inventario de compra
let scheduledDates = []; // Fechas programadas de limpieza/mantenimiento
let purchaseHistory = []; // Registro de compras con fechas
let purchaseRequests = []; // Solicitudes de compra por empleados
let inventoryChecks = []; // Verificaciones de inventario por empleados
let deletedInventoryChecks = []; // Reportes de inventario eliminados (con respaldo de 3 días)
let workDayNotifications = []; // Notificaciones de días cerrados con pendientes
let savedOwnerCreds = null;
let savedStaffCreds = null; // { manager: {username,password}, employee: {username,password} }

const STORAGE_KEYS = {
    properties: 'airbnbmanager_properties',
    cleaningTasks: 'airbnbmanager_tasks',
    purchaseInventory: 'airbnbmanager_purchase',
    scheduledDates: 'airbnbmanager_schedule',
    purchaseHistory: 'airbnbmanager_purchase_history',
    purchaseRequests: 'airbnbmanager_purchase_requests',
    inventoryChecks: 'airbnbmanager_inventory_checks',
    deletedInventoryChecks: 'airbnbmanager_deleted_inventory_checks',
    workDayNotifications: 'airbnbmanager_workday_notifications',
    savedOwnerCreds: 'airbnbmanager_saved_owner_creds',
    savedStaffCreds: 'airbnbmanager_saved_staff_creds',
    cloudSync: 'airbnbmanager_cloud_sync',
    lastSyncTime: 'airbnbmanager_last_sync_time'
};

// Cloud Sync Configuration
const CLOUD_SYNC_CONFIG = {
    enabled: true,
    gistId: 'limpieza360pro_shared_data', // ID único para todos los dispositivos
    checkInterval: 8000, // Verificar cada 8 segundos
    autoSync: true,
    syncUrl: 'https://api.jsonstorage.net/v1/json/limpieza360pro-sync/data'
};

let syncInProgress = false;
let lastKnownDataHash = null;

// Catálogos base
const INVENTORY_CATEGORIES = {
    cocina: {
        name: 'Cocina',
        icon: '🍳',
        items: [
            'Tenedores', 'Cuchillos', 'Cucharas', 'Platos', 'Vasos', 'Copas',
            'Sartenes', 'Ollas', 'Cafetera', 'Tazas', 'Cucharón', 'Espumadera',
            'Tabla de picar', 'Destapador', 'Microondas', 'Licuadora', 'Tetera',
            'Bowls', 'Colador', 'Abrelatas', 'Sacacorchos', 'Bandeja', 'Pyrex',
            'Rallador', 'Pelador', 'Pinzas cocina', 'Espátula'
        ]
    },
    habitaciones: {
        name: 'Habitaciones',
        icon: '🛏️',
        items: [
            'Almohadas', 'Sabanas', 'Colchas', 'Mantas', 'Cortinas', 'Lámparas',
            'Percheros', 'Mesas de noche', 'Espejo', 'Cobijas', 'Protector de colchón',
            'Cojines decorativos', 'Despertador', 'Ganchos ropa'
        ]
    },
    banos: {
        name: 'Baños',
        icon: '🚿',
        items: [
            'Toallas', 'Toallones', 'Jabón', 'Champú', 'Papel higiénico',
            'Espejo', 'Tapete', 'Cortina de ducha', 'Accesorios baño',
            'Acondicionador', 'Jabón líquido', 'Cepillo de baño', 'Destapador',
            'Canasta basura', 'Ambientador', 'Escobilla inodoro'
        ]
    },
    sala: {
        name: 'Sala',
        icon: '🛋️',
        items: [
            'Sofás', 'Mesas de centro', 'Sillas', 'Lámparas', 'Cuadros',
            'Cortinas', 'Cojines', 'Alfombras', 'Control remoto TV',
            'Cobijas decorativas', 'Jarrones', 'Plantas decorativas'
        ]
    },
    comedor: {
        name: 'Comedor',
        icon: '🍽️',
        items: [
            'Sillas', 'Mesa', 'Mantel', 'Servilletas', 'Lámparas', 'Cortinas', 
            'Decoración', 'Individuales', 'Salero y pimentero', 'Centro de mesa',
            'Servilletero'
        ]
    },
    lavanderia: {
        name: 'Lavandería',
        icon: '🧺',
        items: [
            'Detergente', 'Suavizante', 'Cloro', 'Cesto ropa', 'Escobilla', 'Trapos',
            'Jabón en polvo', 'Jabón líquido', 'Quitamanchas', 'Perchas',
            'Tendedero', 'Pinzas ropa', 'Blanqueador'
        ]
    },
    limpieza: {
        name: 'Implementos de Limpieza',
        icon: '🧹',
        items: [
            'Escoba', 'Trapeador', 'Recogedor', 'Balde', 'Desinfectante', 'Limpiador multiusos',
            'Limpiavidrios', 'Esponjas', 'Paños microfibra', 'Guantes', 'Cepillos',
            'Bolsas de basura', 'Lustramuebles', 'Ambientador', 'Papel toalla',
            'Cloro', 'Creolina', 'Jabón líquido para pisos', 'Alcohol',
            'Plumero', 'Escobillón', 'Atomizador', 'Cera para pisos'
        ]
    },
    bbq: {
        name: 'Zona BBQ',
        icon: '🔥',
        items: [
            'Parrilla', 'Pinzas largas', 'Espátula parrilla', 'Cepillo limpieza parrilla',
            'Carbón', 'Encendedor', 'Guantes térmicos', 'Bandeja aluminio',
            'Platos desechables', 'Vasos plásticos', 'Servilletas', 'Mantel',
            'Cubiertos desechables', 'Sillas plegables', 'Mesa auxiliar',
            'Bolsas basura grandes', 'Papel aluminio', 'Encendedor largo'
        ]
    },
    pasillo: {
        name: 'Pasillo',
        icon: '🚪',
        items: [
            'Alfombra pasillo', 'Lámpara pasillo', 'Cuadros decorativos', 'Espejo',
            'Consola o mueble', 'Perchero', 'Plantas decorativas', 'Macetas',
            'Paragüero', 'Zapatero', 'Cortinas', 'Ambientador', 'Reloj pared',
            'Sensor movimiento', 'Portarretratos'
        ]
    },
    terraza: {
        name: 'Terraza',
        icon: '🌿',
        items: [
            'Mesa exterior', 'Sillas exterior', 'Sombrilla', 'Cojines exteriores',
            'Plantas en macetas', 'Maceteros', 'Regadera', 'Manguera',
            'Escoba exterior', 'Luces decorativas', 'Alfombra exterior',
            'Cenicero', 'Porta velas', 'Cubre sillas', 'Toldo', 'Ventilador exterior',
            'Calefactor exterior', 'Repelente mosquitos', 'Cortinas exteriores'
        ]
    },
    otras: {
        name: 'Otras áreas',
        icon: '📦',
        items: [
            'Extintores', 'Botiquín', 'Herramientas básicas', 'Linterna', 'Llaves', 'Cerraduras',
            'Pilas', 'Fósforos', 'Velas', 'Cinta adhesiva', 'Tijeras', 'Bombillos',
            'Cable extensión', 'Candados', 'Kit costura básico'
        ]
    }
};

const CLEANING_TASKS = {
    banos: {
        name: '🚿 Baños',
        icon: '🚿',
        tasks: [
            'Limpiar espejo', 'Limpiar lavamanos', 'Limpiar inodoro', 'Limpiar bañera/ducha',
            'Limpiar pisos', 'Secar superficies', 'Cambiar toallas', 'Vaciar basura', 'Reponer papel higiénico'
        ]
    },
    cocina: {
        name: 'Cocina',
        icon: '[cocina]',
        tasks: [
            'Revisar fugas de agua o gas y cerrar válvulas', 'Lavar vajilla, cubiertos y vasos',
            'Tomar foto de despensa y nevera', 'Verificar electrodomésticos', 'Limpiar mostrador',
            'Limpiar estufa', 'Limpiar microondas', 'Limpiar refrigerador', 'Limpiar fregadero',
            'Secar platos', 'Guardar platos', 'Limpiar pisos', 'Vaciar basura', 'Desinfectar superficies'
        ]
    },
    habitaciones: {
        name: 'Habitaciones',
        icon: '[habitaciones]',
        tasks: [
            'Cambiar sábanas y alinear almohadas', 'Hacer camas', 'Pasar aspiradora', 'Limpiar piso',
            'Quitar polvo muebles', 'Limpiar ventanas', 'Organizar closets', 'Vaciar basura', 'Rociar ambientador'
        ]
    },
    sala: {
        name: 'Sala',
        icon: '[sala]',
        tasks: [
            'Limpiar mesas y muebles', 'Pasar aspiradora', 'Limpiar sofás', 'Quitar polvo muebles',
            'Limpiar piso', 'Organizar cojines', 'Limpiar ventanas', 'Vaciar basura', 'Organizar revistas/libros'
        ]
    },
    comedor: {
        name: 'Comedor',
        icon: '[comedor]',
        tasks: ['Limpiar mesa', 'Limpiar sillas', 'Pasar aspiradora', 'Limpiar piso', 'Quitar polvo muebles', 'Limpiar ventanas', 'Organizar adornos', 'Vaciar basura']
    },
    entrada: {
        name: '🚪 Entrada/Recibidor',
        icon: '🚪',
        tasks: ['Barrer entrada', 'Limpiar pisos', 'Limpiar espejo', 'Organizar zapatos', 'Quitar polvo adornos', 'Limpiar puerta', 'Vaciar basura']
    },
    general: {
        name: '🧹 Tareas generales',
        icon: '🧹',
        tasks: ['Limpiar pasamanos', 'Limpiar puertas', 'Lavar pisos', 'Limpiar ventanas', 'Lavar ropa', 'Secar ropa', 'Planchar', 'Riego de plantas']
    }
};

// Tareas personalizadas por propiedad
const CUSTOM_TASKS = {
    'torre-magna-pi-limpieza': {
        name: '🧹 Limpieza - Torre Magna PI',
        icon: '🧹',
        sections: [
            {
                title: '🛏️ Área de la Cama',
                tasks: [
                    'Polvo y limpieza de mesas de noche, cajones y gabinetes',
                    'Limpieza interior/exterior de cajones de cama',
                    'Cambio y lavado de ropa de cama',
                    'Limpieza de cabecera, escritorio y silla',
                    'Limpieza de lámparas, switches y tomacorrientes',
                    'Pisos aspirados y trapeados'
                ]
            },
            {
                title: '📺 Área de TV y Sala',
                tasks: [
                    'Limpieza de TV (pantalla y soporte)',
                    'Limpieza de gabinete TV y cajones',
                    'Limpieza de sofá cama, cojines y cajones',
                    'Limpieza de mesa de centro',
                    'Limpieza de control remoto, sonido y lámparas',
                    'Cortinas y rieles (polvo)',
                    'Pisos aspirados y trapeados'
                ]
            },
            {
                title: '🍳 Cocina',
                tasks: [
                    'Limpieza exterior/interior de gabinetes',
                    'Limpieza de counter de granito',
                    'Lavaplatos, grifería y backsplash',
                    'Electrodomésticos (exterior/interior)',
                    'Lavadora (tambor, puerta, filtro)',
                    'Basurero limpio y con bolsa nueva',
                    'Pisos aspirados y trapeados'
                ]
            },
            {
                title: '🚿 Baño',
                tasks: [
                    'Lavamanos, grifería y gabinete',
                    'Inodoro (base, tapa, interior)',
                    'Regadera, vidrio y base de jabón',
                    'Espejos y accesorios',
                    'Toallas limpias y organizadas',
                    'Pisos desinfectados'
                ]
            },
            {
                title: '✅ General',
                tasks: [
                    'Puertas, marcos y manijas',
                    'Interruptores y tomacorrientes',
                    'Espejo del hall',
                    'Cuadros y decoración',
                    'Olores (ventilación)',
                    'Revisión final visual del apartamento'
                ]
            }
        ]
    },
    'torre-magna-pi-mantenimiento': {
        name: '🔧 Mantenimiento - Torre Magna PI',
        icon: '🔧',
        sections: [
            {
                title: '🛏️ Área de la Cama',
                tasks: [
                    'Cajones de mesas de noche (6)',
                    'Cajones de la cama (2)',
                    'Gabinetes encima de la cama (6)',
                    'Escritorio – gabinete 2 puertas',
                    'Puertas, bisagras y tiradores',
                    'Pintura en buen estado'
                ]
            },
            {
                title: '📺 Área de TV y Sala',
                tasks: [
                    'Televisor enciende y apaga',
                    'WiFi funcionando',
                    'Sistema de sonido estéreo',
                    'Lámpara detrás del TV',
                    'Gabinete TV – cajones y puerta',
                    'Caja fuerte abierta',
                    'Sofá cama y cajones',
                    'Soporte de maletero',
                    'Cortina eléctrica y control',
                    'Mesa de centro extensible',
                    'Gabinete de hielo – tapas',
                    'Soporte de vinos en pared'
                ]
            },
            {
                title: '🍳 Cocina',
                tasks: [
                    'Gabinete lavadora – 6 puertas',
                    'Gabinetes pared – 4 puertas',
                    'Gabinete counter – cajones y puertas',
                    'Counter de granito sin daños'
                ]
            },
            {
                title: '🚿 Baño y General',
                tasks: [
                    'Gabinete del calentador',
                    'Gabinete del lavamanos',
                    'Puerta de regadera en vidrio',
                    'Puerta del baño',
                    'Espejos',
                    'Cuadros en paredes',
                    'Llaves de agua',
                    'Regadera y base de jabón',
                    'Tapa de inodoro'
                ]
            }
        ]
    }
};

const EPIC_D1_TASKS = {
    'epic-d1-limpieza-regular': {
        name: '🧹 Limpieza Regular - EPIC D1',
        icon: '🧹',
        sections: [
            {
                title: '🏠 Limpieza General',
                tasks: [
                    'Barrer y trapear toda la casa',
                    'Quitar polvo de superficies y decoración con trapo húmedo',
                    'Limpiar televisores sin dejar marcas en pantalla',
                    'Revisar zócalos y esquinas que queden limpios',
                    'Retirar telarañas'
                ]
            },
            {
                title: '🛋️ Sala',
                tasks: [
                    'Limpiar todas las superficies de sala',
                    'Mover cojines del sofá y revisar suciedad u hormigas debajo',
                    'Organizar cojines y dejar sala ordenada'
                ]
            },
            {
                title: '🍽️ Comedor',
                tasks: [
                    'Limpiar mesa, sillas y superficies de comedor',
                    'Dejar el área limpia y ordenada'
                ]
            },
            {
                title: '🍳 Cocina',
                tasks: [
                    'Limpiar superficies y gabinetes por fuera y por dentro',
                    'Verificar gabinetes limpios, organizados y funcionales',
                    'Limpiar cafetera y su filtro',
                    'Verificar dispensador de jabón de loza lleno',
                    'Dejar toallas de cocina limpias disponibles',
                    'Limpiar microondas por dentro y por fuera',
                    'Limpiar el filtro de agua',
                    'Limpiar la nevera por dentro y por fuera (sin alimentos)',
                    'Lavar canecas de basura y colocar bolsas nuevas'
                ]
            },
            {
                title: '🚿 Baños',
                tasks: [
                    'Limpiar ducha: pisos y paredes',
                    'Limpiar divisiones de vidrio sin marcas',
                    'Limpiar espejo, sanitario y lavamanos con clorox',
                    'Lavar canecas de basura y colocar bolsas nuevas',
                    'Verificar toallas: máx 10 toallas blancas cuerpo en la casa, máx 4 toallas de mano (1 por baño)',
                    'Dejar rollo de papel higiénico nuevo instalado en cada baño',
                    'Dejar rollo extra en cuarto de lavado',
                    'Lavar y colocar tapetes de baño limpios'
                ]
            },
            {
                title: '🛏️ Habitaciones',
                tasks: [
                    'Revisar que cajones no tengan objetos',
                    'Lavar sábanas y hacer las camas correctamente',
                    'Limpiar polvo de superficies',
                    'Lavar tapetes de habitación y colocarlos limpios'
                ]
            },
            {
                title: '🧺 Zona de Lavado',
                tasks: [
                    'Limpiar filtro de la lavadora en cada lavada',
                    'Limpiar gabinete debajo del lavadero',
                    'Dejar ganchos de ropa disponibles',
                    'Dejar toallas disponibles para la piscina'
                ]
            },
            {
                title: '🔥 Área de BBQ',
                tasks: [
                    'Barrer y trapear el área de BBQ',
                    'Limpiar mesa y superficies',
                    'Limpiar mini nevera y dejarla sin alimentos',
                    'Limpiar parrilla con cepillo (sin agua)',
                    'Retirar cenizas del carbón',
                    'Dejar área limpia y ordenada'
                ]
            },
            {
                title: '🏊 Área de Piscina',
                tasks: [
                    'Barrer y trapear área de piscina',
                    'Organizar muebles alrededor de la piscina'
                ]
            },
            {
                title: '🌅 Terraza',
                tasks: [
                    'Limpiar piso de la terraza',
                    'Limpiar superficies',
                    'Organizar cojines de la sala exterior'
                ]
            }
        ]
    },
    'epic-d1-limpieza-profunda': {
        name: '🧽 Limpieza Profunda - EPIC D1',
        icon: '🧽',
        sections: [
            {
                title: '🛋️ Textiles y muebles',
                tasks: [
                    'Lavar forros de muebles: sofás, sillas y cojines'
                ]
            },
            {
                title: '🪟 Vidrios y ventanales',
                tasks: [
                    'Limpiar todas las ventanas y ventanales por dentro y por fuera'
                ]
            },
            {
                title: '🌊 Exteriores',
                tasks: [
                    'Hidrolavar piso exterior, escaleras, terraza y placas vehiculares'
                ]
            },
            {
                title: '🗑️ Residuos',
                tasks: [
                    'Lavar caneca grande de basura debajo de la escalera'
                ]
            },
            {
                title: '🧼 Paredes y guardaescobas',
                tasks: [
                    'Limpiar paredes y guardaescobas de toda la casa'
                ]
            }
        ]
    },
    'epic-d1-mantenimiento': {
        name: '🔧 Mantenimiento - EPIC D1',
        icon: '🔧',
        sections: [
            {
                title: '🏊 Piscina y cuarto de máquinas',
                tasks: [
                    'Mantener la piscina limpia y operativa',
                    'Revisar cuarto de máquinas y detectar filtraciones'
                ]
            },
            {
                title: '⚡ Planta eléctrica',
                tasks: [
                    'Chequear generador eléctrico y nivel de diésel',
                    'Encender la planta 2 veces al mes por al menos 30 minutos'
                ]
            },
            {
                title: '🌿 Jardín y palmeras',
                tasks: [
                    'Cortar césped cada 1.5 a 2 meses y limpiar restos',
                    'Remover hojas secas de palmeras'
                ]
            },
            {
                title: '🌱 Plantas y terrazas',
                tasks: [
                    'Mantener matera de terraza sin maleza y deshierbar',
                    'Regar plantas vivas según necesidad'
                ]
            }
        ]
    }
};

// Mapeo de tareas personalizadas por nombre de propiedad
const CUSTOM_TASKS_BY_PROPERTY = {
    'Torre Magna PI': CUSTOM_TASKS,
    'EPIC D1': EPIC_D1_TASKS
};

// Utils de almacenamiento
function loadData() {
    try {
        const storedProps = localStorage.getItem(STORAGE_KEYS.properties);
        const storedTasks = localStorage.getItem(STORAGE_KEYS.cleaningTasks);
        const storedPurchase = localStorage.getItem(STORAGE_KEYS.purchaseInventory);
        const storedSchedule = localStorage.getItem(STORAGE_KEYS.scheduledDates);
        const storedHistory = localStorage.getItem(STORAGE_KEYS.purchaseHistory);
        const storedRequests = localStorage.getItem(STORAGE_KEYS.purchaseRequests);
        const storedChecks = localStorage.getItem(STORAGE_KEYS.inventoryChecks);
        const storedDeletedChecks = localStorage.getItem(STORAGE_KEYS.deletedInventoryChecks);
        const storedNotifications = localStorage.getItem(STORAGE_KEYS.workDayNotifications);
        properties = storedProps ? JSON.parse(storedProps) : {};
        cleaningTasks = storedTasks ? JSON.parse(storedTasks) : [];
        purchaseInventory = storedPurchase ? JSON.parse(storedPurchase) : [];
        scheduledDates = storedSchedule ? JSON.parse(storedSchedule) : [];
        purchaseHistory = storedHistory ? JSON.parse(storedHistory) : [];
        purchaseRequests = storedRequests ? JSON.parse(storedRequests) : [];
        inventoryChecks = storedChecks ? JSON.parse(storedChecks) : [];
        deletedInventoryChecks = storedDeletedChecks ? JSON.parse(storedDeletedChecks) : [];
        workDayNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
        
        // Limpiar reportes eliminados que han pasado 3 días
        cleanupDeletedInventoryChecks();
        
        // Migrar datos antiguos: convertir 'limpieza' a 'limpieza-regular'
        scheduledDates.forEach(item => {
            if (item.type === 'limpieza') {
                item.type = 'limpieza-regular';
            }
        });
        
        // Arreglar fechas que tienen desfase de timezone (agregar un día si es necesario)
        // Solo para fechas que al parsearse muestran un día diferente al esperado
        scheduledDates.forEach(item => {
            if (item.date && item.date.includes('-')) {
                const parts = item.date.split('-');
                if (parts.length === 3) {
                    // Verificar si al parsear con new Date() retrocede un día
                    const utcDate = new Date(item.date);
                    const [year, month, day] = parts.map(Number);
                    const localDate = new Date(year, month - 1, day);
                    
                    // Si hay desfase (el día UTC es diferente al día local esperado)
                    if (utcDate.getDate() !== localDate.getDate() && utcDate.getDate() === localDate.getDate() - 1) {
                        // La fecha tiene el bug de timezone, corregirla
                        const correctedDate = new Date(year, month - 1, day);
                        const correctedYear = correctedDate.getFullYear();
                        const correctedMonth = String(correctedDate.getMonth() + 1).padStart(2, '0');
                        const correctedDay = String(correctedDate.getDate()).padStart(2, '0');
                        item.date = `${correctedYear}-${correctedMonth}-${correctedDay}`;
                    }
                }
            }
        });
    } catch (e) {
        console.error('No se pudo leer localStorage', e);
        properties = {};
        cleaningTasks = [];
        purchaseInventory = [];
        scheduledDates = [];
        purchaseHistory = [];
        purchaseRequests = [];
        inventoryChecks = [];
        deletedInventoryChecks = [];
    }
    
    // Migrar datos antiguos: convertir 'limpieza' a 'limpieza-regular'
    scheduledDates.forEach(item => {
        if (item.type === 'limpieza') {
            item.type = 'limpieza-regular';
        }
    });
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(properties));
    localStorage.setItem(STORAGE_KEYS.cleaningTasks, JSON.stringify(cleaningTasks));
    localStorage.setItem(STORAGE_KEYS.purchaseInventory, JSON.stringify(purchaseInventory));
    localStorage.setItem(STORAGE_KEYS.scheduledDates, JSON.stringify(scheduledDates));
    localStorage.setItem(STORAGE_KEYS.purchaseHistory, JSON.stringify(purchaseHistory));
    localStorage.setItem(STORAGE_KEYS.purchaseRequests, JSON.stringify(purchaseRequests));
    localStorage.setItem(STORAGE_KEYS.inventoryChecks, JSON.stringify(inventoryChecks));
    localStorage.setItem(STORAGE_KEYS.deletedInventoryChecks, JSON.stringify(deletedInventoryChecks));
    localStorage.setItem(STORAGE_KEYS.workDayNotifications, JSON.stringify(workDayNotifications));
    
    // Marcar timestamp de última modificación
    localStorage.setItem(STORAGE_KEYS.lastSyncTime, new Date().getTime().toString());
    
    // Sincronizar con la nube si está habilitado
    if (CLOUD_SYNC_CONFIG.enabled && CLOUD_SYNC_CONFIG.autoSync && !syncInProgress) {
        syncToCloud();
    }
}

// Normaliza inventario con ítems base
function normalizeInventory(prop) {
    if (!prop.inventory) prop.inventory = {};
    
    // Definir exclusiones por propiedad
    const excludedCategories = {};
    if (prop.name === 'Torre Magna PI') {
        excludedCategories.bbq = true;
        excludedCategories.pasillo = true;
        excludedCategories.terraza = true; // Quitar Terraza en Torre Magna
    }
    
    Object.keys(INVENTORY_CATEGORIES).forEach(catKey => {
        // Saltar categorías excluidas para esta propiedad
        if (excludedCategories[catKey]) {
            // Si ya existe, eliminarla
            if (prop.inventory[catKey]) {
                delete prop.inventory[catKey];
            }
            return;
        }
        
        if (!prop.inventory[catKey]) {
            prop.inventory[catKey] = INVENTORY_CATEGORIES[catKey].items.map(item => ({
                id: `${catKey}-${item.toLowerCase().replace(/\s+/g, '-')}`,
                name: item,
                qty: 0
            }));
        }
    });
}

function cleanupDeletedInventoryChecks() {
    const now = new Date().getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000; // 3 días en milisegundos
    
    deletedInventoryChecks = deletedInventoryChecks.filter(deleted => {
        const deletedTime = new Date(deleted.deletedAt).getTime();
        const timePassed = now - deletedTime;
        
        if (timePassed > threeDaysMs) {
            return false; // Eliminar permanentemente
        }
        return true; // Mantener en respaldo
    });
    
    saveData();
}

function deleteInventoryReport(propertyId) {
    if (!confirm('⚠️ ¿Eliminar este reporte de inventario? Se guardará un respaldo por 3 días.')) return;
    
    const checksToDelete = inventoryChecks.filter(c => c.propertyId === propertyId);
    if (checksToDelete.length === 0) {
        alert('No hay verificaciones para eliminar');
        return;
    }
    
    // Guardar en respaldo antes de eliminar
    checksToDelete.forEach(check => {
        deletedInventoryChecks.push({
            ...check,
            deletedAt: new Date().toISOString(),
            deletedBy: currentUser.name
        });
    });
    
    // Eliminar del inventario actual
    inventoryChecks = inventoryChecks.filter(c => c.propertyId !== propertyId);
    
    saveData();
    renderInventoryChecks();
    renderManagerInventoryChecks();
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

function restoreInventoryReport(propertyId) {
    const backupIndex = deletedInventoryChecks.findIndex(d => d.propertyId === propertyId);
    if (backupIndex === -1) {
        alert('No se encontró respaldo para restaurar');
        return;
    }
    
    // Restaurar todos los reportes de esta propiedad desde el respaldo
    const backupsForProp = deletedInventoryChecks.filter(d => d.propertyId === propertyId);
    
    backupsForProp.forEach(backup => {
        const { deletedAt, deletedBy, ...originalData } = backup;
        inventoryChecks.push(originalData);
    });
    
    // Eliminar del respaldo
    deletedInventoryChecks = deletedInventoryChecks.filter(d => d.propertyId !== propertyId);
    
    saveData();
    renderInventoryChecks();
    renderManagerInventoryChecks();
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
function updateLoginForm() {
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
    const type = document.getElementById('userType').value;
    if (!type) { alert('Selecciona el tipo de usuario'); return; }

    if (type === 'owner') {
        const user = document.getElementById('ownerCode').value.trim();
        const pass = document.getElementById('ownerPassword').value.trim();
        if (user === OWNER_CREDENTIALS.username && pass === OWNER_CREDENTIALS.password) {
            currentUserType = 'owner';
            currentUser = { name: OWNER_CREDENTIALS.name, username: user, loginTime: new Date() };
            // Mantener la propiedad seleccionada en la sesión del dueño
            if (!selectedProperty) {
                selectedProperty = Object.keys(properties)[0] || null;
            }
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
            showOwnerView();
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
        showManagerView();
    } else {
        showEmployeeView();
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
    delete properties[propId];
    cleaningTasks = cleaningTasks.filter(t => t.propertyId !== propId);
    saveData();
    if (!selectedProperty) {
        selectedProperty = Object.keys(properties)[0] || null;
    }
    renderProperties();
    refreshOwnerContent();
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
    properties[id] = prop;

    cleaningTasks.push(...createDefaultCleaningTasks(id, name));

    // Programar limpieza profunda inicial para EPIC D1 cada 3 meses (arranque en 90 días)
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

    const prop = properties[selectedProperty];
    const exists = (prop.staff || []).some(s => s.username === username);
    if (exists) { alert('Ese usuario ya existe en la propiedad'); return; }

    prop.staff.push({
        id: `staff_${Date.now()}`,
        name,
        role: role,
        username,
        password,
        lastLoginTime: null,
        assignmentType: prop.name === 'EPIC D1' ? (role === 'maintenance' ? 'mantenimiento' : role === 'manager' ? 'ambas' : 'limpieza') : null
    });

    document.getElementById('staffNameInput').value = '';
    document.getElementById('staffUsernameInput').value = '';
    document.getElementById('staffPasswordInput').value = '';

    saveData();
    renderStaff();
}

function removeStaffMember(staffId) {
    if (!selectedProperty) return;
    const prop = properties[selectedProperty];
    prop.staff = (prop.staff || []).filter(s => s.id !== staffId);
    saveData();
    renderStaff();
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
    
    purchaseInventory.push({
        id: `purchase_${Date.now()}`,
        propertyId,
        name,
        qty,
        purchased: false,
        createdDate: new Date().toLocaleString()
    });
    
    if (source === 'manager') {
        document.getElementById('managerPurchaseInput').value = '';
        document.getElementById('managerPurchaseQty').value = '1';
        renderManagerPurchaseInventory();
    } else {
        document.getElementById('purchaseItemName').value = '';
        document.getElementById('purchaseItemQty').value = '1';
        renderPurchaseInventory();
    }
    
    saveData();
}

function togglePurchaseStatus(purchaseId) {
    const item = purchaseInventory.find(p => p.id === purchaseId);
    if (item) {
        item.purchased = !item.purchased;
        
        // Si se marca como comprado, registrar en historial
        if (item.purchased) {
            const now = new Date();
            purchaseHistory.push({
                id: `purchase_history_${Date.now()}`,
                propertyId: item.propertyId,
                itemName: item.name,
                qty: item.qty,
                purchaseDate: now.toISOString(),
                category: 'aseo' // Por ahora marcamos como aseo, pero puede ser más genérico
            });
        }
        
        saveData();
        renderPurchaseInventory();
        renderManagerPurchaseInventory();
    }
}

function removePurchaseItem(purchaseId) {
    if (!confirm('¿Eliminar este artículo de la lista de compra?')) return;
    purchaseInventory = purchaseInventory.filter(p => p.id !== purchaseId);
    saveData();
    renderPurchaseInventory();
    renderManagerPurchaseInventory();
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
    
    scheduledDates.push({
        id: `schedule_${Date.now()}`,
        propertyId,
        date,
        type, // 'limpieza' o 'mantenimiento'
        assignedEmployeeId: employeeId || '',
        assignedEmployeeName: employeeName,
        startTime: startTime || '',
        completed: false,
        completedTime: null, // Hora en que el empleado marcó como completado
        notes: ''
    });
    
    if (source === 'manager') {
        document.getElementById('managerScheduleDate').value = '';
        document.getElementById('managerScheduleType').value = 'limpieza-regular';
        document.getElementById('managerScheduleEmployee').value = '';
        document.getElementById('managerScheduleTime').value = '';
        renderManagerSchedule();
    } else {
        document.getElementById('scheduleDate').value = '';
        document.getElementById('scheduleType').value = 'limpieza-regular';
        document.getElementById('scheduleEmployee').value = '';
        document.getElementById('scheduleTime').value = '';
        renderSchedule();
    }
    
    saveData();
}

function scheduleDeepCleanEvery3Months(propertyId, propertyName) {
    // Crear un evento de calendario para limpieza profunda dentro de 90 días
    const now = new Date();
    const target = new Date(now.getTime());
    target.setDate(target.getDate() + 90);
    const dateStr = target.toISOString().split('T')[0];

    const existing = scheduledDates.find(s => s.propertyId === propertyId && s.notes?.includes('Limpieza profunda'));
    if (existing) return;

    scheduledDates.push({
        id: `schedule_${Date.now()}`,
        propertyId,
        date: dateStr,
        type: 'limpieza-profunda',
        assignedEmployeeId: '',
        assignedEmployeeName: '',
        startTime: '',
        completed: false,
        completedTime: null,
        notes: 'Limpieza profunda (cada 3 meses)' + (propertyName ? ` - ${propertyName}` : '')
    });
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
        item.completed = !item.completed;
        saveData();
        renderSchedule();
        renderManagerSchedule();
        renderEmployeeSchedule();
    }
}

function removeScheduledDate(scheduleId) {
    if (!confirm('¿Eliminar esta fecha programada?')) return;
    scheduledDates = scheduledDates.filter(s => s.id !== scheduleId);
    saveData();
    renderSchedule();
    renderManagerSchedule();
    renderEmployeeSchedule();
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
