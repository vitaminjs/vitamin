
import Model from './model'
import Mapper from './mapper'
import Promise from 'bluebird'
import NotFoundError from './errors/model-not-found'
import { toArray, isArray, isEmpty, isString, isFunction, isObject, 
         each, keys, uniq, reduce, extend, object, first } from 'underscore'

/**
 * @class Query
 */
export default class Query {
  
  /**
   * Query class constructor
   * 
   * @param {QueryBuilder} qb knex query builder
   * @constructor
   */
  constructor(qb) {
    this.columns = []
    this.table = null
    this.alias = null
    this.rels = {}
    
    this.__qb = qb
  }
  
  /**
   * Get the base query builder
   * 
   * @var {QueryBuilder}
   */
  get builder() {
    return this.__qb
  }
  
  /**
   * Get the base query builder
   * 
   * @return query builder
   * @deprecated
   */
  toBase() {
    // TODO display a warning message
    return this.builder
  }
  
  /**
   * Get the selected columns prefixed by the table name
   * 
   * @return array
   */
  getQualifiedColumns() {
  	return (isEmpty(this.columns) ? ['*'] : this.columns).map(name => {
      return (isString(name) && name.indexOf('.') === -1) ? this.getQualifiedColumn(name) : name
    })
  }
  
  /**
   * Set the table name for this query
   * 
   * @param {String} table
   * @param {String} alias
   * @return this query
   * @deprecated
   */
  from(table, alias) {
  	return this.setTable(table, alias)
  }
  
  /**
   * Set the table name for this query
   * 
   * @param {String} name
   * @param {String} alias
   * @return this query
   */
  setTable(name, alias = null) {
    if (! isString(name) ) throw new TypeError("Invalid table name")
    
    this.table = name
    
    if ( isString(alias) && !isEmpty(alias) ) {
      name += ` as ${alias}`
      this.alias = alias
    }
    
    this.builder.from(name)
  	
    return this
  }
  
  /**
   * Get the column name prefixed by the table name
   * 
   * @param {String} name
   * @return string
   * @deprecated
   */
  getQualifiedColumn(name) {
    return this.qualifyColumn(name)
  }
  
  /**
   * Get the column name prefixed by the table name
   * 
   * @param {String} name
   * @return string
   */
  qualifyColumn(name) {
    return (this.alias || this.table) + '.' + name
  }
  
  /**
   * Set the columns of the query
   * 
   * @param {Array} columns
   * @return this query
   */
  select(columns) {
    if (! isArray(columns) ) columns = toArray(arguments)
  	
  	if (! isEmpty(columns) ) this.columns.push(...columns)
  	
    return this
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
    if (! isArray(relations) ) relations = toArray(arguments)
    
    extend(this.rels, this.parseWithRelated(relations))
    
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
    if ( isEmpty(models) || isEmpty(this.rels) ) return Promise.resolve()
    
    return Promise.map(keys(this.rels), name => this.eagerLoad(name, models))
  }
  
  /**
   * Fetch many models from th database
   * 
   * @param {String|Array} columns
   * @return promise
   */
  fetch(columns) {
    this.select(...arguments)
    
    return Promise
      .resolve(this.builder.select(this.getQualifiedColumns()))
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
    if ( isArray(id) ) return this.findMany(id, columns)
    
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
      if ( !res || isArray(id) && uniq(id).length === res.length ) 
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
    if ( isEmpty(ids) ) return Promise.resolve(this.model.newCollection())
    
    var pk = this.getQualifiedColumn(this.model.primaryKey)
    
    return this.whereIn(pk, ids).fetch(...columns)
  }
  
  /**
   * Insert records into the database
   * 
   * @param {Object} data
   * @param {Array} returning
   * @return promise
   */
  insert(data, returning = ['*']) {
    return Promise.resolve(this.builder.insert(...arguments))
  }
  
  /**
   * Update records in the database
	 * 
	 * @param {String} key
	 * @param {Any} value
	 * @param {Array} returning
	 * @return promise
	 */
  update(key, value, returning = ['*']) {
    return Promise.resolve(this.builder.update(...arguments))
  }
  
  /**
	 * Get an array with the values of the given column
	 * 
	 * @param {String} column
	 * @return promise
	 */
  pluck(column) {
		return Promise.resolve(this.builder.pluck(column))
	}
  
  /**
   * Delete a record from the database
   * 
   * @return promise
   */
  destroy() {
    return Promise.resolve(this.builder.del())
  }  
  /**
   * Get the minimum value of a given column
   * 
   * @param {String} column
   * @return promise
   */
  min(column) {
    return this.aggregate('min', column)
  }
  
  /**
   * Get the maximum value of a given column
   * 
   * @param {String} column
   * @return promise
   */
  max(column) {
    return this.aggregate('max', column)
  }
  
  /**
   * Get the average of the values of a given column
   * 
   * @param {String} column
   * @return promise
   */
  avg(column) {
    return this.aggregate('avg', column)
  }
  
  /**
   * Execute an aggregate function on the database
   * 
   * @param {String} method
   * @param {String} column
   * @return promise
   */
  aggregate(method, column) {
    column += ' as aggregate'
    return this.builder[method](column).then(res => first(res)['aggregate'])
  }
  
  /**
   * Get a single column's value from the first result of a query
   * 
   * @param {String} column
   * @return promise
   */
  value(column) {
    return this.builder.first(column).then(res => res[column])
  }
  
  /**
   * Simple pagination of the given query
   * 
   * @param {Integer} page
   * @param {Integer} count
   * @param {Array} columns
   * @return promise
   */
  paginate(page = 1, count = 15, columns = ['*']) {
    return this.offset((page - 1) * count).limit(count).fetch(columns)
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
    if ( isFunction(config) ) relation.modify(config)
    
    // set nested models
    if ( isArray(config) ) relation.modify(q => q.withRelated(config))
    
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
    return reduce(relations, function (memo, value) {
      if ( isString(value) ) value = object([[value, () => {}]])
      
      if( isObject(value) ) {
        each(value, (val, key) => {
          var parts = key.split('.')
          var parent = parts.shift()
          var child = parts.join('.')
          
          if ( isEmpty(child) ) {
            if (! isArray(val) ) memo[parent] = val
            else memo[parent] = val.concat(memo[parent] || [])
          }
          else
            (memo[parent] = memo[parent] || []).push(object([[child, val]]))
        }) 
      } 
      
      return memo
    }, {})
  }
  
}

// query builder methods
[
  'increment', 'decrement',
  'distinct', 'union', 'unionAll',
  'where', 'orWhere', 'whereRaw', 'whereNot',
  'whereIn', 'orWhereIn', 'whereNotIn', 'orWhereNotIn',
  'whereNull', 'orWhereNull', 'whereNotNull', 'orWhereNotNull',
  'whereExists', 'orWhereExists', 'whereNotExists', 'orWhereNotExists',
  'whereBetween', 'orWhereBetween', 'whereNotBetween', 'orWhereNotBetween',
  'offset', 'limit', 'groupBy', 'groupByRaw', 'having', 'orderBy', 'orderByRaw',
  'join', 'innerJoin', 'leftJoin', 'rightJoin', 'outerJoin', 'crossJoin', 'joinRaw',
]
.forEach(name => Object.defineProperty(Query.prototype, name, {
  writable: true,
  configurable: true,
  value: function () {
    this.builder[name](...arguments)
    return this
  }
}))