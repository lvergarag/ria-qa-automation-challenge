module.exports = {
  default: {
    require: [
      "src/support/*.js",
      "features/step_definitions/*.js"
    ],
    paths: ["features/**/*.feature"],
    format: ["progress"],
    publishQuiet: true
  }
};
