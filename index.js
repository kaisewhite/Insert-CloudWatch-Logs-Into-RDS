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
      `insert into dbo.CloudWatchLogs (Id,Method,LogDate,TimeStamp,Path,URL,IPAddress,Message,Username, Browser) values ('${fields.Id}','${fields.HTTPMethod}','${fields.date}','${fields.timeStamp}','${fields.path}','${fields.URL}','${fields.IPAddress}','${fields.Message}','${fields.Username}','${fields.browser}')`
    );
    console.log(
      `insert into dbo.CloudWatchLogs (Id,Method,LogDate,TimeStamp,Path,URL,IPAddress,Message,Username, Browser) values ('${fields.Id}','${fields.HTTPMethod}','${fields.date}','${fields.timeStamp}','${fields.path}','${fields.URL}','${fields.IPAddress}','${fields.Message}','${fields.Username}','${fields.browser}')`
    );
    console.log(`Results: ${result.recordsets.length}`); // count of rows contained in the recordset
    return result;
  } catch (err) {
    console.error("SQL error", err);
  }
  pool1.close(); //Close all active connections in the pool.
};

/******************** PROCESS LOG DATA *********************/

//Log Streams for Prod, Stage & Dev
const productionLogStream = "ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs";
const productionLogStream2 = "ec2/gasatraq/i-03a28d0841157e03b/GASATRAQ-WEB2/W3SVC3-iislogs";
const stagingLogStream = "ec2/gasatraq/i-04a14e68be91edcf5/GASATRAQDev/W3SVC2-iislogs";
const devLogStream = "ec2/gasatraq/i-04a14e68be91edcf5/GASATRAQDev/W3SVC1-iislogs";

// Regex Patterns used for parsing
const HTTPMethodPattern = /\b(?:GET|PUT|POST|DELETE|PATCH)\b/gi;
const IPAddressPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const URLPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
const datePattern = /\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])*/;
const timePattern = /(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)/;

const loopThroughResults = (LogEventsArray, secret) => {
  //Loop through every item in the array
  for (let item of LogEventsArray) {
    //one object to store all the fields and pass into the database insert function
    const fields = {
      Id: uuidv4(),
      HTTPMethod: item.message.match(HTTPMethodPattern).toString(),
      date: item.message.match(datePattern)[0].toString(),
      timeStamp: item.message.match(timePattern).toString(),
      path: item.message.split(HTTPMethodPattern)[1].split("-")[0].replace(/\s/g, ""), //Removes white spaces,
      URL: item.message.match(URLPattern) === null ? "N/A" : item.message.match(URLPattern).toString(),
      IPAddress: item.message.split("").reverse().join("").match(IPAddressPattern).toString().split("").reverse().join(""),
      Message: item.message.toString(),
      Username: item.message.includes("Create_Account")
        ? item.message.substr(item.message.indexOf("username=") + 9).split("&")[0]
        : item.message.includes("VerifyCode")
        ? item.message.substr(item.message.indexOf("Email=") + 6).split("%")[0]
        : item.message.includes("ResetPassword")
        ? item.message.substr(item.message.indexOf("username=") + 9).split("443")[0]
        : item.message.includes("InviteUser") ||
          item.message.includes("LogOff") ||
          item.message.includes("UserActivity") ||
          item.message.includes("EvaluationList") ||
          item.message.includes("SelfAssessmentEntry")
        ? item.message.substr(item.message.indexOf("443") + 4).split(" ")[0]
        : "unknown",
      browser: item.message.substr(item.message.indexOf("Mozilla")).split(" ")[0],
    };
    //ignore healthchecks so we don't dump those ito the database
    if (
      item.message.includes("ELB-HealthChecker") ||
      item.message.includes("Amazon-Route53") ||
      item.message.includes("amzn.to") ||
      item.message.includes("bing.com") ||
      item.message.includes("CookieSupport") ||
      item.message.includes("styles/Site") ||
      item.message.includes("/bundles")
    ) {
      //console.log("Ignoring HealthChecks");
    } else {
      //Pass in secret and fields object
      console.log(`Using secret: ${secret}`);
      insertIntoSQLDatabase(secret, fields);
    }
  }
};

const processLogs = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));
  //The secret is determined based on the logstream. Ex: If the logstream equals ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs
  //then use GasatraqMSSQLRDSSecret

  if (parsed.logStream === devLogStream) {
    console.log("Displaying Log Stream for Dev:", JSON.stringify(parsed.logStream));
    const LogEventsArray = parsed.logEvents;
    let secret = "GasatraqDevMSSQLRDSSecret";
    loopThroughResults(LogEventsArray, secret);
  }
  if (parsed.logStream === stagingLogStream) {
    console.log("Displaying Log Stream for Staging:", JSON.stringify(parsed.logStream));
    const LogEventsArray = parsed.logEvents;
    let secret = "GasatraqStagingMSSQLRDSSecret";
    loopThroughResults(LogEventsArray, secret);
  }
  //if (parsed.logStream === productionLogStream || parsed.logStream === productionLogStream2) {
  //  console.log("Displaying Log Stream for Prod:", JSON.stringify(parsed.logStream));
  //  const LogEventsArray = parsed.logEvents;
  //  let secret = "GasatraqMSSQLRDSSecret";
  //  loopThroughResults(LogEventsArray, secret);
  //}
};

exports.handler = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8")); //Unzips logs
  console.log(JSON.stringify(parsed));
  processLogs(event);

  //processLogDataProd(event);
};
