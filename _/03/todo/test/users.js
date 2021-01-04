var assert  = require('assert'),
    Browser = require('zombie'),
    app     = require('../app')
    ;

before(function(done) {
  app.start(3000, done);
});

after(function(done) {
  app.server.close(done);
});

describe('Users', function() {

  describe('Signup Form', function() {
    
    it('should load the signup form', function(done) {
      var browser = new Browser();
      browser.visit("http://localhost:3000/users/new", function() {
        assert.ok(browser.success, 'page loaded');
        done();
      });
    });

  });
});