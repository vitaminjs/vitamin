
import Model from './model'

/**
 * Initialize Vitamin
 */
module.exports = function initialize(knex) {
  var vitamin = {}
  
  vitamin.Model = class extends Model {
    
    /**
     * A factory helper to instanciate models without using `new`
     */
    make() {
      return (new this(...arguments)).use(knex)
    }
    
  }
  
  return vitamin
}