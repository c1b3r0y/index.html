// Configuración de ImgBB
const imgbbApiKey = 'TU_API_KEY'; // Reemplaza con tu API Key de ImgBB

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
        previewImage.src = ''; // Limpiar la vista previa si no hay archivo
        previewDiv.style.display = 'none';
    }
});

// Subir la imagen a ImgBB
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
    return data.data.url; // Retorna la URL pública de la imagen
}

// Manejo del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const photo = photoInput.files[0];

    if (!name || !description) {
        alert('Por favor, completa el nombre y la descripción.');
        return;
    }

    let photoURL = null;

    if (photo) {
        try {
            console.log('Subiendo la imagen a ImgBB...');
            photoURL = await uploadToImgBB(photo);
            console.log('Imagen subida. URL:', photoURL);
        } catch (error) {
            console.error('Error al subir la imagen:', error);
            alert('Hubo un problema al subir la imagen.');
            return;
        }
    } else {
        alert('Por favor, selecciona una imagen.');
        return;
    }

    // Mostrar los datos guardados
    addDataToPage(name, description, photoURL);

    // Resetear el formulario
    form.reset();
    previewImage.src = '';
    previewDiv.style.display = 'none';
});

// Mostrar los datos guardados en la página
function addDataToPage(name, description, photoURL) {
    const div = document.createElement('div');
    div.style.border = '1px solid #ddd';
    div.style.padding = '10px';
    div.style.marginBottom = '10px';

    div.innerHTML = `
        <h3>${name}</h3>
        <p>${description}</p>
        <img src="${photoURL}" alt="Imagen de ${name}" style="max-width: 200px; margin-top: 10px;">
    `;

    savedDataDiv.appendChild(div);
}
