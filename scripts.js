const ip = '127.0.0.1';
const port = '8001';
const url = `${ip}:${port}`;
var mode = true;
var files_to_ingest = [];
var file_names_to_ingest = [];
var ingested_files = [];
var selected_files = [];


function selectFile(element) {
    openFile(element);
    element.value = null;
}


function openFile(fileInput) {
    var ingested = [];
    var check = false;
    if (fileInput.files.length > 0) {
        var files = fileInput.files;
        for (var file of files) {
            var file_name = file.name;
            if (ingested_files.includes(file_name)) {
                ingested.push(file_name);
                check = true;
            } else if (file_names_to_ingest.includes(file_name)) {
                continue;
            } else {
                file_names_to_ingest.push(file_name);
                files_to_ingest.push(file);
            }
        }
        setFilesToIngest();
    }

    if (check) {
        var already_ingested = '';
        if (ingested.length > 1) {
            for (var i = 0; i < ingested.length; i++) {
                already_ingested += ingested[i] + ', ';
                if (i == ingested.length - 1) {
                    already_ingested += `${ingested[i]} ya han sido procesados `
                }
            }
            alert(`Los archivos ${names}`)
        } else {
            alert(`El archivo ${ingested[0]} ya ha sido procesado`)
        }
    }
}


function setFilesToIngest() {
    var fileListPre = document.getElementById('file-list-pre');
    fileListPre.innerHTML = '';
    file_names_to_ingest.forEach(function (name) {
        var listItem = document.createElement('li');
        listItem.textContent = name;
        listItem.className = 'pl-4 p-2 no-collapse'
        fileListPre.appendChild(listItem);
    });
}


function resetPreFiles() {
    var fileListPre = document.getElementById('file-list-pre');
    fileListPre.innerHTML = '';
    files_to_ingest = [];
    file_names_to_ingest = [];
}


async function ingestFiles() {
    var loading = document.getElementById('loading');
    if (files_to_ingest.length == 0) {
        alert('No hay archivos para subir')
    } else {
        var count = files_to_ingest.length;
        console.log('start count: ');
        for (var file of files_to_ingest) {
            loading.style.display = 'flex';
            ingestFile(file, loading);
        }
    }
}


async function ingestFile(file, loading) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`http://${url}/v1/ingest/file`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            var responseData = await response.json();
            console.log(responseData);
            getIngestedFiles();
            loading.style.display = 'none';

        } else {
            console.error('Error al enviar el archivo:', response.status);
        }
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
    }
}


async function getIngestedFiles() {
    ingested_files = [];
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
        data.forEach(function (fileName) {
            ingested_files.push(fileName);
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


function clearSelectedList() {
    selected_files = [];
    var selectedList = document.getElementById('file-list-selected');
    selectedList.innerHTML = '';
}


function addToSelectedList(selectElement) {
    var selectedList = document.getElementById('file-list-selected');
    var selected = Array.from(selectElement.options)
        .filter(function (option) {
            return option.selected;
        })
        .map(function (option) {
            return option.value;
        });
    selected.forEach(function (value) {
        if (!selected_files.includes(value)) {
            selected_files.push(value);
            var newListItem = document.createElement('li');
            newListItem.textContent = value;
            newListItem.className = 'pl-4 p-2 border no-collapse';
            newListItem.setAttribute('value', value);
            selectedList.appendChild(newListItem);
        }
    });
    selectElement.value = '';
}


function selectAllOptions() {
    var selectedList = document.getElementById('file-list-selected');
    ingested_files.forEach(function (value) {
        if (!selected_files.includes(value)) {
            selected_files.push(value);
            var newListItem = document.createElement('li');
            newListItem.textContent = value;
            newListItem.className = 'pl-4 p-2 border no-collapse';
            newListItem.setAttribute('value', value);
            selectedList.appendChild(newListItem);
        }
    });
}


async function deleteFiles() {
    var deleting = document.getElementById('deleting');
    if (selected_files.length === 0) {
        alert('No hay archivos seleccionados');
        confirmDelete();
    } else {
        for (var fileName of selected_files) {
            deleting.style.display = 'block';
            deleteFile(fileName, deleting)
        }
    }
    clearSelectedList();
}


async function deleteFile(file_name, deleting) {
    try {
        const response = await fetch(`http://${url}/v1/ingest/${file_name}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            getIngestedFiles();
            deleting.style.display = 'none';
        } else {
            deleting.style.display = 'none';
            throw new Error(`Error al eliminar el archivo ${doc_id}: ${response.status}`);
        }

    } catch (error) {
        console.error('Error al procesar la solicitud de eliminar:', error);
    }
}


async function search() {
    var input = document.getElementById('input');
    var value = input.value.trim();
    var display = document.getElementById('chat');
    var loading = document.getElementById('loading-chat');
    var cronometro = document.getElementById('chat-crono');
    var startTime, requestId;

    if (value !== '') {
        loading.style.display = 'block';
        display.innerHTML += "<div class='border bg-primary text-light p-2 ml-auto message mt-2 mb-2'>" + value + "</div>";
        try {
            input.value = '';
            const requestBody = {
                text: value,
                limit: 300,
                prev_next_chunks: 100
            };
            startTime = performance.now();
            requestId = requestAnimationFrame(updateElapsedTime);
            var response = await fetch(`http://${url}/v1/chunks`, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            cancelAnimationFrame(requestId);
            var endTime = performance.now();

            console.log('Chunks response:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            } else {
                loading.style.display = 'none';
                const responseTimeInSeconds = (endTime - startTime) / 1000;
                cronometro.textContent = responseTimeInSeconds.toFixed(2) + ' s';
            }

            var responseData = await response.json();
            var messages = '';
            var count = 1;
            responseData.data.forEach((chunk) => {
                var windowText = chunk.document.doc_metadata.window;
                var originalText = chunk.document.doc_metadata.original_text;
                var text = chunk.text;
                var previousTexts = chunk.previous_texts;
                var nextTexts = chunk.next_texts;
                var file = chunk.document.doc_metadata.file_name;
                var page = chunk.document.doc_metadata.page_label;
                var message;
                if (comprobarContenido(value, text)) {
                    if (page === undefined) {
                        message = `
                                   ${count} . <b>${file}</b>
                                   </br>
                                   ${text}
                                   </br></br>`
                    } else {
                        message = `
                                    ${count} . <b>${file} (pagina ${page})</b>
                                   </br>
                                   ${text}
                                   </br></br>`
                    }
                    messages += message;
                    count++;
                }
            });
            if (messages !== '') {
                display.innerHTML += "<div class='border bg-dark text-light p-2 message'>" + messages + "</div>";
            }
            display.scrollTop = display.scrollHeight;
        } catch (error) {
            console.error('There was an error with the fetch request:', error);
            cancelAnimationFrame(requestId);
        }
    }

    function updateElapsedTime(currentTime) {
        const elapsedTime = (currentTime - startTime) / 1000;
        cronometro.textContent = elapsedTime.toFixed(2) + ' s';
        requestId = requestAnimationFrame(updateElapsedTime);
    }
}


function send() {
    console.log('mode: ', mode);
    if (mode) {
        search();
    } else {

    }
}


function confirmDelete() {
    var del = document.getElementById('delete');
    var conf = document.getElementById('confirm-delete');

    if (del.style.display === 'flex') {
        del.style.display = 'none';
        conf.style.display = 'flex';
    } else {
        del.style.display = 'flex';
        conf.style.display = 'none';
    }
}


function comprobarContenido(cadena1, cadena2) {
    var server_words = cadena2.split(' ');
    var user_words = cadena1.split(' ');
    var encontrada = false;

    user_words.forEach(function (palabra, index) {
        user_words[index] = processText(palabra);
    });

    server_words.forEach(function (palabra) {
        var server = processText(palabra);
        var user = processText(cadena1);

        console.log(server, ' &&  ', user)
        console.log(user_words);
        if (user_words.includes(server)) {
            console.log('conincidencia: ', palabra, 'CON :', cadena1)
            console.log('EN: ', server_words)
            encontrada = true;
        }
    });
    return encontrada;
}


function processText(cadena) {
    cadena = cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    cadena = cadena.replace(/[.,()'…":\[\]\n\[\t]—]/g, '');
    cadena = cadena.toLowerCase();

    return cadena;
}

function changeMode1() {
    var search = document.getElementById('search');
    var query = document.getElementById('query');

    mode = true;
    search.className = 'btn btn-primary';
    query.className = 'btn btn-secondary';
}


function changeMode2() {
    var search = document.getElementById('search');
    var query = document.getElementById('query');

    mode = false;
    search.className = 'btn btn-secondary';
    query.className = 'btn btn-primary';
}

function reset() {
    var display = document.getElementById('chat');
    var input = document.getElementById('input');
    display.innerHTML = '';
    input.value = '';
}


function handleKeyPress(event) {
    if (event.key === "Enter") {
        send();
    }
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

function openDir() {
    document.getElementById('input-dir').click();
}

setInterval(keepAlive, 20000);
getIngestedFiles();