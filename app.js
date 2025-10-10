// remoteStorage module
const remoteStorage = new RemoteStorage({
  modules: [todos],
  logging: true,
  changeEvents: { local: true, window: true, remote: true, conflict: true },
});

remoteStorage.access.claim('todos', 'rw');

remoteStorage.todos.cacheTodos();

// remoteStorage events
remoteStorage.todos.handle('change', (event) => {
  if (event.newValue && !event.oldValue) {
    console.log(`Change from ${ event.origin } (add)`, event);

    return mod.displayTodo(event.relativePath, event.newValue);
  }

  if (!event.newValue && event.oldValue) {
    console.log(`Change from ${ event.origin } (remove)`, event);

    return mod.undisplayTodo(event.relativePath);
  }

  if (event.newValue && event.oldValue) {
    console.log(`Change from ${ event.origin } (change)`, event);

    if (event.origin !== 'conflict') {
      return mod.renderTodos();
    }

    return mod.updateTodo(event.relativePath, Object.assign(event.newValue, {
      description: `${event.oldValue.description} / ${event.newValue.description} (was ${event.lastCommonValue.description})`,
    })).then(mod.renderTodos);
  }

  console.log(`Change from ${ event.origin }`, event);
});

// app interface
const mod = {

  addTodo: (description) => remoteStorage.todos.addTodo({
    description,
  }),

  updateTodo: (id, object) => remoteStorage.todos.updateTodo(id, object),

  removeTodo: (id) => remoteStorage.todos.removeTodo(id),

  renderTodos: () => remoteStorage.todos.getAllTodos().then(mod.displayTodos),

  displayTodos (todos) {
    document.querySelector('#todo-list').innerHTML = '';

    for (const id in todos) {
      mod.displayTodo(id, todos[id]);
    }
  },

  displayTodo (id, object) {
    let li = mod.liForID(id);

    if (!li) {
      li = document.createElement('li');
      li.dataset.id = id;
      document.querySelector('#todo-list').appendChild(li);
    }

    li.innerHTML += `<form>
      <input type="text" value="${ object.description }" placeholder="description">
      <button class="save">Save</button>
      <a class="delete button" title="Delete" href="#">×</a>
    </form>`;
    
    const save = li.querySelector('button.save');
    const input = li.querySelector('input');

    input.addEventListener('focus', () => save.style.visibility = 'visible');
    
    input.addEventListener('blur', () => {
      setTimeout(() => save.style.visibility = 'hidden', 100)
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        mod.updateTodo(id, Object.assign(object, {
          description: input.value,
        }));
      }
    });

    save.addEventListener('click', () => {
      mod.updateTodo(id, Object.assign(object, {
        description: input.value,
      }));
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

// setup after page loads
document.addEventListener('DOMContentLoaded', () => {

  (new Widget(remoteStorage)).attach(document.querySelector('widget-wrapper'));

  remoteStorage.on('ready', () => {
    document.getElementById('add-todo').addEventListener('submit', (event) => {
      event.preventDefault();

      const text = document.querySelector('#add-todo input').value.trim();
      if (text) {
        mod.addTodo(text);
      }

      document.querySelector('#add-todo input').value = '';
    });

    // hide intro if inside frame
    if (remoteStorage.remote.token && window.self !== window.top) {
      document.querySelector('header h1').remove();
      document.querySelector('header small').remove();
    }
  });

  remoteStorage.on('disconnected', mod.emptyTodos);
  
});
