const async = require('async');
const toml = require('toml');
const path = require('path');
const shelljs = require('shelljs');
const Web3Utils = require('web3-utils');
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
      silent: false,
      cwd
    }, (code, stdout, stderr) => {
      // Cargo outputs all logs in stderr
      if (code !== 0) {
        logger.error(stdout, stderr);
        return callback(`Cargo exited with error code ${code}`);
      }
      const packageName = Compiler.getPackageName(cwd).replace(/-/g, '_');
      const packageFile = path.join(cwd, 'target', 'wasm32-unknown-unknown', 'release', `${packageName}.wasm`);
      const bytecode = fs.readFileSync(packageFile, 'utf8');
      callback(null, bytecode, packageName);
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
        Compiler.compileRustContract(logger, file.filename, (err, byteCode, className) => {
          if (err) {
            return fileCb(err);
          }

          compiled_object[className] = {};
          compiled_object[className].runtimeBytecode = byteCode;
          compiled_object[className].realRuntimeBytecode = byteCode;
          compiled_object[className].code = Web3Utils.bytesToHex(byteCode);
          compiled_object[className].abiDefinition = AbiDefinition;
          compiled_object[className].filename = file.filename;
          fileCb();
        });
      },
      function(err) {
        cb(err, compiled_object);
      }
    );
  }
}

module.exports = Compiler;
