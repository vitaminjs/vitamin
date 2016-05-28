
var Relation = require('./has-one-or-many')

module.exports = Relation.extend({
  
  /**
   * Load the related model from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    return this.query.fetch()
  }
  
})
