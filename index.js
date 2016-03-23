var yeoman = require("yeoman-generator");

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);
    this.pkg = require("../package.json");
  },
  askFor: function() {
    var done = this.async();
    this.options["skip-welcome-message"] = true;
    done();
  }
});
