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
            previewImage.src = e.target.result; // Mostrar la imagen seleccionada
            previewDiv.style.display = 'block'; // Mostrar la sección de vista previa
        };
        reader.readAsDataURL(file); // Leer el archivo como DataURL
    } else {
        previewImage.src = ''; // Limpiar la vista previa si no hay archivo
        previewDiv.style.display = 'none';
    }
});

// Manejo del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const photo = photoInput.files[0];

    if (!name || !description) {
        alert("Por favor, completa el nombre y la descripción.");
        return;
    }

    let photoURL = null; // Inicializar la URL de la foto
    if (photo) {
        try {
            console.log("Intentando subir la foto...");
            const storagePath = `photos/${Date.now()}_${photo.name}`;
            const photoRef = storageRef(storage, storagePath);

            // Subir la foto a Firebase Storage
            const snapshot = await uploadBytes(photoRef, photo);
            photoURL = await getDownloadURL(snapshot.ref);
            console.log("Foto subida correctamente. URL:", photoURL);
        } catch (error) {
            console.error("Error al subir la foto:", error);
            alert("Hubo un problema al subir la foto.");
            return;
        }
    }

    try {
        // Guardar los datos en Realtime Database
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
    } catch (error) {
        console.error("Error al guardar los datos en la base de datos:", error);
        alert("Hubo un problema al guardar los datos.");
    }
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
