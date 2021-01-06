# How to insert CloudWatch logs into an SQL Server on RDS

I created this repo because it was extremely difficult trying to parse fields using CloudWatch Log Insights. I'm not a regex expert but I am pretty good at SQL so
I figured importing the data into a an actual SQL database would make it easier to parse and query log data.

### Imported Modules

**zlib**

The [zlib.gunzipSync()](https://www.geeksforgeeks.org/node-js-zlib-gunzipsync-method/) method is an inbuilt application programming interface of the Zlib module which is used to decompress a chunk of data with Gunzip

**Syntax**

```
    const zlib = require('zlib');

    zlib.gunzipSync(buffer,options)
```

**node-mssql**

[node-mssql](https://www.npmjs.com/package/mssql) is the Microsoft SQL Server client for Node.js

**Syntax**

```
const sql = require("mssql");
```

### Examples

**Using zlib**

Our payload is the log data so we use zlib to unzip the logs and then parse all the data that is returned.

```
const payload = Buffer.from(event.awslogs.data, 'base64');

const parsed = JSON.parse(zlib.gunzipSync(payload).toString('utf8'));
```

So when we console log the variable **parsed** , example below, it returns an array of objects

```
console.log('Displaying Log Stream:', JSON.stringify(parsed));
```

**Array of objects that gets logged to the console**

```
{
    "messageType": "DATA_MESSAGE",
    "owner": "936867263904",
    "logGroup": "/ec2/AdventureWorks",
    "logStream": "ec2/AdventureWorks/i-01414565ae2db9bed/AdventureWorks_WEB/W3SVC3-iislogs",
    "subscriptionFilters": [
        "AdventureWorks"
    ],
    "logEvents": [
        {
            "id": "35901945473762172933828602873743316298018882772767997952",
            "timestamp": 1609898913877,
            "message": "2021-01-06 02:08:09 10.0.1.46 GET / - 443 - 10.0.3.15 ELB-HealthChecker/2.0 - 302 0 0 2 -"
        },
        {
            "id": "35901945473762172933828602873743316298018882772767997953",
            "timestamp": 1609898913877,
            "message": "2021-01-06 02:08:15 10.0.1.46 GET / - 443 - 10.0.3.15 Amazon-Route53-Health-Check-Service+(ref+51118a89-9c69-4544-ba00-2a8951d96e0a;+report+http://amzn.to/1vsZADi) - 302 0 0 2 15.177.6.1"
        }
    ]
}
```
