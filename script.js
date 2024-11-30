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
const charactersDiv = document.getElementById('characters');
const createCharacterButton = document.getElementById('createCharacter');

// Crear un nuevo personaje
createCharacterButton.addEventListener('click', () => {
    const characterName = prompt("Ingrese el nombre del personaje:");
    if (characterName) {
        const characterDiv = document.createElement('div');
        characterDiv.style.border = '1px solid #ddd';
        characterDiv.style.margin = '10px';
        characterDiv.style.padding = '10px';

        const title = document.createElement('h3');
        title.textContent = `Personaje: ${characterName}`;
        characterDiv.appendChild(title);

        const baulButton = document.createElement('button');
        baulButton.textContent = "Baúl del personaje";
        baulButton.addEventListener('click', () => showBaul(characterName, characterDiv));
        characterDiv.appendChild(baulButton);

        charactersDiv.appendChild(characterDiv);
    } else {
        alert('Debe ingresar un nombre para el personaje.');
    }
});

// Mostrar el baúl de un personaje
function showBaul(characterName, parentDiv) {
    // Crear elementos del formulario
    const form = document.createElement('form');
    form.id = `form_${characterName}`;
    form.innerHTML = `
        <h4>Agregar al Baúl de ${characterName}</h4>
        <input type="text" id="name_${characterName}" placeholder="Nombre" required>
        <textarea id="description_${characterName}" placeholder="Descripción" required></textarea>
        <input type="file" id="photo_${characterName}">
        <div id="preview_${characterName}" style="display: none;">
            <img id="previewImage_${characterName}" style="max-width: 200px;">
        </div>
        <button type="submit">Guardar</button>
        <div id="savedData_${characterName}" style="margin-top: 10px;"></div>
    `;

    // Agregar eventos al formulario
    const photoInput = form.querySelector(`#photo_${characterName}`);
    const previewDiv = form.querySelector(`#preview_${characterName}`);
    const previewImage = form.querySelector(`#previewImage_${characterName}`);
    const savedDataDiv = form.querySelector(`#savedData_${characterName}`);

    // Vista previa de la imagen
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

    // Guardar en Firebase
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = form.querySelector(`#name_${characterName}`).value.trim();
        const description = form.querySelector(`#description_${characterName}`).value.trim();
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
            alert('Hubo un problema al subir la imagen. Guardaremos el comentario sin la imagen.');
        }

        try {
            const newEntryRef = push(ref(database, `characters/${characterName}/baul`));
            await set(newEntryRef, {
                name,
                description,
                photoURL,
                timestamp: new Date().toISOString()
            });

            alert('Elemento agregado al baúl correctamente');
            form.reset();
            previewImage.src = '';
            previewDiv.style.display = 'none';
        } catch (error) {
            console.error('Error al guardar el elemento en Firebase:', error);
        }
    });

    // Mostrar elementos guardados
    onValue(
        query(ref(database, `characters/${characterName}/baul`), orderByChild('timestamp')),
        (snapshot) => {
            savedDataDiv.innerHTML = "";
            const items = [];
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                const id = childSnapshot.key;
                items.push({ id, ...data });
            });

            items.reverse().forEach((data) => {
                const div = document.createElement('div');
                div.style.border = '1px solid #ddd';
                div.style.padding = '10px';
                div.style.marginBottom = '10px';

                let photoHtml = '';
                if (data.photoURL) {
                    photoHtml = `<img src="${data.photoURL}" alt="Imagen de ${data.name}" style="max-width: 200px; margin-top: 10px;">`;
                }

                div.innerHTML = `
                    <h5>${data.name}</h5>
                    <p>${data.description}</p>
                    ${photoHtml}
                `;

                savedDataDiv.appendChild(div);
            });
        }
    );

    parentDiv.appendChild(form);
}

// Subir imagen a ImgBB
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
    return data.data.url;
}
