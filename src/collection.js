
import { invoke, first, last, groupBy, indexBy, isString } from 'underscore'

/**
 * @class Collection
 */
export default class Collection {
  
  /**
   * Collection constructor
   * 
   * @param {Array} models
   * @constructor
   */
  constructor(models = []) {
    this.models = models
  }
  
  /**
   * Get the length of the collection
   * 
   * @var int
   */
  get length() {
    return this.models.length
  }
  
  /**
   * Set the collection mapper
   * 
   * @param {Mapper} mapper
   * @return this collection
   */
  setMapper(mapper) {
    this.mapper = mapper
  }
  
  /**
   * Get the collection as an array of plain objects
   * 
   * @return array
   */
  toJSON() {
    return invoke(this.models, 'toJSON')
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
    return invoke(this.models, 'get', key)
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
   * @return a new collection
   */
  map(fn, context) {
    return new Collection(this.models.map(fn, context))
  }
  
  /**
   * Execute a callback over each model
   * 
   * @param {Function} fn
   * @param {Object} context
   * @return this collection
   */
  forEach(fn, context) {
    this.models.forEach(fn, context)
    return this
  }
  
  /**
   * Get the primary keys of the collection models
   * 
   * @return array
   */
  keys() {
    return invoke(this.models, 'getId')
  }
  
  /**
   * Get the first model, or undefined if the collection is empty
   * 
   * @return Model
   */
  first() { 
    return first(this.models)
  }
  
  /**
   * Get the last model, or undefined if the collection is empty
   * 
   * @return Model
   */
  last() {
    return last(this.models)
  }
  
  /**
   * Group the collection by field or using a callback
   * 
   * @param {String|Function} iteratee
   * @param {Object} context
   * @return plain object
   */
  groupBy(iteratee, context) {
    if ( isString(iteratee) ) {
      let key = iteratee
      
      iteratee = function (model) {
        return model.get(key)
      }
    }
    
    return groupBy(this.models, iteratee, context)
  }
  
  /**
   * Key the collection by field or using a callback
   * 
   * @param {String|Function} iteratee
   * @param {Object} context
   * @return plain object
   */
  keyBy(iteratee, context) {
    if ( isString(iteratee) ) {
      let key = iteratee
      
      iteratee = function (model) {
        return model.get(key)
      }
    }
    
    return indexBy(this.models, iteratee, context)
  }
  
  /**
   * Save the collection models in the database
   * 
   * @param {Array} returning
   * @return promise
   */
  save(returning = ['*']) {
    if (! this.mapper )
      throw new ReferenceError("Collection mapper is not defined")
    
    return this.mapper.saveMany(this.models, returning).return(this)
  }
  
  /**
   * Delete the collection models from the database
   * 
   * @return promise
   */
  destroy() {
    if (! this.mapper )
      throw new ReferenceError("Collection mapper is not defined")
    
    return this.mapper.destroyMany(this.models).return(this)
  }
  
  /**
   * Touch the collection models
   * 
   * @return promise
   */
  touch() {
    if (! this.mapper )
      throw new ReferenceError("Collection mapper is not defined")
    
    return this.mapper.touchMany(this.models).return(this)
  }
  
  /**
   * Trigger an event with arguments
   * 
   * @param {String} event
   * @param {Array} args
   * @return promise
   */
  emit(event, ...args) {
    if (! this.mapper )
      throw new ReferenceError("Collection mapper is not defined")
    
    return this.mapper.emit(...arguments)
  }
  
}