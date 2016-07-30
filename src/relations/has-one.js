
import Relation from './has-one-or-many'

// exports
export default class extends Relation {
  
  /**
   * Get the result of the relationship
   * 
   * @return promise
   */
  load() {
    this.getQuery().first()
  }
  
}