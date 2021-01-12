const zlib = require("zlib");
const sql = require("mssql");
const { v4: uuidv4 } = require("uuid");
var AWS = require("aws-sdk");
var client = new AWS.SecretsManager({
  region: "us-gov-west-1",
});

/******************** RETRIEVE SECRET FROM SECRETS MANAGER ***************************/
// Call the AWS API and return a Promise

const AWSSecretsManager = async (secretName) => {
  const response = await client.getSecretValue({ SecretId: secretName }).promise();

  if ("SecretString" in response) {
    return response.SecretString;
  } else {
    return Buffer.from(response.SecretBinary, "base64").toString("ascii");
  }
};

/******************** DATABASE  *********************/
/**
 * This function takes in two params
 * secret - used to retrieve the database credentials
 * fields - this is an object that contains the props/fields to be inserted into the table
 */
const insertIntoSQLDatabase = async (secret, fields) => {
  const config = await AWSSecretsManager(secret).then((data) => {
    return JSON.parse(data);
  });

  const pool1 = new sql.ConnectionPool(config);
  const pool1Connect = pool1.connect();
  pool1.on("error", (err) => {
    console.log(`Error establishing connection: ${err}`);
  });

  await pool1Connect; // ensures that the pool has been created
  try {
    const request = pool1.request(); // or: new sql.Request(pool1)
    const result = await request.query(
      `insert into dbo.CloudWatchLogs (Id,Method,LogDate,TimeStamp,Path,URL,IPAddress) values ('${fields.Id}','${fields.HTTPMethod}','${fields.date}','${fields.timeStamp}','${fields.path}','${fields.URL}','${fields.IPAddress}')`
    );
    console.log(
      `insert into dbo.CloudWatchLogs (Id,Method,LogDate,TimeStamp,Path,URL,IPAddress) values ('${fields.Id}','${fields.HTTPMethod}','${fields.date}','${fields.timeStamp}','${fields.path}','${fields.URL}','${fields.IPAddress}')`
    );
    return result;
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
  const secret = "GasatraqMSSQLRDSSecret"; //Name of the secret to retrieve database creds

  // If the logstream equals ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs
  if (parsed.logStream === productionLogStream) {
    console.log("Displaying Log Stream for Production:", JSON.stringify(parsed.logStream));
    //console.log(JSON.stringify(parsed.logEvents));
    const LogEventsArray = parsed.logEvents;
    //Loop through every item in the array
    for (let item of LogEventsArray) {
      const fields = {
        Id: uuidv4(),
        HTTPMethod: item.message.match(HTTPMethodPattern).toString(),
        date: item.message.match(datePattern)[0].toString(),
        timeStamp: item.message.match(timePattern).toString(),
        path: item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""), //Removes white spaces,
        URL: item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString(),
        IPAddress: item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join(""),
      };
      //ignore healthchecks so we don't dump those ito the database
      if (item.message.includes("ELB-HealthChecker") || item.message.includes("Amazon-Route53")) {
        console.log("Ignoring HealthChecks");
      } else {
        //Pass in secret and fields object
        insertIntoSQLDatabase(secret, fields);
      }
    }
  }
};

const processLogDataStag = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));
  const secret = "GasatraqStagingMSSQLRDSSecret"; //Name of the secret to retrieve database creds

  // If the logstream equals ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs
  if (parsed.logStream === stagingLogStream) {
    console.log("Displaying Log Stream for Dev:", JSON.stringify(parsed.logStream));
    //console.log(JSON.stringify(parsed.logEvents));
    const LogEventsArray = parsed.logEvents;
    //Loop through every item in the array
    for (let item of LogEventsArray) {
      const fields = {
        Id: uuidv4(),
        HTTPMethod: item.message.match(HTTPMethodPattern).toString(),
        date: item.message.match(datePattern)[0].toString(),
        timeStamp: item.message.match(timePattern).toString(),
        path: item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""), //Removes white spaces,
        URL: item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString(),
        IPAddress: item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join(""),
      };
      //ignore healthchecks so we don't dump those ito the database
      if (item.message.includes("ELB-HealthChecker") || item.message.includes("Amazon-Route53")) {
        console.log("Ignoring HealthChecks");
      } else {
        //Pass in secret and fields object
        insertIntoSQLDatabase(secret, fields);
      }
    }
  }
};

const processLogDataDev = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));
  const secret = "GasatraqDevMSSQLRDSSecret"; //Name of the secret to retrieve database creds

  // If the logstream equals ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs
  if (parsed.logStream === devLogStream) {
    console.log("Displaying Log Stream for Dev:", JSON.stringify(parsed.logStream));
    //console.log(JSON.stringify(parsed.logEvents));
    const LogEventsArray = parsed.logEvents;
    //Loop through every item in the array
    for (let item of LogEventsArray) {
      const fields = {
        Id: uuidv4(),
        HTTPMethod: item.message.match(HTTPMethodPattern).toString(),
        date: item.message.match(datePattern)[0].toString(),
        timeStamp: item.message.match(timePattern).toString(),
        path: item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""), //Removes white spaces,
        URL: item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString(),
        IPAddress: item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join(""),
      };
      //ignore healthchecks so we don't dump those ito the database
      if (item.message.includes("ELB-HealthChecker") || item.message.includes("Amazon-Route53")) {
        console.log("Ignoring HealthChecks");
      } else {
        //Pass in secret and fields object
        insertIntoSQLDatabase(secret, fields);
      }
    }
  }
};

exports.handler = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));
  console.log(JSON.stringify(parsed));

  processLogDataDev(event);
  processLogDataStag(event);
  processLogDataProd(event);
};
