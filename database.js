
//require better-sqlite3:
const Database = require('better-sqlite3');

// make database
const db = new Database('log.db');

const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`);
let row = stmt.get();

// if empty database
if (row === undefined) {
    console.log('Your database appears to be empty. I will initialize it now.')

    const sqlInit = `
        CREATE TABLE accesslog ( 
            id INTEGER PRIMARY KEY, 
            remoteaddr TEXT,
            remoteuser TEXT,
            time TEXT,
            method TEXT,
            url TEXT,
            protocol TEXT,
            httpversion TEXT,
            status TEXT, 
            referrer TEXT,
            useragent TEXT
        );
    `

    db.exec(sqlInit)
    console.log('Your database has been initialized with a new table and two entries containing a username and password.');
} else {
    console.log('Log database exists')
}

module.exports=db