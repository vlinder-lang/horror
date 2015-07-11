import * as jsYAML from "js-yaml";
import * as type from "./type";

export class ModuleLoader {
    constructor(fetcher, typeLoader) {
        this._fetcher = fetcher;
        this._typeLoader = typeLoader;
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
        for (let yamlImport of yaml.imports) {
            this.loadModule(yamlImport);
        }
        for (let yamlStruct of yaml.structs) {
            const fields = yamlStruct.fields.map(yamlField => {
                return new type.StructType.Field(yamlField.name, yamlField.type);
            });
            const struct = new type.StructType(name + "." + yamlStruct.name, fields);
            this._typeLoader.registerNamedType(struct.name, struct);
        }
        for (let yamlUnion of yaml.unions) {
            const constructors = yamlUnion.constructors.map(yamlConstructor => {
                const parameters = yamlConstructor.parameters.map(yamlParameter => {
                    return new type.UnionType.Constructor.Parameter(yamlParameter.name, yamlParameter.type);
                });
                return new type.UnionType.Constructor(yamlConstructor.name, parameters);
            });
            const union = new type.UnionType(name + "." + yamlUnion.name, constructors);
            this._typeLoader.registerNamedType(union.name, union);
        }
        for (let yamlAlias of yaml.aliases) {
            const type = this._typeLoader.fromDescriptor(yamlAlias.type);
            this._typeLoader.registerNamedType(name + "." + yamlAlias.name, type);
        }
    }
}
