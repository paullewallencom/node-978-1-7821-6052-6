describe('feature A', function() {

  before(function() {
    console.log('before A');
  });

  after(function() {
    console.log('after A');
  });

  beforeEach(function() {
    console.log('beforeEach A');
  });

  afterEach(function() {
    console.log('afterEach A');
  });

  describe('feature A.1', function() {
    before(function() {
      console.log('before A.1');
    });

    after(function() {
      console.log('after A.1');
    });

    beforeEach(function() {
      console.log('beforeEach A.1');
    });

    afterEach(function() {
      console.log('afterEach A.1');
    });

    it('should do A.1.1', function(done) {
      console.log('A.1.1');
    });

    it('should do A.1.2', function() {
      console.log('A.1.2');
    });

  });

  
});