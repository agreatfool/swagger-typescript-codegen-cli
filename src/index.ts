#!/usr/bin/env node

import * as LibFs from "fs";
import * as LibPath from "path";

import * as program from "commander";
import * as mkdirp from "mkdirp";
import * as YAML from "yaml";

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

const ARGS_SOURCE = (program as any).source === undefined ? undefined : (program as any).source;
const ARGS_OUTPUT = (program as any).output === undefined ? undefined : (program as any).output;
const ARGS_CLASS = (program as any).className === undefined ? "Api" : (program as any).className;
const ARGS_FILE = (program as any).fileName === undefined ? "api.ts" : (program as any).fileName;

let IS_SOURCE_URL = false;
let SPEC = ""; // swagger spec

class Generator {
    public async run() {
        console.log("Starting ...");

        await this._validate();
        await this._process();
    }

    private async _validate() {
        console.log("Validating ...");

        // validate ARGS_SOURCE
        if (ARGS_SOURCE === undefined) {
            console.log("Source is required, please provide -s");
            process.exit(1);
        }
        if (isUrl(ARGS_SOURCE)) {
            IS_SOURCE_URL = true;
        } else {
            try {
                const sStat = LibFs.statSync(ARGS_SOURCE);
                if (!sStat.isFile()) {
                    console.log("Source exists and not a file, please check");
                    process.exit(1);
                }
            } catch (err) {
                if (err.code === "ENOENT") { // file not found, exit
                    console.log("Source file not found, please check");
                    process.exit(1);
                } else {
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
        } catch (err) {
            if (err.code === "ENOENT") { // directory not found, make it
                mkdirp.sync(ARGS_OUTPUT);
            } else {
                throw err;
            }
        }
    }

    private async _process() {
        console.log("Processing ...");

        await this._processSource();
        await this._processOutput();
    }

    private async _processSource() {
        if (IS_SOURCE_URL) {
            await this._processRemoteSource();
        } else {
            await this._processLocalSource();
        }
    }

    private async _processRemoteSource() {
        return new Promise((resolve, reject) => {
            fetch(ARGS_SOURCE).then((res) => res.json()).then((body) => {
                SPEC = body;
                resolve();
            }).catch((err) => reject(err));
        });
    }

    private async _processLocalSource() {
        const file = LibFs.readFileSync(ARGS_SOURCE).toString();

        try {
            SPEC = JSON.parse(file);
        } catch (err) {
            try {
                SPEC = YAML.parse(file);
            } catch (err) {
                throw err;
            }
        }
    }

    private async _processOutput() {
        const tsSourceCode = CodeGen.getTypescriptCode({
            className: ARGS_CLASS,
            swagger: SPEC,
            template: {
                // build/index.js => build/../../src/templates/class.mustache
                class: LibFs.readFileSync(LibPath.join(__dirname, "..", "src", "templates", "class.mustache"), "utf-8"),
            },
        });

        LibFs.writeFileSync(LibPath.join(ARGS_OUTPUT, ARGS_FILE), tsSourceCode);
    }
}

new Generator().run().then((_) => _).catch((_) => console.log(_));

process.on("uncaughtException", (error: Error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on("unhandledRejection", (error: Error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});
