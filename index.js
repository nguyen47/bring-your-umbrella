"use strict";
const config = require("config");
const BootBot = require("bootbot");
const fetch = require("node-fetch");
const fs = require("fs");
const results = require("./results.json");

const bot = new BootBot({
  accessToken: config.get("access_token"),
  verifyToken: config.get("verify_token"),
  appSecret: config.get("app_secret")
});

bot.setGetStartedButton(async (payload, chat) => {
  const user = await chat.getUserProfile();
  chat.say(
    `Xin chào ${
      user.first_name
    }! Chào mừng bạn đến với con "Bring Your Umbrella" !!`
  );
  chat.conversation(convo => {
    convo.sendTypingIndicator(1000).then(() => askCity(convo));
  });
});

const askCity = convo => {
  convo.ask(
    `Bạn vui lòng cho mình biết thành phố mà bạn đang sống không?`,
    (payload, convo, data) => {
      const city = payload.message.text;
      convo
        .say(`Bạn nói đang ở ${city} à? Bạn đợi mình một chút nhé ...`)
        .then(() => checkCity(convo, city));
    }
  );
};

const checkCity = async (convo, city) => {
  const endPointApi = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=db27809de69a86160df6211ffbe0a57e&type=like`;
  const response = await fetch(encodeURI(endPointApi));
  const result = await response.json();
  if (result.cod == 404) {
    askAgain(convo, city);
  } else {
    confirmation(convo, city);
  }
};

const confirmation = async (convo, city) => {
  const user = await convo.getUserProfile();
  convo.ask(
    convo => {
      const buttons = [
        { type: "postback", title: "Chắc", payload: "YES_CONFIRM" },
        { type: "postback", title: "Không", payload: "NO_CONFIRM" }
      ];
      convo.sendButtonTemplate(
        `Bạn có chắc chắn bạn muốn nhận thông báo về thời tiết tại ${city} không ?`,
        buttons
      );
    },
    (payload, convo, data) => {
      convo.say(`Bạn vui lòng chọn "Chắc" hoặc "Không" giúp mình với <3`);
    },
    [
      {
        event: "postback:YES_CONFIRM",
        callback: (payload, convo) => {
          convo
            .say("Cảm ơn bạn đã tin tưởng.")
            .then(() => putData(convo, user, city));
        }
      },
      {
        event: "postback:NO_CONFIRM",
        callback: (payload, convo) => {
          convo.say(
            "Bạn không muốn nhận tin tức về thời tiết của mình sao T_T"
          );
          convo.end();
        }
      }
    ]
  );
};

const askAgain = (convo, city) => {
  convo.ask(
    `Hmmm, có vẻ như ${city} không được tìm thấy. Bạn vui lòng nhập lại giúp mình với :()`,
    (payload, convo, data) => {
      const city = payload.message.text;
      convo
        .say(`Bạn vừa nói lại bạn đang sống ở ${city}. Chờ mình chút nha <3`)
        .then(() => checkCity(convo, city));
    }
  );
};

const putData = (convo, user, city) => {
  let userData = user;
  userData.city = city;
  if (results.filter(e => e.id === userData.id).length > 0) {
    convo.say(
      `${user.first_name} ơi, bạn đã có trong danh sách nhận tin tức rồi nhé.`
    );
    convo.end();
  } else {
    convo.say("Bây giờ mình sẽ gửi thông tin cho bạn mỗi sáng nha <3");
    results.push(userData);
    fs.writeFile("results.json", JSON.stringify(results), function(err) {
      if (err) throw err;
    });
    convo.end();
  }
};

bot.start();
