const Ajv = require("ajv");
const draft4Schema = require("./draft-04.json");

const fixedSchemas = new WeakMap();

function fixSchema(schema) {
    if (!schema || typeof schema !== "object") {
        return schema;
    }

    if (fixedSchemas.has(schema)) {
        return fixedSchemas.get(schema);
    }

    if (Array.isArray(schema)) {
        const fixedArray = [];
        fixedSchemas.set(schema, fixedArray);
        for (const item of schema) {
            fixedArray.push(fixSchema(item));
        }
        return fixedArray;
    }

    const fixed = { ...schema };

    if (typeof fixed.id === 'string' && !fixed.$id) {
        fixed.$id = fixed.id;
        delete fixed.id;
    }

    fixedSchemas.set(schema, fixed);

    for (const key in fixed) {
        if (Object.prototype.hasOwnProperty.call(fixed, key)) {
            fixed[key] = fixSchema(fixed[key]);
        }
    }

    return fixed;
}

class AjvShim extends Ajv {
    constructor(opts = {}) {
        const sanitizedOpts = { 
            ...opts,
            strict: false,
            logger: false,
            validateSchema: false
        };

        delete sanitizedOpts.missingRefs;
        delete sanitizedOpts.strictDefaults;

        super(sanitizedOpts);

        try {
            super.addMetaSchema(fixSchema(draft4Schema));
        } catch (e) {}

        this._opts = this.opts;
    }

    addSchema(schema, key) {
        try {
            return super.addSchema(fixSchema(schema), key);
        } catch (e) {
            if (e.message.includes("already exists")) return this;
            throw e;
        }
    }

    addMetaSchema(schema, key) {
        try {
            return super.addMetaSchema(fixSchema(schema), key);
        } catch (e) {
            if (e.message.includes("already exists")) return this;
            throw e;
        }
    }

    compile(schema) {
        return super.compile(fixSchema(schema));
    }

    validate(schema, data) {
        return super.validate(fixSchema(schema), data);
    }

    validateSchema(schema) {
        return super.validateSchema(fixSchema(schema));
    }
}

module.exports = AjvShim;
module.exports.default = AjvShim;
module.exports.Ajv = AjvShim;