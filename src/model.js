
import NotFoundError from './errors/model-not-found'
import Relation from './relations/base'
import BaseModel from 'vitamin-model'
import Collection from './collection'
import Promise from 'bluebird'
import Query from './query'
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
    super(data)
    
    if ( exists ) this.setData(data, true)
    
    this.exists = exists
    this.related = {}
  }
  
  /**
   * A factory helper to instanciate models without using `new`
   * 
   * @param {Object} data
   * @param {Boolean} exists
   * @return model instance
   */
  static make(data = {}, exists = false) {
    return new this(...arguments)
  }
  
  /**
   * Begin querying the model
   * 
   * @return query instance
   */
  static query() {
    return this.make().newQuery()
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
    
    return Promise
      .bind(this)
      .then(() => this.emit('saving', this))
      .then(() => this.exists ? this._update(returning) : this._insert(returning))
      .then(() => this.emit('saved', this))
      .return(this)
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
    
    var pk = this.primaryKey, id = this.getId()
    
    return Promise
      .bind(this)
      .then(() => this.emit('deleting', this))
      .then(() => this.newQuery().where(pk, id).destroy())
      .then(() => this.emit('deleted', this))
      .return(this)
  }
  
  /**
   * Get the model query builder
   * 
   * @return Query instance
   */
  newQuery() {
    var qb = this.connection.queryBuilder()
    
    return (new Query(qb)).from(this.tableName).setModel(this)
  }
  
  /**
   * Create a new instance of the current model
   * 
   * @param {Object} data
   * @param {Booleab} exists
   * @return Model instance
   */
  newInstance(data = {}, exists = false) {
    return this.constructor.make(...arguments)
  }
  
  /**
   * Create a new collection of models
   * 
   * @param {Array} models
   * @return Collection instance
   */
  newCollection(models = []) {
    return new Collection(models)
  }
  
  /**
   * Begin querying the model on a given connection
   * 
   * @param {Object} connection knex instance
   * @return this model
   */
  use(connection) {
    this.connection = connection
    return this
  }
  
  /**
   * Get a fresh timestamp for the model
   * 
   * @return string ISO time
   */
  freshTimestamp() {
    return new Date().toISOString()
  }
  
  /**
   * Update the creation and update timestamps
   * 
   * @return this model
   */
  updateTimestamps() {
    var time = this.freshTimestamp()
    var useCreatedAt = !!this.createdAtColumn
    var useUpdatedAt = !!this.updatedAtColumn
    
    if ( useUpdatedAt && !this.isDirty(this.updatedAtColumn) ) {
      this.set(this.updatedAtColumn, time)
    }
    
    if ( useCreatedAt && this.exists && !this.isDirty(this.createdAtColumn) ) {
      this.set(this.createdAtColumn, time)
    }
    
    return this
  }
  
  /**
   * Update the model's update timestamp
   * 
   * @return promise
   */
  touch() {
    if (! this.timestamps ) return Promise.resolve(this)
  
    return this.updateTimestamps().save()
  }
  
  /**
   * Load the given relationships
   * 
   * @param {Array} relations
   * @return promise
   */
  load(relations) {
    return this.newQuery().withRelated(...arguments).loadRelated([this]).return(this)
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
   * Determine if the given relationship is loaded
   * 
   * @param {String} name
   * @return boolean
   */
  hasRelated(name) {
    return !!this.related[name]
  }
  
  /**
   * Create the relationship mapper
   * 
   * @param {String} name
   * return relation instance
   */
  getRelation(name) {
    var relation = _.result(this, name)
    
    if ( relation instanceof Relation ) return relation
    
    throw new Error("Relationship must be an object of type 'Relation'")
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
   * Perform a model insert operation
   * 
   * @param {String|Array} returning
   * @return promise
   * @private
   */
  _insert(returning) {
    return Promise
      .bind(this)
      .then(() => this.emit('creating', this))
      .then(() => this.timestamps && this.updateTimestamps())
      .then(() => {
        return this
          .newQuery()
          .insert(this.getData())
          .then(res => this._emulateReturning(res, returning))
          .then(res => this.setData(res, true))
      })
      .then(() => this.emit('created', this))
  }
  
  /**
   * Perform a model update operation
   * 
   * @param {String|Array} returning
   * @return promise
   * @private
   */
  _update(returning) {
    return Promise
      .bind(this)
      .then(() => this.emit('updating', this))
      .then(() => this.timestamps && this.updateTimestamps())
      .then(() => {
        return this
          .newQuery()
          .where(this.primaryKey, this.getId())
          .update(this.getDirty())
          .then(res => this._emulateReturning(res, returning))
          .then(res => this.setData(res, true))
      })
      .then(() => this.emit('updated', this))
  }
  
  /**
   * Emulate the `returning` SQL clause
   * 
   * @param {Array} result
   * @param {Array} columns
   * @private
   */
  _emulateReturning(result, columns = ['*']) {
    var id = result[0]
    
    if ( _.isObject(id) ) return id
    else {
      let qb = this.newQuery().toBase()
      
      if ( this.exists ) id = this.getId()
      
      // resolve with a plain object to populate the model data
      return qb.where(this.primaryKey, id).first(columns)
    }
  }
  
}

/**
 * Define the model table name
 * 
 * @type {String}
 */
Model.prototype.tableName = null

/**
 * Define the model's polymorphic name
 * 
 * @type {String}
 */
Model.prototype.morphName = null

/**
 * Determine if the model uses timestamps
 * 
 * @type {Boolean}
 */
Model.prototype.timestamps = false

/**
 * The name of the "created at" column
 * 
 * @type {String}
 */
Model.prototype.createdAtColumn = 'created_at'

/**
 * The name of the "updated at" column
 * 
 * @type {String}
 */
Model.prototype.updatedAtColumn = 'updated_at'

// exports
export default Model