import * as module from "../src/module";
import * as type from "../src/type";
import * as fs from "fs";

export function testModuleLoaderLoadModule(test) {
    const vlinderModuleFetcher = name => {
        return fs.readFileSync(__dirname + "/testdata/" + name.replace(/\./g, "/") + ".vlm", "utf-8");
    };
    const ecmascriptModuleFetcher = name => {
        return require(__dirname + "/testdata/" + name.replace(/\./g, "/"));
    };
    const globalMap = new module.GlobalMap();
    const typeLoader = new type.TypeLoader();
    const moduleLoader = new module.ModuleLoader(vlinderModuleFetcher, ecmascriptModuleFetcher, globalMap, typeLoader);

    moduleLoader.loadModule("vlinder.log");
    test.ok(moduleLoader._loadedModuleNames["vlinder.log"]);
    test.ok(moduleLoader._loadedModuleNames["vlinder.text"]);

    test.strictEqual(typeLoader.fromDescriptor("Nvlinder.text.String;"), type.stringType);

    const levelType = typeLoader.fromDescriptor("Nvlinder.log.Level;");
    test.ok(levelType instanceof type.UnionType);
    test.strictEqual(levelType.constructors['Debug'].name, 'Debug');
    test.strictEqual(levelType.constructors['Info'].name, 'Info');
    test.strictEqual(levelType.constructors['Warning'].name, 'Warning');
    test.strictEqual(levelType.constructors['Error'].name, 'Error');
    test.strictEqual(levelType.constructors['Critical'].name, 'Critical');
    for (let constructor in levelType.constructors) {
        test.strictEqual(levelType.constructors[constructor].type, levelType);
    }

    const recordType = typeLoader.fromDescriptor("Nvlinder.log.Record;");
    test.ok(recordType instanceof type.StructType);
    test.strictEqual(recordType.fields.length, 2);
    test.strictEqual(recordType.fields[0].name, "level");
    test.strictEqual(recordType.fields[0].typeDescriptor, "Nvlinder.log.Level;");
    test.strictEqual(recordType.fields[1].name, "message");
    test.strictEqual(recordType.fields[1].typeDescriptor, "S");

    const loggerType = typeLoader.fromDescriptor("Nvlinder.log.Logger;");
    test.ok(loggerType instanceof type.SubType);
    test.strictEqual(loggerType.parameterTypes.length, 1);
    test.strictEqual(loggerType.parameterTypes[0], recordType);
    test.ok(loggerType.returnType instanceof type.TupleType);

    const infoSub = globalMap.givenName("vlinder.log.info");
    test.ok(infoSub.type instanceof type.SubType);
    test.strictEqual(infoSub.type.descriptor, "FFNvlinder.log.Record;T;;ST;;");
    test.strictEqual(infoSub.name, "vlinder.log.info");
    test.deepEqual(infoSub.parameterNames, ["logger", "message"]);
    test.strictEqual(infoSub.localCount, 0);

    moduleLoader.loadModule("vlinder.ffi");
    const idWithSideEffectLOLSub = globalMap.givenName("vlinder.ffi.idWithSideEffectLOL");
    test.ok(idWithSideEffectLOLSub.type instanceof type.SubType);
    test.strictEqual(idWithSideEffectLOLSub.type.descriptor, "FT;T;;");
    test.strictEqual(idWithSideEffectLOLSub.name, "vlinder.ffi.idWithSideEffectLOL");
    test.deepEqual(idWithSideEffectLOLSub.parameterNames, ["y"]);
    test.strictEqual(idWithSideEffectLOLSub.localCount, 0);

    moduleLoader.loadModule("main");

    test.done();
}
