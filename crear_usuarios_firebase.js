// Script Node.js para crear usuarios reales en Firebase Auth y asignarles rol en Firestore
// Requiere: npm install firebase-admin
// Coloca tu archivo de credenciales de servicio en la raíz como serviceAccountKey.json

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const users = [
  { email: 'peralta@ejemplo.com', password: 'clave123', rol: 'owner' },
  { email: 'sabadra@ejemplo.com', password: 'clave123', rol: 'manager' },
  { email: 'grisales@ejemplo.com', password: 'clave123', rol: 'employee' },
  { email: 'vela@ejemplo.com', password: 'clave123', rol: 'employee' },
  { email: 'reyes@ejemplo.com', password: 'clave123', rol: 'manager' }
];

async function createUsers() {
  for (const user of users) {
    try {
      // Crear usuario en Auth
      const userRecord = await admin.auth().createUser({
        email: user.email,
        password: user.password
      });
      console.log(`✅ Usuario creado: ${user.email}`);
      // Guardar rol en Firestore
      await db.collection('users').add({ correo: user.email, rol: user.rol });
      console.log(`   Rol asignado: ${user.rol}`);
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        console.log(`⚠️  El usuario ya existe: ${user.email}`);
      } else {
        console.error(`❌ Error con ${user.email}:`, e.message);
      }
    }
  }
  process.exit();
}

createUsers();
