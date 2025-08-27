/**
 * Babel configuration for Jest.
 * This tells Jest how to transpile ES modules for testing.
 */
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
