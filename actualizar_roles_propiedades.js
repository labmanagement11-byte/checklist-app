// Script para actualizar roles y propiedades de usuarios en Firestore
// Requiere: npm install firebase-admin
// Usa el mismo serviceAccountKey.json

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const updates = [
  { correo: 'peralta@ejemplo.com', rol: 'employee', propiedad: 'epic d1' },
  { correo: 'sabadra@ejemplo.com', rol: 'employee', propiedad: 'torre magna' },
  { correo: 'grisales@ejemplo.com', rol: 'manager', propiedad: 'torre magna' },
  { correo: 'vela@ejemplo.com', rol: 'manager', propiedad: 'epic d1' },
  { correo: 'reyes@ejemplo.com', rol: 'employee', propiedad: 'epic d1' },
  { correo: 'jonathan@ejemplo.com', rol: 'owner', propiedad: 'todas' }
];

async function updateUsers() {
  for (const user of updates) {
    const snapshot = await db.collection('users').where('correo', '==', user.correo).get();
    if (!snapshot.empty) {
      for (const doc of snapshot.docs) {
        await doc.ref.update({ rol: user.rol, propiedad: user.propiedad });
        console.log(`✅ Actualizado: ${user.correo} → rol: ${user.rol}, propiedad: ${user.propiedad}`);
      }
    } else {
      // Si no existe, lo crea
      await db.collection('users').add({ correo: user.correo, rol: user.rol, propiedad: user.propiedad });
      console.log(`➕ Creado: ${user.correo} → rol: ${user.rol}, propiedad: ${user.propiedad}`);
    }
  }
  process.exit();
}

updateUsers();
