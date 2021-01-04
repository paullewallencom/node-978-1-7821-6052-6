var plates  = require('plates'),
    fs      = require('fs'),
    couchdb = require('../lib/couchdb'),
    dbName  = 'users',
    db      = couchdb.use(dbName),
    Plates  = require('plates'),
    layout  = require('../templates/layout');

var templates = {
  'new' : fs.readFileSync(__dirname +
    '/../templates/session/new.html', 'utf8')
};

module.exports = function() {

  this.get('/new', function() {
    this.res.writeHead(200, {'Content-Type': 'text/html'});
    this.res.end(layout(templates['new'], 'Log In'));
  });

  this.post('/', function() {
    
    var res   = this.res,
        req   = this.req,
        login = this.req.body;

    if (! login.email || ! login.password) {
      return res.end(layout(templates['new'], 'Log In',
        {error: 'Incomplete Login Data'}));
    }

    db.get(login.email, function(err, user) {
      if (err) {
        if (err.status_code === 404) {
          // User was not found
          return res.end(layout(templates['new'], 'Log In',
            {error: 'No such user'}));
        }
        console.error(err.trace);
        res.writeHead(500, {'Content-Type': 'text/html'});
        return res.end(err.message);
      }

      if (user.password !== login.password) {
        res.writeHead(403, {'Content-Type': 'text/html'});
        return res.end(layout(templates['new'], 'Log In',
            {error: 'Invalid password'}));
      }

      // store session
      req.session.user = user;

      // redirect user to TODO list
      res.writeHead(302, {Location: '/todos'});
      res.end();
    });

  });  

};