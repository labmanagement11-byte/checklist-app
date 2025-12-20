// Script de pruebas automáticas para flujo de login y vistas por rol
// Usa Puppeteer para simular usuarios y verificar la vista mostrada

const puppeteer = require('puppeteer');

const users = [
  { email: 'peralta@ejemplo.com', password: 'clave123', rol: 'owner', vista: '#ownerView' },
  { email: 'sabadra@ejemplo.com', password: 'clave123', rol: 'manager', vista: '#managerView' },
  { email: 'grisales@ejemplo.com', password: 'clave123', rol: 'employee', vista: '#employeeView' },
  { email: 'vela@ejemplo.com', password: 'clave123', rol: 'employee', vista: '#employeeView' },
  { email: 'reyes@ejemplo.com', password: 'clave123', rol: 'manager', vista: '#managerView' }
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  for (const user of users) {
    await page.goto('http://localhost:5500/index.html'); // Cambia el puerto si usas otro
    await page.waitForSelector('#loginView');
    await page.type('#loginEmail', user.email);
    await page.type('#loginPassword', user.password);
    await page.click('#loginButton');
    await page.waitForTimeout(2000);
    const visible = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      return el && el.style.display !== 'none';
    }, user.vista);
    if (visible) {
      console.log(`✅ ${user.email} ve correctamente la vista de ${user.rol}`);
    } else {
      console.error(`❌ ${user.email} NO ve la vista correcta (${user.rol})`);
    }
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });
  }
  await browser.close();
})();
