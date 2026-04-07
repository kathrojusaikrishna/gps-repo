const express = require("express");
const axios = require("axios");
const client = require("prom-client");

const app = express();
app.use(express.json());

// collect default system metrics (CPU, memory, etc.)
client.collectDefaultMetrics();

// custom metric: count API requests
const requestCounter = new client.Counter({
  name: "gps_requests_total",
  help: "Total number of GPS API requests",
});

app.post("/get-gps", async (req, res) => {
  requestCounter.inc(); // track request

  const { place } = req.body;

  if (!place) {
    return res.status(400).send("Place is required");
  }

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "gps-microservice (student-project)",
        },
      },
    );

    if (response.data.length === 0) {
      return res.status(404).send("Location not found");
    }

    const location = response.data[0];

    res.json({
      place,
      latitude: location.lat,
      longitude: location.lon,
      display_name: location.display_name,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error fetching GPS");
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(3000, () => {
  console.log("GPS Microservice running on port 3000");
});
