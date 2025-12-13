# 📱 AirbnbManager Mobile - Guía Completa

## 🚀 Acceso Rápido

### Versiones Disponibles

| Versión | URL | Descripción |
|---------|-----|-------------|
| **Web Desktop** | [airbnbmanager.com](https://labmanagement11-byte.github.io/checklist-app/) | Versión completa de escritorio |
| **Mobile App** | [mobile.html](mobile.html) | Versión optimizada para móvil |

---

## 📲 Características de la Versión Mobile

### ✨ Diseño Profesional
- **Interfaz nativa mobile** con navegación por pestañas en la parte inferior
- **Tema claro/oscuro** adaptable
- **Animaciones suaves** y transiciones fluidas
- **Responsive design** para todos los tamaños de pantalla
- **Safe areas** para dispositivos con notch (iPhone X+)

### 🎯 Funcionalidades Principales

#### Para Dueños 👤
- **Dashboard** con estadísticas en tiempo real
- **Gestión de propiedades** - Ver todas tus casas
- **Inventario** - Consultar inventario por propiedad
- **Personal** - Visualizar staff asignado

#### Para Empleados/Managers 👷
- **Mis Tareas** - Ver tareas asignadas
- **Calendario** - Fechas programadas
- **Solicitudes** - Gestionar solicitudes
- **Mi Perfil** - Información personal

---

## 🔐 Credenciales de Prueba

### Dueño
```
Usuario: jonathan
Contraseña: galindo123
```

### Manager/Empleado
*Las credenciales se crean desde la interfaz de dueño*

---

## 📊 Estructura de Navegación

### Dueño - Pestañas Inferiores
```
📊 Inicio → 🏠 Casas → 📦 Inventario → 👥 Personal
```

### Empleado - Pestañas Inferiores
```
✓ Tareas → 📅 Calendario → 📝 Solicitudes → 👤 Perfil
```

---

## 🎨 Paleta de Colores

### Tema Claro (por defecto)
- **Primario**: Azul #1877f2
- **Fondo**: Blanco #ffffff
- **Texto**: Negro #111111

### Tema Oscuro
- **Primario**: Azul claro #5ba3ff
- **Fondo**: Gris oscuro #121212
- **Texto**: Blanco #ffffff

---

## 📱 Instalación en Dispositivo

### iOS (iPhone)
1. Abre Safari y ve a: [mobile.html](mobile.html)
2. Tap en el botón compartir (↗️)
3. Selecciona "Agregar a Pantalla de Inicio"
4. La app aparecerá como una aplicación nativa

### Android
1. Abre Chrome y ve a: [mobile.html](mobile.html)
2. Tap en el menú (⋮)
3. Selecciona "Instalar aplicación"
4. La app se instalará como PWA

---

## 🔧 Funcionalidades Técnicas

### Almacenamiento
- **localStorage** para persistencia de sesión
- **Sincronización automática** con datos de la versión web
- **Respaldo de 3 días** para inventario eliminado

### Características Móviles
- ✅ Soporte para modo offline
- ✅ Tema adaptable a preferencias del sistema
- ✅ Notificaciones de estado
- ✅ Navegación táctil optimizada
- ✅ Gestos intuitivos

### Rendimiento
- 🚀 Carga instantánea
- 🎯 Animaciones a 60fps
- 📊 Optimizado para conexiones lentas
- 🔄 Sincronización eficiente

---

## 🎯 Guía de Uso

### Primera Vez - Dueño
1. **Ingresa** con credenciales de dueño
2. Tap en **🏠 Casas**
3. Tap en **+ Agregar** para crear nueva propiedad
4. **Configura** inventario y personal

### Primera Vez - Empleado
1. **Recibe** credenciales del dueño
2. **Ingresa** con tu usuario y contraseña
3. Verás automáticamente **tus tareas** asignadas
4. Tap en **📅** para ver fechas programadas

### Operaciones Comunes

#### Marcar Tarea como Completa
1. Ve a **✓ Tareas**
2. Tap en el **checkbox** de la tarea
3. La tarea se marcará como completada

#### Ver Inventario
1. Ve a **📦 Inventario**
2. Selecciona una casa
3. Tap en cualquier **categoría** para expandir
4. Verás todos los items disponibles

#### Gestionar Personal
1. Ve a **👥 Personal**
2. Selecciona una casa
3. Verás lista de empleados asignados

---

## 🎨 Interfaz Detallada

### Header Superior
```
[Título] [🌙 Tema] [🚪 Salir]
```

### Bottom Navigation (Siempre visible)
```
[Icono 1] [Icono 2] [Icono 3] [Icono 4]
[Etiqueta] [Etiqueta] [Etiqueta] [Etiqueta]
```

### Cards
- **Propiedad**: Nombre + Dirección + Estadísticas
- **Tarea**: Nombre + Área + Checkbox
- **Staff**: Avatar + Nombre + Rol

---

## 🔄 Sincronización

La versión móvil se **sincroniza automáticamente** con la versión web:

- 📤 Cambios en mobile → Se guardan en web
- 📥 Cambios en web → Se cargan en mobile
- 🔒 Credenciales recordadas localmente
- 🌐 Datos centralizados en localStorage

---

## 🐛 Solución de Problemas

### "No carga la página"
- Verifica conexión a internet
- Limpia cache (Ctrl+Shift+Delete)
- Recarga la página

### "No puedo ingresar"
- Verifica que escribas bien el usuario
- La contraseña es sensible a mayúsculas
- Prueba las credenciales de dueño: jonathan/galindo123

### "Las tareas no se actualizan"
- Recarga la página (desliza hacia abajo)
- Verifica que estés en la casa correcta
- Los cambios se guardan automáticamente

### "El tema no cambia"
- Tap en el botón 🌙 en la esquina superior
- Verifica que el toggle está activado
- La preferencia se guarda automáticamente

---

## 📞 Soporte

Para reportar problemas o sugerencias, contacta con el equipo de desarrollo.

---

## 📈 Mejoras Futuras

- [ ] Notificaciones push en tiempo real
- [ ] Modo offline mejorado
- [ ] Cámara para documentación
- [ ] Integración con calendario del sistema
- [ ] Gestos personalizados
- [ ] Traducción multiidioma
- [ ] Estadísticas avanzadas
- [ ] Reportes en PDF

---

**¡Disfruta usando AirbnbManager Mobile! 🚀**

*Última actualización: Diciembre 2025*
