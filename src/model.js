
import NotFoundError from './not-found-error'
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
  constructor(data = {}, exists = false) {
    super()
    
    if (! exists ) this.fill(data)
    else this.setData(data, true)
    
    this.exists = exists
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

// query methods
[
  'where', 'orWhere', 'whereRaw', 'whereNot',
  'whereIn', 'orWhereIn', 'whereNotIn', 'orWhereNotIn',
  'whereNull', 'orWhereNull', 'whereNotNull', 'orWhereNotNull',
  'whereExists', 'orWhereExists', 'whereNotExists', 'orWhereNotExists',
  'whereBetween', 'orWhereBetween', 'whereNotBetween', 'orWhereNotBetween',
  'select', 'distinct', 'union', 'unionAll', 'pluck', 'increment', 'decrement',
  'offset', 'limit', 'groupBy', 'groupByRaw', 'having', 'orderBy', 'orderByRaw',
  'join', 'innerJoin', 'leftJoin', 'rightJoin', 'outerJoin', 'crossJoin', 'joinRaw',
  'fetch', 'first', 'find', 'count', 'max', 'min', 'sum', 'avg', 'value', 'paginate',
  'firstOrFail', 'firstOrNew', 'firstOrCreate', 'findOrFail', 'findOrNew', 'findMany',
]
.forEach((fn) => {
  if ( _.has(Model, fn) ) return
  
  Model[fn] = function () {
    return (new this()).newQuery()[name](...arguments)
  }
})

// exports
export default Model