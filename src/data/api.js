
module.exports = dataAPI

function dataAPI(Model) {
  
  /**
   * Identifier getter
   */
  Model.prototype.getId = function getId() { 
    return this.get(this.getOption('pk'))
  }
  
  /**
   * Identifier setter
   */
  Model.prototype.setId = function setId(id) {
    this.set(this.getOption('pk'), id)
    return this
  }
  
  /**
   * Set model attributes
   */
  Model.prototype.set = function set(key, val) {
    this.$data.set(key, val)
    return this
  }

  /**
   * Get the value of an attribute.
   * 
   * @param {String} attr name
   */
  Model.prototype.get = function get(attr) {
    return this.$data.get(attr)
  }

  /**
   * @param {String} attr name
   */
  Model.prototype.has = function has(attr) {
    return this.$data.has(attr)
  }

  /**
   * 
   */
  Model.prototype.isNew = function isNew() {
    return !this.has(this.getOption('pk'))
  }

  /**
   * 
   */
  Model.prototype.toJSON = function toJSON() {
    return this.$data.toJSON()
  }

  /**
   * @param {String} attr name
   */
  Model.prototype.isDirty = function isDirty(attr) {
    return this.$data.isDirty(attr)
  }
  
  /**
   * Normalize schema object and set default attributes
   * 
   * @private
   */
  Model.prototype._initData = function _initData(data) {
    var DataClass = this.getOption('dataClass', require('./container'))
    
    // define model's data object
    Object.defineProperty(this, '$data', {
      value: new DataClass(this, data || {})
    })
  }
  
}