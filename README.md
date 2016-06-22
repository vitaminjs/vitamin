[![Stories in Ready](https://badge.waffle.io/vitaminjs/vitamin.png?label=ready&title=Ready)](https://waffle.io/vitaminjs/vitamin)
## Introduction
Vitamin provides a simple and easy to use ActiveRecord implementation for working with your database. 
Each table or view is wrapped into a "Model" class. Thus, a model instance is tied to a single row in the table. 
Models allow you to query for data in your tables, as well as inserting or updating records.

Based on [knex](//knexjs.org), it supports **Postgres**, **MySQL**, **MariaDB**, **SQLite3**, and **Oracle** databases, 
featuring both promise based and traditional callback interfaces, providing lazy and eager relationships loading, 
and support for one-to-one, one-to-many, and many-to-many relations.

***

## Installation
```
$ npm install --save vitamin

# Then add one of the supported database drivers
$ npm install pg
$ npm install sqlite3
$ npm install mysql
$ npm install mysql2
$ npm install mariasql
$ npm install strong-oracle
$ npm install oracle
```

Database connection is initialized by passing a config object to `connection` static method. 
The [knex documentation](//knexjs.org/#Installation) provides a number of examples for different use cases.

```js
var Model = require('vitamin/model')

// An example of config object for MySQL which will be used by knex
Model.connection({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test',
    charset  : 'utf8'
  }
})
```
***

## Examples of usage

### Defining models
To get started, let's define a basic Model using the `extend` static method, 
and specify both, the `primary key` name, and the `table` name

```js
var Model = require('vitamin/model')

var User = new Model.extend({
  
  // the primary key, defaults to `id`
  $pk: 'id',
  
  // the table name
  $table: 'users',
  
  // add default attributes
  $defaults: {
    active: true,
    verified: false
  },
  
  // define the mass assignable attributes
  $fillable: [ 'name', 'email', 'password' ],
  
  // define the hidden fields from `toJSON()`
  $hidden: [ 'password' ]
  
})
```
> Vitamin assumes that the primary key is an auto-increment key, if you wish to use a non-numeric key, 
you must set to `false` the flag property `$incrementing` when you define the model.

### CRUD : Reading and writing data

#### 1 - Create
To create a new record in the database, simply create a new model instance, set its attributes, then call the `save` method
```js
// we create a new instance of User model with `factory` method
var user = User.factory({ name: "John", occupation: "Developer" })

// or set the attributes manually after instantiation
var user = new User
user.set('name', "John")
user.set('occupation', "Developer")

// then we save it

// using callbacks
user.save(function (error, result) {
  assert.instanceOf(result, User)
})

// or using promises
user.save().then(
  function (result) {
    assert.instanceOf(result, User)
  },
  function (error) {
    ...
  }
)
```
Another shorthand to create and save a new user is the `create` static method
```js
var data = { name: "John", occupation: "Developer" }

// using callabcks
User.create(data, function (error, result) {
  assert.instanceOf(result, User)
})

// using promises
User.create(data).then(
  function (result) {
    assert.instanceOf(result, User)
  }, 
  function (error) {
    ...
  }
)
```

#### 2 - Read

Vitamin uses the standard Node.js style callbacks and promises when dealing with queries.
Below a few examples of different data access methods provided by Vitamin.

* Retrieving multiple models

```js
// get na array of all users 

// using callbacks
User.all(function (error, result) {
  assert.instanceOf(result, Collection)
})

// using promises
User.all().then(
  function (result) {
    assert.instanceOf(result, Collection)
  },
  function (error) {
    ...
  }
)
```
The `all` static method will return all of the results of the model. 
But, if you may also add constraints to queries, you can use the `where` method, which returns a `query builder` instance

```js
// using callbacks
User.where('role', "guest").offset(10).limit(15).fetchAll(function (error, result) {
  assert.instanceOf(result, Collection)
})

// using promises
User.where('role', "guest").orderBy('name').fetchAll().then(
  function (result) {
    assert.instanceOf(result, Collection)
  },
  function (error) {
    ...
  }
)
```

* Retrieving single model
Of course, in addition to retrieving all of the records for a given table, you may also retrieve single records using `find` and `fetch`.
Instead of returning an array of models, these methods return only a single model instance

```js
// find a user by its primary key

// using callbacks
User.find(123, function (error, result) {
  assert.instanceOf(result, User)
})

// using promises
User.find(123).then(
  function (result) {
    assert.instanceOf(result, User)
  },
  function (error) {
    ...
  }
)
```
To retrieve the first model matching the query constraints, use `fetch`

```js
// using callbacks
User.where('is_admin', true).fetch(function (error, result) {
  assert.instanceOf(result, User)
})

// using promises
User.where('name', '!=', 'John').fetch().then(
  function (result) {
    assert.instanceOf(result, User)
  },
  function (error) {
    ...
  }
)
```

#### 3 - Update
The `save` method may also be used to update a single model that already exists in the database.
To update a model, you should retrieve it, set any attributes you wish to update, and then call the `save` method.  
```js
// post model is retrieved from `posts` table
// then we modify the status attribute and save it
Post
  .find(1)
  .then(function (post) {
    return post.set('status', "draft").save()
  })
```
In case you have many attributes to edit, you may use the `update` method:
```js
var data = {
  'status': "published",
  'published_at': new Date
}

// Using callbacks
post.update(data, function (error, result) {
  ...
})

// Using promises
post.update(data).then(
  function (result) {
    ...
  },
  function (error) {
    ...
  }
)
```

#### 4 - Delete
Likewise, once retrieved, a model can be destroyed which removes it from the database.
To delete a model, call the `destroy` method on an existing model instance:
```js
// Using callbacks
post.destroy(function (error, result) {
  assert.equal(result, post)
})

// Using promises
post.destroy().then(
  function (result) {
    assert.equal(result, post)
  },
  function (error) {
    ...
  }
)
```
Of course, you may also run a delete query on a set of models. In this example, we will delete all posts that are marked as draft:
```js
// Using callbacks
Post.where('status', 'draft').destroy(function (error, result) {
  ...
})

// Using promises
Post.where('status', 'draft').destroy().then(
  function (result) {
    ...
  },
  function (error) {
    ...
  }
)
```

### Events
Model events allow you to attach code to certain events in the lifecycle of yours models. 
This enables you to add behaviors to your models when those events 
`ready`, `creating`, `created`, `saving`, `saved`, `updating`, `updated`, `deleting` or `deleted` occur.

```js
// attach a listener for `created` event
User.on('created', function (user) {
  assert.instanceOf(user, Model)
})

// Events `saving - creating - created - saved` are fired in order
// when we create a new model
User.create({ name: "John", occupation: "Developer" })
```
***

You can also attach the same handler for many events separated by a white space
```js
Post.on('creating updating', updateTimestamps)
``` 

## Associations
Vitamin makes managing and working with relationships easy, and supports several types of relations:

* One To One
* One To Many
* Many To Many

### Defining relations

#### One to One

Let's define a relation one to one between `Person` model and `Phone` model
```js
var Phone = Model.extend({
  
  $table: 'phones',
  
  owner: function () {
    // `user_id` is the foreign key of `users` in `phones` table
    return this.belongsTo(Person, 'owner_id')
  }
  
})

var Person = Model.extend({
  
  $table: 'people',
  
  phone: function () {
    // the  first argument is the target model
    // the second is the foreign key in phones table
    // the third parameter is optional, it corresponds to the primary key of person model
    return this.hasOne(Phone, 'owner_id')
  }
})
```

#### One To Many

An example for this type, is the relation between blog `Post` and its `Author`
```js
var Author = Model.extend({
  
  $table: 'authors',
  
  articles: function () {
    return this.hasMany(Post, 'author_id')
  }
  
})

var Post = Model.extend({
  
  $table: 'posts',
  
  author: function () {
    return this.belongsTo(Author, 'author_id')
  }
  
})
```

#### Many To Many

this relation is more complicated than the previous. 
An example of that is the relation between `Product` and `Category`, when a product has many categories, and the same category is assigned to many products. 
A pivot table, in this case `product_categories`, is used and contains the relative keys `product_id` and `category_id`
```js
var Product = Model.extend({
  
  $table: 'products',
  
  categories: function () {
    return belongsToMany(Category, 'product_categories', 'category_id', 'product_id')
  }
  
})

var Category = Model.extend({
  
  $table: 'categories',
  
  products: function () {
    return belongsToMany(Product, 'product_categories', 'product_id', 'category_id')
  }
  
})
```

### Querying relations

#### Lazy loading

We will use the relations defined below, to lazy load the related model
```js
// load the related phone model of the person with the id 123
// we access the relation via `phone()` which return a HasOne relation instance
person.load(['phone'], function (error, model) {
  assert.equal(person, model)
  assert.instanceOf(model.related('phone'), Phone)
})

// the same can be done to retrieve all the  author's posts
author.load(['posts']).then(function (model) {
  assert.equal(author, model)
  assert.instanceOf(model.related('posts'), Collection)
})
```

#### Eager loading

To load a model and its relationships in one call, you can use the static method `populate`
```js
// fetch the first article and its author
Post.populate('author').fetch().then(function (post) {
  assert.instanceOf(post.related('author'), Author)
})

// load all authors with their 3 first posts
Author
  .populate({ posts: function (query) { query.limit(3) } })
  .fetchAll(function (error, authors) {
    authors.forEach(function (author) {
      assert.instanceOf(author.related('posts'), Collection)
      assert.instanceOf(author.related('posts').first(), Post)
    })
  })
```

### Saving related models

Instead of manually setting the foreign keys, Vitamin provides many methods to save the related models.

#### `save()` and `saveMany()`

```js
var comment = Comment.factory({ body: "Hello World !!" })

// using callbacks
post.comments().save(comment, function (error, model) {
  assert.equal(model, comment)
})

// using promises
post.comments().save(comment).then(
  function (model) {
    assert.equal(model, comment)
  },
  function (error) {
    ...
  }
)
```

```js
// save many using callbacks
post.comments().saveMany([
  Comment.factory({ body: "first comment" }),
  Comment.factory({ body: "second comment" })
], function (error, result) {
  assert.instanceOf(result, Collection)
  assert.instanceOf(result.first(), Comment)
})

// using promises
post.comments().saveMany([
  Comment.factory({ body: "first comment" }),
  Comment.factory({ body: "second comment" })
]).then(function (result) {
  assert.instanceOf(result, Collection)
  assert.instanceOf(result.first(), Comment)
})
```

#### `create()` and `createMany()`

In addition to the `save` and `saveMany` methods, you may also use the `create` method, 
which accepts an array of attributes, creates a model, and inserts it into the database.

```js
post.comments().create(, function (error, model) {
  assert.instanceOf(model, Comment)
})

post.comments().createMany([
  { body: "first comment" }, { body: "second comment" }
]).then(function (result) {
  assert.instanceOf(result, Collection)
  assert.instanceOf(result.first(), Comment)
})
```

#### `associate()` and `dissociate`

When updating a `belongsTo` relationship, you may use the `associate` method.

```js
var john = Person.factory({ id: 123 })

// set the foreign key `owner_id` and save the phone model
phone.owner().associate(john).save()

// unset the foreign key, then save
phone.owner().dissociate().save()
```

#### `attach`, `detach` and `updatePivot`

When working with many-to-many relationships, Vitamin provides a few additional helper methods to make working with related models more convenient.

```js
// to attach a role to a user by inserting a record in the joining table
// using callbacks
user.roles().attach(roleId, function (error, result) {
  ...
})

// or using promises
user.roles().attach(roleId).then(
  function (result) {
    ...
  },
  function (error) {
    ...
  }
)
```

To remove a many-to-many relationship record, use the detach method.

```js
// detach all roles of the loaded user
user.roles().detach()

// detach only the role with the given id
user.roles().detach(roleId)

// detach all roles with the given ids
user.roles().detach([1, 2, 3])
```

If you need to update an existing row in your pivot table, you may use `updatePivot` method

```js
user.roles().updatePivot(roleId, pivotAttributes).then(...)
```
