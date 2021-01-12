const message =
  "2021-01-12 18:54:06 10.0.1.221 POST /Account/LogOff - 443 Sheila.Attipoe 10.0.1.245 Mozilla/5.0+(Windows+NT+10.0;+WOW64;+Trident/7.0;+rv:11.0)+like+Gecko https://gasatraq.info/Report/OverallReport 302 0 0 6 168.88.224.133";

const HTTPMethodPattern = /\b(?:GET|PUT|POST|DELETE|PATCH)\b/gi;
const IPAddressPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const URLPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
const datePattern = /\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])*/;
const timePattern = /(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)/;
const namePattern = /([\w]+\.)+[\w]+(?=[\s]|$)/;

console.log(message.match(namePattern));
