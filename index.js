"use strict";
const config = require("config");
const BootBot = require("bootbot");
const fetch = require("node-fetch");
const fs = require("fs");
const _ = require("lodash");
const results = require("./results.json");

const bot = new BootBot({
  accessToken: config.get("access_token"),
  verifyToken: config.get("verify_token"),
  appSecret: config.get("app_secret")
});

bot.setGetStartedButton(async (payload, chat) => welcome(payload, chat));
const disableInput = false;
bot.setPersistentMenu(
  [
    {
      title: "Nhận tin thời tiết",
      type: "postback",
      payload: "REGISTER_WEATHER"
    },
    {
      title: "Đổi thành phố",
      type: "postback",
      payload: "CHANGE_CITY"
    },
    {
      title: "Đi đến Blog của mình",
      type: "web_url",
      url: "https://htknguyen.com"
    }
  ],
  disableInput
);
bot.deletePersistentMenu();

const welcome = async (payload, chat) => {
  const user = await chat.getUserProfile();
  chat.conversation(convo => {
    convo.sendTypingIndicator(1000);
    convo.ask(
      convo => {
        const buttons = [
          {
            type: "postback",
            title: "Nhận tin thời tiết",
            payload: "REGISTER_WEATHER"
          },
          {
            type: "web_url",
            title: "Đi đến Blog của mình",
            url: "https://htknguyen.com"
          }
        ];
        convo.sendButtonTemplate(
          `Xin chào ${user.first_name}, mình có thể giúp được gì cho bạn?`,
          buttons
        );
      },
      (payload, convo, data) => {
        convo.say(`Bạn vui lòng chọn 1 trong 2 option trên giúp mình với nhé.`);
      },
      [
        {
          event: "postback:REGISTER_WEATHER",
          callback: (payload, convo) => {
            askCity(convo);
          }
        }
      ]
    );
  });
};

const askCity = convo => {
  convo.ask(
    `Bạn vui lòng cho mình biết thành phố mà bạn đang sống không?`,
    (payload, convo, data) => {
      const city = payload.message.text;
      checkCity(convo, city);
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

const askAgain = (convo, city) => {
  convo.ask(
    `Hmmm, có vẻ như thành phố ${city} không được tìm thấy. Bạn vui lòng nhập lại giúp mình với :(`,
    (payload, convo, data) => {
      const city = payload.message.text;
      checkCity(convo, city);
    }
  );
};

const confirmation = async (convo, city) => {
  const user = await convo.getUserProfile();
  convo.ask(
    convo => {
      const buttons = [
        { type: "postback", title: "Chắc", payload: "YES_CONFIRM" },
        { type: "postback", title: "Không", payload: "NO_CONFIRM" },
        { type: "postback", title: "Đổi thành phố", payload: "CHANGE_CONFIRM" }
      ];
      convo.sendButtonTemplate(
        `Bạn có chắc chắn bạn muốn nhận thông báo về thời tiết tại thành phố ${city} không ${
          user.first_name
        } ?`,
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
          putData(convo, user, city);
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
      },
      {
        event: "postback:CHANGE_CONFIRM",
        callback: (payload, convo) => {
          changeCity(convo);
        }
      }
    ]
  );
};

const changeCity = convo => {
  convo.ask(`Bạn muốn đổi qua thành phố nào nhỉ?`, (payload, convo, data) => {
    const city = payload.message.text;
    checkCity(convo, city);
  });
};

const putData = (convo, user, city) => {
  let userData = user;
  userData.city = city;
  // Neu chua co -> INsert new
  // Neu id tim thay -> Hoi co muon doi hay khong ?
  // Kiem tra tiep neu city khac voi city trong db ->
  // Co -> change() -> check() -> confirm() ->
  // Khong
};

const existsInfo = (convo, user, city) => {
  convo.ask(
    convo => {
      const buttons = [
        { type: "postback", title: "Có", payload: "YES_CONFIRM" },
        { type: "postback", title: "Không", payload: "NO_CONFIRM" }
      ];
      convo.sendButtonTemplate(
        `${
          user.first_name
        } ơi, bạn đã đăng ký thành phố ${city} trong hệ thống tụi mình rồi. Bạn có muốn đổi thành phố khác không?`,
        buttons
      );
    },
    (payload, convo, data) => {
      convo.say(`Bạn vui lòng chọn "Có" hoặc "Không" giúp mình với <3`);
    },
    [
      {
        event: "postback:YES_CONFIRM",
        callback: (payload, convo) => {
          changeCity(convo);
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

bot.start();
