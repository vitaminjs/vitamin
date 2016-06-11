
var _ = require('underscore'),
    Relation = require('./has-one-or-many')

var HasOne = Relation.extend({})

// use mixin
_.defaults(HasOne.prototype, require('./mixins/one-to-one'))

module.exports = HasOne