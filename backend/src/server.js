const axios = require("axios");
const cors = require("cors");
const express = require("express");
const logger = require("morgan");

const API_PORT = 3000;
const app = express();
const router = express.Router();

app.use(cors());
app.use(logger("dev"));

const API = axios.create({
  baseURL: "http://api.openweathermap.org/data/2.5/",
  timeout: 10000
});

router.get("/getPacking/:city", cors(), async (req, res) => {
  const city = req.params.city;
  if (!city) {
    return res.sendStatus(404);
  }

  const result = await API.get("forecast", {
    params: {
      units: "metric",
      q: city,
      APPID: "3e2d927d4f28b456c6bc662f34350957"
    }
  });

  if (!result || !result.data) {
    return res.sendStatus(404);
  }

  const packing = {
    rain: false,
    cold: false,
    warm: false,
    hot: false
  };

  for (const day of result.data.list) {
    if (day.weather[0].main === "Rain") {
      packing.rain = true;
    }

    if (day.main.temp_min < 10) {
      packing.cold = true;
    }

    if (day.main.temp_max > 20) {
      packing.hot = true;
    }

    if (day.main.temp_max < 20 && day.main.temp_min > 10) {
      packing.warm = true;
    }
  }

  return res.json(packing);
});

router.get("/getSummary/:city", cors(), async (req, res) => {
  const city = req.params.city;
  if (!city) {
    return res.sendStatus(404);
  }

  const result = await API.get("forecast", {
    params: {
      units: "metric",
      q: city,
      APPID: "3e2d927d4f28b456c6bc662f34350957"
    }
  });

  if (!result || !result.data) {
    return res.sendStatus(404);
  }

  const summary = [];
  let dayCount = -1;
  let currentDate = undefined;

  for (const day of result.data.list) {
    let date = new Date(day.dt * 1000).toLocaleDateString();
    let hour = new Date(day.dt * 1000).getUTCHours();

    if (date !== currentDate) {
      currentDate = date;
      dayCount++;
    }

    if (!summary[dayCount]) {
      summary[dayCount] = { date: currentDate };
    }

    if (!summary[dayCount]["hours"]) {
      summary[dayCount]["hours"] = [
        {
          hour,
          temperature: day.main.temp,
          wind: day.wind,
          rain: day.rain && day.rain["3h"] ? day.rain["3h"] : 0
        }
      ];
    } else {
      summary[dayCount]["hours"].push({
        hour,
        temperature: day.main.temp,
        wind: day.wind,
        rain: day.rain && day.rain["3h"] ? day.rain["3h"] : 0
      });
    }
  }

  return res.json(summary);
});

app.use("/", router);
app.disable("etag");

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}/`));
