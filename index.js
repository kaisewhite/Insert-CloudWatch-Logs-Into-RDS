const zlib = require("zlib");
const sql = require("mssql");

const configProd = {
  user: "sa",
  password: "#tYRNKk7wNBXcVL_BA%",
  server: "cyberevaldbprod.ctukqenfaywq.us-gov-west-1.rds.amazonaws.com", // You can use 'localhost\\instance' to connect to named instance
  database: "GASATRAQ",
};
// async/await style:
const pool1 = new sql.ConnectionPool(configProd);
const pool1Connect = pool1.connect();

pool1.on("error", (err) => {
  console.log("Cannot establish database connection: ", err);
});

// LogStream groups for different environments
const productionLogStream = "ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs";
const stagingLogStream = "ec2/gasatraq/i-04a14e68be91edcf5/GASATRAQDev/W3SVC2-iislogs";
const devLogStream = "ec2/gasatraq/i-04a14e68be91edcf5/GASATRAQDev/W3SVC1-iislogs";

// Regex Patterns used for parsing
const HTTPMethodPattern = /\b(?:GET|PUT|POST)\b/gi;
const IPAddressPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const URLPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
const datePattern = /\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])*/;
const timePattern = /(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)/;

//
//Production
const processLogDataProd = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));

  if (parsed.logStream === productionLogStream) {
    console.log("Displaying Log Stream for Production:", JSON.stringify(parsed.logStream));
    const LogEventsArray = parsed.logEvents;
    for (let item of LogEventsArray) {
      const Id = item.id;
      const HTTPMethod = item.message.match(HTTPMethodPattern).toString();
      const date = item.message.match(datePattern)[0].toString();
      const timeStamp = item.message.match(timePattern).toString();
      const path = item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""); //Removes white spaces
      const URL = item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString();
      const IPAddress = item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join("");

      async function sqlInsertData() {
        await pool1Connect; // ensures that the pool has been created
        try {
          const request = pool1.request(); // or: new sql.Request(pool1)
          const result = await request.query(
            `insert into dbo.CloudWatchLogs (Id, Method, LogDate, TimeStamp, Path, URL, IPAddress) values ('${Id}','${HTTPMethod}','${date}','${timeStamp}','${path}','${URL}',,'${IPAddress}')`
          );
          callback(null, event);
          return result;
        } catch (err) {
          callback(null, event);
        }
      }

      // Call the above method
      sqlInsertData();
    }
  }

  return `Successfully processed ${parsed.logEvents.length} log events.`;
};

//Staging
const processLogDataStag = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));

  if (parsed.logStream === stagingLogStream) {
    console.log("Displaying Log Stream for Staging:", JSON.stringify(parsed.logStream));
    const LogEventsArray = parsed.logEvents;
    for (let item of LogEventsArray) {
      const HTTPMethod = item.message.match(HTTPMethodPattern).toString();
      const date = item.message.match(datePattern)[0].toString();
      const timeStamp = item.message.match(timePattern).toString();
      const path = item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""); //Removes white spaces
      const URL = item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString();
      const IPAddress = item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join("");

      //Conditional Statement to ignore healthchecks
      if (item.message.includes("ELB-HealthChecker") || item.message.includes("Amazon-Route53")) {
        console.log("Nothing to log, Ignoring HealthChecks");
      } else {
        console.log("Parsing Log Events Message: ", {
          "Id: ": item.id,
          "HTTP Method: ": HTTPMethod,
          "Date: ": date,
          "Time: ": timeStamp,
          "Path: ": path,
          "URL: ": URL,
          "IPAddress: ": IPAddress,
        });
      }
    }
  }

  return `Successfully processed ${parsed.logEvents.length} log events.`;
};
//Dev
const processLogDataDev = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));

  if (parsed.logStream === devLogStream) {
    console.log("Displaying Log Stream for Dev:", JSON.stringify(parsed.logStream));
    const LogEventsArray = parsed.logEvents;
    for (let item of LogEventsArray) {
      const HTTPMethod = item.message.match(HTTPMethodPattern).toString();
      const date = item.message.match(datePattern)[0].toString();
      const timeStamp = item.message.match(timePattern).toString();
      const path = item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""); //Removes white spaces
      const URL = item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString(); //Check for null values otherwise Lambda will throw an error
      const IPAddress = item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join("");

      //Conditional Statement to ignore healthchecks
      if (item.message.includes("ELB-HealthChecker") || item.message.includes("Amazon-Route53")) {
        console.log("Nothing to log, Ignoring HealthChecks");
      } else {
        console.log("Parsing Log Events Message: ", {
          "Id: ": item.id,
          "HTTP Method: ": HTTPMethod,
          "Date: ": date,
          "Time: ": timeStamp,
          "Path: ": path,
          "URL: ": URL,
          "IPAddress: ": IPAddress,
        });
      }
    }
  }

  return `Successfully processed ${parsed.logEvents.length} log events.`;
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  processLogDataProd(event);
  //processLogDataStag(event);
  //processLogDataDev(event);
};
