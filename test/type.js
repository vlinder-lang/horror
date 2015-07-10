import * as type from "../src/type";

export function testTypeLoaderFromDescriptor(test) {
    const typeLoader = new type.TypeLoader();

    class Record extends type.Structure { }
    Record.fields = [];
    typeLoader.registerStructure("mill.log.Record", Record);

    {
        const intType = typeLoader.fromDescriptor("I");
        test.strictEqual(intType, type.Int);
    }

    {
        const stringType = typeLoader.fromDescriptor("S");
        test.strictEqual(stringType, String);
    }

    {
        const unitType = typeLoader.fromDescriptor("T;");
        test.ok(unitType.prototype instanceof type.Tuple);
        test.strictEqual(unitType.elementTypes.length, 0);
    }

    {
        const tupleType = typeLoader.fromDescriptor("TIS;");
        test.ok(tupleType.prototype instanceof type.Tuple);
        test.strictEqual(tupleType.elementTypes.length, 2);
        test.strictEqual(tupleType.elementTypes[0], type.Int);
        test.strictEqual(tupleType.elementTypes[1], String);
    }

    {
        const namedType = typeLoader.fromDescriptor("Nmill.log.Record;");
        test.strictEqual(namedType, Record);
    }

    test.done();
}