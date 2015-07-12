import * as jsYAML from "js-yaml";
import * as type from "./type";

export class GlobalMap {
    constructor() {
        this._globals = Object.create(null);
    }

    registerGlobal(name, value) {
        if (name in this._globals) {
            throw Error("global already registered");
        }
        this._globals[name] = value;
    }

    givenName(name) {
        if (!(name in this._globals)) {
            throw Error("no such global");
        }
        return this._globals[name];
    }
}

export class ModuleLoader {
    constructor(fetcher, globalMap, typeLoader) {
        this._fetcher = fetcher;
        this._typeLoader = typeLoader;
        this._globalMap = globalMap;
        this._loadedModuleNames = Object.create(null);
    }

    loadModule(name) {
        if (!(name in this._loadedModuleNames)) {
            const yamlSource = this._fetcher(name);
            this._loadModuleFromYAML(name, yamlSource);
            this._loadedModuleNames[name] = true;
        }
    }

    _loadModuleFromYAML(name, yamlSource) {
        const yaml = jsYAML.safeLoad(yamlSource);
        if (yaml.name !== name) {
            throw Error("bad module name");
        }
        for (let phase of ["imports", "structs", "unions", "aliases", "subs"]) {
            this["_load" + phase[0].toUpperCase() + phase.slice(1) + "FromYAML"](name, yaml);
        }
    }

    _loadImportsFromYAML(name, yaml) {
        for (let yamlImport of yaml.imports) {
            this.loadModule(yamlImport);
        }
    }

    _loadStructsFromYAML(name, yaml) {
        for (let yamlStruct of yaml.structs) {
            const fields = yamlStruct.fields.map(yamlField => {
                return new type.StructType.Field(yamlField.name, yamlField.type);
            });
            const struct = new type.StructType(name + "." + yamlStruct.name, fields);
            this._typeLoader.registerNamedType(struct.name, struct);
        }
    }

    _loadUnionsFromYAML(name, yaml) {
        for (let yamlUnion of yaml.unions) {
            const constructors = self => {
                const result = Object.create(null);
                for (let yamlConstructor of yamlUnion.constructors) {
                    const constructor = Object.create(self.prototype);
                    constructor.name = yamlConstructor.name;
                    result[yamlConstructor.name] = constructor;
                }
                return result;
            };
            const union = new type.UnionType(name + "." + yamlUnion.name, constructors);
            this._typeLoader.registerNamedType(union.name, union);
        }
    }

    _loadAliasesFromYAML(name, yaml) {
        for (let yamlAlias of yaml.aliases) {
            const type = this._typeLoader.fromDescriptor(yamlAlias.type);
            this._typeLoader.registerNamedType(name + "." + yamlAlias.name, type);
        }
    }

    _loadSubsFromYAML(name, yaml) {
        for (let yamlSub of yaml.subs) {
            let subTypeDescriptor = "F";
            for (let yamlParameter of yamlSub.parameters) {
                subTypeDescriptor += yamlParameter.type;
            }
            subTypeDescriptor += yamlSub.returnType;
            subTypeDescriptor += ";";
            const subType = this._typeLoader.fromDescriptor(subTypeDescriptor);

            const sub = Object.create(subType.prototype);
            sub.name = name + "." + yamlSub.name;
            sub.parameterNames = yamlSub.parameters.map(p => p.name);
            sub.localCount = yamlSub.localCount;
            sub.body = yamlSub.body;
            this._globalMap.registerGlobal(sub.name, sub);
        }
    }
}
