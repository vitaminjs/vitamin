
import {
  invoke, first, last, find, filter, reduce,
  groupBy, indexBy, isString, isObject, isFunction
} from 'underscore'

/**
 * @class Collection
 */
export default class {
  
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
   * Determine if the collection is empty
   * 
   * @return boolean
   */
  isEmpty() {
    return this.length === 0
  }
  
  /**
   * Set the collection mapper
   * 
   * @param {Mapper} mapper
   * @return this collection
   */
  setMapper(mapper) {
    this.mapper = mapper
    return this
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
  map(fn, context = null) {
    this.ensureMapper()
    
    return this.mapper.newCollection(this.models.map(fn, context))
  }
  
  /**
   * Reduce the collection to a single value
   * 
   * @param {Function} fn
   * @param {Any} initial
   * @param {Object} context
   * @return any
   */
  reduce(fn, initial = null, context = null) {
    return reduce(this.models, fn, initial, context)
  }
  
  /**
   * Execute a callback over each model
   * 
   * @param {Function} fn
   * @param {Object} context
   * @return this collection
   */
  forEach(fn, context = null) {
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
  groupBy(iteratee, context = null) {
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
  keyBy(iteratee, context = null) {
    if ( isString(iteratee) ) {
      let key = iteratee
      
      iteratee = function (model) {
        return model.get(key)
      }
    }
    
    return indexBy(this.models, iteratee, context)
  }
  
  /**
   * Find a model in the collection by key
   * 
   * @param {String} key
   * @return model
   */
  find(id) {
    return find(this.models, model => model.getId() == id)
  }
  
  /**
   * Run a filter over each of the models
   * 
   * @param {Function} fn
   * @param {Object} context
   * @return a new collection
   */
  filter(fn, context = null) {
    this.ensureMapper()
    
    return this.mapper.newCollection(filter(this.models, fn, context))
  }
  
  /**
   * Filter items by the given key value pair
   * 
   * @param {String|Object} key
   * @param {Any} value
   * @return a new collection
   */
  where(key, value = null) {
    function iteratee(model) {
      if ( isObject(key) ) {
        let keys = Object.keys(key)
        
        for ( let i = 0; i < keys.length; i++ ) {
          let attr = keys[i]
          
          if ( model.get(attr) != key[attr] ) return false
        }
        
        return true
      }
      
      return model.get(key) == value
    }
    
    return this.filter(iteratee)
  }
  
  /**
   * Determine if a key/value pair exists in the collection
   * 
   * @param {String|Object|Function} key
   * @param {Any} value
   * @return boolean
   */
  contains(key, value = null) {
    if ( isFunction(key) ) return !this.filter(key).isEmpty()
    
    return !this.where(key, value).isEmpty()
  }
  
  /**
   * Save the collection models in the database
   * 
   * @param {Array} returning
   * @return promise
   */
  save(returning = ['*']) {
    this.ensureMapper()
    
    return this.mapper.saveMany(this.models, returning).return(this)
  }
  
  /**
   * Delete the collection models from the database
   * 
   * @return promise
   */
  destroy() {
    this.ensureMapper()
    
    return this.mapper.destroyMany(this.models).return(this)
  }
  
  /**
   * Touch the collection models
   * 
   * @return promise
   */
  touch() {
    this.ensureMapper()
    
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
    this.ensureMapper()
    
    return this.mapper.emit(...arguments)
  }
  
  /**
   * Load a set of relationships onto the collection
   * 
   * @param {Array} relations
   * @return promise
   */
  load(...relations) {
    this.ensureMapper()
    
    return this.mapper.load(this.models, ...relations).return(this)
  }
  
  /**
   * Throw an Error if the mapper is not defined
   * 
   * @throws ReferenceError
   * @private
   */
  ensureMapper() {
    if (! this.mapper )
      throw new ReferenceError("Collection mapper is not defined")
  }
  
}