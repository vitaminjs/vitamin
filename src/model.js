
import NotFoundError from './errors/model-not-found'
import BaseModel from 'vitamin-model'
import Promise from 'bluebird'
import _ from 'underscore'

/**
 * Vitamin Model Class
 */
class Model extends BaseModel {
  
  /**
   * Model constructor
   * 
   * @param {Object} data
   * @param {Boolean} exists
   * @constructor
   */
  constructor(data = {}, exists = false) {
    super(...arguments)
    
    this.related = {}
  }
  
  /**
   * Begin querying the model
   * 
   * @return query instance
   */
  static query() {
    return this.prototype.mapper.newQuery()
  }
  
  /**
   * Save a new model in the database
   * 
   * @param {Object} data
   * @param {Array} returning
   * @return promise
   */
  static create(data, returning = ['*']) {
    return this.make(data).save(returning)
  }
  
  /**
   * Add a listener for the given event
   * 
   * @param {String} event
   * @param {Function} fn
   * @return model
   * @static
   */
  static on(event, fn) {
    this.prototype.mapper.emitter.on(...arguments)
    return this
  }
  
  /**
   * Remove an event listener
   * 
   * @param {String} event
   * @param {Function} fn
   * @return model
   * @static
   */
  static off(event, fn) {
    this.prototype.mapper.emitter.off(...arguments)
    return this
  }
  
  /**
   * Returns a JSON representation of this model
   * 
   * @return plain object
   */
  toJSON() {
    var json = _.mapObject(this.related, function (related, name) {
      return (! related ) ? related : related.toJSON()
    })
    
    return _.extend(super.toJSON(), json)
  }
  
  /**
   * Save the model in the database
   * 
   * @param {Array} returning
   * @return promise
   */
  save(returning = ['*']) {
    if (! this.isDirty() ) return Promise.resolve(this)
    
    return this.mapper.save(this, returning)
  }
  
  /**
   * Update the model in the database
   * 
   * @param {Object} data
   * @param {Array} returning
   * @return promise
   */
  update(data, returning = ['*']) {
    if (! this.exists ) return Promise.reject(new NotFoundError())
    
    return this.fill(data).save(returning)
  }
  
  /**
   * Delete the model from the database
   * 
   * @return promise
   */
  destroy() {
    if (! this.exists ) return Promise.reject(new NotFoundError())
    
    return this.mapper.destroy(this)
  }
  
  /**
   * Update the model's update timestamp
   * 
   * @return promise
   */
  touch() {
    return this.mapper.touch(this)
  }
  
  /**
   * Load the given relationships
   * 
   * @param {Array} relations
   * @return promise
   */
  load(relations) {
    return this.mapper.newQuery().withRelated(...arguments).loadRelated([this]).return(this)
  }
  
  /**
   * Set the relationship value in the model
   * 
   * @param {String} name
   * @param {Any} value
   * @return this model
   */
  setRelated(name, value) {
    this.related[name] = value
    return this
  }
  
  /**
   * Unset the relationship value in the model
   * 
   * @param {String} name
   * @return this model
   */
  unsetRelated(name) {
    delete this.related[name]
    return this
  }
  
  /**
   * Get the relationship value
   * 
   * @return any
   */
  getRelated(name) {
    return this.related[name]
  }
  
  /**
   * Determine if the given relationship is loaded
   * 
   * @param {String} name
   * @return boolean
   */
  hasRelated(name) {
    return !!this.getRelated(name)
  }
  
  /**
   * Trigger an event with arguments
   * 
   * @param {String} event
   * @param {Array} args
   * @return promise
   */
  emit(event, ...args) {
    return this.mapper.emit(...arguments)
  }
  
}

// exports
export default Model
