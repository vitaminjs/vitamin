
var Model = require('./model')

Model.connection({
  client: 'mysql2',
  debug: false,
  connection: {
    host     : '127.0.0.1',
    database : 'saas_test',
    user     : 'root',
    password : 'root',
    charset  : 'utf8'
  }
})

var Car = Model.extend({
  $table: "cars",
  
  owners: function () {
    return this.belongsToMany(User, 'cars_users', 'user_id', 'car_id')
  }
})

var User = Model.extend({
  $table: "users",
  
  tasks: function tasks() {
    return this.hasMany(Task, "assigned")
  },
  
  task: function () {
    return this.hasOne(Task, 'assigned')
  },
  
  cars: function () {
    return this.belongsToMany(Car, 'cars_users', 'car_id', 'user_id')
  }
})

var Task = Model.extend({
  $table: 'tasks',
  
  assigned: function assigned() {
    return this.belongsTo(User, 'assigned')
  }
})

// Car.all(console.log)

// Car.find(3, console.log)

// Car.create({ model: 'Megane', brand: 'Renault', motor: 'Essence' }, console.log)

// Car.where('model', "Megane").fetch().then(function (model) {
//   model.update({ motor: 'Diesel' }, console.log)
// })

// Car.where('model', "Megane").destroy(console.log)

// Task.all(console.log)

// Task.populate('assigned').fetch(function (err, res) {
//   console.log(res.toJSON())
// })

// User.populate('task').where('id', 3).fetch(function (err, res) {
//   console.log(res.toJSON())
// })

// User.populate('tasks').limit(2).fetchAll(console.log)

// var query = Task.factory().newQuery().query
// query.select('users.*', 'tasks.*').join('users', "tasks.assigned", "users.id").then(console.log)

// Car.factory({ 'id': 2 }).owners().load(console.log)

// Car.populate('owners').fetchAll(function (err, res) {
//   console.log(res[0].toJSON())
// })

User.populate('cars').fetch(function (err, user) {
  console.log(user.toJSON())
})