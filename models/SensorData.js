const mongoose = require("mongoose");

const SensorDataSchema = new mongoose.Schema({
  nodeId: String, // ESP32 Node ID
  temperature: Number,
  humidity: Number,
  co2: Number,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SensorData", SensorDataSchema);
