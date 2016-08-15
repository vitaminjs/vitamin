
import Model from './model'
import registry from './registry'

/**
 * Initialize Vitamin
 */
module.exports = function initialize(knex) {
  // add knex instance to all models as `connection` property
  Model.prototype.connection = knex
  
  return {
    
    Model,
    
    /**
     * Set/Get a model constructor
     * 
     * @param {String} name
     * @param {Function} ctor
     * @return model constructor
     */
    model: function(name, ctor = null) {
      return ctor ? registry.set(...arguments) : registry.get(name)
    }
    
  }
}
