import * as module from "../src/module";
import * as type from "../src/type";
import * as fs from "fs";

export function testModuleLoaderLoadModule(test) {
    const fetcher = name => {
        return fs.readFileSync(__dirname + "/testdata/" + name.replace(/\./g, "/") + ".millm", "utf-8");
    };
    const typeLoader = new type.TypeLoader();
    const moduleLoader = new module.ModuleLoader(fetcher, typeLoader);

    moduleLoader.loadModule("mill.log");
    test.ok(moduleLoader._loadedModuleNames["mill.log"]);
    test.ok(moduleLoader._loadedModuleNames["mill.text"]);

    test.strictEqual(typeLoader.fromDescriptor("Nmill.text.String;"), type.stringType);

    const levelType = typeLoader.fromDescriptor("Nmill.log.Level;");
    test.ok(levelType instanceof type.UnionType);
    test.strictEqual(levelType.constructors.length, 5);
    test.strictEqual(levelType.constructors[0].name, 'Debug');
    test.strictEqual(levelType.constructors[1].name, 'Info');
    test.strictEqual(levelType.constructors[2].name, 'Warning');
    test.strictEqual(levelType.constructors[3].name, 'Error');
    test.strictEqual(levelType.constructors[4].name, 'Critical');
    for (let constructor of levelType.constructors) {
        test.strictEqual(constructor.parameters.length, 0);
    }

    const recordType = typeLoader.fromDescriptor("Nmill.log.Record;");
    test.ok(recordType instanceof type.StructType);
    test.strictEqual(recordType.fields.length, 2);
    test.strictEqual(recordType.fields[0].name, "level");
    test.strictEqual(recordType.fields[0].typeDescriptor, "Nmill.log.Level;");
    test.strictEqual(recordType.fields[1].name, "message");
    test.strictEqual(recordType.fields[1].typeDescriptor, "S");

    const loggerType = typeLoader.fromDescriptor("Nmill.log.Logger;");
    test.ok(loggerType instanceof type.SubType);
    test.strictEqual(loggerType.parameterTypes.length, 1);
    test.strictEqual(loggerType.parameterTypes[0], recordType);
    test.ok(loggerType.returnType instanceof type.TupleType);

    test.done();
}
