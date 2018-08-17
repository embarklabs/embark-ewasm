const async = require('async');
const toml = require('toml');
const path = require('path');
const shelljs = require('shelljs');
const fs = require('fs');

const AbiDefinition = [
  {
    "payable": true,
    "stateMutability": "payable",
    "type": "fallback"
  }
];

class Compiler {

  static getPackageName(cwd) {
    const file = path.join(cwd, 'Cargo.toml');
    const data = toml.parse(fs.readFileSync(file));
    return data.package.name;
  }

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
      const packageName = Compiler.getPackageName(cwd).replace(/-/g, '_');
      const packageFile = path.join(cwd, 'target', 'wasm32-unknown-unknown', 'release', `${packageName}.wasm`);
      const bytecode = fs.readFileSync(packageFile);
      callback(null, bytecode);
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

          compiled_object[className].runtimeBytecode = byteCode;
          compiled_object[className].realRuntimeBytecode = byteCode;
          compiled_object[className].code = byteCode;
          compiled_object[className].abiAbiDefinition = AbiDefinition;
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
