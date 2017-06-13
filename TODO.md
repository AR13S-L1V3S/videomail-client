### TODOs
| Filename | line # | TODO
|:------|:------:|:------
| src/options.js | 139 | pass on version to server
| src/util/eventEmitter.js | 6 | MAKE EVENT EMITTING IN DESPOT NOT GLOBAL BUT BY CONTAINER ID INSTEAD
| src/util/eventEmitter.js | 43 | have this emitted through a configuration because it is pretty noisy
| src/util/humanize.js | 4 | get rid of this class and use those imports directly
| src/util/videomailError.js | 59 | fix this deadlock
| src/wrappers/container.js | 278 | figure out how to fire dom's onload event again
| src/wrappers/container.js | 279 | or how to run all the scripts over again
| src/wrappers/visuals/recorder.js | 646 | commented out because for some reasons server does not accept such a long
| src/wrappers/visuals/recorder.js | 651 | consider removing this later or have it for debug=1 only?
| src/wrappers/visuals/userMedia.js | 172 | debug and fix that weird error
| gulpfile.babel.js | 41 | consider using snazzy https://github.com/feross/snazzy
| gulpfile.babel.js | 65 | fix this, so that it also works when not minified, this
| gulpfile.babel.js | 70 | location is bad, should be in a temp folder or so