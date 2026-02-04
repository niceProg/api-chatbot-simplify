require("dotenv").config();

const createApp = require("./app");

const app = createApp();
const PORT = Number(process.env.PORT) || 5555;

const server = app.listen(PORT, "0.0.0.0", () => {
     console.log(`Server running on port ${PORT}`);
});

function shutdown(signal) {
     console.log(`Received ${signal}. Shutting down gracefully...`);
     server.close(() => process.exit(0));

     setTimeout(() => {
          console.error("Force shutdown after timeout.");
          process.exit(1);
     }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
