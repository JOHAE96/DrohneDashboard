const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
  // Add the publicPath option for correct asset paths
  publicPath: process.env.NODE_ENV === 'production'
    ? '/DrohneDashboard/'  // This should match your GitHub repo name
    : '/'

});
