const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

// Keep production builds from overwriting assets served by a running dev server.
module.exports = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
});
