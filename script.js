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

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!name || !description) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    try {
        const newEntryRef = push(ref(database, 'entries'));
        await set(newEntryRef, {
            name,
            description,
            timestamp: new Date().toISOString()
        });

        alert('Comentario guardado correctamente');
        form.reset();
        previewImage.src = '';
        previewDiv.style.display = 'none';
    } catch (error) {
        console.error('Error al guardar el comentario:', error);
        alert('Hubo un problema al guardar el comentario.');
    }
});

// Cargar todos los comentarios
onValue(ref(database, 'entries'), (snapshot) => {
    savedDataDiv.innerHTML = ""; // Limpia los datos previos
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const id = childSnapshot.key; // Obtiene el ID único del comentario
        const div = document.createElement('div');
        div.style.border = '1px solid #ddd';
        div.style.padding = '10px';
        div.style.marginBottom = '10px';

        div.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.description}</p>
            <button onclick="editComment('${id}', '${data.name}', '${data.description}')">Editar</button>
            <button onclick="deleteComment('${id}')">Eliminar</button>
        `;

        savedDataDiv.appendChild(div);
    });
});

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
