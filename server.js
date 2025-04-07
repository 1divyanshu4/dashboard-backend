require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(express.json());
app.use(cors());

// Import Routes
const sensorRoutes = require("./routes/sensorRoutes");
const SensorData = require("./models/SensorData");

// Use Routes
app.use("/api", sensorRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// MongoDB Change Stream - broadcast latest data
const changeStream = SensorData.watch();
changeStream.on("change", async () => {
  const latestData = await SensorData.find().sort({ timestamp: -1 }).limit(20);
  io.emit("sensorDataUpdate", latestData);
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("Client connected");

  // Send latest 20 entries on connection
  SensorData.find()
    .sort({ timestamp: -1 })
    .limit(20)
    .then((latestData) => {
      socket.emit("sensorDataUpdate", latestData);
    });

  // NEW: Allow client to request data for a specific date
  socket.on("getDataByDate", async ({ date, nodeId }) => {
    try {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const query = {
        timestamp: { $gte: start, $lte: end },
      };

      if (nodeId) {
        query.nodeId = nodeId;
      }

      const filteredData = await SensorData.find(query).sort({ timestamp: 1 });

      socket.emit("sensorDataByDate", filteredData);
    } catch (error) {
      console.error("Error fetching data by date & node:", error);
      socket.emit("sensorDataByDate", { error: "Error fetching data" });
    }
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
