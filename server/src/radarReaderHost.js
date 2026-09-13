const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_PATH = path.join(__dirname, "..", "..", "radar-reader.js");

const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(SOURCE_PATH, "utf8"), sandbox, { filename: SOURCE_PATH });

module.exports = sandbox.RadarReader;
