// remoteStorage module
const remoteStorage = new RemoteStorage({
  modules: [todos],
  changeEvents: { local: true, window: true, remote: true, conflict: true },
});

remoteStorage.access.claim('todos', 'rw');

remoteStorage.todos.cacheTodos();

// remoteStorage events
remoteStorage.todos.on('change', (event) => {
  if (typeof event.newValue === 'object' && typeof event.oldValue !== 'object') {
    console.log(`Change from ${ event.origin } (add)`, event);

    mod.displayTodo(event.relativePath, event.newValue.name);
  } else if (typeof event.newValue !== 'object' && typeof event.oldValue === 'object') {
    console.log(`Change from ${ event.origin } (remove)`, event);

    mod.undisplayTodo(event.relativePath);
  } else if (typeof event.newValue === 'object' && typeof event.oldValue === 'object') {
    console.log(`Change from ${ event.origin } (change)`, event);

    if (event.origin !== 'conflict' || (event.oldValue.name === event.newValue.name)) {
      mod.renderTodos();
    } else {
      const name = `${event.oldValue.name} / ${event.newValue.name} (was ${event.lastCommonValue.name})`;
      mod.updateTodo(event.relativePath, name).then(mod.renderTodos);
    }
  } else {
    console.log(`Change from ${ event.origin }`, event);
  }
});

// app interface
const mod = {

  addTodo: (name) => remoteStorage.todos.addTodo(name),

  updateTodo: (id, name) => remoteStorage.todos.updateTodo(id, name),

  removeTodo: (id) => remoteStorage.todos.removeTodo(id),

  renderTodos: () => remoteStorage.todos.getAllTodos().then(mod.displayTodos),

  displayTodos (todos) {
    document.querySelector('#todo-list').innerHTML = '';

    for (const id in todos) {
      mod.displayTodo(id, todos[id].name);
    }
  },

  displayTodo (id, name) {
    let li = mod.liForID(id);

    if (!li) {
      li = document.createElement('li');
      li.dataset.id = id;
      document.querySelector('#todo-list').appendChild(li);
    }

    li.innerHTML += `<form>
      <input type="text" value="${ name }" placeholder="name">
      <button class="save">Save</button>
      <a class="delete button" title="Delete" href="#">×</a>
    </form>`;
    
    const save = li.querySelector('button.save');
    const input = li.querySelector('input');

    input.addEventListener('focus', () => save.style.visibility = 'visible');
    
    input.addEventListener('blur', () => {
      setTimeout(() => save.style.visibility = 'hidden', 100)
    });

    li.querySelector('form').addEventListener('submit', () => mod.updateTodo(id, input.value));

    save.addEventListener('click', () => {
      mod.updateTodo(id, input.value);
    });

    li.querySelector('a.delete').addEventListener('click', (event) => {
      event.preventDefault();

      mod.removeTodo(li.dataset.id);
    });
  },

  undisplayTodo: (id) => document.querySelector('#todo-list').removeChild(mod.liForID(id)),

  emptyTodos () {
    document.querySelector('#todo-list').innerHTML = '';
    document.querySelector('#add-todo input').value = '';
  },

  liForID: (id) => document.querySelector(`#todo-list li[data-id="${ id }"]`),

};

// Setup after page loads
document.addEventListener('DOMContentLoaded', () => {

  (new Widget(remoteStorage)).attach('widget-wrapper');

  remoteStorage.on('ready', () => {
    document.getElementById('add-todo').addEventListener('submit', (event) => {
      event.preventDefault();

      const text = document.querySelector('#add-todo input').value.trim();
      if (text) {
        mod.addTodo(text);
      }

      document.querySelector('#add-todo input').value = '';
    });
  });

  remoteStorage.on('disconnected', mod.emptyTodos);
  
});
