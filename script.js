import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCAT6ZJsrI8tlyiDc1dEBSiezdK_JuEBmg",
    authDomain: "inventario-2be27.firebaseapp.com",
    databaseURL: "https://inventario-2be27-default-rtdb.firebaseio.com",
    projectId: "inventario-2be27",
    storageBucket: "inventario-2be27.firebasestorage.app",
    messagingSenderId: "138347129495",
    appId: "1:138347129495:web:c31aab61624d1a68bcd7d2",
    measurementId: "G-DL44WCPP4L"
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
const partidasDiv = document.getElementById('partidas');
const addPartidaButton = document.getElementById('addPartida');

// Mostrar vista previa de la imagen seleccionada
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

// Subir la imagen a ImgBB
async function uploadToImgBB(imageFile) {
    if (!imageFile) return null;

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
    return data.data.url;
}

// Manejo del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const photo = photoInput.files[0];

    if (!name || !description) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    let photoURL = null;

    try {
        if (photo) {
            photoURL = await uploadToImgBB(photo);
        }
    } catch (error) {
        console.error('Error al subir la imagen a ImgBB:', error);
        alert('Hubo un problema al subir la imagen.');
    }

    try {
        const newEntryRef = push(ref(database, 'entries'));
        await set(newEntryRef, {
            name,
            description,
            photoURL,
            timestamp: new Date().toISOString()
        });

        alert('Comentario guardado correctamente');
        form.reset();
        previewImage.src = '';
        previewDiv.style.display = 'none';
    } catch (error) {
        console.error('Error al guardar el comentario en Firebase:', error);
    }
});

// Cargar todos los comentarios
onValue(ref(database, 'entries'), (snapshot) => {
    savedDataDiv.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const id = childSnapshot.key;
        const div = document.createElement('div');
        div.style.border = '1px solid #ddd';
        div.style.padding = '10px';
        div.style.marginBottom = '10px';

        let photoHtml = '';
        if (data.photoURL) {
            photoHtml = `<img src="${data.photoURL}" alt="Imagen de ${data.name}" style="max-width: 200px;">`;
        }

        div.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.description}</p>
            ${photoHtml}
            <button onclick="editComment('${id}', '${data.name}', '${data.description}')">Editar</button>
            <button onclick="deleteComment('${id}')">Eliminar</button>
        `;

        savedDataDiv.appendChild(div);
    });
});

// Crear nueva partida
addPartidaButton.addEventListener('click', () => {
    const newPartidaRef = push(ref(database, 'partidas'));
    set(newPartidaRef, { name: 'Nueva Partida', personajes: {} });
});

// Crear partida visualmente
function createPartida(id, name = 'Nueva Partida') {
    const partidaDiv = document.createElement('div');
    partidaDiv.id = `partida-${id}`;
    partidaDiv.style.border = '1px solid #ddd';
    partidaDiv.style.padding = '10px';

    partidaDiv.innerHTML = `
        <h2 contenteditable="true" onblur="updatePartidaName('${id}', this.innerText)">${name}</h2>
        <button onclick="addPersonaje('${id}')">Agregar Personaje</button>
        <div class="personajes" id="personajes-${id}"></div>
    `;

    partidasDiv.appendChild(partidaDiv);
}

// Cargar partidas y personajes
onValue(ref(database, 'partidas'), (snapshot) => {
    partidasDiv.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const partida = childSnapshot.val();
        const partidaId = childSnapshot.key;

        createPartida(partidaId, partida.name);
    });
});
