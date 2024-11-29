import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    databaseURL: "TU_DATABASE_URL",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// API Key de ImgBB
const imgbbApiKey = 'e7186e33106d5b82ebcc518e2bf11103';

// Elementos del DOM
const form = document.getElementById('dataForm');
const photoInput = document.getElementById('photo');
const previewDiv = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const savedDataDiv = document.getElementById('savedData');

// Mostrar vista previa de la imagen seleccionada
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

// Subir la imagen a ImgBB
async function uploadToImgBB(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Error al subir la imagen a ImgBB');
    }

    const data = await response.json();
    return data.data.url; // Retorna la URL pública de la imagen
}

// Manejo del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const photo = photoInput.files[0];

    if (!name || !description) {
        alert('Por favor, completa el nombre y la descripción.');
        return;
    }

    let photoURL = null;

    if (photo) {
        try {
            console.log('Subiendo la imagen a ImgBB...');
            photoURL = await uploadToImgBB(photo);
            console.log('Imagen subida. URL:', photoURL);
        } catch (error) {
            console.error('Error al subir la imagen:', error);
            alert('Hubo un problema al subir la imagen.');
            return;
        }
    } else {
        alert('Por favor, selecciona una imagen.');
        return;
    }

    try {
        // Guardar los datos en Firebase Realtime Database
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
        console.error('Error al guardar los datos en Firebase:', error);
        alert('Hubo un problema al guardar los datos.');
    }
});

// Cargar todos los datos desde Firebase
onValue(ref(database, 'entries'), (snapshot) => {
    savedDataDiv.innerHTML = ""; // Limpia los datos previos
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const div = document.createElement('div');
        div.style.border = '1px solid #ddd';
        div.style.padding = '10px';
        div.style.marginBottom = '10px';

        let photoHtml = '';
        if (data.photoURL) {
            photoHtml = `<img src="${data.photoURL}" alt="Imagen de ${data.name}" style="max-width: 200px; margin-top: 10px;">`;
        }

        div.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.description}</p>
            ${photoHtml}
        `;

        savedDataDiv.appendChild(div);
    });
});
