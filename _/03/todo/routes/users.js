var fs      = require('fs'),
    couchdb = require('../lib/couchdb'),
    dbName  = 'users',
    db      = couchdb.use(dbName),
    Plates  = require('plates'),
    layout  = require('../templates/layout');

var templates = {
  'new' : fs.readFileSync(__dirname +
    '/../templates/users/new.html', 'utf8'),
  'show': fs.readFileSync(__dirname +
    '/../templates/users/show.html', 'utf8')
};

function insert(doc, key, callback) {
  var tried = 0, lastError;
  
  (function doInsert() {
    tried ++;
    if (tried >= 2) {
      return callback(lastError);
    }

    db.insert(doc, key, function(err) {
      if (err) {
        lastError = err;
        if (err.status_code === 404) {
          couchdb.db.create(dbName, function(err) {
            if (err) {
              return callback(err);
            }
            doInsert();
          });
        } else {
          return callback(err);
        }
      }
      callback.apply({}, arguments);
    });
  }());
}

function render(user) {
  var map = Plates.Map();
  map.where('id').is('email').use('email').as('value');
  map.where('id').is('password').use('password').as('value');
  return Plates.bind(templates['new'], user || {}, map);
}

module.exports = function() {
  this.get('/new', function() {
    this.res.writeHead(200, {'Content-Type': 'text/html'});
    this.res.end(layout(render(), 'New User'));
  });

  this.post('/', function() {
    
    var res = this.res,
        user = this.req.body;

    if (! user.email || ! user.password) {
      return this.res.end(layout(templates['new'], 'New User', {error: 'Incomplete User Data'}));
    }

    insert(user, this.req.body.email, function(err) {
      if (err) {
        if (err.status_code === 409) {
          res.writeHead(409, {'Content-Type': 'text/html'});
          return res.end(layout(render(user), 'New User', {
            error: 'We already have a user with that email address.'}));
        }
        console.error(err.trace);
        res.writeHead(500, {'Content-Type': 'text/html'});
        return res.end(err.message);
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(layout(templates['show'], 'Registration Complete'));
    });
  });

};