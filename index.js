const zlib = require("zlib");
const sql = require("mssql");
const { v4: uuidv4 } = require("uuid");

/******************** DATABASE REQUIREMENTS *********************/
const configProd = {
  user: "",
  password: "",
  server: "", // You can use 'localhost\\instance' to connect to named instance
  database: "",
};

const pool1 = new sql.ConnectionPool(configProd);
const pool1Connect = pool1.connect();

pool1.on("error", (err) => {
  console.log(`Error establishing connection: ${err}`);
});

const insertIntoSQLDatabase = async (Id, Method, Date, TimeStamp, Path, URL, IPAddress) => {
  await pool1Connect; // ensures that the pool has been created
  try {
    const request = pool1.request(); // or: new sql.Request(pool1)
    const result = await request.query(
      `insert into dbo.CloudWatchLogs (Id,Method,LogDate,TimeStamp,Path,URL,IPAddress) values ('${Id}','${Method}','${Date}','${TimeStamp}','${Path}','${URL}','${IPAddress}')`
    );
    const recordCount = await request.query(`Select count(*) from dbo.CloudWatchLogs `);
    console.log(recordCount);
    //console.log(result);
    //console.log(`insert into dbo.CloudWatchLogs (Id) values ('${Id}')`);
    return recordCount;
  } catch (err) {
    console.error("SQL error", err);
  }
};

/******************** PROCESS LOG DATA *********************/

//Log Streams for Prod, Stage & Dev
const productionLogStream = "ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs";
const stagingLogStream = "ec2/gasatraq/i-04a14e68be91edcf5/GASATRAQDev/W3SVC2-iislogs";
const devLogStream = "ec2/gasatraq/i-04a14e68be91edcf5/GASATRAQDev/W3SVC1-iislogs";

// Regex Patterns used for parsing
const HTTPMethodPattern = /\b(?:GET|PUT|POST|DELETE|PATCH)\b/gi;
const IPAddressPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const URLPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
const datePattern = /\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])*/;
const timePattern = /(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)/;

const processLogDataProd = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));

  if (parsed.logStream === productionLogStream) {
    console.log("Displaying Log Stream for Production:", JSON.stringify(parsed.logStream));

    const LogEventsArray = parsed.logEvents;
    const Id = uuidv4();
    for (let item of LogEventsArray) {
      const HTTPMethod = item.message.match(HTTPMethodPattern).toString();
      const date = item.message.match(datePattern)[0].toString();
      const timeStamp = item.message.match(timePattern).toString();
      const path = item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""); //Removes white spaces
      const URL = item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString();
      const IPAddress = item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join("");
      insertIntoSQLDatabase(Id, HTTPMethod, date, timeStamp, path, URL, IPAddress);
    }
  }
};

exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  processLogDataProd(event);
  //insertIntoSQLDatabase("12345678");
};
