/**
 * Curriculum registry.
 *
 * Each entry is a full course specification: modules, lessons and the topic
 * content those lessons render from. Add a spec here after creating it in this
 * directory, then run `npm run curriculum:check` and `npm run curriculum:build`.
 */

module.exports = [
  require('./devops'),
  require('./go'),
  require('./react'),
  require('./nodejs'),
  require('./data-science'),
  require('./system-design'),
  require('./typescript'),
  require('./ui-ux'),
  require('./javascript'),
  require('./html-css'),
  require('./git'),
];
