
import InvalidRelationError from './errors/invalid-relation-object'
import EventEmitter from 'vitamin-events'
import Relation from './relations/base'
import Collection from './collection'
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
    this.events = {}
    this.methods = {}
    this.statics = {}
    this.relations = {}
    this.attributes = {}
    this.defaults = null
    this.tableName = null
    this.primaryKey = 'id'
    this.timestamps = false
    this.connection = 'default'
    this.createdAtColumn = 'created_at'
    this.updatedAtColumn = 'updated_at'

    _.extend(this, options)
    
    // set up the model class for this mapper
    this._setupModel(options.modelClass || Model)
    
    // set up the event emitter
    this.emitter = new EventEmitter()
    this._registerEvents(this.events)
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
   * Get the model mapper from the registry
   *
   * @param {String} name
   * @return mapper
   */
  mapper(name) {
    return registry.get(name)
  }

  /**
   * Get the model default attributes
   *
   * @return function or plain object
   */
  getDefaults() {
    return this.defaults ? this.defaults : () => {
      return _.reduce(this.attributes, (memo, config, attr) => {
        if ( _.has(config, 'defaultValue') )
          memo[attr] = _.result(config, 'defaultValue')

        return memo
      }, {})
    }
  }
  
  /**
   * Load the given relationships of a model
   * 
   * @param {Model} model
   * @param {Array} relations
   * @return promise
   */
  load(model, relations) {
    relations = _.rest(arguments)
    
    return this.newQuery().withRelated(...relations).loadRelated([model]).return(model)
  }

  /**
   * Create a new record into the database
   *
   * @param {Object} attrs
   * @param {Array} returning
   * @return promise
   */
  create(attrs, returning = ['*']) {
    return this.save(this.newInstance(attrs), returning)
  }

  /**
   * Create many instances of the related model
   *
   * @param {Array} records
   * @parma {Array} returning
   * @return promise
   */
  createMany(records, returning = ['*']) {
    return Promise.map(records, attrs => this.create(attrs, returning))
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
   * Save the related models
   *
   * @param {Array} models
   * @parma {Array} returning
   * @return promise
   */
  saveMany(models, returning = ['*']) {
    return Promise.map(models, model => this.save(model, returning))
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
      return this.save(model.set(this.updatedAtColumn, this.freshTimestamp()))
    }

    return Promise.resolve(model)
  }

  /**
   * Create a new model instance
   *
   * @param {Object} data
   * @param {Boolean} exists
   * @return model instance
   */
  newInstance(data = {}, exists = false) {
    return this.modelClass.make(...arguments)
  }

  /**
   * Get the model query builder
   *
   * @return Query instance
   * @alias query
   */
  newQuery() {
    var conn = registry.connection(this.connection)
    var query = new Query(conn.queryBuilder())
    
    return query.from(this.tableName).setModel(this)
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
   * Helper to create a collection of models
   * 
   * @param {Array} records
   * @return collection
   */
  createModels(records) {
    return this.newCollection(_.map(records, data => this.newInstance(data, true)))
  }

  /**
   * Create the relationship mapper
   *
   * @param {String} name
   * return relation instance
   */
  getRelation(name) {
    if ( this.relations[name] ) {
      let relation = this.relations[name].call(this)

      if ( relation instanceof Relation ) return relation.setName(name)
    }

    throw new InvalidRelationError(name)
  }

  /**
   * Define a has-one relationship
   *
   * @param {Model} related
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @return relation
   */
  hasOne(related, fk = null, pk = null) {
    var HasOne = require('./relations/has-one').default

    if (! pk ) pk = this.primaryKey

    if (! fk ) fk = this.name + '_id'

    if ( _.isString(related) ) related = this.mapper(related)

    return new HasOne(this, related, fk, pk)
  }

  /**
   * Define a morph-one relationship
   *
   * @param {Model} related
   * @param {String} name of the morph
   * @param {String} type target model type column
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @return relation
   */
  morphOne(related, name, type = null, fk = null, pk = null) {
    var MorphOne = require('./relations/morph-one').default

    if (! pk ) pk = this.primaryKey

    if (! type ) type = name + '_type'

    if (! fk ) fk = name + '_id'

    if ( _.isString(related) ) related = this.mapper(related)

    return new MorphOne(this, related, type, fk, pk)
  }

  /**
   * Define a has-many relationship
   *
   * @param {Model} related
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @return relation
   */
  hasMany(related, fk = null, pk = null) {
    var HasMany = require('./relations/has-many').default

    if (! pk ) pk = this.primaryKey

    if (! fk ) fk = this.name + '_id'

    if ( _.isString(related) ) related = this.mapper(related)

    return new HasMany(this, related, fk, pk)
  }

  /**
   * Define a morph-many relationship
   *
   * @param {Model} related
   * @param {String} name of the morph
   * @param {String} type target model type column
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @return relation
   */
  morphMany(related, name, type = null, fk = null, pk = null) {
    var MorphMany = require('./relations/morph-many').default

    if (! pk ) pk = this.primaryKey

    if (! type ) type = name + '_type'

    if (! fk ) fk = name + '_id'

    if ( _.isString(related) ) related = this.mapper(related)

    return new MorphMany(this, related, type, fk, pk)
  }

  /**
   * Define a belongs-to relationship
   *
   * @param {Model} related
   * @param {String} fk parent model foreign key
   * @param {String} pk target model primary key
   * @return relation
   */
  belongsTo(related, fk = null, pk = null) {
    var BelongsTo = require('./relations/belongs-to').default

    if ( _.isString(related) ) related = this.mapper(related)

    if (! pk ) pk = related.primaryKey

    if (! fk ) fk = related.name + '_id'

    return new BelongsTo(this, related, fk, pk)
  }
  
  /**
   * Define a morph-to relationship
   * 
   * @param {String} name of the morph
   * @param {String} type column name
   * @param {String} fk
   * @param {String} pk
   * @return relation
   */
  morphTo(name, type = null, fk = null, pk = null) {
    var MorphTo = require('./relations/morph-to').default
    
    if (! fk ) fk = name + '_id'
    
    if (! pk ) pk = this.primaryKey
    
    if (! type ) type = name + '_type'
    
    return new MorphTo(this, type, fk, pk)
  }

  /**
   * Define a belongs-to-many relationship
   *
   * @param {Model} related
   * @param {String} pivot table name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @return relation
   */
  belongsToMany(related, pivot, pfk = null, tfk = null) {
    var BelongsToMany = require('./relations/belongs-to-many').default

    if ( _.isString(related) ) related = this.mapper(related)

    if (! pfk ) pfk = this.name + '_id'

    if (! tfk ) tfk = related.name + '_id'
    
    return new BelongsToMany(this, related, pivot, pfk, tfk)
  }

  /**
   * Define a morph-to-many relationship
   *
   * @param {Model} related
   * @param {String} pivot table name
   * @param {String} name of the morph
   * @param {String} type column name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @return relation
   */
  morphToMany(related, pivot, name, type = null, pfk = null, tfk = null) {
    var MorphToMany = require('./relations/morph-to-many').default

    if ( _.isString(related) ) related = this.mapper(related)

    if (! pfk ) pfk = name + '_id'
    
    if (! type ) type = name + '_type'

    if (! tfk ) tfk = related.name + '_id'
    
    return new MorphToMany(this, related, pivot, type, pfk, tfk)
  }
  
  /**
   * Define the inverse of morph-to-many relationship
   * 
   * @param {Model} related
   * @param {String} pivot table name
   * @param {String} name of the morph
   * @param {String} type column name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @return relation
   */
  morphedByMany(related, pivot, name, type = null, pfk = null, tfk = null) {
    if (! tfk ) tfk = name + '_id'
    
    if (! pfk ) pfk = this.name + '_id'
    
    return this.morphToMany(related, pivot, name, type, pfk, tfk)
  }
  
  /**
   * Add a listener for the given event
   * 
   * @param {String} event
   * @param {Function} fn
   * @return this model
   */
  on(event, fn) {
    this.emitter.on(...arguments)
    return this
  }
  
  /**
   * Remove an event listener
   * 
   * @param {String} event
   * @param {Function} fn
   * @return this model
   */
  off(event, fn) {
    this.emitter.off(...arguments)
    return this
  }
  
  /**
   * Trigger an event with arguments
   * 
   * @param {String} event
   * @param {Array} args
   * @return promise
   */
  emit(event, ...args) {
    return this.emitter.emit(...arguments)
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
      .tap(() => this.timestamps && this._updateTimestamps(model))
      .tap(() => {
        return this
          .newQuery()
          .insert(model.getData(), returning)
          .then(res => this._emulateReturning(model, res, returning))
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
      .tap(() => this.timestamps && this._updateTimestamps(model))
      .tap(() => {
        return this
          .newQuery()
          .where(this.primaryKey, model.getId())
          .update(model.getDirty(), returning)
          .then(res => this._emulateReturning(model, res, returning))
          .then(res => model.setData(res, true))
      })
      .tap(() => this.emitter.emit('updated', model))
  }

  /**
   * Emulate the `returning` SQL clause
   *
   * @param {Model} model
   * @param {Array} result
   * @param {Array} columns
   * @private
   */
  _emulateReturning(model, result, columns = ['*']) {
    var id = result[0]

    if ( _.isObject(id) ) return id
    else {
      let qb = this.newQuery().toBase()

      if ( model.exists ) id = model.getId()

      // resolve with a plain object to populate the model data
      return qb.where(this.primaryKey, id).first(columns)
    }
  }

  /**
   * Update the creation and update timestamps
   *
   * @param {Model} model
   * @private
   */
  _updateTimestamps(model) {
    var time = this.freshTimestamp()
    var useCreatedAt = !!this.createdAtColumn
    var useUpdatedAt = !!this.updatedAtColumn

    if ( useUpdatedAt && !model.isDirty(this.updatedAtColumn) ) {
      model.set(this.updatedAtColumn, time)
    }

    if ( useCreatedAt && !model.exists && !model.isDirty(this.createdAtColumn) ) {
      model.set(this.createdAtColumn, time)
    }
  }

  /**
   * Set up the model class
   *
   * @param {Model} model constructor
   * @private
   */
  _setupModel(model) {
    var _this = this
    var proto = _.clone(this.methods)

    // add prototype properties
    proto.mapper = this
    proto.defaults = this.getDefaults()
    proto.idAttribute = this.primaryKey

    // add relationship accessors
    _.each(this.relations, (_, name) => {
      proto[name] = function () {
        return _this.getRelation(name).addConstraints(this)
      }
    })

    this.modelClass = model.extend(proto, this.statics)
  }

}
