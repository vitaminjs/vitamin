
import Mapper from './mapper'
import registry from './registry'

// vitamin object
const vitamin = {
  
  /**
   * Set/Get a model constructor
   * 
   * @param {String} name
   * @param {Object|Mapper} options
   * @return model constructor
   */
  model: function(name, options = null) {
    if ( options != null ) {
      let mapper

      if ( options instanceof Mapper ) mapper = options
      else mapper = new Mapper(options)

      registry.set(name, mapper)
    }

    return registry.get(name).modelClass
  }
  
}

/**
 * Usage
 * 
 * export default require('vitamin')(knex(dbConfig))
 */
module.exports = function initialize(knex) {
  // register the default database connection
  registry.connection('default', knex)
  
  return vitamin
}
