import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCAT6ZJsrI8tlyiDc1dEBSiezdK_JuEBmg",
    authDomain: "inventario-2be27.firebaseapp.com",
    projectId: "inventario-2be27",
    storageBucket: "inventario-2be27.appspot.com",
    messagingSenderId: "138347129495",
    appId: "1:138347129495:web:c31aab61624d1a68bcd7d2",
    measurementId: "G-DL44WCPP4L"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

// Elementos del DOM
const form = document.getElementById('dataForm');
const savedDataDiv = document.getElementById('savedData');
const photoInput = document.getElementById('photo');
const previewDiv = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');

// Mostrar vista previa de la foto seleccionada
photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewDiv.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewImage.src = '';
        previewDiv.style.display = 'none';
    }
});

// Manejo del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const photo = photoInput.files[0];

    let photoURL = null;
    if (photo) {
        try {
            const storagePath = `photos/${Date.now()}_${photo.name}`;
            const photoRef = storageRef(storage, storagePath);
            const snapshot = await uploadBytes(photoRef, photo);
            photoURL = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Error al subir la foto:", error);
            alert("Hubo un error al subir la foto.");
            return;
        }
    }

    const newEntryRef = push(ref(database, 'entries'));
    await set(newEntryRef, {
        name,
        description,
        photoURL,
        timestamp: new Date().toISOString()
    });

    alert('Datos guardados correctamente');
    form.reset();
    previewImage.src = '';
    previewDiv.style.display = 'none';
});

// Cargar todos los datos al abrir la página
onValue(ref(database, 'entries'), (snapshot) => {
    savedDataDiv.innerHTML = ""; // Limpia los datos previos
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const div = document.createElement('div');
        div.style.border = "1px solid #ddd";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";

        let photoHtml = '';
        if (data.photoURL) {
            photoHtml = `<img src="${data.photoURL}" alt="Foto de ${data.name}" width="200" style="margin-top:10px;">`;
        } else {
            photoHtml = `<p style="color: red;">No se subió ninguna foto.</p>`;
        }

        div.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.description}</p>
            ${photoHtml}
        `;
        savedDataDiv.appendChild(div);
    });
});
