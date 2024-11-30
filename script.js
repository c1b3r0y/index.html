document.addEventListener('DOMContentLoaded', () => {
    const charactersDiv = document.getElementById('characters');
    const createCharacterButton = document.getElementById('createCharacter');

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

            // Botón para desplegar/ocultar la información del personaje
            const toggleInfoButton = document.createElement('button');
            toggleInfoButton.textContent = "Mostrar/Ocultar Información";
            toggleInfoButton.addEventListener('click', () => {
                const baulContainer = document.getElementById(`baul_${characterName}`);
                baulContainer.style.display = baulContainer.style.display === 'none' ? 'block' : 'none';
            });
            characterDiv.appendChild(toggleInfoButton);

            // Contenedor para el baúl
            const baulContainer = document.createElement('div');
            baulContainer.id = `baul_${characterName}`;
            baulContainer.style.display = 'none';
            characterDiv.appendChild(baulContainer);

            const form = createBaulForm(characterName, baulContainer);
            baulContainer.appendChild(form);

            // Contenedor para mostrar datos guardados
            const savedDataDiv = document.createElement('div');
            savedDataDiv.id = `savedData_${characterName}`;
            baulContainer.appendChild(savedDataDiv);

            charactersDiv.appendChild(characterDiv);

            // Mostrar datos guardados en tiempo real
            displaySavedData(characterName, savedDataDiv);
        } else {
            alert('Debe ingresar un nombre para el personaje.');
        }
    });

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
                console.error('Error al guardar el elemento:', error);
            }
        });

        return form;
    }

    function displaySavedData(characterName, savedDataDiv) {
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
                    div.classList.add('baul-item');

                    let photoHtml = '';
                    if (data.photoURL) {
                        photoHtml = `<img src="${data.photoURL}" alt="${data.name}" class="preview-image">`;
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

    window.editItem = (characterName, id, currentName, currentDescription) => {
        const newName = prompt("Editar nombre:", currentName);
        const newDescription = prompt("Editar descripción:", currentDescription);

        if (newName && newDescription) {
            const entryRef = ref(database, `characters/${characterName}/baul/${id}`);
            update(entryRef, { name: newName, description: newDescription })
                .then(() => alert('Elemento actualizado correctamente'))
                .catch((error) => console.error('Error al actualizar el elemento:', error));
        }
    };

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
