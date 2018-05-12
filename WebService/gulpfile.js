var gulp = require("gulp");
var ts = require("gulp-typescript");
var server = require('gulp-express');
var del = require('del');
var tsProject = ts.createProject("tsconfig.json");

// compile typescript
gulp.task('tsc-compile', () => {
    del(['./dist/*']);
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});

// watch src directory.
gulp.task('express:watch', (done) => {
    gulp.watch('./src/**/*.ts', gulp.series('tsc-compile', 'express'));
    done();
})

// run express server.
gulp.task('express', (done) => {
    server.run(['bin/www'], {}, false);
    done();
})

// serve task.
gulp.task('serve', gulp.series('tsc-compile', 'express:watch', 'express'));
