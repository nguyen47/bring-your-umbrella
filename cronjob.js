const cron = require("node-cron");
const BootBot = require("bootbot");
const fetch = require("node-fetch");
const results = require("./results.json");
const config = require("config");

const bot = new BootBot({
  accessToken: config.get("access_token"),
  verifyToken: config.get("verify_token"),
  appSecret: config.get("app_secret")
});

const task = cron.schedule("*/1 * * * *", () => {
  sendInfo();
});

task.start();

const sendInfo = async () => {
  for (let i = 0; i < results.length; i++) {
    try {
      const endPointApi = `http://api.openweathermap.org/data/2.5/weather?q=${
        results[i].city
      }&appid=db27809de69a86160df6211ffbe0a57e&type=like&units=metric`;
      const response = await fetch(encodeURI(endPointApi));
      const result = await response.json();
      bot.say(
        results[i].id,
        `Chào ${results[i].first_name}, nhiệt độ hôm nay ở thành phố ${
          results[i].city
        } là ${result.main.temp} độ C`
      );
      sleep(4 * 1000); // Sleep 4 giây vì limit 20 call/phút
    } catch (error) {
      console.log(error);
    }
  }
};

function sleep(time) {
  console.log("Begin Sleep");
  var stop = new Date().getTime();
  while (new Date().getTime() < stop + time) {}
  console.log("End Sleep");
}
