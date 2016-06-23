# Vitamin changes log

### _**v0.7.4** - June 23, 2016_
* Add `pluck()`, `count()`, `sum()`, `min()`, `max` and `avg()` query methods
* Add `sync()` method to enhance many-to-many associations

### _**v0.7.3** - June 19, 2016_
* Fix: `model.get()` which returns `undefined` for falsy values
* Fix: `attach()` and `detach()` to accept also model collections
* Add `findMany`, `findOrNew`, `firstOrNew`, `firstOrCreate` Query helpers
* Add a new life-cycle event: `ready` to add more initialization logic
* `model.fetch()` accept an array of relations, as first argument, to fetch with

### _**v0.7.2** - June 15, 2016_
* Fix: for eager loading, for no parent models, we resolve without loading relationships (Performance)
* Add `newExistingInstance()` helper method in model class
* Add default attributes hash to init the model's data
* Add protection against mass assignment
* Add the ability to blacklist attributes from `toJSON()`
* Add `collections` to be used instead of arrays for relations

### _**v0.7.1** - June 12, 2016_
* Rename many-to-many joining table as `pivot` for fluent querying
* Fix: `load()` to resolve with the current model
* Fix: `getOriginal()` to return a copy of the original hash
* Add default message for custom errors
* Add relationship methods: `create()`, `createMany()`, `save()`, `saveMany()` and `updatePivot()`

### _**v0.7.0** - June 10, 2016_
* First release as an ActiveRecord library