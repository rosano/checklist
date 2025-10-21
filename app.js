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

    return mod.displayItem(event.relativePath, event.newValue);
  }

  if (!event.newValue && event.oldValue) {
    console.log(`Change from ${ event.origin } (remove)`, event);

    return mod.undisplayItem(event.relativePath);
  }

  if (event.newValue && event.oldValue) {
    console.log(`Change from ${ event.origin } (change)`, event);

    if (event.origin !== 'conflict') {
      return mod.renderItems();
    }

    return mod.updateItem(event.relativePath, Object.assign(event.newValue, {
      description: `${event.oldValue.description} / ${event.newValue.description} (was ${event.lastCommonValue.description})`,
    })).then(mod.renderItems);
  }

  console.log(`Change from ${ event.origin }`, event);
});

// app interface
const mod = {

  addItem: (description) => remoteStorage.todos.addTodo({
    description,
  }),

  updateItem: (id, object) => remoteStorage.todos.updateTodo(id, object),

  removeItem: (id) => remoteStorage.todos.removeTodo(id),

  renderItems: () => remoteStorage.todos.getAllTodos().then(mod.displayItems),

  displayItems (items) {
    document.querySelector('#item-list').innerHTML = '';

    for (const id in items) {
      mod.displayItem(id, items[id]);
    }
  },

  displayItem (id, object) {
    let li = mod.liForID(id);

    if (!li) {
      li = document.createElement('li');
      li.dataset.id = id;
      document.querySelector('#item-list').appendChild(li);
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
        mod.updateItem(id, Object.assign(object, {
          description: input.value,
        }));
      }
    });

    save.addEventListener('click', () => {
      mod.updateItem(id, Object.assign(object, {
        description: input.value,
      }));
    });

    li.querySelector('a.delete').addEventListener('click', (event) => {
      event.preventDefault();

      mod.removeItem(li.dataset.id);
    });
  },

  undisplayItem: (id) => document.querySelector('#item-list').removeChild(mod.liForID(id)),

  emptyItems () {
    document.querySelector('#item-list').innerHTML = '';
    document.querySelector('#add-item input').value = '';
  },

  liForID: (id) => document.querySelector(`#item-list li[data-id="${ id }"]`),

};

// setup after page loads
document.addEventListener('DOMContentLoaded', () => {

  (new Widget(remoteStorage)).attach(document.querySelector('widget-wrapper'));

  remoteStorage.on('ready', () => {
    document.getElementById('add-item').addEventListener('submit', (event) => {
      event.preventDefault();

      const text = document.querySelector('#add-item input').value.trim();
      if (text) {
        mod.addItem(text);
      }

      document.querySelector('#add-item input').value = '';
    });

    // hide intro if inside frame
    if (remoteStorage.remote.token && window.self !== window.top) {
      document.body.classList.add('embedded');
    }
  });

  remoteStorage.on('disconnected', mod.emptyItems);
  
});
