"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
                return res.status(400).json((0, response_1.failResponse)("Validation failed", errors));
            }
            next(error);
        }
    };
}
