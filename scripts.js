const ip = '192.168.0.15';
const port = '8001';
const url = `${ip}:${port}`;
var deleteVisible = false;
var mode = false;
var files_to_ingest = [];
var file_names_to_ingest = [];
var ingested_files = [];
var selected_files = [];
var reader;
// const admin_code="make_this_parameterizable_per_api_call"
const admin_code = "sergi"


function selectFile(element) {
    openFile(element.files);
    element.value = null;
}


function selectDir(event) {
    var fileList = event.target.files;
    openFile(fileList);
}


function openFile(files) {
    var ingested = [];
    var check = false;
    if (files.length > 0) {
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
            alert(`Los archivos ${already_ingested}`)
        } else {
            alert(`El archivo ${ingested[0]} ya ha sido procesado`)
        }
    }
}

function ingestFiles() {
    var loading = document.getElementById('loading');
    if (files_to_ingest.length == 0) {
        alert('No hay archivos para subir')
    } else {
        for (var file of files_to_ingest) {
            loading.style.display = 'flex';
            ingestFile(file, loading);
        }
    }
    resetPreFiles();
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


async function ingestFile(file, loading) {
    try {
        var formData = new FormData();
        formData.append('file', file);
        var response = await fetch(`http://${url}/v1/ingest/file/${admin_code}`, {
            method: 'POST',
            body: formData,
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
        var response = await fetch(`http://${url}/v1/ingest/list/${admin_code}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        var data = await response.json();
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
    var fileListElement = document.getElementById('file-list-ingested');
    fileListElement.innerHTML = '';
    var fragment = document.createDocumentFragment();
    ingested_files.forEach(function (name) {
        var listItem = document.createElement('option');
        listItem.textContent = name;
        listItem.value = name;
        listItem.className = 'list-group-item no-collapse'
        fragment.appendChild(listItem);

    });
    fileListElement.appendChild(fragment);
}


async function keepAlive() {
    try {
        var response = await fetch(`http://${url}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        var data = await response.json();
        var status = data.status;
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
    confirmDelete();
    clearSelectedList();
}


async function deleteFile(file_name, deleting) {
    try {
        var response = await fetch(`http://${url}/v1/ingest/${file_name}/${admin_code}`, {
            method: 'DELETE',
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


async function send() {
    var input = document.getElementById('input');
    var searchDisplay = document.getElementById('search-display');
    var queryDisplay = document.getElementById('query-display');
    var loading = document.getElementById('loading-chat');
    var cronometro = document.getElementById('chat-crono');
    var value = input.value.trim();

    if (value != '') {
        loading.style.display = 'block';
        input.value = '';
        if (mode) {
            await search(value, searchDisplay, cronometro);
        } else {
            await query(value, queryDisplay, cronometro);
        }
        loading.style.display = 'none';
    }
}


async function getChunks(value, cronometro) {
    try {
        var requestBody = {
            text: value,
            limit: 100,
            prev_next_chunks: 50
        };
        var startTime = performance.now();
        var requestId = requestAnimationFrame(updateElapsedTime);
        var response = await fetch(`http://${url}/v1/chunks/${admin_code}`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',

            }
        });
        cancelAnimationFrame(requestId);
        var endTime = performance.now();

        if (!response.ok) {
            throw new Error('Network response was not ok');
        } else {
            var responseTimeInSeconds = (endTime - startTime) / 1000;
            cronometro.textContent = responseTimeInSeconds.toFixed(2) + ' s';
        }

        return await response.json();
    } catch (error) {
        console.error('There was an error with the fetch request:', error);
    }

    function updateElapsedTime(currentTime) {
        var elapsedTime = (currentTime - startTime) / 1000;
        cronometro.textContent = elapsedTime.toFixed(2) + ' s';
        requestId = requestAnimationFrame(updateElapsedTime);
    }
}


async function search(value, display, cronometro) {
    nextMsg();
    display.innerHTML += "<div id='msg-cont'><div class='border bg-primary text-light p-2 ml-auto message mt-2 mb-2'>" + value + "</div>";

    try {
        var responseData = await getChunks(value, cronometro);

        var messages = '';
        var count = 1;
        responseData.data.forEach((chunk) => {
            var text = chunk.text;
            var file = chunk.document.doc_metadata.file_name;
            var page = chunk.document.doc_metadata.page_label;
            if (comprobarContenido(value, text)) {
                var message = buildMessage(count, file, page, text)
                messages += message;
                count++;
            }
        });

        if (messages !== '') {
            display.innerHTML += "<div class='d-flex'><div class='border bg-dark text-light p-2 message'>" + messages + "</div><button id='up-btn' class='mt-auto ml-2 mb-1 align-items-center justify-content-center' onclick='goUp()'><div class='material-symbols-outlined'>arrow_upward</div></button></div></div>";
        }
        document.getElementById('chat').scrollTop = display.scrollHeight;
    } catch (error) {
        console.error('There was an error with the fetch request:', error);
    }
}


function buildMessage(count, file, page, text) {
    var message;
    var regex = /www\.[^\s]+/g;
    var links = text.match(regex);
    text = text.replace(/(www\.[^\s]+|https?:\/\/[^\s]+)/g, '');
    if (page === undefined) {
        message = `
                    ${count} . <b>${file}</b>
                    </br>
                    <p class='ml-2 m-0'>${text}</p>
                    </br>
                    `
    } else {
        message = `
                    ${count} . <b>${file} (pagina ${page})</b>
                    </br>
                    <p class='ml-2 m-0'>${text}</p>
                    </br>
                    `
    }
    if (links) {
        links.forEach(function (link) {
            message += `<a href='http://${link}'>${link}</a> 
                                        </br>`
        });
    }
    message += "<hr class='bg-light'>";
    return message;
}


function get_query_data(cadena) {
    let contentRegex = /"delta":\{"content":"(.*?)"\}/g;
    let contentMatches = [];
    let match;
    while ((match = contentRegex.exec(cadena)) !== null) {
        contentMatches.push(match[1]);
    }

    let docRegex = /"page_label":"(.*?)","file_name":"(.*?)"/g;
    let docMatches = [];
    while ((match = docRegex.exec(cadena)) !== null) {
        docMatches.push({ page_label: match[1], file_name: match[2] });
    }

    return result = {
        contents: contentMatches,
        documents: docMatches

    };
}


function build_header(files, pages) {
    if (files.length !== 0 && pages.length !== 0) {
        var extracted_files = {};

        for (var i = 0; i < files.length; i++) {
            var file = files[i].trim();
            var page = pages[i].toString().trim();

            if (!extracted_files[file]) {
                extracted_files[file] = new Set();
            }
            extracted_files[file].add(page);
        }

        var header = '';
        for (var file in extracted_files) {
            var pagesArray = Array.from(extracted_files[file]).sort((a, b) => a - b);
            header += file + " pg. " + pagesArray.join(', ') + "; ";
        }
        
        if (header.endsWith("; ")) {
            header = header.slice(0, -2);
        }

        return header;
    }
}


async function query(value, display, cronometro) {
    let system_prompt = "You are a helpful, respectful and honest assistant." +
        "If you know the answer but it is not based in the provided context, don't provide the answer, just state the answer is not in the context provided." +
        "Do not speculate or make up information." +
        "Answer only in spanish.";

    display.innerHTML += "<div class='border bg-primary text-light p-2 ml-auto message mt-2 mb-2'>" + value + "</div>";
    display.innerHTML += "<div id='chat-message' class='border bg-dark text-light p-2 message'></div>";
    var chat_message = document.getElementById('chat-message');
    try {
        var requestBody = {
            context_filter: {
                docs_ids: selected_files
            },
            include_sources: true,
            messages: [
                {
                    "content": system_prompt,
                    "role": "system"
                },
                {
                    "content": value,
                    "role": "user"
                }
            ],
            stream: true,
            use_context: true
        };
        document.getElementById('stop-btn').style.display = 'flex';
        document.getElementById('send-btn').style.display = 'none';
        var startTime = performance.now();
        var requestId = requestAnimationFrame(updateElapsedTime);
        var response = await fetch(`http://${url}/v1/chat/completions/${admin_code}`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
            }
        });
        reader = response.body.getReader();
        var message = '';

        
        while (true) {
            var { done, value } = await reader.read();
            if (done) break;
            var decodedValue = new TextDecoder().decode(value);

            console.log('decoded', decodedValue);
            if (decodedValue.trim() === '[DONE]') break;

            result = get_query_data(decodedValue.trim())
            console.log("DATA\n" + result.contents + "\n" + result.documents.map(doc => doc.file_name).join(', ') + "\n" + result.documents.map(doc => doc.page_label).join(', '));
            var content = result.contents[0];
            header = build_header(result.documents.map(doc => doc.file_name), result.documents.map(doc => doc.page_label))

            if (header !== undefined && content !== undefined) {
                sources = header.trim();
                message += content;
                message = message.replace(/\\n/g,"</br>").replace(/\\t/g," ").replace(/\\\"/g, '"').replace(/\\"/g, '"');
                chat_message.innerHTML = sources + "<hr class='bg-light m-0'> </br>" + message;
                document.getElementById('chat').scrollTop = display.scrollHeight;
            }
        }

        cancelAnimationFrame(requestId);
        var endTime = performance.now();
        document.getElementById('send-btn').style.display = 'flex';
        document.getElementById('stop-btn').style.display = 'none';

        if (!response.ok) {
            throw new Error('Network response was not ok');
        } else {
            var responseTimeInSeconds = (endTime - startTime) / 1000;
            cronometro.textContent = responseTimeInSeconds.toFixed(2) + ' s';
        }
        chat_message.id = '#'
    } catch (error) {
        if (error instanceof SyntaxError && error.message.includes('unexpected token')) {
            return;
        }
        console.error('There was an error with the fetch request:', error);
        cancelAnimationFrame(requestId);
    }

    function updateElapsedTime(currentTime) {
        var elapsedTime = (currentTime - startTime) / 1000;
        cronometro.textContent = elapsedTime.toFixed(2) + ' s';
        requestId = requestAnimationFrame(updateElapsedTime);
    }
}


function comprobarContenido(cadena1, cadena2) {
    var server_words = cadena2.split(' ');
    var user_words = cadena1.split(' ');
    var encontrada = true;

    user_words.forEach(function (palabra, index) {
        user_words[index] = processText(palabra);
    });

    server_words.forEach(function (palabra, index) {
        server_words[index] = processText(palabra);
    });

    user_words.forEach(function (word) {
        if (!server_words.includes(word)) {
            encontrada = false;
        }
    });

    return encontrada;
}


function processText(cadena) {
    cadena = cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    cadena = cadena.replace(/[.,()'…"“”:\[\]\n\t—]/g, '');
    cadena = cadena.toLowerCase();

    return cadena;
}


function confirmDelete() {
    var del = document.getElementById('delete');
    var conf = document.getElementById('confirm-delete');

    if (selected_files.length > 0) {
        if (!deleteVisible) {
            del.style.display = 'none';
            conf.style.display = 'flex';
        } else {
            del.style.display = 'flex';
            conf.style.display = 'none';
        }
        deleteVisible = !deleteVisible;
    }
}


function changeMode1() {
    var searchBtn = document.getElementById('search');
    var queryBtn = document.getElementById('query');
    var searchDisplay = document.getElementById('search-display');
    var queryDisplay = document.getElementById('query-display');

    mode = true;
    searchBtn.className = 'btn btn-primary';
    queryBtn.className = 'btn btn-secondary';
    queryDisplay.style.display = 'none';
    searchDisplay.style.display = 'block';
}


function changeMode2() {
    var searchBtn = document.getElementById('search');
    var queryBtn = document.getElementById('query');
    var searchDisplay = document.getElementById('search-display');
    var queryDisplay = document.getElementById('query-display');

    mode = false;
    searchBtn.className = 'btn btn-secondary';
    queryBtn.className = 'btn btn-primary';
    queryDisplay.style.display = 'block';
    searchDisplay.style.display = 'none';
}


function reset() {
    document.getElementById('chat').innerHTML = '';
    document.getElementById('input').value = '';
    document.getElementById('chat-crono').innerHTML = '';
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


function searchFile() {
    document.getElementById('search-label').style.display = 'none';
    document.getElementById('search-btn').style.display = 'none';
    document.getElementById('reset-search-btn').style.display = 'flex';


    var input = document.getElementById('search-input');
    input.style.display = 'flex'
    input.style.width = '0';
    input.style.opacity = '0';

    input.focus();
    setTimeout(function () {
        input.style.width = '100%';
        input.style.opacity = '1';
    }, 5);
}


function closeReader() {
    if (reader) {
        reader.cancel();
    }
}

function goUp() {
    var chat = document.getElementById('chat');
    var msgCont = document.getElementById('msg-cont');
    var scrollTop = msgCont.offsetTop - chat.offsetTop;

    chat.scrollTop = scrollTop;
}

function nextMsg() {
    var msgCont = document.getElementById('msg-cont');

    if (msgCont) {
        var upButton = document.getElementById('up-btn');
        if (upButton) {
            upButton.parentNode.removeChild(upButton);
        }
        msgCont.id = '#';
    }
}



// setInterval(keepAlive, 20000);
getIngestedFiles();

keepAlive()