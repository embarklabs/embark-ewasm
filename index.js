/*global require, module*/
const Compiler = require('./lib/Compiler');


module.exports = (embark) => {
  embark.registerCompiler('.rs', compileRustWasm);

  function compileRustWasm(files, cb) {
    if (!files || !files.length) {
      return cb();
    }
    Compiler.compileRustWasm(embark.logger, files, cb);
  }
};
