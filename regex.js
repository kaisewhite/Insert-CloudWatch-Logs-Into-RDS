const methodPattern = /\b(?:GET|PUT|POST)\b/gi;
const IPAddressPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const URLPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
const datePattern = /\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])*/;
const timePattern = /(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)/;

const message =
  "2020-12-08 15:21:49 10.0.1.221 GET /Account/Login - 8443 - 10.0.3.105 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+AppleWebKit/537.36+(KHTML,+like+Gecko)+Chrome/64.0.3282.140+Safari/537.36+Edge/18.17763 https://www.gasatraq.net/ 200 0 0 8 63.146.9.249";
const message2 =
  "2020-12-21 23:13:44 10.0.1.221 POST /Account/LoginConfirmationPost - 8443 - 10.0.3.105 Mozilla/5.0+(Windows+NT+10.0;+Win64;+x64)+AppleWebKit/537.36+(KHTML,+like+Gecko)+Chrome/87.0.4280.88+Safari/537.36+Edg/87.0.664.57 https://www.gasatraq.net/Account/LoginConfirmation 302 0 0 29 76.104.57.213@timestamp	1608592457922";
const message3 =
  "2021-01-07 19:12:07 10.0.1.46 GET / - 443 - 10.0.3.15 Amazon-Route53-Health-Check-Service+(ref+51118a89-9c69-4544-ba00-2a8951d96e0a;+report+http://amzn.to/1vsZADi) - 302 0 0 1 15.177.18.1";
const parsedMethod = message2.match(methodPattern).toString();
/**
 * 1. Reverse String so that we can search starting from the end of the string
 * 2. Find IP Address
 * 3. Reverse String again so that we have the IP address in the right format again
 */
const parsedIPAddress = message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join("");
const parasedDate = message2.match(datePattern)[0].toString();
const parsedTime = message2.match(timePattern).toString();
const parsedPath = message2.split(methodPattern)[1].split("-")[0].replace(/\s/g, ""); //Removes white spaces
const parsedURL = message3.match(URLPattern).toString();

const URL = message3.match(URLPattern) === null ? "N/A" : message3.match(URLPattern).toString();

//console.log(parsedMethod);
//console.log(parsedIPAddress);
//console.log(parasedDate);
//console.log(parsedTime);
//console.log(parsedPath);
//console.log(parsedURL);

const heathcheck = "2020-12-08 15:21:49 10.0.1.221 Amazon-Route53";
