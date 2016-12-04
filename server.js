"use strict";
const bodyParser = require('body-parser');
const mail = require('./mail.js');
const constants = require('./constants.js');

const express = require('express');
const moment = require('moment');
var CronJob = require('cron').CronJob;

const app = express();

// group these constants in a new file
const SPANISH = 0;
const FRENCH = 1;
const CHINESE = 2;

var algorithm = require('./algorithm');

//parse request.body as json
app.use(bodyParser.json());

//set the port
app.set('port', (process.env.PORT || 3000));

app.use(express.static('client/build'));

//connect to the database and store the reference
var MongoClient = require('mongodb').MongoClient;
var db;

//TODO extract db location out to an environment variable
MongoClient.connect('mongodb://localhost:27017/lt', (err, database) => {
  if (err) {
    throw err;
  }
  db = database;
  app.listen(app.get('port'), () => {
    console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
  });
});

// '/languages' or '/languages?id=x' routes
app.get('/languages', (req, res) => {
  // if no id, output all the languages and their number in an array
  // *** is undefined the way to check "if x == NULL" in JS?
  if (req.query.id === undefined) {
    let languages = Object.entries(constants.languages);
    languages = languages.map((lang) => {
      return {language: lang[1], language_string: lang[0]}
    });

    res.send(languages);
  // if id is specified, return an object with dates and seats
  } else {
    let language_id = Number.parseInt(req.query.id);
    db.collection('dates').find({'vacancy.language': language_id},{'date': 1, 'vacancy.$': 1})
      .toArray(function(err, results) {
        if (err) {
          throw err;
        }
        results = results.map((element) => {
          return {
            date: element.date,
            seats: element.vacancy[0].seatsReserved - element.vacancy[0].seatsAvailable
          }
        });

        res.send(results);
    });
  }
});

// '/signup' route
app.post('/signup', (req, res) => {
  //assuming there is a seat at the given date and language table
  //since calendar won't allow picking dates with seats = 0

  /***************
    TO DO: res.sendStatus(400) if have errors?
  ***************/
  let guestlistFull = false;

  db.collection('dates').find({date:req.body.date}).toArray(function(err, result) {
    if (err) {
      throw err;
    }
    let language = result[0].vacancy[req.body.language]

    if (language.seatsAvailable - language.seatsReserved === 0) {
      guestlistFull = true;
    }
  });

  //find a record of the attendant
  db.collection('attendants').find({id:req.body.id}).toArray(function(err, result) {
    if (err) {
      throw err;
    }
    console.log(guestlistFull);
    console.log(req.body);

    // if attendant does not exist in database
    if (result[0] == undefined) {
      //create a new attendant with the new record of attendance
      db.collection('attendants').insert({
        id: req.body.id,
        name: req.body.name,
        email: req.body.email
      });
    }

    if (guestlistFull) {
      //add a new record of waitlists for the student
      db.collection('attendants').update(
        {id: req.body.id},
        {$push: {waitlists: {date:req.body.date, language:req.body.language}}}
      );

      //add the student id to the date's waitlist
      db.collection('dates').update(
        {date: req.body.date, "vacancy.language": req.body.language},
        {$addToSet: {"vacancy.$.waitlist": req.body.id}}
      );

    } else {
      //add a new record of attendance for the student
      db.collection('attendants').update(
        {id: req.body.id},
        {$push: {attendance: {date:req.body.date, language:req.body.language}}}
      );

      //increment the number of reserved seats at the given language at the given date
      db.collection('dates').update(
        {date: req.body.date, "vacancy.language": req.body.language},
        {$inc: {"vacancy.$.seatsReserved": 1}}
      );

      //add the student id to the date's guestlist
      db.collection('dates').update(
        {date: req.body.date, "vacancy.language": req.body.language},
        {$addToSet: {"vacancy.$.guestlist": req.body.id}}
      );
    }
  });

  mail.send(req.body);
  //send a success status to the client
  res.sendStatus(200);
});

// TODO change cronTime to 00 00 20 * * 1-5
var timeToRun = moment().add(10, 'seconds');

var hour = timeToRun.hour();
var minute = timeToRun.minutes();
var second = timeToRun.seconds();
console.log("\nThe algorithm will run at: "+hour+":"+minute+":"+second+"\n");
console.log("The emails to TA's and professors will be sent at: "+hour+":"+minute+":"+(second+5)+"\n");


var tableAllocationJob = new CronJob({
  cronTime: second+" "+minute+" "+hour+" * * 0-6",
  onTick: function() {
    /*
     * Runs every weekday (Monday through Friday)
     * at 20:00:00 AM.
     */
     algorithm.run(db, moment);
  },
  start: false,
  timeZone: 'America/New_York'
});
tableAllocationJob.start();


//TODO: change cronTime to 00 00 15 * * 1-5
var sendEmailToFacultyJob = new CronJob({
  cronTime: (second+5)+" "+minute+" "+hour+" * * 0-6",
  onTick: function() {
    /*
     * Runs every weekday (Monday through Friday)
     * at 15:00:00 PM.
     */
     //TODO: uncomment for actual implementation - we need to look at the current day
     //for now look for info for the next day
     //var today = moment().startOf('day');
     var today = moment();
     today = today.add(1, 'days').startOf('day');

     //get the faculty collection
     db.collection('faculty').find().toArray((err, result) => {
       if (err) {
         throw err;
       }

       //for each language department
       result.forEach(function(object, objectIndex) {
         db.collection('dates').find({date: today.toISOString()}).toArray((err, result) => {
           if (err) {
             throw err;
           }

           var guestList = result[0].vacancy[object.language].guestlist;
           var guestNamesList = [];
           var emails = [];

           //get emails of TA's and Professors for this language
           object.faculty.forEach((facultyMember, facultyMemberIndex) => {
             emails.push(facultyMember.email);
           });

           //get the names of the attendants by their id
           guestList.forEach((guestId, guestIndex) => {
             db.collection('attendants').find({id: guestId}, {name: 1}).toArray((err, result) => {
               if (err) {
                 throw err;
               }
               guestNamesList.push(result[0].name);

               //send the email
               if (guestNamesList.length === guestList.length) {
                 mail.sendProfTA(object, guestNamesList, today.month()+"/"+ today.day(), emails);
               }
             });
           });
         });
       });
     });
  },
  start: false,
  timeZone: 'America/New_York'
});
sendEmailToFacultyJob.start();
