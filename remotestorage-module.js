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

        handle: privateClient.on,

        addTodo: (object) => privateClient.storeObject('todo', new Date().toJSON().replace(/\D/g, ''), object),

        updateTodo: (id, object) => privateClient.storeObject('todo', id, object),

        removeTodo: privateClient.remove.bind(privateClient),

        getAllTodos: () => privateClient.getAll('', false),
      }
    }
  }
};
