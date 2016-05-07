
var Promise = require('bluebird')
var _ = require('underscore')

module.exports = Query

/**
 * Vitamin query builder constructor
 * 
 * @param {Object} model
 * @param {Object} driver
 */
function Query(model) {
  this._select = []
  this._from   = undefined
  this._where  = []
  this._order  = []
  this._skip   = undefined
  this._limit  = undefined
  
  this.setModel(model)
}

/**
 * 
 */
Object.defineProperty(Query.prototype, 'driver', {
  get: function getDriver() {
    var driver = this.model.constructor.driver
    
    if ( driver ) return driver
    
    throw "Undefined database driver"
  }
})

/**
 * 
 * 
 * @param {Object} model
 */
Query.prototype.setModel = function setModel(model) {
  this._from   = model.getOption('source')
  this.model   = model
  return this
}

/**
 * 
 * 
 * where('name', "John")
 * where({ name: "Rita", age: 18 })
 * where('status', { $ne: "draft" })
 * where('price', { $gt: 100, $lte: 200 })
 * 
 * 
 */
Query.prototype.where = function where(key, val) {
  if ( key ) {
    var cond = {}
    
    if ( _.isObject(key) ) cond = key
    else cond[key] = val
    
    this._where.push(cond)
  }
  
  return this
}

/**
 * 
 * 
 * @param {Object} args
 */
Query.prototype.orWhere = function orWhere() {
  return this.where({ $or: _.toArray(arguments) })
}

/**
 * 
 */
Query.prototype.from = function from(from) {
  this._from = from
  return this
}

/**
 * 
 */
Query.prototype.select = function select() {
  var args = _.toArray(arguments)
  
  this._select = _.uniq(this._select.concat(args))
  return this
}

/**
 * 
 */
Query.prototype.take = function take(n) {
  this._limit = Number(n)
  return this
}

/**
 * 
 */
Query.prototype.skip = function skip(n) {
  this._skip = Number(n)
  return this
}

/**
 * 
 */
Query.prototype.order = function order() {
  var args = _.toArray(arguments)
  
  this._order = _.uniq(this._order.concat(args))
  return this
}

/**
 * 
 */
Query.prototype.fetch = function fetch(cb) {
  var pending = this.driver.fetch(this.limit(1).assemble())
  
  function _mapOne(data) {
    return _.isEmpty(data) ? Promise.reject(null) : this.model.set(data)
  }
  
  return Promise.bind(this).resolve(pending).then(_mapOne).nodeify(cb)
}

/**
 * 
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  var pending = this.driver.fetchAll(this.assemble())
  
  function _mapAll(list) {
    var Model = this.model.constructor
    
    return _.map(list, Model.factory.bind(Model))
  }
  
  return Promise.bind(this).resolve(pending).then(_mapAll).nodeify(cb)
}

/**
 * 
 */
Query.prototype.insert = function insert(cb) {
  var data = this.model.serialize(),
      pending = this.driver.insert(this.assemble(), data)
  
  function _handle(id) {
    return this.model.setId(id[0])
  }
  
  return Promise.bind(this).resolve(pending).then(_handle).nodeify(cb)
}

/**
 * 
 */
Query.prototype.update = function update(cb) {
  var data = this.model.serialize(),
      pending = this.driver.update(this.assemble(), data)
  
  return Promise.resolve(pending).return(this.model).nodeify(cb)
}

/**
 * 
 */
Query.prototype.destroy = function destroy(cb) {
  var pending = this.driver.remove(this.assemble())
  
  return Promise.resolve(pending).return(this.model).nodeify(cb)
}

/**
 * 
 * 
 * @return {Object}
 */
Query.prototype.assemble = function assemble() {
  var q = {}, 
      props = ['select', 'from', 'where', 'order', 'skip', 'limit']
  
  _.each(props, function _assemblePieces(name) {
    if (! _.isEmpty(this['_' + name]) ) 
      q[name] = _.clone(this['_' + name])
  }, this)
  
  return q
}