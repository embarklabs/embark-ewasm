/*global require, module*/
const Compiler = require('./lib/Compiler');


module.exports = (embark) => {
  embark.registerCompiler('.rs', compileRustWasm);

  function compileRustWasm(files, cb) {
    if (!files) {
      return cb();
    }
    let filesToCompile = files.filter(file => file.filename.indexOf('target') === -1);
    if (!filesToCompile.length) {
      return cb();
    }
    Compiler.compileRustWasm(embark.logger, filesToCompile, cb);
  }
};
