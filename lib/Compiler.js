const async = require('async');
const path = require('path');
const shelljs = require('shelljs');

class Compiler {
  static compileRustContract(logger, filename, callback) {
    const parts = path.normalize(filename).split(path.sep);
    const cwd = parts.slice(0, parts.length - 2).join(path.sep);
    shelljs.exec(`cargo build --release --target wasm32-unknown-unknown`, {
      silent: true,
      cwd
    }, (code, stdout, stderr) => {
      // Cargo outputs all logs in stderr
      if (code !== 0) {
        logger.error(stdout, stderr);
        return callback(`Cargo exited with error code ${code}`);
      }
      // TODO get the .wasm file in "target\wasm32-unknown-unknown\release"
      // The name of the file is in the TOML file as the field "name"
      callback();
    });
  }

  static compileRustWasm(logger, files, cb) {
    if (!files || !files.length) {
      return cb();
    }
    logger.info("compiling Rust eWASM contracts...");
    const compiled_object = {};
    // TODO might have to "merge" files together, as multiple rust file in a folder can be used by ONE toml file (which is the source of the compilation)
    // Might need to ask more question about that
    async.each(files,
      function(file, fileCb) {
        const className = path.basename(file.filename).split('.')[0];
        compiled_object[className] = {};
        Compiler.compileRustContract(logger, file.filename, (err, byteCode) => {
          if (err) {
            return fileCb(err);
          }

          // TODO put content of WASM file in those. I'm not sure yet how aleth uses those
          compiled_object[className].runtimeBytecode = byteCode;
          compiled_object[className].realRuntimeBytecode = byteCode;
          compiled_object[className].code = byteCode;
          // TODO put the hardcoded ABI in the abi field of the object
          fileCb();
        });
      },
      function(err) {
        // TODO remove this when ready. It is easier to debug with the Exit
        console.log('ERR', err);
        process.exit();
        cb(err, compiled_object);
      });
  }
}

module.exports = Compiler;
