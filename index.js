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


