
import knex from 'knex'
import Mapper from './mapper'
import registry from './registry'
import { isString, isPlainObject, forOwn } from 'lodash'

// 
const vitamin = {
  
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

      registry.set(name, mapper)
    }

    return registry.get(name).modelClass
  }
  
}

/**
 * Initialize Vitamin
 */
function initialize(name, config = {}) {
  // define single database client
  if ( isString(name) ) {
    registry.connection(name, knex(config))
  }
  
  // register multiple database connections
  if ( isPlainObject(name) ) {
    forOwn(name, (val, key) => registry.connection(key, knex(val)))
  }
  
  return vitamin
}

/**
 * Usage
 * 
 * export default require('vitamin')('default', {
 *   client: 'mysql',
 *   connection: { ... },
 * })
 */
module.exports = initialize
