export class TypeNotFoundError extends Error { }
export class TypeDescriptorError extends Error { }

export class Type { }

export const stringType = new class extends Type {
    constructor() {
        super();
        this.prototype = { type: this };
    }
};

export class TupleType extends Type {
    constructor(elementTypes) {
        super();
        this.elementTypes = elementTypes;
        this.prototype = { type: this };
    }
}

export class StructureType extends Type {
    constructor(fields) {
        super();
        this.fields = fields;
        this.prototype = { type: this };
    }
}

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
            case "S": return [stringType, descriptor.slice(1)];

            case "T": {
                const elementTypes = [];
                let remaining = descriptor.slice(1);
                while (remaining[0] !== ";") {
                    let elementType;
                    [elementType, remaining] = this._fromDescriptor(remaining);
                    elementTypes.push(elementType);
                }
                const type = new TupleType(elementTypes);
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
