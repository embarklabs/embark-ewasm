# embark-ewasm
Embark plugin to enable the compilation of ewasm

Installation
======

In your embark dapp directory:
```npm install embark-ewasm --save```

FOR ANTHONY: Put `"embark-ewasm": "file:../embark-ewasm",` in your package json

then add embark-ewasm to the plugins section in ```embark.json```:

```Json
  "plugins": {
    "embark-ewasm": {}
  }
```

Requirements
======

- Embark 3.0.0 or higher
- Rust and Cargo installed and available globally on your machine
