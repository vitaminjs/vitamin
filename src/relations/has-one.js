
var Relation = require('./has-one-or-many')

module.exports = Relation.extend({
  
  /**
   * Load the related model from the database
   * 
   * @param {Function} cb (optional)
   * @return {Promise}
   */
  _load: function _load(cb) {
    return this.query.fetch(cb)
  }
  
})
