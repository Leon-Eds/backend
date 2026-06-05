"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
// Import Middlewares
const error_middleware_1 = require("./middlewares/error.middleware");
// Import Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const school_routes_1 = __importDefault(require("./routes/school.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const grading_routes_1 = __importDefault(require("./routes/grading.routes"));
const score_routes_1 = __importDefault(require("./routes/score.routes"));
const result_routes_1 = __importDefault(require("./routes/result.routes"));
const fee_routes_1 = __importDefault(require("./routes/fee.routes"));
const report_card_routes_1 = __importDefault(require("./routes/report-card.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Base Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Swagger Setup
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "LeonEd Africa Backend API",
            version: "1.0.0",
            description: "Node.js Express Rewrite of ASP.NET Core Backend",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.ts"],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/swagger", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Base status check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date() });
});
// Register Api Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/school", school_routes_1.default);
app.use("/api/student", student_routes_1.default);
app.use("/api/teacher", teacher_routes_1.default);
app.use("/api/class", class_routes_1.default);
app.use("/api/subject", subject_routes_1.default);
app.use("/api/academicsession", session_routes_1.default);
app.use("/api/grading", grading_routes_1.default);
app.use("/api/score", score_routes_1.default);
app.use("/api/result", result_routes_1.default);
app.use("/api/fee", fee_routes_1.default);
app.use("/api/reportcard", report_card_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
// Error Handling Middleware (Must be registered last)
app.use(error_middleware_1.errorMiddleware);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/swagger`);
});
exports.default = app;
