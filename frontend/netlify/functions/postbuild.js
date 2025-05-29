// This is a Netlify Build Plugin
// https://docs.netlify.com/configure-builds/build-plugins/

module.exports = {
  onPostBuild: async ({ utils }) => {
    console.log('Running post-build tasks...');
    
    // Verify the font files exist in the output directory
    try {
      const fs = require('fs');
      const path = require('path');
      
      const fontDir = path.join(process.cwd(), 'out', 'fonts');
      const fontFile = path.join(fontDir, 'main-font.woff2');
      
      if (!fs.existsSync(fontDir)) {
        console.error('Font directory not found in build output!');
        utils.build.failBuild('Missing font directory in build output');
      }
      
      if (!fs.existsSync(fontFile)) {
        console.error('Main font file not found in build output!');
        utils.build.failBuild('Missing main-font.woff2 in build output');
      }
      
      console.log('✅ Font files verified in build output');
    } catch (error) {
      console.error('Error in post-build verification:', error);
      utils.build.failBuild('Error in post-build verification');
    }
  }
}; 