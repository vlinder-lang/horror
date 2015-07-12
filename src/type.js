export class TypeNotFoundError extends Error { }
export class TypeDescriptorError extends Error { }

export class Type {
    get descriptor() {
        throw Error("not implemented");
    }
}

export const stringType = new class extends Type {
    constructor() {
        super();
        this.prototype = { type: this };
    }

    new(value) {
        const string = Object.create(this.prototype);
        string.value = value;
        return string;
    }

    get descriptor() { return "S"; }
};

export class TupleType extends Type {
    constructor(elementTypes) {
        super();
        this.elementTypes = elementTypes;
        this.prototype = {
            type: this,
            getField: function(field) {
                return this["__" + field];
            },
            setField: function(field, value) {
                this["__" + field] = value;
            },
        };
    }

    new() {
        return Object.create(this.prototype);
    }

    get descriptor() {
        return "T" + this.elementTypes.map(t => t.descriptor).join("") + ";";
    }
}

export class SubType extends Type {
    constructor(parameterTypes, returnType) {
        super();
        this.parameterTypes = parameterTypes;
        this.returnType = returnType;
        this.prototype = { type: this };
    }

    new(name, parameterNames, localCount, body) {
        const sub = Object.create(this.prototype);
        sub.name = name;
        sub.parameterNames = parameterNames;
        sub.localCount = localCount;
        sub.body = body;
        return sub;
    }

    get descriptor() {
        return "F"
             + this.parameterTypes.map(t => t.descriptor).join("")
             + this.returnType.descriptor
             + ";";
    }
}

export class StructType extends Type {
    constructor(name, fields) {
        super();
        this.name = name;
        this.fields = fields;
        this.prototype = {
            type: this,
            getField: function(field) {
                return this["__" + field];
            },
            setField: function(field, value) {
                this["__" + field] = value;
            },
        };
    }

    new() {
        return Object.create(this.prototype);
    }

    get descriptor() { return "N" + this.name + ";" }
}

StructType.Field = class {
    constructor(name, typeDescriptor) {
        this.name = name;
        this.typeDescriptor = typeDescriptor;
    }
};

export class UnionType extends Type {
    constructor(name, constructors) {
        super();
        this.name = name;
        this.prototype = { type: this };
        this.constructors = constructors(this);
    }

    get descriptor() { return "N" + this.name + ";" }
}

export class TypeLoader {
    constructor() {
        this._namedTypes = Object.create(null);
    }

    registerNamedType(name, type) {
        if (name in this._namedTypes) {
            throw Error("type already registered");
        }
        this._namedTypes[name] = type;
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

            case "F": {
                const types = [];
                let remaining = descriptor.slice(1);
                while (remaining[0] !== ";") {
                    let type;
                    [type, remaining] = this._fromDescriptor(remaining);
                    types.push(type);
                }
                if (types.length < 1) {
                    throw new TypeDescriptorError();
                }
                const parameterTypes = types.slice(0, types.length - 1);
                const returnType = types[types.length - 1];
                const type = new SubType(parameterTypes, returnType);
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
