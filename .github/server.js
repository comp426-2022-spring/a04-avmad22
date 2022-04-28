const args = require('minimist')(process.argv.slice(2))
// Store help text 
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

// define app
let express = require("express")
const { listen } = require('express/lib/application')
let app = express()
const fs = require('fs')
const morgan = require('morgan')
const db = require('./database.js')

app.use(express.urlencoded({ extended: true}));
app.use(express.json());

// port
const port = args.port || args.p || 5000

// start server
const server = app.listen(port, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",port))
})

// if log false, no log file
if (args.log =='false') {
    console.log("NOTICE: not creating file access.log")
} else {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a'})
    app.use(morgan('combined', { stream: accessLog}))

}

// log to database
app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    console.log(logdata)
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    //console.log(info)
    next();
})

// logging middleware
const logging = (req, res, next) => {
    console.log()
    next()
}

app.use(logging)

app.get('/app/', (req, res) => {
    // Respond with status 200
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';

        // res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
});




// works
app.get('/app/flip', (req, res) => {
    res.status(200).json({ 'flip': coinFlip()})
}) 
  
app.get('/app/flips/:number([0-9]{1,3})', (req, res) => {
    let flips = coinFlips(req.params.number)
    let count = countFlips(flips);
    res.status(200).json({"raw":flips, "summary":count})
})

app.get('/app/flip/call/heads', (req, res) => {
    let flipsCoinheads=flipACoin("heads")
    res.status(200).json(flipsCoinheads)
})

app.get('/app/flip/call/tails', (req, res) => {
    let flipsCointails=flipACoin("tails")
    res.status(200).json(flipsCointails)
})

// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});

function coinFlip() {
 
    let num = Math.round(Math.random())%2;
    
    if(num==0) {return "heads"};
    return "tails";
}

function coinFlips(flips) {
    let arr= [];
    for(let i=0; i<flips; i++) {
      arr[i] = coinFlip();
    }
    return arr;
}

function countFlips(array) {
    let heads =0;
    let tails=0;
    for(let i=0; i < array.length; i++) {
      if(array[i]=="heads") {
        heads++;
      } else {
        tails++;
      }
    }
    return "{ heads: " + heads + ", tails: " + tails + " }"
}

function flipACoin(call) {
    let side = coinFlip();
    let result = "";
    if(side==call) {
      result = "win";
    } else {result="lose";}
    return {call: call, flip: side, result: "win"}
}

