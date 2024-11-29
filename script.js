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
const partidasDiv = document.getElementById('partidas');
const addPartidaButton = document.getElementById('addPartida');

// Función para crear una nueva partida
function createPartida(id, name = 'Nueva Partida') {
    const partidaDiv = document.createElement('div');
    partidaDiv.id = `partida-${id}`;
    partidaDiv.style.border = '1px solid #ddd';
    partidaDiv.style.padding = '10px';
    partidaDiv.style.marginBottom = '10px';

    partidaDiv.innerHTML = `
        <h2 contenteditable="true" onblur="updatePartidaName('${id}', this.innerText)">${name}</h2>
        <button onclick="addPersonaje('${id}')">Agregar Personaje</button>
        <div class="personajes" id="personajes-${id}"></div>
    `;

    partidasDiv.appendChild(partidaDiv);
}

// Agregar nueva partida al presionar el botón "+"
addPartidaButton.addEventListener('click', () => {
    const newPartidaRef = push(ref(database, 'partidas'));
    set(newPartidaRef, { name: 'Nueva Partida', personajes: {} });
});

// Cargar las partidas desde Firebase
onValue(ref(database, 'partidas'), (snapshot) => {
    partidasDiv.innerHTML = ''; // Limpia las partidas previas
    snapshot.forEach((childSnapshot) => {
        const partidaData = childSnapshot.val();
        const partidaId = childSnapshot.key;
        createPartida(partidaId, partidaData.name);

        const personajesDiv = document.getElementById(`personajes-${partidaId}`);
        if (partidaData.personajes) {
            for (const personajeId in partidaData.personajes) {
                const personaje = partidaData.personajes[personajeId];
                createPersonaje(partidaId, personajeId, personaje.name, personaje.description, personaje.photoURL);
            }
        }
    });
});

// Función para agregar un personaje
window.addPersonaje = (partidaId) => {
    const personajesDiv = document.getElementById(`personajes-${partidaId}`);
    const personajeForm = document.createElement('form');

    personajeForm.innerHTML = `
        <label>Nombre:</label>
        <input type="text" required>
        <label>Descripción:</label>
        <textarea rows="2" required></textarea>
        <label>Imagen:</label>
        <input type="file" accept="image/png, image/jpeg">
        <button type="submit">Guardar</button>
    `;

    personajeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = personajeForm.querySelector('input[type="text"]').value.trim();
        const description = personajeForm.querySelector('textarea').value.trim();
        const photoFile = personajeForm.querySelector('input[type="file"]').files[0];
        let photoURL = null;

        if (photoFile) {
            const formData = new FormData();
            formData.append('image', photoFile);
            const response = await fetch(`https://api.imgbb.com/1/upload?key=e7186e33106d5b82ebcc518e2bf11103`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            photoURL = data.data.url;
        }

        const newPersonajeRef = push(ref(database, `partidas/${partidaId}/personajes`));
        await set(newPersonajeRef, { name, description, photoURL });
        personajeForm.reset();
    });

    personajesDiv.appendChild(personajeForm);
};

// Crear un personaje visualmente
function createPersonaje(partidaId, personajeId, name, description, photoURL) {
    const personajesDiv = document.getElementById(`personajes-${partidaId}`);
    const personajeDiv = document.createElement('div');
    personajeDiv.style.border = '1px solid #ccc';
    personajeDiv.style.marginTop = '10px';
    personajeDiv.style.padding = '10px';

    let photoHtml = '';
    if (photoURL) {
        photoHtml = `<img src="${photoURL}" alt="${name}" style="max-width: 100px; margin-top: 10px;">`;
    }

    personajeDiv.innerHTML = `
        <h3>${name}</h3>
        <p>${description}</p>
        ${photoHtml}
        <button onclick="deletePersonaje('${partidaId}', '${personajeId}')">Eliminar</button>
    `;

    personajesDiv.appendChild(personajeDiv);
}

// Función para eliminar un personaje
window.deletePersonaje = (partidaId, personajeId) => {
    const personajeRef = ref(database, `partidas/${partidaId}/personajes/${personajeId}`);
    remove(personajeRef);
};

// Función para actualizar el nombre de la partida
window.updatePartidaName = (id, newName) => {
    const partidaRef = ref(database, `partidas/${id}`);
    update(partidaRef, { name: newName });
};
