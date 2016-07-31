
import _ from 'underscore'

/**
 * Model Collection Class
 */
class Collection {
  
  /**
   * Model Collection constructor
   * 
   * @param {Array} models
   * @constructor
   */
  constructor(models = []) {
    this.models = models
    this.length = models.length
  }
  
  /**
   * Get the collection as an array of plain objects
   * 
   * @return array
   */
  toJSON() {
    return _.invoke(this.models, 'toJSON')
  }
  
  /**
   * Get all items as a plain array
   * 
   * @return array
   */
  toArray() {
    return this.models.slice()
  }
  
  /**
   * Get an array with the values of the given key
   * 
   * @param {String} key
   * @return array
   */
  pluck(key) {
    return _.invoke(this.models, 'get', key)
  }
  
  /**
   * Get the model at the given position
   * 
   * @param {Integer} position
   * @return model instance
   */
  at(position) {
    return this.models[position]
  }
  
  /**
   * Run a map callback over each model
   * 
   * @param {Function} fn
   * @param {Object} context
   * @return Collection
   */
  map(fn, context) {
    return new Collection(_.map(this.models, fn, context))
  }
  
  /**
   * Execute a callback over each model
   * 
   * @param {Function} fn
   * @param {Object} context
   * @return this collection
   */
  forEach(fn, context) {
    _.each(this.models, fn, context)
    return this
  }
  
  /**
   * Get the primary keys of the collection models
   * 
   * @return array
   */
  keys() {
    return _.invoke(this.models, 'getId')
  }
  
  /**
   * Get the first model, or undefined if the collection is empty
   * 
   * @return Model
   */
  first() { 
    return _.first(this.models)
  }
  
  /**
   * Get the last model, or undefined if the collection is empty
   * 
   * @return Model
   */
  last() {
    return _.last(this.models)
  }
  
  /**
   * Group the collection by field or using a callback
   * 
   * @param {String|Function} iteratee
   * @param {Object} context
   * @return object
   */
  groupBy(iteratee, context) {
    if ( _.isString(iteratee) ) {
      var key = iteratee
      
      iteratee = function (model) {
        return model.get(key)
      }
    }
    
    return _.groupBy(this.models, iteratee, context)
  }
  
  /**
   * Key the collection by field or using a callback
   * 
   * @param {String|Function} iteratee
   * @param {Object} context
   * @return Object
   */
  keyBy(iteratee, context) {
    if ( _.isString(iteratee) ) {
      var key = iteratee
      
      iteratee = function (model) {
        return model.get(key)
      }
    }
    
    return _.indexBy(this.models, iteratee, context)
  }
  
}

// exports
export default Collection