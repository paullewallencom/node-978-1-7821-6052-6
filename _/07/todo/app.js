var flatiron = require('flatiron'),
    path = require('path'),
    nstatic = require('node-static'),
    app = flatiron.app;

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

var file = new nstatic.Server(__dirname + '/public/');

app.use(flatiron.plugins.http, {
  before: [
    require('flatware-method-override')(),
    require('flatware-cookie-parser')(),
    require('flatware-session')(),
    function(req, res) {
      
      var found = app.router.dispatch(req, res);
      if (! found) {
        file.serve(req, res);
      }
    }
  ]
});

app.router.path('/users', require('./routes/users'));
app.router.path('/session', require('./routes/session'));
app.router.path('/todos', require('./routes/todos'));

module.exports = app;

if (process.mainModule === module) {
  app.start(3000);
}