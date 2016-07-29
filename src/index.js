
import Model from './model'

/**
 * Initialize Vitamin
 */
module.exports = function initialize(knex) {
  // add knex instance to all models as `connection` property
  Model.prototype.connection = knex
  
  return { Model }
}