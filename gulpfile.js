const gulp = require("gulp");
const eslint = require("gulp-eslint");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const jsdoc = require("gulp-jsdoc3");
const connect = require("gulp-connect");
const webpack = require("webpack");
const path = require("path");

gulp.task("default", () => {
  gulp.start("lint", "babel", "doc");
});

gulp.task("lint", () => {
  return gulp
    .src(["src/*.js", "!node_modules/**"])
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task("watch", () => {
  gulp.watch(["src/**/*.js"], gulp.series("babel"));
});

gulp.task("babel", done => {
  gulp
    .src("src/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ["@babel/env"],
        plugins: [
          "@babel/plugin-proposal-object-rest-spread",
          "@babel/plugin-transform-runtime",
          "@babel/plugin-transform-modules-commonjs",
          "@babel/plugin-syntax-dynamic-import",
          "@babel/plugin-syntax-optional-chaining",
        ],
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"));
  done();
});

gulp.task("build", done => {
  webpack({
    entry: ["@babel/polyfill", path.join(__dirname, "src/lumino-js-sdk")],
    output: {
      path: "./dist/",
      filename: "bundle.js",
      library: "Lumino",
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "babel-loader",
          query: {
            presets: ["@babel/preset-env"],
            plugins: [
              "@babel/plugin-proposal-object-rest-spread",
              "@babel/plugin-transform-runtime",
              "@babel/plugin-transform-modules-commonjs",
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-syntax-optional-chaining",
            ],
          },
        },
        {
          test: /\.json$/,
          loader: "json-loader",
        },
      ],
    },
    resolve: {
      extensions: ["", ".js"],
    },
  }).run((err, stat) => {
    if (err) {
      console.log("Error building application - ", err);
      return;
    }
    const statJson = stat.toJson();
    if (statJson.errors.length > 0) {
      console.log("Error building application - ", statJson.errors);
      return;
    }
    console.log("Application built successfully !");
    done();
  });
});

gulp.task("doc", cb => {
  gulp.src(["README.md", "src/**/*.js"], { read: false }).pipe(jsdoc(cb));
});

gulp.task("webserver", () => {
  connect.server({
    port: 8085,
  });
});
