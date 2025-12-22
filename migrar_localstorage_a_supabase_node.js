// migrar_localstorage_a_supabase_node.js
// Ejecuta este script con Node.js para migrar datos locales a Supabase
// Requiere: npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://nyosrgruflarxgdysnah.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b3NyZ3J1ZmxhcnhnZHlzbmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODE1NDMsImV4cCI6MjA4MTg1NzU0M30.4imJU82gxPxmT6_fLQ3z7NDyhTqgUt2_F8IDqvL9GAI';
const supaClient = createClient(supabaseUrl, supabaseKey);

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

(async function migrate() {
  // 1. Propiedades
  const properties = readJson('airbnbmanager_properties.json') || {};
  for (const propId in properties) {
    const prop = properties[propId];
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
  const cleaningTasks = readJson('airbnbmanager_tasks.json') || [];
  for (const task of cleaningTasks) {
    const { error } = await supaClient.from('cleaning_tasks').upsert(task);
    if (error) console.error('Error migrando tarea', task.taskText || task.titulo, error);
  }

  // 5. Compras
  const purchaseInventory = readJson('airbnbmanager_purchase.json') || [];
  for (const item of purchaseInventory) {
    const { error } = await supaClient.from('purchase_inventory').upsert(item);
    if (error) console.error('Error migrando compra', item.name, error);
  }

  // 6. Historial de compras
  const purchaseHistory = readJson('airbnbmanager_purchase_history.json') || [];
  for (const item of purchaseHistory) {
    const { error } = await supaClient.from('purchase_history').upsert(item);
    if (error) console.error('Error migrando historial', item.item_name, error);
  }

  // 7. Solicitudes de compra
  const purchaseRequests = readJson('airbnbmanager_purchase_requests.json') || [];
  for (const item of purchaseRequests) {
    const { error } = await supaClient.from('purchase_requests').upsert(item);
    if (error) console.error('Error migrando solicitud', item.item_name, error);
  }

  console.log('Migración a Supabase finalizada. Revisa tu dashboard.');
})();
