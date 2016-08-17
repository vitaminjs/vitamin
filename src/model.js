
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
   * Define a has-one relationship
   * 
   * @param {Model} related
   * @param {Object} config { as*, foreignKey, localKey }
   * @return relation
   * @private
   */
  hasOne(related, config = {}) {
    var pk = config.localKey || this.primaryKey
    var fk = config.foreignKey || config.as + '_id'
    var HasOne = require('./relations/has-one').default
    
    return new HasOne(config.as, this, related.make(), fk, pk)
  }
  
  /**
   * Define a morph-one relationship
   * 
   * @param {Model} related
   * @param {Object} config { as*, name, type, foreignKey, localKey }
   * @return relation
   * @private
   */
  morphOne(related, config = {}) {
    var pk = config.localKey || this.primaryKey
    var type = config.type || config.name + '_type'
    var fk = config.foreignKey || config.name + '_id'
    var MorphOne = require('./relations/morph-one').default
    
    return new MorphOne(config.as, this, related.make(), type, fk, pk)
  }
  
  /**
   * Define a has-many relationship
   * 
   * @param {Model} related
   * @param {Object} config { as*, foreignKey, localKey }
   * @return relation
   * @private
   */
  hasMany(related, config = {}) {
    var pk = config.localKey || this.primaryKey
    var fk = config.foreignKey || config.as + '_id'
    var HasMany = require('./relations/has-many').default
    
    return new HasMany(config.as, this, related.make(), fk, pk)
  }
  
  /**
   * Define a morph-many relationship
   * 
   * @param {Model} related
   * @param {Object} config { as*, name, type, foreignKey, localKey }
   * @return relation
   * @private
   */
  morphMany(related, config = {}) {
    var pk = config.localKey || this.primaryKey
    var type = config.type || config.name + '_type'
    var fk = config.foreignKey || config.name + '_id'
    var MorphOne = require('./relations/morph-one').default
    
    return new MorphOne(config.as, this, related.make(), type, fk, pk)
  }
  
  /**
   * Define a belongs-to relationship
   * 
   * @param {Model} related
   * @param {Object} config { as*, foreignKey, targetKey }
   * @return relation
   * @private
   */
  belongsTo(related, config) {
    var target = related.make()
    var pk = config.targetKey || target.primaryKey
    var fk = config.foreignKey || config.as + '_id'
    var BelongsTo = require('./relations/belongs-to').default
    
    return new BelongsTo(config.as, this, target, fk, pk)
  }
  
  /**
   * Define a belongs-to-many relationship
   * 
   * @param {Model} related
   * @param {Object} config { as*, pivot, foreignKey, targetKey }
   * @return relation
   * @private
   */
  belongsToMany(related, config) {
    var table = config.pivot || null
    var tfk = config.targetKey || null
    var pfk = config.foreignKey || null
    var BelongsToMany = require('./relations/belongs-to-many').default
    
    return new BelongsToMany(config.as, this, related.make(), table, pfk, tfk)
  }
  
}

/**
 * Define the model's polymorphic name
 * 
 * @type {String}
 */
Model.prototype.morphName = null

// exports
export default Model
