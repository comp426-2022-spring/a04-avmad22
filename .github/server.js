const args = require('minimist')(process.argv.slice(2))

args["port", "debug", "log", "help"]
const port = args.port || 5000 || process.env.PORT
const debug = args.debug
const log = args.log
const help = args.help
console.log(args)
// port



// define app
const express = require("express")
const app = express()
// const { listen } = require('express/lib/application')

const fs = require('fs')
const morgan = require('morgan')
const db = require('./database.js')

app.use(express.urlencoded({ extended: true}));
app.use(express.json());



// start server
const server = app.listen(port, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",port))
})

// if log false, no log file
if (args.log =='false') {
    console.log("NOTICE: not creating file access.log");
} else {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a'});
    app.use(morgan('combined', { stream: accessLog }));

}

// Store help text 
const help_text = (`
server.js [options]

--port, p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug, d	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help, -h	Return this message and exit.
`);
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help_text)
    process.exit(0)
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
    const info = stmt.run(String(logdata.remoteaddr), String(logdata.remoteuser), String(logdata.time), 
    String(logdata.method), String(logdata.url), String(logdata.protocol), String(logdata.httpversion), 
    String(logdata.status), String(logdata.referer), String(logdata.useragent))//console.log(info)
    next();
})

if (args.debug || args.d) {
    try{
        app.get("/app/log/access", (req, res, next) => {
        const stmt = db.prepare('SELECT * FROM accesslog');
        const stmtAll = stmt.all();
        res.status(200).json(stmtAll)
        });
    } catch (e) {
        console.error(e)
    }

    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.')
    })
} else {
    app.use(morgan('combined'))
}

// coin flip stuff
function coinFlip() {
 
    let num = Math.round(Math.random())%2;
    
    if(num==0) {return "heads"};
    return "tails";
}

function coinFlips(flips) {
    let array = [];
    for (let i = 1; i <= flips; i++) {
        array.push(coinFlip());
    }
    return array;

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


app.get('/app/', (req, res) => {
    // Respond with status 200
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
});



// works
app.get('/app/flip/', (req, res) => {
    res.status(200).json({ 'flip': coinFlip()})
}) 
  

app.get('/app/flips/:number', (req, res, next) => {
    const flips = coinFlips(req.params.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});


app.get('/app/flip/call/heads', (req, res) => {
	const flip = flipACoin('heads');
    res.status(200).json({ 'call' : flip.call, 'flip': flip.flip, 'result': flip.result});
});


app.get('/app/flip/call/tails', (req, res) => {
	const flip = flipACoin('tails');
    res.status(200).json({ 'call' : flip.call, 'flip': flip.flip, 'result': flip.result});
});


// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});


process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});
