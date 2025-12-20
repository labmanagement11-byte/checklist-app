// Configuración de Firebase para web clásica (sin módulos)
// Incluye los scripts de Firebase en tu index.html o aquí dinámicamente:
// Inicialización clásica de Firebase v8.x
(function() {
	if (typeof firebase !== 'undefined' && !window.db) {
		var firebaseConfig = {
			apiKey: "AIzaSyBNoGj-sMu9YcCiNXggZDhSi8GOJO8f7wI",
			authDomain: "limpieza360pro-18e63.firebaseapp.com",
			projectId: "limpieza360pro-18e63",
			storageBucket: "limpieza360pro-18e63.appspot.com",
			messagingSenderId: "295895627830",
			appId: "1:295895627830:web:63de909e4f8b40f6d0c097",
			measurementId: "G-23V6L6RE47"
		};
		firebase.initializeApp(firebaseConfig);
		window.db = firebase.firestore();
		window.auth = firebase.auth();
	}
})();
