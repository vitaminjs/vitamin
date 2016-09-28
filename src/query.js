
import _ from 'underscore'
import Model from './model'
import Mapper from './mapper'
import Promise from 'bluebird'
import BaseQuery from 'vitamin-query'
import NotFoundError from './errors/model-not-found'

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
   * @param {Mapper} mapper
   * @return this query
   */
  setModel(mapper) {
    this.model = mapper
    return this
  }
  
  /**
   * Set the relationships that should be eager loaded
   * 
   * @param {Array} relations
   * @return this query
   */
  withRelated(relations) {
    if (! _.isArray(relations) ) relations = _.toArray(arguments)
    
    _.extend(this.rels, this.parseWithRelated(relations))
    
    return this
  }
  
  /**
   * Load the relationships of the models
   * 
   * @param {Array} models
   * @return promise
   */
  loadRelated(models) {
    // no need to load related, if there is no parent models
    if ( _.isEmpty(models) || _.isEmpty(this.rels) ) return Promise.resolve()
    
    return Promise.map(_.keys(this.rels), name => this.eagerLoad(name, models))
  }
  
  /**
   * Fetch many models from th database
   * 
   * @param {String|Array} columns
   * @return promise
   */
  fetch(columns) {
    return super.fetch(...arguments)
      .then(res => this.model.createModels(res))
      .tap(res => this.loadRelated(res.toArray()))
  }
  
  /**
   * Fetch the first model from the database
   * 
   * @param {String|Array} columns
   * @return promise
   */
  first(columns) {
    return this.limit(1).fetch(...arguments).then(res => res.first())
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
      
      throw new NotFoundError()
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
      
      return this.model.newInstance(attrs)
    })
  }
  
  /**
   * Get the first record matching the attributes or create it
   * 
   * @param {Object} attrs
   * @return promise
   */
  firstOrCreate(attrs, returning = ['*']) {
    return this.firstOrNew(attrs).then(res => res.save(returning))
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
      // it will throw a error if there is no result,
      // or the models found are different than the given ids,
      // in case of an array of ids passed in
      if ( !res || _.isArray(id) && _.uniq(id).length === res.length ) 
        throw new NotFoundError()
      
      return res
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
  
  /**
   * Eager laod a relationhip
   * 
   * @param {String} name
   * @param {Array} models
   * @return promise
   * @private
   */
  eagerLoad(name, models) {
    var config = this.rels[name]
    var relation = this.model.getRelation(name)
    
    // add custom constraints
    if ( _.isFunction(config) ) relation.modify(config)
    
    // set nested models
    if ( _.isArray(config) ) relation.modify(q => q.withRelated(config))
    
    return relation.eagerLoad(models)
  }
  
  /**
   * Reduce an array of relations into a plain object
   * 
   * @param {Array} relations
   * @return plain object
   * @private
   */
  parseWithRelated(relations) {
    return _.reduce(relations, function (memo, value) {
      if ( _.isString(value) ) value = _.object([[value, _.noop]])
      
      if( _.isObject(value) ) {
        _.each(value, function (val, key) {
          var parts = key.split('.')
          var parent = parts.shift()
          var child = parts.join('.')
          
          if ( _.isEmpty(child) ) {
            if (! _.isArray(val) ) memo[parent] = val
            else memo[parent] = val.concat(memo[parent] || [])
          }
          else
            (memo[parent] = memo[parent] || []).push(_.object([[child, val]]))
        }) 
      } 
      
      return memo
    }, {})
  }
  
  
  
}

// exports
export default Query
