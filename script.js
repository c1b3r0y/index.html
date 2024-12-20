import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove, query, orderByChild } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

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
        previewImage.src = '';
        previewDiv.style.display = 'none';
    }
});

// Subir la imagen a ImgBB
async function uploadToImgBB(imageFile) {
    if (!imageFile) return null; // Si no hay imagen, retorna null

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
    const photo = photoInput.files[0]; // Obtén la imagen cargada

    if (!name || !description) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    let photoURL = null;

    try {
        if (photo) {
            console.log('Subiendo la imagen a ImgBB...');
            photoURL = await uploadToImgBB(photo);
            console.log('Imagen subida a ImgBB. URL:', photoURL);
        }
    } catch (error) {
        console.error('Error al subir la imagen a ImgBB:', error);
        alert('Hubo un problema al subir la imagen. Guardaremos el comentario sin la imagen.');
    }

    try {
        console.log('Guardando datos en Firebase...');
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
        alert('Hubo un problema al guardar el comentario.');
    }
});

// Cargar todos los comentarios
onValue(
    query(ref(database, 'entries'), orderByChild('timestamp')),
    (snapshot) => {
        savedDataDiv.innerHTML = ""; // Limpia los datos previos

        // Almacena los datos en un array para invertir el orden
        const comments = [];
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            const id = childSnapshot.key;
            comments.push({ id, ...data });
        });

        // Recorre los comentarios en orden inverso
        comments.reverse().forEach((data) => {
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
                <button onclick="editComment('${data.id}', '${data.name}', '${data.description}')">Editar</button>
                <button onclick="deleteComment('${data.id}')">Eliminar</button>
            `;

            savedDataDiv.appendChild(div);
        });
    }
);

// Función para editar un comentario
window.editComment = (id, currentName, currentDescription) => {
    const newName = prompt("Editar nombre:", currentName);
    const newDescription = prompt("Editar descripción:", currentDescription);

    if (newName && newDescription) {
        const entryRef = ref(database, `entries/${id}`);
        update(entryRef, {
            name: newName,
            description: newDescription
        })
            .then(() => alert('Comentario actualizado correctamente'))
            .catch((error) => console.error('Error al actualizar el comentario:', error));
    }
};

// Función para eliminar un comentario
window.deleteComment = (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este comentario?")) {
        const entryRef = ref(database, `entries/${id}`);
        remove(entryRef)
            .then(() => alert('Comentario eliminado correctamente'))
            .catch((error) => console.error('Error al eliminar el comentario:', error));
    }
};
