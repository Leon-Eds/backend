import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { NotificationService } from "./services/notification.service";
import { validateRuntimeConfiguration } from "./config/env";
import { resolveAuthenticatedUser } from "./middlewares/auth.middleware";

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
import bursarRoutes from "./routes/bursar.routes";
import promotionRoutes from "./routes/promotion.routes";
import reportRoutes from "./routes/report.routes";
import schemeOfWorkRoutes from "./routes/scheme-of-work.routes";

validateRuntimeConfiguration();

const app = express();
const PORT = process.env.PORT || 5000;

// Base Middlewares
app.use(cors());
app.use(express.json({
  verify: (req, _res, buffer) => {
    const expressRequest = req as express.Request;
    if (expressRequest.originalUrl.startsWith("/api/payment/webhook")) {
      expressRequest.rawBody = Buffer.from(buffer);
    }
  },
}));
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
    path.join(process.cwd(), "src/routes", "*.ts").replace(/\\/g, "/"),
    path.join(process.cwd(), "dist/routes", "*.js").replace(/\\/g, "/"),
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
app.use("/api/admin/attendance", attendanceRoutes);
app.use("/admin/attendance", attendanceRoutes);
app.use("/api/payment-plans", paymentPlanRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/subscription-logs", subscriptionLogRoutes);
app.use("/api/bursar", bursarRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/scheme-of-work", schemeOfWorkRoutes);

// Error Handling Middleware (Must be registered last)
app.use(errorMiddleware);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.use(async (socket, next) => {
  try {
    const authorization = socket.handshake.headers.authorization;
    const suppliedToken = socket.handshake.auth?.token;
    const token = typeof suppliedToken === "string"
      ? suppliedToken.replace(/^Bearer\s+/i, "")
      : typeof authorization === "string"
        ? authorization.replace(/^Bearer\s+/i, "")
        : "";

    if (!token) return next(new Error("Authentication token is missing."));
    socket.data.user = await resolveAuthenticatedUser(token);
    return next();
  } catch {
    return next(new Error("Invalid or expired authentication token."));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  const user = socket.data.user;
  socket.join(`user:${user.id}`);
  if (user.schoolId) socket.join(`school:${user.schoolId}`);

  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

NotificationService.init(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/swagger`);
});

export default app;
