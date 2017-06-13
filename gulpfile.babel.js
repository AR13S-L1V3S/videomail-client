import path from 'path'
import fs from 'fs'
import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import nib from 'nib'
import browserify from 'browserify'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import Router from 'router'
import bodyParser from 'body-parser'
import send from 'connect-send-json'
import rimraf from 'rimraf'
import minimist from 'minimist'
import sslRootCas from 'ssl-root-cas'
import pump from 'pump'

const plugins = gulpLoadPlugins()

const defaultOptions = {
  minify: false,
  importance: null,
  write: false,
  version: null
}

const options = minimist(process.argv.slice(2), {default: defaultOptions})

plugins.util.log('Options:', options)

gulp.task('clean:js', (cb) => {
  rimraf('dist/*.js', cb)
})

gulp.task('todo', () => {
  gulp.src(['src/**/*.{js, styl}', 'gulpfile.babel.js', 'examples/*.html'], {base: './'})
    .pipe(plugins.todo({fileName: 'TODO.md'}))
    .pipe(gulp.dest('./'))
})

gulp.task('standard', () => {
  // todo consider using snazzy https://github.com/feross/snazzy
  return gulp.src(['src/**/*.js', 'gulpfile.babel.js', '!src/styles/css/main.min.css.js'])
    .pipe(plugins.standard())
    .pipe(plugins.standard.reporter('default', {breakOnError: true}))
})

gulp.task('stylus', () => {
  gulp.src('src/styles/styl/main.styl')
    .pipe(plugins.plumber()) // with the plumber the gulp task won't crash on errors
    .pipe(plugins.stylus({
      use: [nib()],
      errors: true
    }))
    // https://github.com/ai/autoprefixer#browsers
    .pipe(plugins.autoprefixer(
      'last 4 versions',
      '> 1%',
      'Explorer >= 11',
      'Firefox ESR',
      'iOS >= 9',
      'android >= 4'
    ))
    // always minify otherwise it gets broken with line-breaks
    // when surrounded with `'s when injected
    // todo: fix this, so that it also works when not minified, this
    // for faster builds during development
    .pipe(plugins.cssnano())
    .pipe(plugins.rename({suffix: '.min', extname: '.css.js'}))
    .pipe(plugins.injectString.wrap('module.exports=\'', '\''))
    // todo: location is bad, should be in a temp folder or so
    .pipe(gulp.dest('src/styles/css'))
    .pipe(plugins.connect.reload())
})

gulp.task('browserify', ['clean:js'], (cb) => {
  const entry = path.join(__dirname, '/src/index.js')
  const bundler = browserify({
    entries: [entry],
    basedir: __dirname,
    globals: false,
    debug: !options.minify // enables inline source maps
  })

  pump([
    bundler
      .require(entry, {expose: 'videomail-client'})
      .transform('babelify', {presets: ['es2015'], sourceMaps: !options.minify})
      .bundle(),

    source('./src/'), // gives streaming vinyl file object
    buffer(), // required because the next steps do not support streams
    plugins.concat('videomail-client.js'),
    gulp.dest('dist'),
    plugins.if(options.minify, plugins.sourcemaps.init()),
    plugins.if(options.minify, plugins.uglify()),
    plugins.if(options.minify, plugins.rename({suffix: '.min'})),
    plugins.if(options.minify, plugins.sourcemaps.write('/')),
    plugins.if(options.minify, gulp.dest('dist')),
    plugins.connect.reload()
  ], cb)
})

gulp.task('connect', ['build'], () => {
  var SSL_CERTS_PATH = path.join(__dirname, '/env/dev/ssl-certs/')

  sslRootCas
    .inject()
    .addFile(path.join(SSL_CERTS_PATH, 'server', 'my-root-ca.crt.pem'))

  plugins.connect.server({
    root: ['examples', 'dist'],
    port: 8080,
    debug: true,
    livereload: true,
    https: {
      key: fs.readFileSync(path.join(SSL_CERTS_PATH, 'server', 'my-server.key.pem')),
      cert: fs.readFileSync(path.join(SSL_CERTS_PATH, 'server', 'my-server.crt.pem'))
    },
    middleware: () => {
      const router = new Router()

      router.use(bodyParser.json())
      router.use(send.json())

      // does not work, see bug https://github.com/AveVlad/gulp-connect/issues/170
      router.post('/contact', (req, res) => {
        console.log('Videomail data received:', req.body)

        // At this stage, a backend could store the videomail_key in req.body
        // into a database for replay functionality

        // Just an example to see that the backend can do anything with the data
        res.json({
          status: 'Inserted on ' + new Date().toISOString()
        })
      })

      return [router]
    }
  })
})

gulp.task('reload', () => {
  plugins.connect.reload()
})

gulp.task('watch', ['connect'], () => {
  gulp.watch(['src/styles/styl/**/*.styl'], ['stylus'])
  gulp.watch(['src/**/*.js'], ['browserify'])
  // commented out so that it reloads faster
  // gulp.watch(['src/**/*.js', 'gulpfile.js', '!src/styles/css/main.min.css.js'], ['standard'])
  gulp.watch(['examples/*.html'], ['reload'])
})

// get inspired by
// https://www.npmjs.com/package/gulp-tag-version and
// https://github.com/nicksrandall/gulp-release-tasks/blob/master/tasks/release.js
gulp.task('bumpVersion', () => {
  const bumpOptions = {}

  if (options.version) {
    bumpOptions.version = options.version
  } else if (options.importance) {
    bumpOptions.type = options.importance
  }

  return gulp.src(['./package.json'])
    .pipe(plugins.bump(bumpOptions))
    .pipe(plugins.if(options.write, gulp.dest('./')))
    .on('error', plugins.util.log)
})

gulp.task('examples', ['connect', 'watch'])
gulp.task('build', ['standard', 'stylus', 'browserify', 'todo'])
gulp.task('default', ['build'])
