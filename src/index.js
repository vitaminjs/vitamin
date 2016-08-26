
import registry from './registry'

/**
 * Initialize Vitamin
 */
module.exports = function initialize(knex) {
  
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
        else {
          options.name = name
          mapper = new Mapper(options)
        }
        
        // we set by default knex as the connection object,
        // for the given mapper, if not already provided
        if (! mapper.connection ) mapper.use(knex)
        
        return registry.set(name, mapper.build())
      }
      
      return registry.get(name)
    }
    
  }
  
}
