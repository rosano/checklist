const todos = {
  name: 'todos',
  builder: function (privateClient) {
    privateClient.declareType('todo', {
      type: 'object',
      properties: {
        description: { type: 'string' },
      },
      required: ['description'],
    });

    return {
      exports: {
        cacheTodos: () => privateClient.cache(''),

        on: privateClient.on,

        addTodo: (description) => privateClient.storeObject('todo', `${ new Date().getTime() }`, { description }),

        updateTodo: (id, description) => privateClient.storeObject('todo', id, { description }),

        removeTodo: privateClient.remove.bind(privateClient),

        getAllTodos: () => privateClient.getAll('', false),
      }
    }
  }
};
