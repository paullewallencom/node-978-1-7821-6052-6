function LoggedIn() {
  return function(next) {
    if (! this.req.session || ! this.req.session.user) {
      this.res.writeHead(303, {Location: '/session/new'});
      return this.res.end();
    }
    next();
  };
}

module.exports = LoggedIn;