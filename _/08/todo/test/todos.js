var assert   = require('assert'),
    Browser  = require('zombie'),
    app      = require('../app'),
    couchdb  = require('../lib/couchdb'),
    dbName   = 'todos',
    db       = couchdb.use(dbName),
    fixtures = require('./fixtures'),
    login    = require('./login'),
    fs       = require('fs');

describe('Todos', function() {

  before(function(done) {
    app.start(3000, done);
  });

  after(function(done) {
    app.server.close(done);
  });

  beforeEach(function(done) {
    db.get(fixtures.user.email, function(err, doc) {
      if (err && err.status_code === 404) return done();
      if (err) throw err;
      db.destroy(doc._id, doc._rev, done);
    });
  });

  describe('Todo list', function() {

    
    it('should have some elements', login(function(browser, done) {
      assert.equal(browser.text('h1'), 'Your To-Dos');
      assert(browser.query('a[href="/todos/new"]'),
        'should have a link to create a new Todo');
      assert.equal(browser.text('a[href="/todos/new"]'), 'New To-Do');
      done();
    }));

    
    it('should start with an empty list', login(function(browser, done) {
      assert.equal(browser.queryAll('#todo-list tr').length, 0,
        'To-do list length should be 0');
      done();
    }));

    it('should not load when the user is not logged in', function(done) {
      Browser.visit('http://localhost:3000/todos', function(err, browser) {
        if (err) throw err;
        assert.equal(browser.location.pathname, '/session/new',
          'should be redirected to login screen');
        done();
      });
    });

    describe('When there are some items on the list', function() {
      
      beforeEach(function(done) {
        // insert todo items
        db.insert(fixtures.todos, fixtures.user.email, done);
      });

      it('should allow me to reorder items using drag and drop',
        login(function(browser, done) {

          var items = browser.queryAll('#todo-list tr');
          assert.equal(items.length, 3, 'Should have 3 items and has ' +
            items.length);


          function expectOrder(order) {
            var itemTexts = browser.queryAll('#todo-list tr .what').map(
              function(node) {
                return node.textContent.trim();
              }
            );
            var itemPositions = browser.queryAll('#todo-list tr .pos').map(
              function(node) {
                return node.textContent.trim();
              }
            );
            assert.deepEqual(itemTexts, order);
            assert.equal(itemPositions.length, itemTexts.length);
            itemPositions.forEach(function(itemPos, index) {
              assert.equal(index + 1, itemPos);
            });
          }
          
          expectOrder(['Do the laundry', 'Call mom', 'Go to gym']);

          function mouseEvent(name, target, x, y) {
            var event = browser.document.createEvent('MouseEvents');
            event.initEvent(name, true, true);
            event.clientX = event.screenX = x;
            event.clientY = event.screenY = y;
            event.which = 1;
            browser.dispatchEvent(item, event);
          }

          var item = items[0];

          mouseEvent('mousedown', item, 50, 50);
          mouseEvent('mousemove', browser.document, 51, 51);
          mouseEvent('mousemove', browser.document, 51, 150);
          mouseEvent('mouseup',  browser.document, 51, 150);

          browser.wait(function(err) {
            if (err) throw err;

            expectOrder(['Call mom', 'Go to gym', 'Do the laundry']);

            var lastRequest = browser.lastRequest;
            assert.equal(lastRequest.url, 'http://localhost:3000/todos/sort');
            assert.equal(lastRequest.method, 'POST');

            console.log(browser.html());

            browser.reload(function(err) {
              if (err) throw err;

              expectOrder(['Call mom', 'Go to gym', 'Do the laundry']);

              done();

            });
          });

        })
      );

    });

  });

  describe('Todo creation form', function() {

    it('should not load when the user is not logged in', function(done) {
      Browser.visit('http://localhost:3000/todos/new', function(err, browser) {
        if (err) throw err;
        assert.equal(browser.location.pathname, '/session/new',
          'should be redirected to login screen');
        done();
      });
    });

    it('should load with some components', login(function(browser, done) {
      browser.visit('http://localhost:3000/todos/new', function(err) {
        if (err) throw err;
        assert.equal(browser.text('h1'), 'New To-Do');
        
        var form = browser.query('form');
        assert(form, 'should have a form');
        assert.equal(form.method, 'POST', 'form should use post');
        assert.equal(form.action, '/todos', 'form should post to /todos');
        
        assert(browser.query('textarea[name=what]', form),
          'should have a what textarea input');
        assert(browser.query('input[type=submit]', form),
          'should have an input submit type');
        
        done();
      });
    }));

    it('should allow to create a todo', login(function(browser, done) {
      browser.visit('http://localhost:3000/todos/new', function(err) {
        if (err) throw err;

        browser
          .fill('What', 'Laundry')
          .select('scope', 'Personal')
          .pressButton('Create', function(err) {
            if (err) throw err;

            assert.equal(browser.location.pathname, '/todos',
              'should be redirected to /todos after creation');

            var list = browser.queryAll('#todo-list tr.todo');
            assert.equal(list.length, 1, 'To-do list length should be 1');
            var todo = list[0];
            assert.equal(browser.text('td.pos', todo), 1);
            assert.equal(browser.text('td.what', todo), 'Laundry');
            assert.equal(browser.text('td.scope', todo), 'personal');

            done();

          });
      });
    }));

    it('should have an alarm option', login(function(browser, done) {
       browser.visit('http://localhost:3000/todos/new', function(err) {
         if (err) throw err;
         
         var radios = browser.queryAll('input[type=radio]');
         assert.equal(radios.length, 2,
          'should have 2 alarm-date radio buttons and has ' + radios.length);
         radios.forEach(function(radio) {
          assert.equal(radio.name, 'alarm');
         });
         assert.equal(radios[0].value, 'false');
         assert.equal(radios[1].value, 'true');
         assert(radios[0].checked);
         done();
       });
    }));

    

    it('should present the alarm date form fields when alarm', 
      login(function(browser, done) {
        browser.visit('http://localhost:3000/todos/new', function(err) {
          if (err) throw err;

          var container = browser.query('#alarm-date-time');
          
          browser.choose('No Alarm', function(err) {
            if (err) throw err;

            assert.equal(container.style.display, 'none');

            browser.choose('Use Alarm', function(err) {
              if (err) throw err;

              assert.equal(container.style.display, '');

              browser.choose('No Alarm', function(err) {
                if (err) throw err;

                assert.equal(container.style.display, 'none');

                done();
              });
            });
          });
        });
      })
    );

    it('should present the scope select box',
      login(function(browser, done) {
        browser.visit('http://localhost:3000/todos/new', function(err) {
          if (err) throw err;

          var select = browser.queryAll('form select[name=scope]');
          assert.equal(select.length, 1);
          
          var options = browser.queryAll('form select[name=scope] option');
          assert.equal(options.length, 4);

          options = options.map(function(option) {
            return [option.value, option.textContent];
          });

          var expectedOptions = [
            [null, 'Please select'],
            ['work', 'Work'],
            ['personal', 'Personal'],
            ['family', 'Family']
          ];

          assert.deepEqual(options, expectedOptions);

          done();

        });
      })
    );

  });

describe('Todo removal form', function() {

  describe('When one todo item exists', function() {

    beforeEach(function(done) {
      // insert one todo item
      db.insert(fixtures.todo, fixtures.user.email, done);
    });

    it("should allow you to remove", login(function(browser, done) {

      browser.visit('http://localhost:3000/todos', function(err, browser) {
        if (err) throw err;

        assert.equal(browser.queryAll('#todo-list tr.todo').length, 1);
      
        browser.pressButton('#todo-list tr.todo .remove form input[type=submit]',
          function(err) {
            if (err) throw err;
            assert.equal(browser.location.pathname, '/todos');
            // assert that all todos have been removed
            assert.equal(browser.queryAll('#todo-list tr').length, 0);
            done();
          }
        );

      });
    }));

  });

    describe('When more than one todo item exists', function() {

      beforeEach(function(done) {
        // insert todo items
        db.insert(fixtures.todos, fixtures.user.email, done);
      });

      it("should allow you to remove one todo item", login(
        function(browser, done) {

          browser.visit('http://localhost:3000/todos', function(err, browser) {
            if (err) throw err;

            var expectedList = [
              fixtures.todos.todos[0],
              fixtures.todos.todos[1],
              fixtures.todos.todos[2]
            ];

            var list = browser.queryAll('#todo-list tr');
            assert.equal(list.length, 3);

            list.forEach(function(todoRow, index) {
              assert.equal(browser.text('.pos', todoRow), index + 1);
              assert.equal(browser.text('.what', todoRow),
                expectedList[index].what);
            });

            browser.pressButton(
              '#todo-list tr:nth-child(2) .remove input[type=submit]',
              function(err) {
                if (err) throw err;
                
                assert.equal(browser.location.pathname, '/todos');
                
                // assert that the middle todo item have been removed
                var list = browser.queryAll('#todo-list tr');
                assert.equal(list.length, 2);

                // remove the middle element from the expected list
                expectedList.splice(1,1);

                // test that the rendered list is the expected list
                list.forEach(function(todoRow, index) {
                  assert.equal(browser.text('.pos', todoRow), index + 1);
                  assert.equal(browser.text('.what', todoRow),
                    expectedList[index].what);
                });

                done();
              }
            );

          });
        }
      ));

    });

  });

});