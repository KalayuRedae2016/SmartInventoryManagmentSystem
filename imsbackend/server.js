const https = require("https");
const http = require("http");

const dotenv = require("dotenv");
const app = require("./index");

const { connectDB, sequelize } = require("./config/db");

const swaggerSetup = require('./swagger');
swaggerSetup(app);

//const { createDefaultAdminUser } = require("./utils/userUtils"); // Import the function

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

connectDB();

const initializeServer = async () => {
  try {
    console.log("Initializing server...");
    // Ensure the default admin user is created before starting the server
    // await createDefaultAdminUser();
    // console.log("Default admin user created successfully");

    const PORT = process.env.PORT || 8085;
    const SSL = process.env.SSL
    if (SSL === "true") {
       https.createServer(app).listen(() => {
        console.log(`HTTPS Server is running on https://localhost:${PORT}`);
      });

    } else {
      
      http.createServer(app).listen(PORT, "127.0.0.1", () => {
        console.log(`HTTP Server is running on http://localhost:${PORT}`);
        //console.log("Format Date Utility Loaded:", formatDate);
      }).on("error", (err) => {
        console.log("Error starting HTTP server:", err);
      });

    }

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.log(`Error: ${err.message}`);
      console.log("Shutting down the server due to Unhandled Promise Rejection");
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.log(`Error: ${err.message}`);
      console.log("Shutting down the server due to Uncaught Exception");
      process.exit(1);
    });
  } catch (err) {
    console.error("Error initializing the server:", err);
    process.exit(1);
  }
};

// Start the initialization process
initializeServer();

