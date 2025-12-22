// Script para migrar datos de localStorage a Supabase
// Ejecutar en consola del navegador en la página principal (con usuario owner logueado)

(async function migrateLocalStorageToSupabase() {
  // Configuración: usa los mismos valores que en app.js
  const supabaseUrl = 'https://nyosrgruflarxgdysnah.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b3NyZ3J1ZmxhcnhnZHlzbmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODE1NDMsImV4cCI6MjA4MTg1NzU0M30.4imJU82gxPxmT6_fLQ3z7NDyhTqgUt2_F8IDqvL9GAI';
  const supaClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : supabase.createClient(supabaseUrl, supabaseKey);

  // 1. Propiedades
  const properties = JSON.parse(localStorage.getItem('airbnbmanager_properties') || '{}');
  for (const propId in properties) {
    const prop = properties[propId];
    // Insertar o actualizar propiedad
    const { error } = await supaClient.from('properties').upsert({
      id: prop.id,
      name: prop.name,
      address: prop.address,
      code: prop.code || null
    });
    if (error) console.error('Error migrando propiedad', prop.name, error);
    // 2. Empleados (staff)
    if (Array.isArray(prop.staff)) {
      for (const staff of prop.staff) {
        const { error: staffErr } = await supaClient.from('users').upsert({
          id: staff.id,
          name: staff.name,
          username: staff.username,
          password: staff.password,
          role: staff.role,
          property_id: prop.id
        });
        if (staffErr) console.error('Error migrando staff', staff.name, staffErr);
      }
    }
    // 3. Inventario
    if (prop.inventory) {
      for (const catKey in prop.inventory) {
        for (const item of prop.inventory[catKey]) {
          const { error: invErr } = await supaClient.from('inventory').upsert({
            property_id: prop.id,
            category: catKey,
            name: item.name || item,
            qty: item.qty || 0
          });
          if (invErr) console.error('Error migrando inventario', item.name || item, invErr);
        }
      }
    }
  }

  // 4. Tareas
  const cleaningTasks = JSON.parse(localStorage.getItem('airbnbmanager_tasks') || '[]');
  for (const task of cleaningTasks) {
    const { error } = await supaClient.from('cleaning_tasks').upsert(task);
    if (error) console.error('Error migrando tarea', task.taskText || task.titulo, error);
  }

  // 5. Compras
  const purchaseInventory = JSON.parse(localStorage.getItem('airbnbmanager_purchase') || '[]');
  for (const item of purchaseInventory) {
    const { error } = await supaClient.from('purchase_inventory').upsert(item);
    if (error) console.error('Error migrando compra', item.name, error);
  }

  // 6. Historial de compras
  const purchaseHistory = JSON.parse(localStorage.getItem('airbnbmanager_purchase_history') || '[]');
  for (const item of purchaseHistory) {
    const { error } = await supaClient.from('purchase_history').upsert(item);
    if (error) console.error('Error migrando historial', item.item_name, error);
  }

  // 7. Solicitudes de compra
  const purchaseRequests = JSON.parse(localStorage.getItem('airbnbmanager_purchase_requests') || '[]');
  for (const item of purchaseRequests) {
    const { error } = await supaClient.from('purchase_requests').upsert(item);
    if (error) console.error('Error migrando solicitud', item.item_name, error);
  }

  alert('Migración a Supabase finalizada. Refresca la página para ver los datos en vivo.');
})();
