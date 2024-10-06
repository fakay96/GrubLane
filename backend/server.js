const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors"); 
const https = require("https");
const fs = require("fs");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const sslOptions = {
  key: fs.readFileSync("/etc/ssl/private/private.key"),
  cert: fs.readFileSync("/etc/ssl/certs/certificate.crt"),
};

app.use(bodyParser.json());
app.use(cors());

const initializeDatabase = require("./initializeDatabase");
const userRoutes = require("./routes/users");
const orderRoutes = require("./routes/orders");
const reservationRoutes = require("./routes/reservations");
const menuRoutes = require('./routes/menu');
const dishRoutes = require('./routes/dish');
const paymentsRoutes=require('./routes/payments')
const adminRoutes=require("./routes/admin")

initializeDatabase();

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "API Documentation",
      description: "API Information",
      version: "1.0.0",
      contact: {
        name: "API Support",
      },
      servers: ["https://0.0.0.0:3000"], 
    },
  },
  apis: ["./routes/users.js", "./routes/orders.js", "./routes/reservations.js", "./routes/dish.js", "./routes/menu.js","./routes/payments.js","./routes/admin.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/users", userRoutes);
app.use("/orders", orderRoutes);
app.use("/reservations", reservationRoutes);
app.use('/menu', menuRoutes);
app.use('/dish', dishRoutes);
app.use("/payments",paymentsRoutes);
app.use("/admin",adminRoutes);
https.createServer(sslOptions, app).listen(port, () => {
  console.log(`HTTPS Server is running on https://0.0.0.0:${port}`);
});
