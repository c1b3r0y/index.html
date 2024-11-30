// Cargar todos los comentarios
onValue(ref(database, 'entries'), (snapshot) => {
    savedDataDiv.innerHTML = ""; // Limpia los datos previos

    // Convierte los datos en un array procesable
    const entries = [];
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const id = childSnapshot.key; // Obtiene el ID único del comentario
        entries.push({ id, ...data });
    });

    // Asegúrate de que las entradas existen antes de intentar renderizar
    if (entries.length > 0) {
        // Invertir el orden del array
        entries.reverse();

        // Renderizar las entradas en el DOM
        entries.forEach((entry) => {
            const div = document.createElement('div');
            div.style.border = '1px solid #ddd';
            div.style.padding = '10px';
            div.style.marginBottom = '10px';

            let photoHtml = '';
            if (entry.photoURL) {
                photoHtml = `<img src="${entry.photoURL}" alt="Imagen de ${entry.name}" style="max-width: 200px; margin-top: 10px;">`;
            }

            div.innerHTML = `
                <h3>${entry.name}</h3>
                <p>${entry.description}</p>
                ${photoHtml}
                <button onclick="editComment('${entry.id}', '${entry.name}', '${entry.description}')">Editar</button>
                <button onclick="deleteComment('${entry.id}')">Eliminar</button>
            `;

            savedDataDiv.appendChild(div);
        });
    } else {
        savedDataDiv.innerHTML = "<p>No hay datos disponibles</p>";
    }
});
