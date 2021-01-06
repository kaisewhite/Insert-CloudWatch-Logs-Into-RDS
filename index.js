const zlib = require("zlib");
const sql = require("mssql");

const config = {
  user: "username",
  password: "password",
  server: "servername", // You can use 'localhost\\instance' to connect to named instance
  database: "database",
};

// async/await style:
const pool1 = new sql.ConnectionPool(config);
const pool1Connect = pool1.connect();

pool1.on("error", (err) => {
  console.log(`Can't establish database connection: ${err}`);
});

const insertDataToMSSQL = async (message, event) => {
  await pool1Connect; // ensures that the pool has been created
  try {
    const request = pool1.request(); // or: new sql.Request(pool1)
    const result = await request.query(`insert into dbo.users (fieldName) values ('${message}')`);
    callback(null, event);
    return result;
  } catch (err) {
    callback(null, event);
  }
};

const processLogData = (event) => {
  const payload = Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));

  if (parsed.logStream === "ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs") {
    console.log("Displaying Log Stream:", JSON.stringify(parsed));
    console.log("Displaying Log Stream:", JSON.stringify(parsed.logStream));
    console.log("Array Content:", JSON.stringify(parsed.logEvents));

    const LogEventsArray = parsed.logEvents;
    //Lambda does not allow the use for array.forEach so we have to use a conventional loop
    for (let item of LogEventsArray) {
      console.log("Log Events Message:", item.message);
      insertDataToMSSQL(item.message, event);
    }
  }

  return `Successfully processed ${parsed.logEvents.length} log events.`;
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; //The connection pool remains active so we have to set this flag to false to close the pool otherwise lambda will throw a timeout error
  processLogData(event);
};

/**
 const zlib = require('zlib');

exports.handler = async (event, context) => {
    const payload = Buffer.from(event.awslogs.data, 'base64');
    const parsed = JSON.parse(zlib.gunzipSync(payload).toString('utf8'));
    
    if(parsed.logStream === "ec2/gasatraq/i-01414565ae2db9bed/GASATRAQ_WEB/W3SVC3-iislogs"){
        console.log('Displaying Log Stream:', JSON.stringify(parsed));
        console.log('Displaying Log Stream:', JSON.stringify(parsed.logStream));
        console.log('Array Content:', JSON.stringify(parsed.logEvents));
        
        
        const LogEventsArray = parsed.logEvents
        for(let item of LogEventsArray){
            console.log('Log Events Message:', item.message)
        }
        
    }
    
    return `Successfully processed ${parsed.logEvents.length} log events.`;
};



 */
