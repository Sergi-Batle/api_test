var files_to_ingest = [];
var ingested_files = [];
var selected_files = [];
var relations;
const ip = '127.0.0.1';
const port = '8001';
const url = `${ip}:${port}`;


function selectFile() {
    var fileInput = document.getElementById('fileInput');
    openFile(fileInput);
}


function openFile(fileInput) {
    var ingested = [];
    var check = false;
    // Verificar si se ha seleccionado un archivo
    if (fileInput.files.length > 0) {
        // Obtener todos los archivos seleccionados
        var files = fileInput.files;

        // Iterar sobre todos los archivos seleccionados
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (ingested_files.includes(file.name)) {
                ingested.push(file.name);
                check = true;
                continue;
            }
            files_to_ingest.push(file);
        }

        // Llamar a la función para actualizar la lista de archivos para cargar
        setFilesToIngest();
    }
    if (check) {
        var names = ''
        if (ingested.length > 1) {
            for (var i = 0; i < ingested.length; i++) {
                names += ingested[i] + ', ';
                if (i == ingested.length - 1) {
                    names += `${ingested[i]} ya han sido procesados `
                }
            }
            alert(`Los archivos ${names}`)
        } else {
            alert(`El archivo ${ingested[0]} ya ha sido procesado`)
        }
    }
}


function setFilesToIngest() {
    // Obtener el elemento de lista de archivos para cargar
    var fileListPre = document.getElementById('file-list-pre');

    // Limpiar la lista
    fileListPre.innerHTML = '';

    // Recorrer la lista de archivos para ingestión y agregar los nombres a la lista HTML
    files_to_ingest.forEach(function (file) {
        var listItem = document.createElement('li');
        listItem.textContent = file.name;
        listItem.className = 'list-group-item no-collapse'
        fileListPre.appendChild(listItem);
    });
}


function resetPreFiles() {
    var fileListPre = document.getElementById('file-list-pre');
    fileListPre.innerHTML = '';
    files_to_ingest = [];
}


async function ingestFiles() {
    if (files_to_ingest.length == 0) {
        alert('No hay archivos para subir')
    } else {
        for (const file of files_to_ingest) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`http://${url}/v1/ingest/file`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const responseData = await response.json();
                    // Manejar la respuesta según sea necesario
                    console.log(responseData); // Por ejemplo, puedes mostrar la respuesta en la consola
                } else {
                    console.error('Error al enviar el archivo:', response.status);
                }
            } catch (error) {
                console.error('Error al procesar la solicitud:', error);
            }
        }
    }
}


async function getIngestedFiles() {
    try {
        const response = await fetch(`http://${url}/v1/ingest/list`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setIngestedFiles(data);
    } catch (error) {
        console.error('Error fetching ingested files:', error);
        alert('Error fetching ingested files. Please try again later.');
    }
}


function setIngestedFiles(data) {
    const fileListElement = document.getElementById('file-list-ingested');
    const fragment = document.createDocumentFragment(); // Create a document fragment
    const filenames = [];
    relations = relacionarDocId(JSON.stringify(data.data));

    data.data.forEach(doc => {
        // Check if the filename already exists in the filenames array
        if (!filenames.includes(doc.doc_metadata.file_name)) {
            // If not, add it to the filenames array and add to ingested_files
            filenames.push(doc.doc_metadata.file_name);

            // Create and append the list item to the document fragment
            const listItem = document.createElement('option');
            listItem.textContent = doc.doc_metadata.file_name;
            listItem.value = doc.doc_metadata.file_name;
            listItem.className = 'list-group-item no-collapse'
            fragment.appendChild(listItem);
        }
    });
    fileListElement.appendChild(fragment);
    console.log(relations)
    ingested_files = filenames;
}


function relacionarDocId(jsonData) {
    const data = JSON.parse(jsonData);
    const relacionDocId = {};

    data.forEach(obj => {
        const fileName = obj.doc_metadata.file_name;
        const docId = obj.doc_id;

        if (fileName in relacionDocId) {
            relacionDocId[fileName].push(docId);
        }
        else {
            relacionDocId[fileName] = [docId];
        }
    });

    return relacionDocId;
}


async function keepAlive() {
    try {
        const response = await fetch(`http://${url}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const status = data.status;
        if (status === 'ok') {
            console.log('Conexion establecida');
        }
    } catch (error) {
        console.error('Error fetching ingested files:', error);
        alert('Conexión perdida.');
    }
}


function addToSelectedList(selectElement) {
    var selectedOptions = selectElement.selectedOptions;
    var selectedList = document.getElementById('file-list-selected');

    // Recorremos todas las opciones seleccionadas
    for (var i = 0; i < selectedOptions.length; i++) {
        var selectedOption = selectedOptions[i];
        var selectedValue = selectedOption.value;
        var selectedText = selectedOption.textContent;

        // Verificamos si el valor ya está presente en la lista
        var alreadyExists = false;
        var listItems = selectedList.getElementsByTagName('li');
        for (var j = 0; j < listItems.length; j++) {
            if (listItems[j].getAttribute('value') === selectedValue) {
                alreadyExists = true;
                break;
            }
        }

        // Si el valor no está presente, lo agregamos a la lista
        if (!alreadyExists) {
            selected_files.push(selectedValue);
            var newListItem = document.createElement('li');
            newListItem.textContent = selectedText;
            newListItem.className = 'list-group-item no-collapse';
            newListItem.setAttribute('value', selectedValue);
            selectedList.appendChild(newListItem);
        }
    }
}

function clearSelectedList() {
    selected_files = [];
    var selectedList = document.getElementById('file-list-selected');
    selectedList.innerHTML = '';
}


function selectAllOptions() {
    selected_files = ingestFiles;
    var select = document.getElementById('file-list-ingested');
    var selectedList = document.getElementById('file-list-selected');

    // Recorremos todas las opciones del select
    for (var i = 0; i < select.options.length; i++) {
        var option = select.options[i];
        var optionValue = option.value;
        var optionText = option.textContent;

        // Verificamos si el valor ya está presente en la lista
        var alreadyExists = false;
        var listItems = selectedList.getElementsByTagName('li');
        for (var j = 0; j < listItems.length; j++) {
            if (listItems[j].getAttribute('value') === optionValue) {
                alreadyExists = true;
                break;
            }
        }

        // Si el valor no está presente, lo agregamos a la lista
        if (!alreadyExists) {
            var newListItem = document.createElement('li');
            newListItem.textContent = optionText;
            newListItem.setAttribute('value', optionValue);
            selectedList.appendChild(newListItem);
        }
    }
}


function deleteFiles() {
    if (selected_files.length == 0) {
        alert('No hay archivos seleccionados')
    } else {
        for (const fileName in relations) {
            if (fileName in selected_files) {
                console.log(`Archivo: ${fileName}`);
                const ids = data[fileName];
                console.log(`IDs:`);
                ids.forEach(id => {
                    console.log(id);
                });
            }
        }
    }
}


async function deleteFile(doc_id) {
    try {
        const response = await fetch(`http://${url}/v1/ingest/${doc_id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log(`Archivo "${file}" eliminado correctamente.`);
        } else {
            console.error('Error al eliminar el archivo:', response.status);
        }
    } catch (error) {
        console.error('Error al procesar la solicitud de eliminar:', error);
    }
}


function seeSelected() {
    for (var i = 0; i < selected_files.length; i++) {
        console.log(selected_files[i]);
    }
}


function seeIngested() {
    console.log('ingested files:')
    for (var i = 0; i < ingested_files.length; i++) {
        console.log(ingested_files[i]);
    }
}

setInterval(keepAlive, 4000);
getIngestedFiles();