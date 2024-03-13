/**
 * return the color of the icon of the task type
 * 
 * @param {string} type     type of the task like: Design, Marketing....
 * */
function getTypeColorAddTask(type) {

    let c = "";
    colorsCategory.forEach(col => {
        if (col['name'] == type)
            c = col['color'];
    });
    return c;
}

/**
 * Loads the contacs from the remote server in dummyContacts
 */
async function loadContacts() {
    contacts = [];
    //contacts = JSON.parse(await getItem('contacts')).
    contacts = JSON.parse(await getContact('contacts')).sort((a, b) => a.name.localeCompare(b.name));

    let i = 0;
    contacts.forEach(element => { //colors[i % 9]
        let a = { "name": element['name'], "email": element['email'], "id": i + '', "iconColor": element['iconColor'], "short": element['short'] };
        i++;
        dummyContacts.push(a);
    });

    await loadRemoteColor();
    await loadUsersAll();
    // loaded all registered User to the contact list
    usersRegistered.forEach(u => {
        let firstName = u['name'].trim().split(' ')[0]; // Erster Name
        let lastName = u['name'].trim().split(' ')[1]; // Nachname
        let short = (firstName ? firstName.charAt(0) : '') + (lastName ? lastName.charAt(0) : '');
        let a = { "name": u['name'], "email": u['email'], "id": i + '', "iconColor": colorAll[i % 9], "short": short };
        dummyContacts.push(a);
    });
}

/**
 * Reads the name of the logged in Person from the query parameter and saves it
 */
function readQueryParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('name');

    if (msg) {
        userNameAddTask = msg;
    }
}

/** 
Initialized add-task.
Loads: the contacts, the external html FileSystem, and two contacts that are shown in the assignemnt selection
*/
async function init() {
    expanded = false;
    addTask = true;
    loadContacts();
    await includeHTML();
    await loadRemote();
    await loadRemoteColor();
    addContact(dummyContacts[0], '');
    addContact(dummyContacts[1], '');

    readQueryParameters();
    setNameToHrefs(userNameAddTask);

    // Handles the rezising
    window.addEventListener("resize", resizeListenerAddTask);
    //Handles wheather the size of the screen is fullsize or not
    sizeAction();
    categoryTitle = document.getElementById('selectionCategory').innerHTML;
    // Sets the minDate
    document.getElementById('date').min = new Date().toLocaleDateString('fr-ca');
}

/**
 * Adds the subtak that is written in the subtask input-field to the checkbox area of the subtasks
 */
function addSubtask() {
    let sub = document.getElementById('subtask').value;
    if (sub !== "") {
        let numberSubtasks = document.querySelectorAll('.subtaskContainer').length + 1;

        let t = `<div class="subtaskContainer" id="subtaskContainer${numberSubtasks}">
            <span class="subtaskText">• ${sub}</span>
            <span class="subtaskAction" onclick="toggleEditSubtask(${numberSubtasks})">✎</span>
            
            <span class="subtaskAction save" onclick="saveSubtask(${numberSubtasks})" style="display: none;">✔️</span>
            <span  >|</span>
            <span class="subtaskAction" onclick="deleteSubtask(${numberSubtasks})">🗑️</span>
        </div>`;

        // Änderung hier: Wrapp die Subtasks in einer Container-Div
        let subtasksContainer = document.getElementById('subtasksArea');
        subtasksContainer.innerHTML += t;

        // Füge die Subtasks in die Container-Div ein
        subtasksContainer.classList.add('subtasks-container');
    }
    document.getElementById('subtask').value = "";
}


/**
 * Toggles the editing mode for a subtask identified by its unique ID.
 * If the subtask is not found, an error message is logged.
 * Manages the display and functionality of editing icons and input fields.
 *
 * @param {string} subtaskId - The unique identifier of the subtask.
 */
function toggleEditSubtask(subtaskId) {
    const subtaskContainer = document.getElementById(`subtaskContainer${subtaskId}`);
    if (!subtaskContainer) return;

    const subtaskTextElement = subtaskContainer.querySelector('.subtaskText');
    const editIcon = subtaskContainer.querySelector('.subtaskAction:not(.save)');
    const saveIcon = subtaskContainer.querySelector('.subtaskAction.save');
    if (!subtaskTextElement || !editIcon || !saveIcon) return;

    if (!subtaskTextElement.classList.contains('editing')) subtaskTextElement.dataset.originalText = subtaskTextElement.innerText;

    subtaskTextElement.classList.toggle('editing');
    editIcon.style.display = subtaskTextElement.classList.contains('editing') ? 'none' : 'inline';
    saveIcon.style.display = subtaskTextElement.classList.contains('editing') ? 'inline' : 'none';

    if (subtaskTextElement.classList.contains('editing')) {
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = subtaskTextElement.dataset.originalText;
        subtaskTextElement.innerHTML = '';
        subtaskTextElement.appendChild(editInput);

        editInput.addEventListener('blur', () => {
            subtaskTextElement.innerText = editInput.value;
            toggleEditSubtask(subtaskId);
        });

        editInput.focus();
    }
}


/**
 * Saves changes made to the subtask identified by its unique ID.
 * Calls the toggleEditSubtask function to exit the editing mode.
 *
 * @param {string} subtaskId - The unique identifier of the subtask.
 */
function saveSubtask(subtaskId) {
    toggleEditSubtask(subtaskId);
}

/**
 * Deletes the subtask identified by its unique ID by removing its container element.
 *
 * @param {string} subtaskId - The unique identifier of the subtask.
 */
function deleteSubtask(subtaskId) {
    const subtaskContainer = document.getElementById(`subtaskContainer${subtaskId}`);

    if (subtaskContainer) {
        subtaskContainer.remove();
    } else {
        
    }
}

/**
 * Creates a new subtask element with the specified ID and text, and appends it to the subtasks area.
 * The subtask element includes a text container, an "Edit" button, and a "Delete" button.
 *
 * @param {string} subtaskId - The unique identifier of the new subtask.
 * @param {string} subtaskText - The text content of the new subtask.
 */
function createSubtaskElement(subtaskId, subtaskText) {
    const subtaskContainer = document.createElement('div');
    subtaskContainer.id = `subtaskContainer${subtaskId}`;

    const editButton = document.createElement('span');
    editButton.innerText = 'Bearbeiten';
    editButton.onclick = () => editSubtask(subtaskId);

    const deleteButton = document.createElement('span');
    deleteButton.innerText = 'Löschen';
    deleteButton.onclick = () => deleteSubtask(subtaskId);

    const subtaskTextElement = document.createElement('div');
    subtaskTextElement.innerText = subtaskText;

    subtaskContainer.appendChild(subtaskTextElement);
    subtaskContainer.appendChild(editButton);
    subtaskContainer.appendChild(deleteButton);

    document.getElementById('subtasksArea').appendChild(subtaskContainer);
}

/**
 * 
 * @returns returns a list with the names of the subtasks, that are assigned to the currently created task
 */
function setSubtasks() {
    let form = document.getElementById('form');
    let subTasks = form.querySelectorAll('[subtasks]');
    subtasks = [];
    subTasks.forEach(element => {
        if (element.checked) {
            subtasks.push(element.name);
        }
    });
    return subtasks;
}

/**
 * When a task is created/edited than we need the possibility to search for contacts that can be assigned to the task.
 * This funtion switched between the checkboxes of contacts that can be assigned and the input field,where we enter the
 * email of a contact that should be assigned
 * 
 * @param {string} add   is 'Edit', when we are in the Edit-mode of a task. If a new task is creatd it is '';
 * 
 */
function changeSelect(add) {
    const selectionContainer = document.getElementById('selectionContainer' + add);
    const addContact = document.getElementById('addContact' + add);

    selectionContainer.classList.toggle('d-none');
    addContact.classList.toggle('d-none');

    if (!changed) {
        changed = true;
    } else {
        document.getElementById('mailContact' + add).value = "";
        changed = false;
    }

    return changed;
}


/**
 * Clears every entry in Add-Task
 *
 */
function clearInput() {
    // Löscht alle Eingabefelder
    document.getElementById("title").value = "";
    document.getElementById("discription").value = "";
    document.getElementById("date").value = "";
    document.getElementById("subtask").value = "";

    // Setzt die Hintergrundfarbe der Prioritäten zurück
    for (let i = 0; i < 3; i++) {
        document.getElementById('prio' + i).style.backgroundColor = "white";
    }

    // Setzt alle Subtasks zurück
    clearSubtasks();

    // Setzt alle Checkboxen für Zuweisungen zurück
    uncheckAll();

    // Führt die Aktionen für das Zurücksetzen der Benutzeroberfläche durch
    if (expanded) {
        showCheckboxes();
    }
}


/**
 *  Blend in/out the popUp "Task added to board"
 * @param {number} num num = 1 blend out, otherwise blend in the popUp
 */
function togglePopUp() {
    const popUp = document.getElementById('popUpAdded');
    popUp.classList.toggle('bottom');
    setTimeout(() => {
        if (!popUp.classList.contains('bottom')) {
            popUp.classList.add('d-none');
        }
    }, 500);
}

/**
 * Handles the display of a pop-up after a successful operation.
 * Shows the added pop-up container and triggers animations for upward movement and removal.
 * If a dialog is not present, schedules the complete removal of the pop-up after a delay.
 */
function handlePopUpAfterSuccess() {
    const popUp = document.getElementById('popUpAdded');
    const popUpContainer = document.getElementById('popUpAddedContainer');
    popUp.classList.remove('d-none');
    popUpContainer.classList.remove('d-none');
    togglePopUp();
    if (!dialog) { setTimeout(() => popUp.classList.add('d-none'), 1000); }
}

/**
 * Removes the pop up, that appears when a task is succesfully created
 */
function removePopUP() {
    document.getElementById('popUpAdded').classList.add('d-none');
    document.getElementById('popUpAddedContainer').classList.add('d-none');
    // document.getElementById('popUpAdded').classList.remove('top');
}

/**
 * Handles what happens when we return to the board from the addtask dialog
 */
function handleDialog(newCreated) {
    document.getElementById('bordbaner').classList.remove('d-none');
    if (newCreated) {
        handlePopUpAfterSuccess();

        //moves dialog out
        setTimeout(movePos, 875, 0);
        //blend out dialog
        setTimeout(closeDialog, 1000, 1);
        setTimeout(renderTasks, 1000);

    } else {
        setTimeout(movePos, 350, 0);
        setTimeout(closeDialog, 500, 0);
    }

}

/**
 * Handlles the pop up after a Task was creates directly form the addtask.html
 */
function handleAddTaskHTML(newCreated) {
    if (newCreated) {
        handlePopUpAfterSuccess();

    }
    document.getElementById('colorChoice').classList.add('d-none');
    expandedCategory = true;
    showCategory();
}


/**
 * return back from AddTask
 * 
 * @param {boolean} newCreated   was a new task succesfully created
 */
function returnFromAddTask(newCreated) {

    // delete content of all inputs
    clearInput();

    if (dialog) {
        handleDialog(newCreated);

    } else {
        handleAddTaskHTML(newCreated);
    }
    setPrioWhiteColor('prioAdd', 'prio', prio);
    setBackgroundWhite('prio');
    dialog = false;
}

/**
 * Actions that should be performed, when the cross in the AddTask dialog is clicked.
 */
function crossAddTask() {
    closeDialog();
    document.getElementById('popUpAdded').classList.add('d-none');
    document.getElementById('popUpAddedContainer').classList.add('d-none');
    dialog = false;
    document.getElementById('bordbaner').classList.remove('d-none');
    setPrioWhiteColor('prioAdd', 'prio', prio);
    setBackgroundWhite('prio');
}

/**
 * Performs a visual validation for the category selection by adding a red border briefly
 * and then reverting it to white after a short delay.
 */
function handleCategoryValidation() {
    const selectionCategory = document.getElementById('selectionCategory');
    selectionCategory.classList.add('red');
    setTimeout(() => selectionCategory.classList.remove('red'), 500);
}

/**
 * Handles the createTask, whe the Form validation was successfull.
 * Actually creates the new task
 */
function handleCreateTaskCorrectForm() {

    let checked = [];
    let st = setSubtasks();
    st.forEach(s => {
        checked.push(false);
    })
    checkedContacts();

    let task = giveTask(st, checked);

    document.getElementById('prio' + prioOld).style.backgroundColor = 'white';
    tasks.push(task);
    //saves tasks remote
    setTask('tasks', tasks);
    // handles what happend after the task was created      
    returnFromAddTask(true);
    if (addTask) { setTimeout(backBoard, 1500); }
}

/**
 * Clears subtasks by removing their HTML content and resetting the internal state.
 * @function
 * @returns {void}
 */
function clearSubtasks() {
    
    let subtasksContainer = document.getElementById('subtasksArea');
    subtasksContainer.innerHTML = '';

    subtasks = [];
   
}