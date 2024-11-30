// Cargar todos los comentarios
onValue(ref(database, 'entries'), (snapshot) => {
    savedDataDiv.innerHTML = ""; // Limpia los datos previos

    // Convierte los datos a un array y los invierte
    const entries = [];
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const id = childSnapshot.key; // Obtiene el ID único del comentario
        entries.push({ id, ...data });
    });

    // Invertir el orden para mostrar desde la última entrada
    entries.reverse();

    // Renderiza los datos
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
});
