module.exports = {
  version: 2,
  snapshot: {
    widths: [375, 768, 1280],
    minHeight: 800,
    percyCSS: `
      // Ignore animations
      * {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  },
  discovery: {
    allowedHostnames: [],
    disallowedHostnames: [],
    networkIdleTimeout: 100,
  },
  upload: {
    files: './percy-setup.js',
    ignore: ['node_modules/**'],
  },
}; 