
var Query = require('./query')

module.exports = extension

function extension(Model) {
  
  /**
   * Get all models from database
   * 
   * @param {Object} where
   * @param {Function} cb
   * 
   * @static
   */
  Model.all = function all(cb) {
    return newQuery(this).fetchAll(cb)
  }
  
  /**
   * Find a model by ID
   * 
   * @param {Mixed} id
   * @param {Function} cb
   * 
   * @static
   */
  Model.find = function find(id, cb) {
    return this.where(this.options.pk, id).fetch(null, cb)
  }
  
  /**
   * 
   * @param {String|Object} key attribute name or query object
   * @param {Mixed} value attribute value
   * 
   * @return Query
   */
  Model.where = function where(key, value) {
    return newQuery(this).where(key, value)
  }
  
  /**
   * Create and save a new model
   * 
   * @param {Object} data object
   * @param {Function} callback
   * 
   * @static
   */
  Model.create = function create(data, cb) {
    return this.factory(data).save(cb)
  }
  
  /**
   * Fetch fresh data from database
   * 
   * @param {Function} callback
   */
  Model.prototype.fetch = function fetch(cb) {
    return newQuery(this).where(this.$options.pk, this.id).fetch(this)
  }
  
  /**
   * Save the model attributes
   * 
   * @param {Function} callback
   */
  Model.prototype.save = function save(cb) {
    return this.isNew() ? this.insert(cb) : this.update(cb)
  }
  
  /**
   * Destroy the model
   * 
   * @param {Function} callback
   */
  Model.prototype.destroy = function destroy(cb) {
    return newQuery(this).destroy(this, cb)
  }
  
  /**
   * 
   */
  Model.prototype.insert = function insert(cb) {
    return newQuery(this).insert(this, cb)
  }
  
  /**
   * 
   */
  Model.prototype.update = function update(cb) {
    return newQuery(this).update(this, cb)
  }
}

/**
 * Create a new query for the provided model
 * 
 * @return Query builder object
 */
function newQuery(o) {
  return new Query(o.prototype ? o : o.constructor)
}