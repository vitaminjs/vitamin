
var _ = require('underscore')

module.exports = Query

function Query(Ctor) {
  this.o = Ctor
  this.d = Ctor.driver
  this.s = Ctor.options.schema
  this.q = {
    $where: [],
    $order: [],
    $select: [],
    $from: [Ctor.options.source]
  }
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
    
    this.q.$where.push(cond)
  }
  
  return this
}

/**
 * 
 * 
 * @param {Object} args
 */
Query.prototype.orWhere = function orWhere(...args) {
  return this.where({ $or: args })
}

Query.prototype.from = function from(from) {
  this.q.$from.push(from)
  return this
}

Query.prototype.select = function select(...args) {
  this.q.$select = _.compact(this.q.$select.concat(args))
  return this
}

Query.prototype.take = function take(n) {
  this.q.$take = n
  return this
}

Query.prototype.skip = function skip(n) {
  this.q.$skip = n
  return this
}

Query.prototype.order = function order(...args) {
  this.q.$order = _.compact(this.q.$order.concat(args))
  return this
}

/**
 * @todo use promises
 */
Query.prototype.fetch = function fetch(model, cb) {
  var factory = this.o.factory.bind(this.o)
  
  function _done(err, data) {
    if ( model ) cb(err, err ? null : model.set(data))
    else cb(err, err ? null : factory(data))
  }
    
  return this.d.fetch(this, _done)
}

/**
 * @todo use promises
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  var factory = this.o.factory.bind(this.o)
  
  function _done(err, list) {
    cb(err, err ? null : _.map(list, factory))
  }
  
  return this.d.fetchAll(this, _done)
}

Query.prototype.insert = function insert(model, cb) {
  // TODO add model data
  return this.d.insert(this, cb)
}

Query.prototype.update = function update(model, cb) {
  // TODO add model data
  return this.d.update(this, cb)
}

Query.prototype.remove = function remove(model, cb) {
  // TODO add model id
  return this.d.remove(this, cb)
}

