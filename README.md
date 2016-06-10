# Vitamin

Vitamin provides a simple and easy to use ActiveRecord implementation for working with your database. 
Each table or view is wrapped into a "Model" class. Thus, a model instance is tied to a single row in the table. 
Models allow you to query for data in your tables, as well as inserting or updating records.

It supports **Postgres**, **MySQL**, **MariaDB**, **SQLite3**, and **Oracle** databases, 
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

Database connection is initialized by passing a config object to `connection` static method. The [knex documentation](//knexjs.org/#Installation) provides a number of examples for different use cases.

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

```js
var Model = require('vitamin/model')

var User = new Model.extend({
  
  // the primary key, defaults to `id`
  $pk: 'id',
  
  // the table name
  $table: 'users'
  
})
```

### CRUD : Reading and writing data

#### 1 - Create
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
  assert.instanceOf(Model, result)
})

// or using promises
user.save().then(
  function (result) {
    assert.instanceOf(Model, result)
  },
  function (error) {
    ...
  }
)
```
Another shorthand to create and save a new user is the `create` method
```js
var data = { name: "John", occupation: "Developer" }

// using callabcks
User.create(data, function (error, result) {
  assert.instanceOf(Model, result)
})

// using promises
User.create(data).then(
  function (result) {
    assert.instanceOf(Model, result)
  }, 
  function (error) {
    ...
  }
)
```

#### 2 - Read

Below a few examples of different data access methods provided by Vitamin

* Retrieving multiple models

```js
// get na array of all users 

// using callbacks
User.all(function (error, result) {
  assert.isArray(result)
})

// using promises
User.all().then(
  function (result) {
    assert.isArray(result)
  },
  function (error) {
    ...
  }
)
```

```js


// using callbacks
User.where('role', "guest").limit(15).fetchAll(function (error, result) {
  ...
})

// using promises
User.where('role', "guest").limit(15).fetchAll().then(
  function (result) {
    ... 
  },
  function (error) {
    ...
  }
)
```

* Retrieving single model

```js
// find a user by its primary key

// using callbacks
User.find(123, function (error, result) {
  assert.instanceOf(Model, result)
})

// using promises
User.find(123).then(
  function (result) {
    assert.instanceOf(Model, result)
  },
  function (error) {
    ...
  }
)
```

```js
// using callbacks
User.where('is_admin', true).fetch(function (error, result) {
  ...
})

// using promises
User.where('is_admin', true).fetch().then(
  function (result) {
    ...
  },
  function (error) {
    ...
  }
)
```

#### 3 - Update
The `save` method may also be used to update a single model that already exists in the database.
```js
// post model is retrieved from `posts` table
// then we modify the status attribute and save it
Post
  .find(1)
  .then(function (post) {
    return post.set('status', "draft").save()
  })
```

#### 4 - Delete
Likewise, once retrieved, a model can be destroyed which removes it from the database

```js
User.find(123).then(function (user) {
  return user.destroy()
})
```

### Events
Model events allow you to attach code to certain events in the lifecycle of yours models. This enables you to add behaviors to your models when those events `creating`, `created`, `saving`, `saved`, `updating`, `updated`, `deleting` or `deleted` occur.

```js
// attach a listener for `created` event
User.on('created', function (user) {
  assert.instanceOf(Model, user)
})

// Events `saving - creating - created - saved` are fired in order
// when we create a new model
User.create({ name: "John", occupation: "Developer" })
```
***

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
    // the third parameter is optional, it corresponds to the primary key of user model
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

this relation is more complicated than the previous. An example of that is the relation between `Product` and `Category`, when a product has many tags, and the same tage is assigned to many products. A pivot table, in this case `product_categories`, is used and contains the relative keys `product_id` and `category_id`
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
  assert.instanceOf(Phone, model.related('phone'))
})

// the same can be done to retrieve the phone owner
phone.load(['owner']).then(function (model) {
  assert.equal(phone, model)
  assert.instanceOf(Person, model.related('owner'))
})
```

### Eager loading

To load a model and its relationships in one call, you can use the static method `populate`
```js
// fetch the first article and its author
Post.populate('author').fetch().then(function (post) {
  assert.instanceOf(Author, post.related('author'))
})

// load all authors with their 3 first posts
Author
  .populate({ posts: function (query) { query.limit(3) } })
  .fetchAll(function (error, authors) {
    authors.forEach(function (author) {
      assert.isArray(author.related('posts'))
      assert.instanceOf(Post, author.related('posts')[0])
    })
  })
```
