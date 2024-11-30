document.addEventListener('DOMContentLoaded', () => {
    const charactersDiv = document.getElementById('characters');
    const createCharacterButton = document.getElementById('createCharacter');

    // Crear un nuevo personaje
    createCharacterButton.addEventListener('click', () => {
        const characterName = prompt("Ingrese el nombre del personaje:");
        if (characterName) {
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
            baulButton.textContent = "Mostrar Baúl";
            baulButton.addEventListener('click', () => toggleBaul(characterName, characterDiv));
            characterDiv.appendChild(baulButton);

            // Contenedor para el baúl y la tabla
            const baulContainer = document.createElement('div');
            baulContainer.id = `baul_${characterName}`;
            baulContainer.style.display = 'none';
            characterDiv.appendChild(baulContainer);

            const form = createBaulForm(characterName, baulContainer);
            baulContainer.appendChild(form);

            // Contenedor para mostrar los datos guardados
            const tableContainer = document.createElement('div');
            tableContainer.id = `tableContainer_${characterName}`;
            baulContainer.appendChild(tableContainer);

            charactersDiv.appendChild(characterDiv);

            // Mostrar datos guardados en tiempo real
            displaySavedData(characterName, tableContainer);
        } else {
            alert('Debe ingresar un nombre para el personaje.');
        }
    });

    function toggleBaul(characterName, parentDiv) {
        const baulContainer = document.getElementById(`baul_${characterName}`);
        baulContainer.style.display = baulContainer.style.display === 'none' ? 'block' : 'none';
    }

    function createBaulForm(characterName, baulContainer) {
        const form = document.createElement('form');
        form.innerHTML = `
            <h4>Agregar al Baúl de ${characterName}</h4>
            <input type="text" placeholder="Nombre" id="name_${characterName}" required>
            <br>
            <textarea placeholder="Descripción" id="description_${characterName}" required></textarea>
            <br>
            <input type="file" id="photo_${characterName}">
            <div id="preview_${characterName}" style="display: none;">
                <img id="previewImage_${characterName}" class="preview-image">
            </div>
            <br>
            <button type="submit">Guardar</button>
        `;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById(`name_${characterName}`).value.trim();
            const description = document.getElementById(`description_${characterName}`).value.trim();
            const photoInput = document.getElementById(`photo_${characterName}`);
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
                console.error('Error al subir la imagen:', error);
                alert('Guardaremos el elemento sin la imagen.');
            }

            try {
                const newEntryRef = push(ref(database, `characters/${characterName}/baul`));
                await set(newEntryRef, { name, description, photoURL, timestamp: new Date().toISOString() });

                alert('Elemento agregado al baúl correctamente');
                form.reset();
                const previewDiv = document.getElementById(`preview_${characterName}`);
                previewDiv.style.display = 'none';
            } catch (error) {
                console.error('Error al guardar el elemento en Firebase:', error);
            }
        });

        return form;
    }

    function displaySavedData(characterName, tableContainer) {
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Imagen</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="tableBody_${characterName}">
            </tbody>
        `;
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);

        const tableBody = document.getElementById(`tableBody_${characterName}`);

        onValue(
            query(ref(database, `characters/${characterName}/baul`), orderByChild('timestamp')),
            (snapshot) => {
                tableBody.innerHTML = "";
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    const id = childSnapshot.key;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td contenteditable="true" data-id="${id}" data-field="name">${data.name}</td>
                        <td contenteditable="true" data-id="${id}" data-field="description">${data.description}</td>
                        <td>
                            ${data.photoURL ? `<img src="${data.photoURL}" alt="${data.name}" class="preview-image" style="width: 50px;">` : ''}
                        </td>
                        <td>
                            <button onclick="deleteItem('${characterName}', '${id}')">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                makeTableEditable(characterName);
            }
        );
    }

    function makeTableEditable(characterName) {
        const tableBody = document.getElementById(`tableBody_${characterName}`);
        tableBody.addEventListener('input', (e) => {
            const cell = e.target;
            const id = cell.dataset.id;
            const field = cell.dataset.field;
            const newValue = cell.textContent.trim();

            if (id && field) {
                const entryRef = ref(database, `characters/${characterName}/baul/${id}`);
                update(entryRef, { [field]: newValue })
                    .then(() => console.log(`${field} actualizado correctamente`))
                    .catch((error) => console.error(`Error al actualizar ${field}:`, error));
            }
        });
    }

    window.deleteItem = (characterName, id) => {
        if (confirm("¿Estás seguro de que deseas eliminar este elemento?")) {
            const entryRef = ref(database, `characters/${characterName}/baul/${id}`);
            remove(entryRef)
                .then(() => alert('Elemento eliminado correctamente'))
                .catch((error) => console.error('Error al eliminar el elemento:', error));
        }
    };

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
});
