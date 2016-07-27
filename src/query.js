
import _ from 'underscore'
import Promise from 'bluebird'
import BaseQuery from 'vitamin-query'
import NotFoundError from './not-found-error'

/**
 * Model Query Class
 */
class Query extends BaseQuery {
  
  /**
   * Model Query constructor
   * 
   * @param {Object} qb
   * @constructor
   */
  constructor(qb) {
    super(qb)
    
    this.rels = {}
  }
  
  /**
   * Set the model being queried
   * 
   * @param {Model} model
   * @return this query
   */
  setModel(model) {
    this.from(model.tableName)
    this.model = model
    return this
  }
  
  /**
   * Fetch many models from th database
   * 
   * @param {String|Array} columns
   * @return promise
   */
  fetch(columns) {
    return this.super.fetch(...arguments).then(res => {
      return this.model.newCollection(_.map(res, data => {
        return this.model.newInstance(data, true)
      }))
    })
  }
  
  /**
   * Fetch the first model from the database
   * 
   * @param {String|Array} columns
   * @return promise
   */
  first(columns) {
    return this.fetch(...arguments).then(res => res.first())
  }
  
  /**
   * Fetch the first model or fail if not found
   * 
   * @param {String|Array} columns
   * @return promise
   */
  firstOrFail(columns) {
    return this.first(...arguments).then(model => {
      if ( model ) return model
      else throw new NotFoundError('Not Found')
    })
  }
  
  /**
   * Get the first record matching the attributes or instantiate it
   * 
   * @param {Object} attrs
   * @return promise
   */
  firstOrNew(attrs) {
    return this.where(attrs).firstOrFail().catch(err => {
      if (! (err instanceof NotFoundError) ) throw err
      else return this.model.newInstance(attrs)
    })
  }
  
  /**
   * Get the first record matching the attributes or create it
   * 
   * @param {Object} attrs
   * @return promise
   */
  firstOrCreate(attrs) {
    return this.firstOrNew(attrs).then(res => res.save())
  }
  
  /**
   * Find a model by its primary key
   * 
   * @param {Any} id
   * @param {Array} columns
   * @return promise
   */
  find(id, columns = ['*']) {
    if ( _.isArray(id) ) return this.findMany(id, columns)
    
    var pk = this.getQualifiedColumn(this.model.primaryKey)
    
    return this.where(pk, id).first(...columns)
  }
  
  /**
   * Find a model by its primary key or fail
   * 
   * @param {Any} id
   * @param {Array} columns
   * @return promise
   */
  findOrFail(id, columns = ['*']) {
    return this.find(id, columns).then(res => {
      if (
        res instanceof this.model.constructor ||
        ( _.isArray(id) && _.uniq(id).length === res.length )
      ) return res
      
      throw new NotFoundError('Not Found')
    })
  }
  
  /**
   * Find a model by its primary key or instantiate it
   * 
   * @param {Any} id
   * @param {Array} columns
   * @return promise
   */
  findOrNew(id, columns = ['*']) {
    return this.findOrFail(id, columns).catch(err => {
      if (! (err instanceof NotFoundError) ) throw err
      else return this.model.newInstance()
    })
  }
  
  /**
   * Find multiple models by their primary keys
   * 
   * @param {Array} ids
   * @param {Array} columns
   * @return promise
   */
  findMany(ids, columns = ['*']) {
    if ( _.isEmpty(ids) ) return Promise.resolve(this.model.newCollection())
    
    var pk = this.getQualifiedColumn(this.model.primaryKey)
    
    return this.whereIn(pk, ids).fetch(...columns)
  }
  
}

// exports
export default Query
