
var _ = require('underscore'),
    Promise = require('bluebird'),
    Relation = require('has-one-or-many')

var HasMany = Relation.extend({
  
  /**
   * Attach many models to the parent model
   * 
   * @param {Array} models
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  saveMany: function saveMany(models, cb) {
    return Promise
      .bind(this, models)
      .map(this.save)
      .nodeify(cb)
  }
  
})

// use mixin
_.assign(HasMany.prototype, require('./mixins/one-to-many'))

module.exports = HasMany
