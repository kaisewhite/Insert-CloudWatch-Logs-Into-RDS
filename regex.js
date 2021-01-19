const item = {
  message:
    "2021-01-19 17:03:31 10.0.1.221 GET /Admin/EvaluationList - 443 akkaraju.shanthi 10.0.1.245 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+AppleWebKit/537.36+(KHTML,+like+Gecko)+Chrome/87.0.4280.141+Safari/537.36 https://gasatraq.info/Admin/EditUser/8453de4a-f248-ea11-aa3e-069dab0f73d6 200 0 0 55 96.255.239.166",
};
//const username = message.includes("LogOff")
//  ? message
//      .substr(message.indexOf("443") + 3) // splits everyting after 443
//      .substring(1) //removes first space
//      .split(" ")[0] // removes everything after the space
//  : message.includes("Create_Account")
//  ? message.substr(message.indexOf("username=") + 9).split("&")[0]
//  : "unknown";

const username =
  item.message.includes("InviteUser") ||
  item.message.includes("UserActivity") ||
  item.message.includes("EvaluationList") ||
  item.message.includes("SelfAssessmentEntry")
    ? item.message.substr(item.message.indexOf("443") + 4).split(" ")[0]
    : "unknown";
console.log(username);
