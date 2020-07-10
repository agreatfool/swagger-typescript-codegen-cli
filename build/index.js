#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LibFs = require("fs");
const LibPath = require("path");
const program = require("commander");
const mkdirp = require("mkdirp");
const YAML = require("yaml");
const isUrl = require("is-url");
const fetch = require("node-fetch");
const CodeGen = require("swagger-typescript-codegen").CodeGen;
const pkg = require("../package.json");
program.version(pkg.version)
    .description("Download|Read provided swagger json|yml, and generate client typescript api codes.")
    .option("-s, --source <string>", "swagger spec source, could be a URL string or local file path string")
    .option("-o, --output <string>", "codes output path, would be made if does not exist")
    .option("-c, --class-name <string>", "class name to generate, default: Api")
    .option("-f, --file-name <string>", "file name to generate, default: api.ts")
    .parse(process.argv);
const ARGS_SOURCE = program.source === undefined ? undefined : program.source;
const ARGS_OUTPUT = program.output === undefined ? undefined : program.output;
const ARGS_CLASS = program.className === undefined ? "Api" : program.className;
const ARGS_FILE = program.fileName === undefined ? "api.ts" : program.fileName;
let IS_SOURCE_URL = false;
let SPEC = ""; // swagger spec
class Generator {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Starting ...");
            yield this._validate();
            yield this._process();
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Validating ...");
            // validate ARGS_SOURCE
            if (ARGS_SOURCE === undefined) {
                console.log("Source is required, please provide -s");
                process.exit(1);
            }
            if (isUrl(ARGS_SOURCE)) {
                IS_SOURCE_URL = true;
            }
            else {
                try {
                    const sStat = LibFs.statSync(ARGS_SOURCE);
                    if (!sStat.isFile()) {
                        console.log("Source exists and not a file, please check");
                        process.exit(1);
                    }
                }
                catch (err) {
                    if (err.code === "ENOENT") { // file not found, exit
                        console.log("Source file not found, please check");
                        process.exit(1);
                    }
                    else {
                        throw err;
                    }
                }
            }
            // validate ARGS_OUTPUT
            if (ARGS_OUTPUT === undefined) {
                console.log("Output is required, please provide -o");
                process.exit(1);
            }
            try {
                const oStat = LibFs.statSync(ARGS_OUTPUT);
                if (!oStat.isDirectory()) {
                    console.log("Output exits and not a directory, please check");
                    process.exit(1);
                }
            }
            catch (err) {
                if (err.code === "ENOENT") { // directory not found, make it
                    mkdirp.sync(ARGS_OUTPUT);
                }
                else {
                    throw err;
                }
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Processing ...");
            yield this._processSource();
            yield this._processOutput();
        });
    }
    _processSource() {
        return __awaiter(this, void 0, void 0, function* () {
            if (IS_SOURCE_URL) {
                yield this._processRemoteSource();
            }
            else {
                yield this._processLocalSource();
            }
        });
    }
    _processRemoteSource() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fetch(ARGS_SOURCE).then((res) => res.json()).then((body) => {
                    SPEC = body;
                    resolve();
                }).catch((err) => reject(err));
            });
        });
    }
    _processLocalSource() {
        return __awaiter(this, void 0, void 0, function* () {
            const file = LibFs.readFileSync(ARGS_SOURCE).toString();
            try {
                SPEC = JSON.parse(file);
            }
            catch (err) {
                try {
                    SPEC = YAML.parse(file);
                }
                catch (err) {
                    throw err;
                }
            }
        });
    }
    _processOutput() {
        return __awaiter(this, void 0, void 0, function* () {
            const tsSourceCode = CodeGen.getTypescriptCode({
                className: ARGS_CLASS,
                swagger: SPEC,
                template: {
                    // build/index.js => build/../../src/templates/class.mustache
                    class: LibFs.readFileSync(LibPath.join(__dirname, "..", "src", "templates", "class.mustache"), "utf-8"),
                },
            });
            LibFs.writeFileSync(LibPath.join(ARGS_OUTPUT, ARGS_FILE), tsSourceCode);
        });
    }
}
new Generator().run().then((_) => _).catch((_) => console.log(_));
process.on("uncaughtException", (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on("unhandledRejection", (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});
//# sourceMappingURL=index.js.map