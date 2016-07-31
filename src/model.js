
import NotFoundError from './not-found-error'
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
    super()
    
    if (! exists ) this.fill(data)
    else this.setData(data, true)
    
    this.exists = exists
    this.related = {}
  }
  
  /**
   * Define the model table name
   * 
   * @type {String}
   */
  get tableName() {
    return null
  }
  
  /**
   * Determine if the model uses timestamps
   * 
   * @type {Boolean}
   */
  get timestamps() {
    return false
  }
  
  /**
   * The name of the "created at" column
   * 
   * @type {String}
   */
  get createdAtColumn() {
    return 'created_at'
  }
  
  /**
   * The name of the "updated at" column
   * 
   * @type {String}
   */
  get updatedAtColumn() {
    return 'updated_at'
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
   * Set the model raw data
   * 
   * @param {Object} data
   * @param {Boolean} sync
   * @return this model
   */
  setData(data, sync = true) {
    this.exists = !!sync
    this.data = data || {}
    
    // sync original attributes with the current state
    if ( sync === true ) this.syncOriginal()
    
    return this
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
      .then(() => this.exists ? this._insert(returning) : this._update(returning))
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
    
    var pk = this.getKeyName(), id = this.getId()
    
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
   * @param {Object} config { as*, foreignKey, targetKey }
   * @return relation
   * @private
   */
  hasOne(related, config = {}) {
    var pk = config.targetKey || this.primaryKey
    var fk = config.foreignKey || config.as + '_id'
    var HasOne = require('./relations/has-one').default
    
    return new HasOne(this, related.make(), fk, pk).setName(config.as)
  }
  
  /**
   * Define a has-many relationship
   * 
   * @param {Model} related
   * @param {Object} config { as*, foreignKey, targetKey }
   * @return relation
   * @private
   */
  hasMany(related, config = {}) {
    var pk = config.targetKey || this.primaryKey
    var fk = config.foreignKey || config.as + '_id'
    var HasMany = require('./relations/has-many').default
    
    return new HasMany(this, related.make(), fk, pk).setName(config.as)
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
    
    return new BelongsTo(this, target, fk, pk).setName(config.as)
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
      .then(() => {
        return this
          .newQuery()
          .update(this.getDirty())
          .where(this.primaryKey, this.getId())
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
      var qb = this.newQuery().toBase()
      
      // resolve with a plain object to populate the model data
      return qb.where(this.primaryKey, id).first(columns)
    }
  }
  
}

// exports
export default Model