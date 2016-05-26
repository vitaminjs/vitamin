
var Relation = require('has-one-or-many')

module.exports = Relation.extend({
  
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
