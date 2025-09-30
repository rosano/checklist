(function() {
  let inputElement;
  let formElement;
  let ulElement;
  const itemPrefix = 'item-';

  const remoteStorage = new RemoteStorage({
    logging: true,
    changeEvents: { local: true, window: true, remote: true, conflict: true },
    modules: [todos]
  });

  // Claim read/write access for the /todos category
  remoteStorage.access.claim('todos', 'rw');

  // Add RemoteStorage and BaseClient instances to window for easy console
  // access
  window.remoteStorage = remoteStorage;
  window.baseClient    = remoteStorage.scope("/todos/")

  function prefixId(id) {
    return itemPrefix + id;
  }

  function unprefixId(prefixedId) {
    return prefixedId.replace(itemPrefix, '');
  }

  function init() {
    formElement = document.getElementById('add-todo');
    inputElement = formElement.getElementsByTagName('input')[0];
    ulElement = document.getElementById('todo-list');

    // Display the RS connect widget
    const widget = new Widget(remoteStorage);
    widget.attach('widget-wrapper');

    // Enable caching
    remoteStorage.todos.init();

    remoteStorage.todos.on('change', (event) => {
      if (typeof event.newValue === 'object' && typeof event.oldValue !== 'object') {
        console.log('Change from '+event.origin+' (add)', event);
        displayTodo(event.relativePath, event.newValue.description);
      }
      else if (typeof event.newValue !== 'object' && typeof event.oldValue === 'object') {
        console.log('Change from '+event.origin+' (remove)', event);
        undisplayTodo(event.relativePath);
      }
      else if (typeof event.newValue === 'object' && typeof event.oldValue === 'object') {
        console.log('Change from '+event.origin+' (change)', event);
        if (event.origin !== 'conflict' || (event.oldValue.description === event.newValue.description)) {
          renderTodos();
        } else {
          const description = `${event.oldValue.description} / ${event.newValue.description} (was ${event.lastCommonValue.description})`;
          updateTodo(event.relativePath, description).then(renderTodos);
        }
      } else {
        console.log('Change from '+event.origin+'', event);
      }
    });

    remoteStorage.on('ready', function() {
      ulElement.addEventListener('click', function(event) {
        if (
          event.target.tagName === 'BUTTON' &&
          event.target.classList.contains('delete')
        ) {
          removeTodo(unprefixId(event.target.parentNode.id));
        }
      });

      formElement.addEventListener('submit', function(event) {
        event.preventDefault();
        const trimmedText = inputElement.value.trim();
        if (trimmedText) {
          addTodo(trimmedText);
        }
        inputElement.value = '';
      });
    });

    remoteStorage.on('disconnected', function() {
      emptyTodos();
    });
  }

  function addTodo(description) {
    remoteStorage.todos.addTodo(description);
  }

  function updateTodo(id, description) {
    return remoteStorage.todos.updateTodo(id, description);
  }

  function removeTodo(id) {
    remoteStorage.todos.removeTodo(id);
  }

  function renderTodos() {
    remoteStorage.todos.getAllTodos().then(todos => {
      displayTodos(todos);
    });
  }

  function displayTodos(todos) {
    ulElement.innerHTML = '';
    for (const todoId in todos) {
      displayTodo(todoId, todos[todoId].description);
    }
  }

  function displayTodo(id, description) {
    const domID = prefixId(id);
    let liElement = document.getElementById(domID);
    if (!liElement) {
      liElement = document.createElement('li');
      liElement.id = domID;
      ulElement.appendChild(liElement);
    }
    liElement.innerHTML += `
      <input type="text" value="${description}" placeholder="Todo description">
      <button class="save" title="Save">Save</button>
      <button class="delete" title="Delete">×</button>
    `;
    const saveButton = liElement.querySelector('button.save');
    const inputEl = liElement.querySelector('input');
    inputEl.addEventListener("focus", () => {
      saveButton.style.visibility = 'visible';
    });
    inputEl.addEventListener("blur", () => {
      setTimeout(() => {
        saveButton.style.visibility = 'hidden';
      }, 100)
    });
    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        updateTodo(id, inputEl.value);
      }
    });
    saveButton.addEventListener("click", () => {
      updateTodo(unprefixId(domID), inputEl.value);
    });
  }

  function undisplayTodo(id) {
    const elem = document.getElementById(prefixId(id));
    ulElement.removeChild(elem);
  }

  function emptyTodos() {
    ulElement.innerHTML = '';
    inputElement.value = '';
  }

  document.addEventListener('DOMContentLoaded', init);

})();
