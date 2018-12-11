const config = require("config");
const BootBot = require("bootbot");

const bot = new BootBot({
  accessToken: config.get("access_token"),
  verifyToken: config.get("verify_token"),
  appSecret: config.get("app_secret")
});

// Xin chao, minh co the giup duoc gi cho ban ? ['Nhan tin ve thoi tiet', 'Deo co gi dau']

// Nhan tin ve thoi tiet ['Vui Long cho minh biet ve thanh pho cua ban - Ban song o dau ?']

//
