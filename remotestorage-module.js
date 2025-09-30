const MyFavoriteDrinks = {
  name: 'myfavoritedrinks',
  builder: function (privateClient) {
    privateClient.declareType('drink', {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    });

    return {
      exports: {
        init: function() {
          privateClient.cache('');
        },

        on: privateClient.on,

        addDrink: (name) => privateClient.storeObject('drink', `${ new Date().getTime() }`, { name }),

        updateDrink: (id, name) => privateClient.storeObject('drink', id, { name }),

        removeDrink: privateClient.remove.bind(privateClient),

        getAllDrinks: () => privateClient.getAll('', false),
      }
    }
  }
};
