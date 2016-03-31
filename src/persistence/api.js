
var Query = require('./query')

module.exports = persistenceAPI

function persistenceAPI(Model) {
  
  /**
   * Get all models from database
   * 
   * @param {Object} where
   * @param {Function} cb
   * 
   * @static
   */
  Model.all = function all(cb) {
    return this.factory().newQuery().fetchAll(cb)
  }
  
  /**
   * Find a model by its primary key
   * 
   * @param {Mixed} id
   * @param {Function} cb
   * 
   * @static
   */
  Model.find = function find(id, cb) {
    return this.where(this.options.pk, id).fetch(cb)
  }
  
  /**
   * 
   * @param {String|Object} key attribute name or constraints object
   * @param {Mixed} value attribute value
   * 
   * @return Query
   */
  Model.where = function where(key, value) {
    return this.factory().newQuery().where(key, value)
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
    var pk = this.getKeyName()
    
    return this.newQuery().where(pk, this.getId()).fetch(cb)
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
    return this.newQuery().destroy(cb)
  }
  
  /**
   * 
   */
  Model.prototype.insert = function insert(cb) {
    return this.newQuery().insert(cb)
  }
  
  /**
   * 
   */
  Model.prototype.update = function update(cb) {
    return this.newQuery().update(cb)
  }
  
  /**
   * Create a new query for the provided model
   * 
   * @return Query builder object
   */
  Model.prototype.newQuery = function newQuery() {
    return new Query(this, this.getOption('driver'))
  }
  
}