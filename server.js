"use strict";
const bodyParser = require('body-parser');
const mail = require('./mail.js');
const constants = require('./constants.js');
const _ = require('lodash');

const express = require('express');
const moment = require('moment');
var CronJob = require('cron').CronJob;

const app = express();

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
    TODO: res.sendStatus(400) if have errors?
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

app.get('/attendance', (req, res) => {
  var date = moment().startOf('day').utc().format();
  var attendants = [];
  var promises = [];

  db.collection('dates').find({ date: date }).toArray()
  .then((result) => {
    result[0].vacancy.forEach((day) => {
      promises.push(new Promise((resolve, reject) => {
        db.collection('attendants').find({ id: { $in: day.guestlist } }).toArray()
        .then((result) => {
          if (result.length > 0) {
            var langAttendants = result.map((item) => {
              return {
                id: item.id,
                name: item.name,
                language: _.find(item.attendance, (day) => { return moment(day.date).isSame(date, 'day') }).language
              }
            })

            attendants.push(langAttendants[0]);
          }
          resolve();
        })
        .catch((error) => {
          res.sendStatus(404);
          reject();
        });
      }));
    });

    Promise.all(promises).then(() => {
      res.json(attendants);
    })
  })
  .catch((error) => {
    res.sendStatus(404);
  });
});

app.post('/attendance', (req, res) => {
  var date = req.body.date;
  var ids = req.body.attendants;

  db.collection('dates').update(
    { date: date },
    { $set: { "vacancy.0.guestlist" : ids }}
  );

  res.sendStatus(200);
});

// TODO change the job to 00 00 11 * * 1-5
var timeToRun = moment().add(15, 'seconds');

var hour = timeToRun.hour();
var minute = timeToRun.minutes();
var second = timeToRun.seconds();
console.log(hour);
console.log(minute);
console.log(second);


var job = new CronJob({
  cronTime: second+" "+minute+" "+hour+" * * 1-7",
  onTick: function() {
    /*
     * Runs every weekday (Monday through Friday)
     * at 11:00:00 AM.
     */
     algorithm.run(db, moment);
  },
  start: false,
  timeZone: 'America/New_York'
});
job.start();
