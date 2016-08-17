
import Relation from './relations/base'
import Collection from './collection'
import Emitter from 'vitamin-events'
import registry from './registry'
import Promise from 'bluebird'
import Model from './model'
import Query from './query'
import _ from 'underscore'

// exports
export default class {
  
  /**
   * Mapper class constructor
   * 
   * @param {Object} options
   * @constructor
   */
  constructor(options = {}) {
    this.name = options.name
    this.methods = options.methods || {}
    this.statics = options.statics || {}
    this.relations = options.relations || {}
    this.tableName = options.tableName || null
    this.attributes = options.attributes || {}
    this.primaryKey = options.primaryKey || 'id'
    this.timestamps = options.timestamps || false
    this.modelClass = options.modelClass || Model
    this.createAtColumn = options.createdAtColumn || 'created_at'
    this.updatedAtColumn = options.updatedAtColumn || 'updated_at'
    
    this.emitter = new Emitter()
    this._registerEvents(options.events)
  }
  
  /**
   * Inheritance helper
   * 
   * @param {Object} props
   * @param {Object} statics
   * @return constructor function
   */
  static extend(props = {}, statics = {}) {
    var parent = this
    var child = function () { parent.apply(this, arguments) }
    
    // use custom constructor
    if ( _.has(props, 'constructor') ) child = props.constructor
    
    // set the prototype chain to inherit from `parent`
    child.prototype = Object.create(parent.prototype, {
      constructor: { value: child, writable: true, configurable: true }
    })
    
    // add static and instance properties
    _.extend(child, statics)
    _.extend(child.prototype, props)
    
    // fix extending static properties
    Object.setPrototypeOf ? Object.setPrototypeOf(child, parent) : child.__proto__ = parent
    
    return child
  }
  
  /**
   * Build a model class
   * 
   * @return model constructor
   */
  build() {
    var ctor = this.modelClass.extend(this.methods, this.statics)
    
    ctor.prototype.mapper       = this
    ctor.prototype.idAttribute  = this.primaryKey
    ctor.prototype.defaults     = this.getDefaults()
    
    return ctor
  }
  
  /**
   * Get the model constructor from the registry
   * 
   * @return model constructor
   */
  model(name) {
    return registry.get(name || this.name)
  }
  
  /**
   * Get the model default attributes
   * 
   * @return function
   */
  getDefaults() {
    if (! this.defaults ) {
      this.defaults = {}
      
      // add only the attributes which have a default value
      _.each(this.attributes, (config, attr) => {
        if ( _.has(config, 'default') )
          this.defaults[attr] = _.result(config, 'default')
      })
    }
    
    return () => { return this.defaults }
  }
  
  /**
   * Save the model in the database
   * 
   * @param {Model} model
   * @param {Array} returning
   * @return promise
   */
  save(model, returning = ['*']) {
    return Promise
      .resolve(model)
      .tap(() => this.emitter.emit('saving', model))
      .tap(() => model.exists ? this._update(...arguments) : this._insert(...arguments))
      .tap(() => this.emitter.emit('saved', model))
  }
  
  /**
   * Delete the model from the database
   * 
   * @param {Model} model
   * @return promise
   */
  destroy(model) {
    return Promise
      .resolve(model)
      .tap(() => this.emitter.emit('deleting', model))
      .tap(() => this.newQuery().where(this.primaryKey, model.getId()).destroy())
      .tap(() => this.emitter.emit('deleted', model))
  }
  
  /**
   * Begin querying the mapper on a given connection
   * 
   * @param {Object} connection knex instance
   * @return this mapper
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
   * Update the model's update timestamp
   * 
   * @param {Model} model
   * @return promise
   */
  touch(model) {
    if ( this.timestamps && this.updatedAtColumn ) {
      return model.set(this.updatedAtColumn, this.freshTimestamp()).save()
    }
    
    return Promise.resolve(model)
  }
  
  /**
   * Update the creation and update timestamps
   * 
   * @param {Model} model
   * @return this mapper
   */
  updateTimestamps(model) {
    var time = this.freshTimestamp()
    var useCreatedAt = !!this.createdAtColumn
    var useUpdatedAt = !!this.updatedAtColumn
    
    if ( useUpdatedAt && !model.isDirty(this.updatedAtColumn) ) {
      model.set(this.updatedAtColumn, time)
    }
    
    if ( useCreatedAt && this.exists && !model.isDirty(this.createdAtColumn) ) {
      model.set(this.createdAtColumn, time)
    }
    
    return this
  }
  
  /**
   * Create a new model instance
   * 
   * @param {Object} data
   * @param {Boolean} exists
   * @return model instance
   */
  newInstance(data = {}, exists = false) {
    return this.model().make(...arguments)
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
   * Create a new collection of models
   * 
   * @param {Array} models
   * @return Collection instance
   */
  newCollection(models = []) {
    return new Collection(models)
  }
  
  /**
   * Create the relationship mapper
   * 
   * @param {String} name
   * return relation instance
   */
  getRelation(name) {
    var relation = _.result(this.relations, name)
    
    if ( relation instanceof Relation ) return relation
    
    // TODO use custom error class
    throw new Error("Relationship must be an object of type 'Relation'")
  }
  
  /**
   * Override it to register shared events between mappers
   * 
   * @param {Object} events
   * @private
   */
  _registerEvents(events = {}) {
    _.each(events, (name, listener) => {
      (_.isArray(listener) ? listener : [listener]).forEach(fn => this.emitter.on(name, fn))
    })
  }
  
  /**
   * Perform a model insert operation
   * 
   * @param {Model} model
   * @param {String|Array} returning
   * @return promise
   * @private
   */
  _insert(model, returning) {
    return Promise
      .resolve(model)
      .tap(() => this.emitter.emit('creating', model))
      .tap(() => this.timestamps && this.updateTimestamps(model))
      .tap(() => {
        return this
          .newQuery()
          .insert(model.getData()) // TODO pick only the table columns
          .then(res => this._emulateReturning(res, returning))
          .then(res => model.setData(res, true))
      })
      .tap(() => this.emitter.emit('created', model))
  }
  
  /**
   * Perform a model update operation
   * 
   * @param {Model} model
   * @param {String|Array} returning
   * @return promise
   * @private
   */
  _update(model, returning) {
    return Promise
      .resolve(model)
      .tap(() => this.emitter.emit('updating', model))
      .tap(() => this.timestamps && this.updateTimestamps(model))
      .tap(() => {
        return this
          .newQuery()
          .where(this.primaryKey, model.getId())
          .update(model.getDirty())
          .then(res => this._emulateReturning(res, returning))
          .then(res => model.setData(res, true))
      })
      .tap(() => this.emitter.emit('updated', model))
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
