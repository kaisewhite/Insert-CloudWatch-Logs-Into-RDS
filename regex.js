const message =
  "2021-01-14 20:49:52 10.0.1.221 GET /Account/VerifyCode Email=shanthi.akkaraju%40jacobs.com 443 - 10.0.3.8 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+AppleWebKit/537.36+(KHTML,+like+Gecko)+Chrome/87.0.4280.141+Safari/537.36 https://gasatraq.info/Account/Login 200 0 0 9 96.255.239.166";

const regString = "433";
//const username = message.includes("LogOff")
//  ? message
//      .substr(message.indexOf("443") + 3) // splits everyting after 443
//      .substring(1) //removes first space
//      .split(" ")[0] // removes everything after the space
//  : message.includes("Create_Account")
//  ? message.substr(message.indexOf("username=") + 9).split("&")[0]
//  : "unknown";

const username = message.includes("VerifyCode") ? message.substr(message.indexOf("Email=") + 6).split("%")[0] : "unknown";
console.log(username);
