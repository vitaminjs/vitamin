
var Promise = require('bluebird'),
    Relation = require('has-one-or-many')

module.exports = Relation.extend({
  
  /**
   * Attach many models to the parent model
   * 
   * @param {Array} models
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  saveMany: function saveMany(models, cb) {
    return Promise
      .bind(this)
      .map(models, function (model) {
        return this.save(model)
      })
  },
  
  /**
   * Load the related models from the database
   * 
   * @param {Function} cb (optional)
   * @return a promise
   * @private
   */
  _load: function _load(cb) {
    return this.query.fetchAll(cb)
  }
  
})
