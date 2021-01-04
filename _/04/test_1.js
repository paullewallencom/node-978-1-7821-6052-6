describe('some feature', function() {
  
  beforeEach(function runBeforeEach(done) {
    console.log('running beforeEach function...');
    setTimeout(done, 1000);
  });

  it('should do A', function(done) {
    console.log('test A');
    done();
  });

  it('should do B', function(done) {
    console.log('test B');
    done();
  });
});