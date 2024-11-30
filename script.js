// Importa las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove, query, orderByChild } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Configuración de Firebase (reemplaza con tus propias credenciales)
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    databaseURL: "YOUR_FIREBASE_DATABASE_URL",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID",
    measurementId: "YOUR_FIREBASE_MEASUREMENT_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// API Key de ImgBB (reemplaza con tu propia clave)
const imgbbApiKey = 'YOUR_IMGBB_API_KEY';

// Espera a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    const charactersDiv = document.getElementById('characters');
    const createCharacterButton = document.getElementById('createCharacter');

    // Crear un nuevo personaje
    createCharacterButton.addEventListener('click', () => {
        const characterName = prompt("Ingrese el nombre del personaje:");
        if (characterName) {
            // Verifica si el personaje ya existe
            if (document.getElementById(`character_${characterName}`)) {
                alert('Este personaje ya existe.');
                return;
            }

            const characterDiv = document.createElement('div');
            characterDiv.id = `character_${characterName}`;
            characterDiv.classList.add('character');

            const title = document.createElement('h3');
            title.textContent = `Personaje: ${characterName}`;
            characterDiv.appendChild(title);

            const baulButton = document.createElement('button');
            baulButton.textContent = "Baúl del personaje";
            baulButton.addEventListener('click', () => showBaul(characterName, characterDiv));
            characterDiv.appendChild(baulButton);

            // Contenedor para el baúl
            const baulContainer = document.createElement('div');
            baulContainer.id = `baul_${characterName}`;
            characterDiv.appendChild(baulContainer);

            charactersDiv.appendChild(characterDiv);
        } else {
            alert('Debe ingresar un nombre para el personaje.');
        }
    });

    // Mostrar el baúl de un personaje
    function showBaul(characterName, parentDiv) {
        const baulContainer = document.getElementById(`baul_${characterName}`);

        // Evitar que se duplique el formulario si ya se ha mostrado
        if (baulContainer.innerHTML !== '') {
            return;
        }

        // Crear elementos del formulario
        const form = document.createElement('form');
        form.id = `form_${characterName}`;
        form.innerHTML = `
            <h4>Agregar al Baúl de ${characterName}</h4>
            <input type="text" id="name_${characterName}" placeholder="Nombre" required>
            <br>
            <textarea id="description_${characterName}" placeholder="Descripción" required></textarea>
            <br>
            <input type="file" id="photo_${characterName}">
            <div id="preview_${characterName}" style="display: none;">
                <img id="previewImage_${characterName}" class="preview-image">
            </div>
            <br>
            <button type="submit">Guardar</button>
            <div id="savedData_${characterName}" style="margin-top: 20px;"></div>
        `;

        baulContainer.appendChild(form);

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
                alert('Hubo un problema al subir la imagen. Guardaremos el elemento sin la imagen.');
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

                // Mostrar los elementos en orden inverso (más recientes primero)
                items.reverse().forEach((data) => {
                    const div = document.createElement('div');
                    div.classList.add('baul-item');

                    let photoHtml = '';
                    if (data.photoURL) {
                        photoHtml = `<img src="${data.photoURL}" alt="Imagen de ${data.name}" class="preview-image">`;
                    }

                    div.innerHTML = `
                        <h5>${data.name}</h5>
                        <p>${data.description}</p>
                        ${photoHtml}
                        <button onclick="editItem('${characterName}', '${data.id}', '${data.name}', '${data.description}')">Editar</button>
                        <button onclick="deleteItem('${characterName}', '${data.id}')">Eliminar</button>
                    `;

                    savedDataDiv.appendChild(div);
                });
            }
        );
    }

    // Subir imagen a ImgBB
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

    // Función para editar un elemento
    window.editItem = (characterName, id, currentName, currentDescription) => {
        const newName = prompt("Editar nombre:", currentName);
        const newDescription = prompt("Editar descripción:", currentDescription);

        if (newName && newDescription) {
            const entryRef = ref(database, `characters/${characterName}/baul/${id}`);
            update(entryRef, {
                name: newName,
                description: newDescription
            })
                .then(() => alert('Elemento actualizado correctamente'))
                .catch((error) => console.error('Error al actualizar el elemento:', error));
        }
    };

    // Función para eliminar un elemento
    window.deleteItem = (characterName, id) => {
        if (confirm("¿Estás seguro de que deseas eliminar este elemento?")) {
            const entryRef = ref(database, `characters/${characterName}/baul/${id}`);
            remove(entryRef)
                .then(() => alert('Elemento eliminado correctamente'))
                .catch((error) => console.error('Error al eliminar el elemento:', error));
        }
    };
});
