var fs      = require('fs'),
    couchdb = require('../lib/couchdb'),
    dbName  = 'todos',
    db      = couchdb.use(dbName),
    Plates  = require('plates'),
    layout  = require('../templates/layout'),
    loggedIn = require('../middleware/logged_in')()
    ;

var templates = {
  index : fs.readFileSync(__dirname +
    '/../templates/todos/index.html', 'utf8'),
  'new' : fs.readFileSync(__dirname +
    '/../templates/todos/new.html', 'utf8')
};

function insert(email, todo, callback) {
  var tries = 0,
      lastError;

  (function doInsert() {

    if (++ tries >= 3) return callback(lastError);

    db.get(email, function(err, todos) {
      if (err && err.status_code !== 404) return callback(err);

      if (! todos) todos = {todos: []};
      todos.todos.unshift(todo);

      db.insert(todos, email, function(err) {
        if (err) {
          if (err.status_code === 404) {
            lastError = err;
            // database does not exist, need to create it
            couchdb.db.create(dbName, function(err) {
              if (err) {
                return callback(err);
              }
              doInsert();
            });
            return;
          }
          return callback(err);
        }
        return callback();
      });
    });
  })();
  
}

module.exports = function() {

this.get('/', [loggedIn, function() {

  var res = this.res;

  db.get(this.req.session.user.email, function(err, todos) {

    if (err && err.status_code !== 404) {
      res.writeHead(500);
      return res.end(err.stack);
    }

    if (! todos) todos = {todos: []};
    todos = todos.todos;

    todos.forEach(function(todo, idx) {
      if (todo) todo.pos = idx + 1;
    });

    var map = Plates.Map();
    map.className('todo').to('todo');
    map.className('pos').to('pos');
    map.className('what').to('what');
    map.className('scope').to('scope');
    map.where('name').is('pos').use('pos').as('value');

    var main = Plates.bind(templates.index, {todo: todos}, map);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(layout(main, 'To-Dos'));

  });

}]);

  
  this.get('/new', [loggedIn, function() {

    this.res.writeHead(200, {'Content-Type': 'text/html'});
    this.res.end(layout(templates['new'], 'New To-Do'));
  }]);

  
  this.post('/', [loggedIn, function() {
    
    var req  = this.req,
        res  = this.res,
        todo = this.req.body
    ;

    if (! todo.what) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      return res.end(layout(templates['new'], 'New To-Do',
        {error: 'Please fill in the To-Do description'}));
    }

    todo.alarm = todo.alarm === 'true';
    todo.alarm_date = Date.parse(todo['alarm-date'] + ' ' + todo['alarm-time']);
    delete todo['alarm-date'];
    delete todo['alarm-time'];

    todo.created_at = Date.now();

    insert(req.session.user.email, todo, function(err) {
      
      if (err) {
        res.writeHead(500);
        return res.end(err.stack);
      }
      
      res.writeHead(303, {Location: '/todos'});
      res.end();
    });
  
  }]);


  this.post('/sort', [loggedIn, function() {

    var res = this.res,
        order = this.req.body.order && this.req.body.order.split(','),
        newOrder = []
        ;
    
    db.get(this.req.session.user.email, function(err, todosDoc) {
      if (err) {
        res.writeHead(500);
        return res.end(err.stack);
      }

      var todos = todosDoc.todos;

      if (order.length !== todos.length) {
        res.writeHead(409);
        return res.end('Conflict');
      }

      order.forEach(function(order) {
        newOrder.push(todos[parseInt(order, 10) - 1]);
      });

      todosDoc.todos = newOrder;

      db.insert(todosDoc, function(err) {
        if (err) {
          res.writeHead(500);
          return res.end(err.stack);
        }
        res.writeHead(200);
        res.end();
      });

    });
  }]);

  
  this.post('/delete', [loggedIn, function() {

    var req = this.req,
        res = this.res,
        pos = parseInt(req.body.pos, 10)
        ;

    db.get(this.req.session.user.email, function(err, todosDoc) {
      if (err) {
        res.writeHead(500);
        return res.end(err.stack);
      }

      var todos = todosDoc.todos;
      todosDoc.todos = todos.slice(0, pos - 1).concat(todos.slice(pos));

      db.insert(todosDoc, function(err) {
        if (err) {
          res.writeHead(500);
          return res.end(err.stack);
        }
        res.writeHead(303, {Location: '/todos'});
        res.end();
      });

    });

  }]);

};