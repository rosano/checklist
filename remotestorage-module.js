const todos = {
  name: 'todos',
  builder: function (privateClient) {
    privateClient.declareType('todo', {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    });

    return {
      exports: {
        cacheTodos: () => privateClient.cache(''),

        on: privateClient.on,

        addTodo: (name) => privateClient.storeObject('todo', `${ new Date().getTime() }`, { name }),

        updateTodo: (id, name) => privateClient.storeObject('todo', id, { name }),

        removeTodo: privateClient.remove.bind(privateClient),

        getAllTodos: () => privateClient.getAll('', false),
      }
    }
  }
};
