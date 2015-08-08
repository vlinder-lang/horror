import * as fs from "fs";
import * as module from "./src/module";
import * as thread from "./src/thread";
import * as type from "./src/type";

const millModuleFetcher = name => {
    return fs.readFileSync(process.argv[2] + "/" + name + ".millm");
};
const ecmascriptModuleFetcher = name => {
    return require(process.argv[2] + "/" + name);
};
const globalMap = new module.GlobalMap();
const typeLoader = new type.TypeLoader();
const moduleLoader = new module.ModuleLoader(
    millModuleFetcher,
    ecmascriptModuleFetcher,
    globalMap,
    typeLoader
);


moduleLoader.loadModule("mill.log");
moduleLoader.loadModule("main");
const main = globalMap.givenName("main.main");
const logger =
    typeLoader.fromDescriptor("FNmill.log.Record;T;;")
    .new("console", ["logger"], 0, [
        { opcode: "ldarg", argument: 0 },
        {
            opcode: "horror.ffiretcall",
            arguments: 1,
            function: record => {
                // TODO: Support different log levels.
                console.info(record.getField("message").value);
                return typeLoader.fromDescriptor("T;").new();
            },
        },
        { opcode: "ret" },
    ]);
const mainThread = new thread.Thread(globalMap, typeLoader, main, [logger]);
mainThread.resume();
