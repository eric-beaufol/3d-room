module.exports = {
  plugins: [
    // https://github.com/jonathantneal/precss
    require('precss'),
    // https://github.com/postcss/autoprefixer
    require('autoprefixer'),
    // https://github.com/postcss/postcss-nested
    require('postcss-nested')
  ]
};