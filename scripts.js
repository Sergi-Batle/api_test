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
            console.log('files_to_ingest:', files_to_ingest);
            if (files_to_ingest.some(existingFile => existingFile.name === file.name)) {
                alert(`${file.name} ya ha sido seleccionado`);
            }
            else if (ingested_files.includes(file.name)) {
                ingested.push(file.name);
                check = true;
            } else {
                files_to_ingest.push(file);
            }

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
        listItem.className = 'pl-4 p-2 no-collapse'
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
                    console.log(responseData);
                    getIngestedFiles();
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
        relations = relacionarDocId(JSON.stringify(data.data));
        data.data.forEach(doc => {
            var name = doc.doc_metadata.file_name;
            if (!(ingested_files.includes(name))) {
                ingested_files.push(doc.doc_metadata.file_name);
            }
        });
        setIngestedFiles();
    } catch (error) {
        console.error('Error al obtener archivos guardados:', error);
        alert('Error al obtener archivos guardados');
    }
}


function setIngestedFiles() {
    const fileListElement = document.getElementById('file-list-ingested');
    fileListElement.innerHTML = '';
    const fragment = document.createDocumentFragment();
    ingested_files.forEach(function (name) {
        const listItem = document.createElement('option');
        listItem.textContent = name;
        listItem.value = name;
        listItem.className = 'list-group-item no-collapse'
        fragment.appendChild(listItem);

    });
    fileListElement.appendChild(fragment);
    console.log(relations)
    console.log('Ingested:', ingested_files);
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
        console.error('Error al obtener conexion:', error);
        alert('Conexión perdida.');
    }
}


function addToSelectedList(selectElement) {
    var selectedValue = selectElement.value;
    var selectedList = document.getElementById('file-list-selected');
    var selectedText = selectElement.options[selectElement.selectedIndex].textContent;

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
        newListItem.className = 'pl-4 p-2 border no-collapse';
        newListItem.setAttribute('value', selectedValue);
        selectedList.appendChild(newListItem);
    }
    selectElement.value = '';
}


function clearSelectedList() {
    selected_files = [];
    var selectedList = document.getElementById('file-list-selected');
    selectedList.innerHTML = '';
}


function selectAllOptions() {
    selected_files = ingested_files;
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
            newListItem.className = 'pl-4 p-2 border no-collapse';
            newListItem.setAttribute('value', optionValue);
            selectedList.appendChild(newListItem);
        }
    }
}


async function deleteFiles() {
    if (selected_files.length === 0) {
        alert('No hay archivos seleccionados');
    } else {
        for (const fileName in relations) {
            if (selected_files.includes(fileName)) {
                console.log(`Archivo: ${fileName}`);
                var ids = relations[fileName];
                console.log(`IDs:`);
                ids.forEach(id => {
                    console.log(id);
                });
                deleteFile(ids);
            }
        }
    }
    updateIngestedFiles();
    clearSelectedList();
}


function updateIngestedFiles() {
    ingested_files.forEach(function(ingestedFile, ingestedIndex) {
        selected_files.forEach(function(selectedFile) {
            if (ingestedFile === selectedFile) {
                ingested_files.splice(ingestedIndex, 1);
            }
        });
    });
    setIngestedFiles(ingested_files);
}


async function deleteFile(doc_ids) {
    try {
        const deletePromises = doc_ids.map(async (doc_id) => {
            const response = await fetch(`http://${url}/v1/ingest/${doc_id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar el archivo ${doc_id}: ${response.status}`);
            }

            console.log(`Archivo "${doc_id}" eliminado correctamente.`);
        });

        // Espera a que todas las promesas se resuelvan (es decir, todas las solicitudes DELETE se completen)
        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error al procesar la solicitud de eliminar:', error);
    }
}


async function send() {
    reset
    var input = document.getElementById('input').value.trim();
    var display = document.getElementById('chat');
    console.log('input', input);

    if (input === '') {
        display.innerHTML = 'Escribe papi';
    } else {
        try {
            const requestBody = {
                text: input,
                context_filter: {
                    docs_ids: [
                        '6f842806-9c28-4abb-a5ef-4f01c5c5ed12'
                    ]
                },
                limit: 10,
                prev_next_chunks: 2
            };
            console.log('Request body:', requestBody);

            const response = await fetch(`http://${url}/v1/chunks`, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Chunks response:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const responseData = await response.json();
            responseData.data.forEach(chunk => {
                var windowText = chunk.document.doc_metadata.window;
                var originalText = chunk.document.doc_metadata.original_text;
                var text = chunk.text;
                var previousTexts = chunk.previous_texts;
                var nextTexts = chunk.next_texts;
                var file = chunk.document.doc_metadata.file_name;

                console.log('Window Text:', windowText);
                console.log('Original Text:', originalText);
                console.log('Text:', text);
                console.log('Previous Texts:', previousTexts);
                console.log('Next Texts:', nextTexts);
                var mensage = `
                               Texto: ${text}
                               </br>
                               Fuente: ${file}
                               </br></br>
                               `
                display.innerHTML += mensage;
            });

        } catch (error) {
            console.error('There was an error with the fetch request:', error);
        }
    }
}


function reset() {
    var display = document.getElementById('chat');
    display.innerHTML = '';
}


function seeSelected() {
    console.log('selected files:');
    for (var i = 0; i < selected_files.length; i++) {
        console.log(selected_files[i]);
    }
}


function seeIngested() {
    console.log('ingested files:');
    for (var i = 0; i < ingested_files.length; i++) {
        console.log(ingested_files[i]);
    }
}


console.log(relations)

setInterval(keepAlive, 10000);
getIngestedFiles();