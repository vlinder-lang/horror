import * as type from "../src/type";

export function testTypeLoaderFromDescriptor(test) {
    const typeLoader = new type.TypeLoader();

    const recordType = new type.StructType("mill.log.Record", []);
    typeLoader.registerNamedType(recordType);

    {
        const stringType = typeLoader.fromDescriptor("S");
        test.strictEqual(stringType, type.stringType);
    }

    {
        const unitType = typeLoader.fromDescriptor("T;");
        test.ok(unitType instanceof type.TupleType);
        test.strictEqual(unitType.elementTypes.length, 0);
    }

    {
        const tupleType = typeLoader.fromDescriptor("TST;;");
        test.ok(tupleType instanceof type.TupleType);
        test.strictEqual(tupleType.elementTypes.length, 2);
        test.strictEqual(tupleType.elementTypes[0], type.stringType);
        test.ok(tupleType.elementTypes[1] instanceof type.TupleType);
        test.strictEqual(tupleType.elementTypes[1].elementTypes.length, 0);
    }

    {
        const namedType = typeLoader.fromDescriptor("Nmill.log.Record;");
        test.strictEqual(namedType, recordType);
    }

    test.done();
}
