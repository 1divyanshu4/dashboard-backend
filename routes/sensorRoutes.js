const express = require("express");
const SensorData = require("../models/sensorData");

const router = express.Router();

// POST - Store sensor data
router.post("/data", async (req, res) => {
  try {
    const { nodeId, temperature, humidity, co2 } = req.body;
    const newEntry = new SensorData({ nodeId, temperature, humidity, co2 });
    await newEntry.save();
    res.status(201).json({ message: "Data saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Fetch sensor data
router.get("/data", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(50);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Fetch sensor data for a specific date
router.get("/data", async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: start, $lte: end };
    }

    const data = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET sensor data for a specific node
router.get("/sensor-data/:nodeId", async (req, res) => {
  try {
    const { nodeId } = req.params;
    const data = await SensorData.find({ nodeId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
