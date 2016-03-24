
var _ = require('underscore')

module.exports = persistenceAPI

function persistenceAPI(Vitamin) {
  
  /**
   * Get all models from database
   * 
   * @param {Object} conditions
   * @param {Function} callback
   * 
   * @static
   */
  Vitamin.all = function all(query, cb) {
    var adapter = this.prototype.$adapter
    var from = this.options.source
    
    query = _.extend(query, { $from: from })
    
    return adapter.all(query, cb)
  }
  
  /**
   * Find one model
   * 
   * @param {Object} conditions
   * @param {Function} callback
   * 
   * @static
   */
  Vitamin.find = function find(query, cb) {
    var adapter = this.prototype.$adapter
    var from = this.options.source
    
    query = _.extend(query, { $from: from })
    
    return adapter.find(query, cb)
  }
  
  /**
   * Create and save a new model
   * 
   * @param {Object} data object
   * @param {Function} callback
   * 
   * @static
   */
  Vitamin.create = function create(data, cb) {
    return this.factory(data).save(cb)
  }
  
  /**
   * Fetch fresh data from database
   * 
   * @param {Function} callback
   */
  Vitamin.prototype.fetch = function fetch(cb) {
    return this.$adapter.fetch(this, cb)
  }
  
  /**
   * Save the model attributes
   * 
   * @param {Function} callback
   */
  Vitamin.prototype.save = function save(cb) {
    return this.$adapter.save(this, cb)
  }
  
  /**
   * Destroy the model
   * 
   * @param {Function} callback
   */
  Vitamin.prototype.destroy = function destroy(cb) {
    return this.$adapter.destroy(this, cb)
  }
  
}