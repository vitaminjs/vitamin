
import Mapper from './mapper'
import registry from './registry'

/**
 * Initialize Vitamin
 */
module.exports = function initialize(knex) {
  // add knex instance to all models as `connection` property
  Mapper.prototype.connection = knex
  
  return {
    
    Mapper,
    
    /**
     * Set/Get a model constructor
     * 
     * @param {String} name
     * @param {Object} options
     * @return model constructor
     */
    model: function(name, options = null) {
      if ( options ) {
        var mapper = options instanceof Mapper ? options : new Mapper(options)
        
        return registry.set(name, mapper.build())
      }
      
      return registry.get(name)
    }
    
  }
}
