const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  base: "DrohneDashboard",
  transpileDependencies: true,
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
});
