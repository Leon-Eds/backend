import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

// Import Middlewares
import { errorMiddleware } from "./middlewares/error.middleware";

// Import Routes
import authRoutes from "./routes/auth.routes";
import schoolRoutes from "./routes/school.routes";
import studentRoutes from "./routes/student.routes";
import teacherRoutes from "./routes/teacher.routes";
import classRoutes from "./routes/class.routes";
import subjectRoutes from "./routes/subject.routes";
import sessionRoutes from "./routes/session.routes";
import gradingRoutes from "./routes/grading.routes";
import scoreRoutes from "./routes/score.routes";
import resultRoutes from "./routes/result.routes";
import feeRoutes from "./routes/fee.routes";
import reportCardRoutes from "./routes/report-card.routes";
import dashboardRoutes from "./routes/dashboard.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Base Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base status check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Register Api Routes
app.use("/api/auth", authRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/class", classRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/academicsession", sessionRoutes);
app.use("/api/grading", gradingRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/fee", feeRoutes);
app.use("/api/reportcard", reportCardRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error Handling Middleware (Must be registered last)
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/swagger`);
});

export default app;
