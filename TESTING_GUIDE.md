# AirbnbManager - Guía de Pruebas

## Descripción General
La aplicación está completa con las siguientes características:

### ✅ Características Implementadas

#### 1. **Sistema de Login**
- Selecciona tipo de usuario: Dueño o Empleado
- Ingresa nombre de usuario
- Dueños ingresan un código de dueño
- Empleados ingresan código de propiedad (proporcionado por el dueño)

#### 2. **Panel del Dueño**
- **Gestión de Propiedades:**
  - Agregar nuevas propiedades con nombre y dirección
  - Cada propiedad genera un código único que se comparte con empleados
  - Seleccionar propiedad activa para ver detalles

- **Gestión de Inventario:**
  - Agregar elementos al inventario de la propiedad
  - Ver lista de elementos por propiedad
  - Eliminar elementos del inventario

- **Gestión de Tareas:**
  - Crear tareas asignadas a empleados específicos
  - Ver estado de tareas (Pendiente/Completada)
  - Eliminar tareas

- **Registro de Empleados:**
  - Ver lista de empleados conectados
  - Ver última hora de conexión de cada empleado
  - Asignar tareas a empleados activos

#### 3. **Panel del Empleado**
- **Información de Propiedad:**
  - Ver propiedad asignada con nombre y dirección
  - Ver hora de ingreso al sistema

- **Inventario (Solo Lectura):**
  - Ver elementos del inventario de la propiedad asignada
  - No puede editar ni eliminar elementos

- **Tareas Asignadas:**
  - Ver tareas asignadas específicamente al empleado
  - Marcar tareas como completadas
  - Las tareas completadas muestran estado verde con checkmark

#### 4. **Almacenamiento de Datos**
- Todos los datos se guardan en localStorage
- Las propiedades, inventario, tareas y empleados persisten entre recargas
- Datos almacenados: airbnbManagerData

---

## Instrucciones de Prueba

### Prueba 1: Crear Dueño y Primera Propiedad
1. Abre `index.html` en el navegador
2. Selecciona "Dueño" en tipo de usuario
3. Ingresa nombre: "Juan García" 
4. Ingresa código de dueño: "admin123"
5. Haz clic en "Ingresar"
6. **Esperado:** Se muestra panel del dueño
7. Haz clic en "+ Agregar Casa"
8. Ingresa:
   - Nombre: "Casa Playa Cartagena"
   - Dirección: "Calle 1 No. 100, Cartagena"
9. Haz clic en "Guardar Casa"
10. **Esperado:** Casa aparece en la lista de propiedades con código único (se muestra en el botón)

### Prueba 2: Agregar Inventario
1. Con la propiedad seleccionada, ve a la sección "📦 Inventario"
2. Ingresa: "2 Almohadas grandes"
3. Haz clic en "Agregar"
4. Ingresa más elementos:
   - "1 Colchón matrimonial"
   - "4 Toallas blancas"
5. **Esperado:** Todos los elementos aparecen en la lista

### Prueba 3: Agregar Empleado
1. Abre una nueva pestaña/ventana privada del navegador
2. Abre `index.html` de nuevo
3. Selecciona "Empleado" en tipo de usuario
4. Ingresa nombre: "María Pérez"
5. Ingresa código de propiedad: Copia el código del botón de la propiedad del dueño
6. **Esperado:** Se muestra panel del empleado con:
   - Hora de ingreso registrada
   - Nombre de la propiedad
   - Lista de inventario (igual a la que agregó el dueño)

### Prueba 4: Crear y Asignar Tareas
1. Vuelve a la pestaña del dueño
2. Ve a la sección "✓ Tareas"
3. Ingresa tarea: "Limpiar cocina"
4. Selecciona empleado: "María Pérez" (debe haber aparecido al crear empleado)
5. Haz clic en "Crear Tarea"
6. **Esperado:** Tarea aparece con estado "⏳ Pendiente"

### Prueba 5: Completar Tarea como Empleado
1. Ve a la pestaña del empleado (María Pérez)
2. Recarga la página para actualizar
3. Ve la sección "✓ Mis Tareas"
4. **Esperado:** Aparece la tarea "Limpiar cocina" con botón "Marcar Completa"
5. Haz clic en "Marcar Completa"
6. **Esperado:** Tarea muestra estado verde "✓ Completada"

### Prueba 6: Sincronización en Tiempo Real
1. Vuelve a la pestaña del dueño
2. Recarga la página
3. Ve la sección "✓ Tareas"
4. **Esperado:** La tarea ahora muestra estado "✓ Completada" en verde

### Prueba 7: Múltiples Propiedades
1. En panel del dueño, haz clic en "+ Agregar Casa"
2. Crea una segunda propiedad:
   - Nombre: "Apartamento Centro"
   - Dirección: "Av. Principal 500, Centro"
3. Haz clic en botón de nueva propiedad para seleccionarla
4. Agrega inventario diferente para esta propiedad
5. **Esperado:** Inventario es independiente por propiedad

### Prueba 8: Salir de Sesión
1. Haz clic en botón "Salir" (en dueño o empleado)
2. **Esperado:** Vuelve a la pantalla de login
3. Todos los campos están limpios
4. Puedes hacer login nuevamente y los datos se mantienen

---

## Datos de Prueba Sugeridos

### Para Dueño:
- Nombre: Juan García
- Código: admin123

### Para Empleados:
- Nombres: María Pérez, Carlos López, Ana Martínez
- Código de propiedad: El que genera el sistema

### Para Propiedades:
1. Casa Playa Cartagena - Calle 1 No. 100
2. Apartamento Centro - Av. Principal 500
3. Cabaña Montaña - Km 5 Vía Montaña

---

## Verificación de localStorage

En la consola del navegador (F12), ejecuta:
```javascript
JSON.parse(localStorage.getItem('airbnbManagerData'))
```

**Esperado:** Objeto con estructura:
```json
{
  "properties": {
    "prop_123456": {
      "id": "prop_123456",
      "name": "Casa Playa",
      "code": "ABC12345",
      "inventory": [...],
      "tasks": [...],
      "address": "Dirección"
    }
  },
  "employees": {
    "María Pérez": {
      "name": "María Pérez",
      "propertyId": "prop_123456",
      "loginTime": "2024-01-01T10:30:00.000Z",
      "lastLoginTime": "2024-01-01T10:30:00.000Z"
    }
  }
}
```

---

## Notas de Desarrollo

- Todos los datos son en español
- Interfaz móvil-first y responsive
- Tema: Azul Facebook (#1877f2)
- Sin dependencias externas (solo HTML5/CSS3/Vanilla JS)
- Sin servidor backend (todo en cliente con localStorage)

---

## Características Futuras (No Implementadas)
- [ ] Backend server para sincronización en tiempo real
- [ ] Autenticación con contraseñas encriptadas
- [ ] Reportes y estadísticas
- [ ] Fotos del inventario
- [ ] Notas y comentarios en tareas
- [ ] Notificaciones push
- [ ] Integración con Google Calendar
