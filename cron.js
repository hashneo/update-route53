const cron = require('node-cron');

const app = require('./index.js');

let argv = process.argv;
let sched = argv.splice(2,1)[0];

console.log('using schedule => ' + sched);
cron.schedule( sched, function(){
    app.start(argv);
});