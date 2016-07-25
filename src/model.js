
import BaseModel from 'vitamin-model'
import Collection from './collection'
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
  constructor(data, exists = false) {
    super(data)
    
    if (! exists ) this.fill(data)
    else this.setData(data, true)
    
    this.exists = exists
  }
  
  /**
   * Define the primary key name
   * 
   * @type {String}
   */
  get primaryKey() {
    return null
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
   * Set the primary key value
   * 
   * @param {Any} id
   * @return this model
   */
  setId(id) {
    return this.set(this.primaryKey, id)
  }
  
  /**
   * Get the primary key value
   * 
   * @return any
   */
  getId() {
    return this.get(this.primaryKey)
  }
  
  /**
   * Set the model raw data
   * 
   * @param {Object} data
   * @param {Boolean} sync
   * @return this model
   */
  setData(data, sync) {
    this.data = data || {}
    
    // sync original attributes with the current state
    if ( sync === true ) this.syncOriginal()
    
    return this
  }
  
  /**
   * Save the model in the database
   * 
   * @param {String|Array} returning
   * @return promise
   */
  save(returning = '*') {
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
   * @param {String|Array} returning
   * @return promise
   */
  update(data, returning = '*') {
    if (! this.exists ) return Promise.reject(new Error('Not Found'))
    
    return this.fill(data).save(returning)
  }
  
  /**
   * Delete the model from the database
   * 
   * @return promise
   */
  destroy() {
    if (! this.exists ) return Promise.reject(new Error('Not Found'))
    
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
    
    return (new Query(qb)).setModel(this)
  }
  
  /**
   * Create a new instance of the current model
   * 
   * @param {Object} data
   * @param {Booleab} exists
   * @return Model instance
   */
  newInstance(data, exists = false) {
    var Ctor = this.constructor
    
    return new Ctor(...arguments)
  }
  
  /**
   * Create a new collection of models
   * 
   * @param {Array} models
   * @return Collection instance
   */
  newCollection(models) {
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
        var query = this.newQuery()
        
        return query
          .insert(this.getData())
          .then(res => this._simulateReturning(res, returning))
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
        var query = this.newQuery()
        
        return query
          .update(this.getDirty())
          .where(this.primaryKey, this.getId())
          .then(res => this._simulateReturning(res, returning))
          .then(res => this.setData(res, true))
      })
      .then(() => this.emit('updated', this))
  }
  
  /**
   * Simulate the `returning` SQL clause
   * 
   * @param {Array} result
   * @param {String|Array} columns
   * @private
   */
  _simulateReturning(result, columns) {
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