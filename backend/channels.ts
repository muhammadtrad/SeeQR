// Import parts of electron to use
import { ipcMain } from 'electron';

const { exec } = require('child_process');
const db = require('./models');

/************************************************************
 *********************** IPC CHANNELS ***********************
 ************************************************************/

// Global variable to store list of databases and tables to provide to frontend upon refreshing view.
let listObj;

ipcMain.on('return-db-list', (event, args) => {
  db.getLists().then(data => event.sender.send('db-lists', data));
});

// Listen for skip button on Splash page.
ipcMain.on('skip-file-upload', (event) => { });

// Listen for database changes sent from the renderer upon changing tabs.
ipcMain.on('change-db', (event, dbName) => {
  db.changeDB(dbName);
  event.sender.send('return-change-db', dbName);
});

// Generate CLI commands to be executed in child process.
const createDBFunc = (name) => {
  return `docker exec postgres-1 psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE ${name}"`
}

const importFileFunc = (file) => {
  return `docker cp ${file} postgres-1:/data_dump`;
}

const runSQLFunc = (file) => {
  return `docker exec postgres-1 psql -U postgres -d ${file} -f /data_dump`;
}

const runTARFunc = (file) => {
  return `docker exec postgres-1 pg_restore -U postgres -d ${file} /data_dump`;
}

// Function to execute commands in the child process.
const execute = (str: string, nextStep: any) => {
  exec(str, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`${stdout}`);
    if (nextStep) nextStep();
  });
};

// Listen for file upload. Create an instance of database from pre-made .tar or .sql file.
ipcMain.on('upload-file', (event, filePath: string) => {
  let dbName: string;
  if (process.platform === 'darwin') {
    dbName = filePath[0].slice(filePath[0].lastIndexOf('/') + 1, filePath[0].lastIndexOf('.'));
  } else {
    dbName = filePath[0].slice(filePath[0].lastIndexOf('\\') + 1, filePath[0].lastIndexOf('.'));
  }

  const createDB: string = createDBFunc(dbName);
  const importFile: string = importFileFunc(filePath);
  const runSQL: string = runSQLFunc(dbName);
  const runTAR: string = runTARFunc(dbName);
  const extension: string = filePath[0].slice(filePath[0].lastIndexOf('.'));

  // SEQUENCE OF EXECUTING COMMANDS
  // Steps are in reverse order because each step is a callback function that requires the following step to be defined.

  // Step 4: Changes the pg URI the newly created database, queries new database, then sends list of tables and list of databases to frontend.
  async function sendLists() {
    listObj = await db.getLists();
    event.sender.send('db-lists', listObj);
    // Send schema name back to frontend, so frontend can load tab name.
    event.sender.send('return-schema-name', dbName)
  };

  // Step 3 : Given the file path extension, run the appropriate command in postgres to populate db.
  const step3 = () => {
    let runCmd: string = '';
    if (extension === '.sql') runCmd = runSQL;
    else if (extension === '.tar') runCmd = runTAR;
    execute(runCmd, sendLists);
  };

  // Step 2 : Import database file from file path into docker container
  const step2 = () => execute(importFile, step3);

  // Step 1 : Create empty db
  if (extension === '.sql' || extension === '.tar') execute(createDB, step2);
  else console.log('INVALID FILE TYPE: Please use .tar or .sql extensions.');
});

interface SchemaType {
  schemaName: string;
  schemaFilePath: string;
  schemaEntry: string;
}

// Listen for schema edits (via file upload OR via CodeMirror inout) from schemaModal. Create an instance of database from pre-made .tar or .sql file.
ipcMain.on('input-schema', (event, data: SchemaType) => {
  const { schemaName: dbName, schemaFilePath: filePath, schemaEntry } = data;

  // Using RegEx to remove line breaks to ensure data.schemaEntry is being run as one large string
  // so that schemaEntry string will work for Windows computers.
  let trimSchemaEntry = schemaEntry.replace(/[\n\r]/g, "").trim();

  const createDB: string = createDBFunc(dbName);
  const importFile: string = importFileFunc(filePath);
  const runSQL: string = runSQLFunc(dbName);
  const runTAR: string = runTARFunc(dbName);

  const runScript: string = `docker exec postgres-1 psql -U postgres -d ${dbName} -c "${trimSchemaEntry}"`;
  let extension: string = '';
  if (filePath.length > 0) {
    extension = filePath[0].slice(filePath[0].lastIndexOf('.'));
  }

  // SEQUENCE OF EXECUTING COMMANDS
  // Steps are in reverse order because each step is a callback function that requires the following step to be defined.

  // Step 4: Changes the pg URI to look to the newly created database and queries all the tables in that database and sends it to frontend.
  async function sendLists() {
    listObj = await db.getLists();
    event.sender.send('db-lists', listObj);
  };

  // Step 3 : Given the file path extension, run the appropriate command in postgres to build the db
  const step3 = () => {
    let runCmd: string = '';
    if (extension === '.sql') runCmd = runSQL;
    else if (extension === '.tar') runCmd = runTAR;
    else runCmd = runScript;
    execute(runCmd, sendLists);
  };

  // Step 2 : Import database file from file path into docker container
  const step2 = () => execute(importFile, step3);

  // Step 1 : Create empty db
  if (extension === '.sql' || extension === '.tar') execute(createDB, step2);
  // if data is inputted as text
  else execute(createDB, step3);
});

interface QueryType {
  queryCurrentSchema: string;
  queryString: string;
  queryLabel: string;
  queryData: string;
  queryStatistics: string;
}

// Listen for queries being sent from renderer
ipcMain.on('execute-query', (event, data: QueryType) => {
  // destructure object from frontend
  const { queryString, queryCurrentSchema, queryLabel } = data;

  // initialize object to store all data to send to frontend
  let frontendData = {
    queryString,
    queryCurrentSchema,
    queryLabel,
    queryData: '',
    queryStatistics: '',
    lists: {},
  };

  // Run select * from actors;
  db.query(queryString)
    .then((queryData) => {
      frontendData.queryData = queryData.rows;

      // Run EXPLAIN (FORMAT JSON, ANALYZE)
      db.query('EXPLAIN (FORMAT JSON, ANALYZE) ' + queryString).then((queryStats) => {
        frontendData.queryStatistics = queryStats.rows;

        (async function getListAsync() {
          listObj = await db.getLists();
          frontendData.lists = listObj;
          event.sender.send('db-lists', listObj)
          event.sender.send('return-execute-query', frontendData);
        })();
      });
    })
    .catch((error: string) => {
      console.log('ERROR in execute-query channel in main.ts', error);
    });
});

module.exports;