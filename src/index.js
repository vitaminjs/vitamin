
import Mapper from './mapper'
import registry from './registry'

/**
 * Initialize Vitamin
 */
module.exports = function initialize(knex) {
  
  // register the default connection
  registry.connection('default', knex)
  
  return {
    
    /**
     * Set/Get a model constructor
     * 
     * @param {String} name
     * @param {Object} options object or a mapper instance
     * @return model constructor
     */
    model: function(name, options = null) {
      if ( options != null ) {
        let mapper
        
        if ( options instanceof Mapper ) mapper = options
        else mapper = new Mapper(options)
        
        return registry.set(name, mapper)
      }
      
      return registry.get(name).modelClass
    }
    
  }
  
}
