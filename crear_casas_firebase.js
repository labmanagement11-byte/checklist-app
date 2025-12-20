// Script para crear las casas reales en Firestore según las que ya tienes en la página
// Requiere: npm install firebase-admin
// Usa el mismo serviceAccountKey.json

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Lista de casas reales según tu app
const casas = [
  { nombre: 'EPIC D1', ubicacion: 'Playa del Carmen', activa: true },
  { nombre: 'Torre Magna PI', ubicacion: 'Playa del Carmen', activa: true }
  // Agrega aquí más casas si tienes otras en tu app
];

async function crearCasas() {
  for (const casa of casas) {
    // Evita duplicados: busca por nombre
    const snapshot = await db.collection('houses').where('nombre', '==', casa.nombre).get();
    if (snapshot.empty) {
      await db.collection('houses').add(casa);
      console.log(`✅ Casa creada: ${casa.nombre}`);
    } else {
      console.log(`⚠️  Ya existe: ${casa.nombre}`);
    }
  }
  process.exit();
}

crearCasas();
