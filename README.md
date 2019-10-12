# Swagger to Typescript Codegen CLI

## Intro
A cli wrapper for [swagger-typescript-codegen](https://github.com/mtennoe/swagger-typescript-codegen). Provides the functionality to generate client ts codes from swagger json|yaml.

## Wrapper
Using [swagger-typescript-codegen](https://github.com/mtennoe/swagger-typescript-codegen) to generate client ts codes. 

## Notes
Version 3.0.1 of swagger-typescript-codegen has a critical bug: [Property 'default' does not exist on type 'SuperAgentStatic' #98](https://github.com/mtennoe/swagger-typescript-codegen/issues/98).

So currently cli tool using custom template file, placed at: `src/templates/*`. Codes executed at `build/index.js` would using templates `../src/templates/*` to generate client codes. Currently there is no script to sync templates files from `src` to `build`. The whole templates dir & functionality shall be removed later.

## Usage
```bash
$ swagger-typescript-codegen-cli -h
Usage: swagger-typescript-codegen-cli [options]

Download|Read provided swagger json|yml, and generate client typescript api codes.

Options:
  -V, --version          output the version number
  -s, --source <string>  swagger spec source
  -o, --output <string>  codes output path
  -h, --help             output usage information
```
