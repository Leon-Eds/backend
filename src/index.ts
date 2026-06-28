import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

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
import announcementRoutes from "./routes/announcement.routes";
import teacherPortalRoutes from "./routes/teacher-portal.routes";
import attendanceRoutes from "./routes/attendance.routes";
import paymentPlanRoutes from "./routes/paymentPlan.routes";
import paymentRoutes from "./routes/payment.routes";
import subscriptionLogRoutes from "./routes/subscriptionLog.routes";

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
  apis: [
    path.join(__dirname, "routes", "*.ts").replace(/\\/g, "/"),
    path.join(__dirname, "routes", "*.js").replace(/\\/g, "/"),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve the raw OpenAPI spec JSON
app.get("/api-docs/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Serve Swagger UI page using CDN assets (completely resolves Vercel serverless asset issues)
const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LeonEd Africa Backend API Docs</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api-docs/json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
`;

app.get("/swagger", (req, res) => {
  res.send(swaggerHtml);
});
app.get("/api-docs", (req, res) => {
  res.send(swaggerHtml);
});

// Base status check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});
app.get("/api/health", (req, res) => {
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
app.use("/api/announcement", announcementRoutes);
app.use("/api/teacher-portal", teacherPortalRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payment-plans", paymentPlanRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/subscription-logs", subscriptionLogRoutes);

// Error Handling Middleware (Must be registered last)
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/swagger`);
});

export default app;
