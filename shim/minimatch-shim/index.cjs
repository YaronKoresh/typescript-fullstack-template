const m = require('minimatch');

const minimatch = m.minimatch || m;

module.exports = minimatch;
module.exports.Minimatch = m.Minimatch;
module.exports.minimatch = minimatch;

module.exports.filter = m.filter;
module.exports.defaults = m.defaults;