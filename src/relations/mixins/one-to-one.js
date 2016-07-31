
// exports
export default (parent) => class extends parent {
  
  /**
   * Get the result of the relationship
   * 
   * @return promise
   */
  load() {
    this.getQuery().first()
  }
  
}