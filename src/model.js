
var knex = require('knex'),
    _ = require('underscore'),
    Events = require('./events'),
    Promise = require('bluebird'),
    ModelQuery = require('./query')


const EVENT_CREATING = "creating",
      EVENT_UPDATING = "updating",
      EVENT_DELETING = "deleting",
      EVENT_CREATED = "created",
      EVENT_UPDATED = "updated",
      EVENT_DELETED = "deleted",
      EVENT_SAVING = "saving",
      EVENT_SAVED = "saved"

module.exports = Model

/**
 * Model constructor
 * 
 * @constructor
 */
function Model() { this._init.apply(this, arguments) }

/**
 * Define the primary key name
 */
Model.prototype.$pk = 'id'

/**
 * Indicates if the IDs are auto-incrementing
 */
Model.prototype.$incrementing = true

/**
 * Model events dispatcher
 */
Model.prototype.$events = new Events()

/**
 * Set up correctly the prototype chain for subclasses
 * 
 * @param {Object} props
 * @param {Object} statics
 * @static
 */
Model.extend = function extend(props, statics) {
  var Super = this
  
  // default constructor simply calls the parent one
  var Model = _.has(props, 'constructor') ? props.constructor :
  function Model() { Super.apply(this, arguments) }
  
  // set the prototype chain to inherit from `parent`
  Model.prototype = Object.create(Super.prototype, {
    constructor: { value: Model } 
  })
  
  // add static and instance properties
  _.extend(Model, Super, statics)
  _.extend(Model.prototype, props)
  
  // init model events
  Model.prototype.$events = Super.prototype.$events.clone()
  
  return Model
}

/**
 * Use a plugin
 * 
 * @param {Function|Object} plugin object with `install` method, or simply a function
 * @return Model
 * @static
 */
Model.use = function use(plugin) {
  if ( plugin.installed === true ) return this
  
  var args = _.rest(arguments)
  
  // prepend Model as first argument
  args.unshift(this)
  
  if ( _.isFunction(plugin.install) ) {
    plugin.install.apply(null, args)
  }
  else if ( _.isFunction(plugin) ) {
    plugin.apply(null, args)
  }
  
  // prevent reuse the same plugin next time
  plugin.installed = true
  
  return this
}

/**
 * Initialise the database connection
 * 
 * @param {Object} config
 * @static
 */
Model.connection = function connection(config) {
  this.prototype.$connection = knex(config)
  return this
}

/**
 * Factory function to instantiate new models without `new` operator
 * 
 * @param {Object} attrs
 * @return Model
 * @static
 */
Model.factory = function factory(attrs) { return new this(attrs) }

/**
 * Add a listener for a model event
 * 
 * @param {String} event
 * @param {Function} fn
 * @return Model
 * @static
 */
Model.on = function on(event, fn) {
  this.prototype.$events.on(event, fn)
  return this
}

/**
 * Unset an event listener
 * use cases:
 *   Model.off()
 *   Model.off('event')
 *   Model.off('event', listener)
 * 
 * @param {String} event
 * @param {Function} fn
 * @return Model
 * @static
 */
Model.off = function off(event, fn) {
  this.prototype.$events.off(event, fn)
  return this
}

/**
 * Save a new model in the database
 * 
 * @param {Object} data
 * @param {Function} cb optional callback
 * @return Promise instance
 * @static
 */
Model.create = function create(data, cb) {
  return this.factory(data).save(cb)
}

/**
 * Get all models from the database
 * 
 * @param {Function} cb optional callback
 * @return Promise instance
 * @static
 */
Model.all = function all(cb) {
  return Promise
    .bind(this)
    .then(function (resp) {
      return this.factory().newQuery().fetchAll()
    })
    .nodeify(cb)
}

/**
 * Find a model by its primary key
 * 
 * @param {any} id
 * @param {Function} cb optional callback
 * @return Promise instance
 * @static
 */
Model.find = function find(id, cb) {
  return Promise
    .bind(this)
    .then(function () {
      var pk = this.prototype.getKeyName()
      
      return this.where(pk, id).fetch()
    })
    .nodeify(cb)
}

/**
 * Start the query by a `where` constraints
 * 
 * @param {String|Object} key
 * @param {string} operator
 * @param {any} value
 * @return Query instance
 * @static
 */
Model.where = function where(key, operator, value) {
  var query = this.factory().newQuery()
  
  return query.where.apply(query, arguments)
}

/**
 * Begin querying a model wtih eager loading
 * 
 * @param {String|Array} related
 * @return Query instance
 * @static
 */
Model.populate = function populate(related) {
  if (! _.isArray(related) ) related = _.toArray(arguments)
  
  return this.factory().newQuery().populate(related)
}

/**
 * Load all the given relationships
 * 
 * @param {Array} rels
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Model.prototype.load = function load(rels, cb) {
  return this.newQuery().populate(rels).loadRelated([this]).nodeify(cb)
}

/**
 * Trigger a model event
 * 
 * @param {String} event
 * @return Promise instance
 */
Model.prototype.trigger = function trigger(event) {
  var events = this.$events
  
  return events.emit.apply(events, arguments)
}

/**
 * Fill the model data
 * 
 * @param {object} attrs
 * @return Model instance
 */
Model.prototype.fill = function fill(attrs) {
  for ( var name in attrs ) { 
    this.set(name, attrs[name])
  }
  
  return this
}

/**
 * Set the model data without any checking
 * 
 * @param {Object} data
 * @param {Boolean} sync (optional)
 * @return Model instance
 */
Model.prototype.setData = function setData(data, sync) {
  this.$data = data
  
  // sync original attributes with current state
  if ( sync === true ) this._syncOriginal()
  
  return this
}

/**
 * Get the model raw data
 * 
 * @return object
 */
Model.prototype.getData = function getData() {
  return _.clone(this.$data)
}

/**
 * Set model's attribute value
 * 
 * @param {String} attr
 * @param {any} newVal
 * @return Model instance
 */
Model.prototype.set = function set(attr, newVal) {
  if ( _.isEmpty(attr) ) return this
  
  // TODO use attribute setter if available
  
  // set the new value
  this.$data[attr] = newVal
  
  return this
}

/**
 * Get the value of an attribute
 * 
 * @param {String} attr name
 * @param {any} defaultValue
 * @return any
 */
Model.prototype.get = function get(attr, defaultValue) {
  // TODO use attribute getter if available
  return this.$data[attr] || defaultValue
}

/**
 * Get or set the relationship value
 * 
 * @param {String} name
 * @param {Model|Array} value
 * @return any
 */
Model.prototype.related = function related(name, value) {
  if ( value ) this.$rels[name] = value
  
  return this.$rels[name]
}

/**
 * Set primary key value
 * 
 * @param {any} id
 * @return Model instance
 */
Model.prototype.setId = function setId(id) {
  return this.set(this.getKeyName(), id)
}

/**
 * Get the primary key value
 * 
 * @return any
 */
Model.prototype.getId = function getId() {
  return this.get(this.getKeyName())
}

/**
 * Get the primary key field name
 * 
 * @return string
 */
Model.prototype.getKeyName = function getKeyName() {
  return this.$pk
}

/**
 * Get table or collection name
 * 
 * @return string
 */
Model.prototype.getTableName = function getTableName() {
  return this.$table
}

/**
 * Determine if an attribute exists on the model
 * 
 * @param {String} attr
 * @return boolean
 */
Model.prototype.has = function has(attr) {
  return !!this.get(attr)
}

/**
 * Return the original value of one or all the dirty attributes
 * 
 * @return any
 */
Model.prototype.getOriginal = function getOriginal(attr) {
  return attr ? this.$original[attr] : this.$original
}

/**
 * Return a hash of dirty fields
 * 
 * @return object
 */
Model.prototype.getDirty = function getDirty() {
  return _.pick(this.$data, function(val, attr) {
    return !_.has(this.$original, attr) || val !== this.$original[attr]
  }, this)
}

/**
 * Determine if the model or given attribute have been modified
 * 
 * @param {String} attr (optional)
 * @return boolean
 */
Model.prototype.isDirty = function isDirty(attr) {
  var dirty = this.getDirty()
  
  return attr ? _.has(dirty, attr) : !_.isEmpty(dirty)
}

/**
 * Returns true if the model doesn't have an identifier
 * 
 * @return boolean
 */
Model.prototype.isNew = function isNew() {
  return !this.has(this.getKeyName())
}

/**
 * Returns a JSON representation of the current model
 * 
 * @return object
 */
Model.prototype.toJSON = function toJSON() {
  // TODO omit hidden fields
  var json = _.clone(this.$data)
  
  _.each(this.$rels, function (related, name) {
    if ( _.isArray(related) ) {
      json[name] = _.map(related, function (rel) {
        return rel.toJSON()
      })
    }
    else json[name] = related.toJSON()
  })
  
  return json
}

/**
 * Get the model query builder
 * 
 * @return Query instance
 */
Model.prototype.newQuery = function newQuery() {
  var builder = this.$connection.queryBuilder()
  
  return (new ModelQuery(builder)).setModel(this)
}

/**
 * Create a new instance of the current model
 * 
 * @param {Object} attrs (optional)
 * @return Model instance
 */
Model.prototype.newInstance = function newInstance(attrs) {
  return this.constructor.factory(attrs)
}

/**
 * Fetch fresh data from database
 * 
 * @param {Function} cb optional callback
 * @return Promise instance
 */
Model.prototype.fetch = function fetch(cb) {
  return Promise
    .bind(this)
    .then(function () {
      var pk = this.getKeyName(), id = this.getId()
      
      return this.newQuery().where(pk, id).fetch()
    })
    .nodeify(cb)
}

/**
 * Update the model in the database
 * 
 * @param {Object} attrs
 * @param {Function} cb optional callback
 * @return Promise instance
 */
Model.prototype.update = function update(attrs, cb) {
  return this.fill(attrs).save(cb)
}

/**
 * Save the model to the database
 * 
 * @param {Function} cb optional callback
 * @return Promise instance
 */
Model.prototype.save = function save(cb) {
  return Promise
    .bind(this)
    .then(function () {
      return this.trigger(EVENT_SAVING, this)
    })
    .then(this.isNew() ? this._create : this._update)
    .then(function () {
      this._syncOriginal()
      
      return this.trigger(EVENT_SAVED, this)
    })
    .return(this)
    .nodeify(cb)
}

/**
 * Delete the model from the database
 * 
 * @param {Function} cb optional callback
 * @return Promise instance
 */
Model.prototype.destroy = function destroy(cb) {
  if ( this.isNew() ) return Promise.reject(null).nodeify(cb)
  
  return Promise
    .bind(this)
    .then(function () {
      return this.trigger(EVENT_DELETING, this)
    })
    .then(this._destroy)
    .then(function () {
      this._syncOriginal()
      
      return this.trigger(EVENT_DELETED, this)
    })
    .return(this)
    .nodeify(cb)
}

/**
 * Define a HasOne relationship
 * 
 * @param {Model} target
 * @param {String} fk related model foreign key name
 * @param {String} pk parent model primary key name
 * @return Relation instance
 * @private
 */
Model.prototype.hasOne = function _hasOne(target, fk, pk) {
  var related = target.factory(),
      HasOne = require('./relations/has-one')
  
  return new HasOne(this, related, fk, pk || this.getKeyName())
}

/**
 * Define a HasMany relationship
 * 
 * @param {Model} target
 * @param {String} fk related model foreign key name
 * @param {String} pk parent model primary key name
 * @return Relation instance
 * @private
 */
Model.prototype.hasMany = function _hasMany(target, fk, pk) {
  var related = target.factory(),
      HasMany = require('./relations/has-many')
  
  return new HasMany(this, related, fk, pk || this.getKeyName())
}

/**
 * Define a BelongsTo relationship
 * 
 * @param {Model} target
 * @param {String} fk parent model foreign key name
 * @param {String} pk related model primary key name
 * @return Relation instance
 * @private
 */
Model.prototype.belongsTo = function _belongsTo(target, fk, pk) {
  var related = target.factory(),
      BelongsTo = require('./relations/belongs-to')
  
  return new BelongsTo(this, related, fk, pk || related.getKeyName())
}

/**
 * Define a BelongsToMany relationship
 * 
 * @param {Model} target
 * @param {String} pivot table name
 * @param {String} fk related model foreign key name
 * @param {String} pk parent model foreign key name
 * @private
 */
Model.prototype.belongsToMany = function _belongsToMany(target, pivot, fk, pk) {
  var related = target.factory(),
      BelongsToMany = require('./relations/belongs-to-many')
  
  return new BelongsToMany(this, related, pivot, fk, pk)
}

/**
 * Perform a model insert operation
 * 
 * @return Promise instance
 * @private
 */
Model.prototype._create = function _create() {
  return Promise
    .bind(this)
    .then(function () {
      return this.trigger(EVENT_CREATING, this)
    })
    .then(function () {
      var promise = this.newQuery().insert(this.getData())
      
      // If the model has an incrementing key,
      // we set the new inserted id for this model
      if ( this.$incrementing ) {
        promise.then(function (ids) {
          this.setId(ids[0])
        }.bind(this))
      }
      
      return promise
    })
    .then(function () {
      this._syncOriginal()
      
      return this.trigger(EVENT_CREATED, this)
    })
}

/**
 * Perform a model update operation
 * 
 * @return Promise instance
 * @private
 */
Model.prototype._update = function _update() {
  if (! this.isDirty() ) return Promise.resolve()
  
  return Promise
    .bind(this)
    .then(function () {
      return this.trigger(EVENT_UPDATING, this)
    })
    .then(function () {
      var data = this.getDirty(),
          pk = this.getKeyName(), 
          id = this.getId()
      
      return this.newQuery().where(pk, id).update(data)
    })
    .then(function () {
      this._syncOriginal()
      
      return this.trigger(EVENT_UPDATED, this)
    })
}

/**
 * Perform the actual delete query
 * 
 * @return Promise instance
 * @private
 */
Model.prototype._destroy = function _destroy() {
  var pk = this.getKeyName(), id = this.getId()
  
  return this.newQuery().where(pk, id).destroy()
}

/**
 * Called by the constructor to init the new instance
 * 
 * @param {Object} attrs
 * @private
 */
Model.prototype._init = function _init(attrs) {
  this.$rels = {}
  this.$data = {}
  this.$original = {}
  
  // set model attributes
  this.fill(attrs)
}

/**
 * Sync the original attributes with the current
 * 
 * @private
 */
Model.prototype._syncOriginal = function _syncOriginal() {
  this.$original = _.clone(this.$data)
}
