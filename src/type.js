export class TypeNotFoundError extends Error { }
export class TypeDescriptorError extends Error { }

export class Int {
    constructor(value) {
        this.value = value;
    }
}

export class Tuple { }

export class Structure { }

export class TypeLoader {
    constructor() {
        this._namedTypes = Object.create(null);
    }

    registerStructure(name, structure) {
        this._namedTypes[name] = structure;
    }

    fromDescriptor(descriptor) {
        const [type, remaining] = this._fromDescriptor(descriptor);
        if (remaining !== "") {
            throw new TypeDescriptorError();
        }
        return type;
    }

    _fromDescriptor(descriptor) {
        switch (descriptor[0]) {
            case "I": return [Int, descriptor.slice(1)];
            case "S": return [String, descriptor.slice(1)];

            case "T": {
                const type = class extends Tuple { };
                type.elementTypes = [];
                let remaining = descriptor.slice(1);
                while (remaining[0] !== ";") {
                    let elementType;
                    [elementType, remaining] = this._fromDescriptor(remaining);
                    type.elementTypes.push(elementType);
                }
                return [type, remaining.slice(1)];
            }

            case "N": {
                const semicolonIndex = descriptor.indexOf(";");
                const name = descriptor.slice(1, semicolonIndex);
                if (!(name in this._namedTypes)) {
                    throw new TypeNotFoundError();
                }
                const type = this._namedTypes[name];
                return [type, descriptor.slice(semicolonIndex + 1)];
            }
        }
        throw new TypeDescriptorError();
    }
}
