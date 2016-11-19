var gulp = require('gulp');
var child = require('child_process');
var mongoData = require('gulp-mongodb-data');
require('dotenv').config();


//**TASKS TO USE**
gulp.task('start', ['start-mongo', 'webpack', 'start-server']);
gulp.task('start-fresh', ['init-db', 'webpack', 'start-server']);



//**INDIVIDUAL TASKS AND HELPERS**

//fires up mongo
gulp.task('start-mongo', function() {
  child.exec('mongod --dbpath ./db', function(err, stdin, stderr) {
    console.log('mongo: ', stdin);
    console.log('mongo: ', stderr);
  });
});

//deletes all collections in lt database
gulp.task('clean-db', ['start-mongo'], function(cb) {
  child.exec('mongo lt --eval "db.dropDatabase()"', function(err, stdin, stderr) {
    console.log('clean-db: ', stdin);
    console.log('clean-db: ', stderr);
    cb(err);
  })
});

//adds all the test collections to a freshly cleaned db
gulp.task('init-db', ['clean-db', 'start-mongo'], function() {
  gulp.src('./dates.json')
    .pipe(mongoData({ mongoUrl: 'mongodb://localhost:27017/lt' }));
});

//webpacks our bundle.js
gulp.task('webpack', function(){
  const args = ['--watch', '--progress'];
  const options = { cwd: './client', stdio: 'inherit' };
  child.spawn('webpack', args, options)
});

//starts the server
gulp.task('start-server', function(cb) {
  child.exec('./node_modules/.bin/babel-node server.js', function(err, stdout, stderr) {
    console.log('server: ', stdout);
    console.log('server: ', stderr);
    cb(err);
  });
});
