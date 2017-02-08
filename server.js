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
MongoClient.connect('mongodb://languagetableapp:centurybarrenfortysnake@localhost:3001/lt', (err, database) => {
  if (err) {
    throw err;
  }
  db = database;
  app.listen(app.get('port'), () => {
    console.log(`Find the server at: http://basin.middlebury.edu:${app.get('port')}/`); // eslint-disable-line no-console
  });
});

// '/languages' or '/languages?id=x' routes
app.get('/languages', (req, res) => {
  // if no id, output all the languages and their number in an array
  // *** is undefined the way to check "if x == NULL" in JS?
  if (req.query.id === undefined) {
    let languages = Object.entries(constants.languages);
    db.collection('dates').find({date: moment().startOf('day').utc().format()})
      .toArray(function(err, result) {
      if (err) {
        throw err;
      }
      let tables = result[0].vacancy;

      languages = languages.map((lang) => {
        let langObj = _.find(tables, function(o) { return o.language === lang[1]; });
        return {language       : lang[1],
                language_string: lang[0],
                tablesOf6      : langObj.tablesOf6,
                tablesOf8      : langObj.tablesOf8}
      });
      res.send(languages);

    });

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
            seats: element.vacancy[0].seatsAvailable - element.vacancy[0].seatsReserved
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

      //send a waitlister message
      mail.send(req.body, true);

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

      //send a guestlist message
      mail.send(req.body, false);
    }
  });

  //send a success status to the client
  res.sendStatus(200);
});

// '/cancel' or '/cancel?reservation=x' routes
app.get('/cancel', (req, res) => {

  //uncomment below for actual implementation
  var encodedString = req.query.reservation;
  //var string = "1006666662016-12-05T05:00:00.000Z"
  //var encodedString = new Buffer(string).toString('base64');
  var decodedString = new Buffer(encodedString, 'base64').toString('ascii');

  var language = Number.parseInt(decodedString.substring(0, 1));
  var id = decodedString.substring(1, 9);
  var date = decodedString.substring(9, decodedString.length);

  // console.log(language +"\n");
  // console.log(id +"\n");
  // console.log(date +"\n");

  // remove the reservation from dates collection
  db.collection('dates').find(
    {'date': date},
    {'vacancy': {$elemMatch: {'language': language}}}).toArray((err, result) => {
    if (err) {
      throw err;
    }

    // console.log(result);

    //for convenience
    var waitlist = result[0].vacancy[0].waitlist;
    var guestlist = result[0].vacancy[0].guestlist;
    var seatsReserved = result[0].vacancy[0].seatsReserved;

    // if the attendant is on the waitlist for that language on that day
    if (waitlist.includes(id)) {

      // remove him from wailtlist
      var index = waitlist.indexOf(id);
      waitlist.splice(index, 1);

      // update the waitlist in dates collection
      db.collection('dates').update(
        {'date': date, 'vacancy.language': language},
        {$set: {'vacancy.$.waitlist': waitlist}}
      );

      // update the waitlist in attendants collection
      db.collection('attendants').update(
        { id: id },
        { $pull: { 'waitlists': { 'date' : date, 'language' : language } }
      });

    //if the attendant is on the guestlist for that language on that day
    } else if (guestlist.includes(id)) {

      // remove him from the guestlist
      var index = guestlist.indexOf(id);
      guestlist.splice(index, 1);

      // decrement the number of seats reserved
      seatsReserved--;

      // if waitlist is not empty
      if (waitlist.length > 0) {

        // remove waitlist[0]
        var luckyPerson = waitlist.splice(0, 1);
        // push waitlist[0] to guestlist
        guestlist.push(luckyPerson[0]);

        // increment the number of seats reserved
        seatsReserved++;

        // update the waitlist in dates collection
        db.collection('dates').update(
          {'date': date, 'vacancy.language': language},
          {$set: {'vacancy.$.waitlist': waitlist}}
        );
        // update the waitlists for the lucky person in attendants collection
        db.collection('attendants').update(
          { id: luckyPerson[0] },
          { $pull: { 'waitlists': { 'date' : date, 'language' : language } }
        });
        // update the attendance for the lucky person in attendants collection
        db.collection('attendants').update(
          { id: luckyPerson[0] },
          { $push: { 'attendance': { 'date' : date, 'language' : language } }
        });

        //send an email to the lucky person
        db.collection('attendants').find({id: luckyPerson[0]}).toArray((err, result) => {
          if (err) {
            throw err;
          }
          mail.sendNewGuests(result[0].email, language, moment(date));
        });
      }

      // update the guestlist in dates collection
      db.collection('dates').update(
        {'date': date, 'vacancy.language': language},
        {$set: {'vacancy.$.guestlist': guestlist}}
      );

      // update the number of seats reserved in dates collection
      db.collection('dates').update(
        {'date': date, 'vacancy.language': language},
        {$set: {'vacancy.$.seatsReserved': seatsReserved}}
      );

      // update the attendance in attendants collection
      db.collection('attendants').update(
        { id: id },
        { $pull: { 'attendance': { 'date' : date, 'language' : language } }
      });
    }
  });
  res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">You have successfully cancelled your reservation.</p>');
  //res.sendStatus(200);
});

// getting the current allocation of tables
app.get('/update', (req, res) => {
  db.collection('baseline').find({language: Number.parseInt(req.query.lang)}).toArray()
  .then((result) => {
    res.json(result[0].baseline);
    resolve();
  })
  .catch((error) => {
    res.sendStatus(404);
    reject();
  });
});

// updating the current allocation of tables
app.post('/update', (req, res) => {

  db.collection('baseline').update(
    { language: req.body.language },
    { $set: {baseline: req.body.baseline}}
  );

  res.sendStatus(200);
});


app.get('/attendance', (req, res) => {
  //TODO: remove add(1, 'day') -- we want the current day
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
                language: _.find(item.attendance, (day) => {
                  return moment(day.date).isSame(date, 'day')
                }).language
              }
            });
            attendants = attendants.concat(langAttendants);
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
      res.json({date: date, attendants: attendants});
    })
  })
  .catch((error) => {
    res.sendStatus(404);
  });
});

app.post('/attendance', (req, res) => {
  var date = req.body.date;
  var attendants = req.body.attendants;
  var absent = req.body.absent;
  //console.log(absent);
  var promises = [];

  for (var language in constants.languages) {
    promises.push(new Promise((resolve, reject) => {
      var queryString = "vacancy." + constants.languages[language]+".guestlist";
      var ids = attendants[constants.languages[language]] || [];
      var update = { $set: {} };
      update.$set[queryString] = ids;
      db.collection('dates').update(
        { date: date },
        update
      );

      var absentIds = absent[constants.languages[language]] || [];
      for (var i = 0; i < absentIds.length; i++) {
        db.collection('attendants').update(
          { id: absentIds[i] },
          { $pull: { 'attendance': { 'date' : date, 'language' : constants.languages[language] } } }
        );
      }
      resolve();
    }));
  }

  Promise.all(promises).then(()=> {
    res.sendStatus(200);
  });
});

// TODO change cronTime to 00 00 20 * * 1-5
var timeToRun = moment().add(10, 'seconds');

var hour = timeToRun.hour();
var minute = timeToRun.minutes();
var second = timeToRun.seconds();

// for testing:
// cronTime: second+" "+minute+" "+hour+" * * 0-6",

var tableAllocationJob = new CronJob({
  cronTime: "00 00 20 * * 0-4",
  onTick: function() {
    /*
     * Runs the day before every weekday (Sunday through Thursday)
     * at 20:00:00 PM.
     */
     algorithm.run(db, moment);
  },
  start: false,
  timeZone: 'America/New_York'
});
// console.log("\nThe algorithm will run at: "+hour+":"+minute+":"+second+"\n");
tableAllocationJob.start();


//TODO: change cronTime to 00 00 15 * * 1-5
// for testing:
// (second+20)+" "+minute+" "+hour+" * * 0-6"
var sendEmailToFacultyJob = new CronJob({
  cronTime: "00 00 15 * * 1-5",
  onTick: function() {
    /*
     * Runs every weekday (Monday through Friday)
     * at 15:00:00 PM.
     */

     // delete add 1 days
     var today = moment().startOf('day');

     //get the faculty collection
     db.collection('faculty').find().toArray((err, result) => {
       if (err) {
         throw err;
       }

       //for each language department
       result.forEach(function(object, objectIndex) {
         db.collection('dates').find({date: today.utc().format()}).toArray((err, result) => {
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
                 mail.sendProfTA(object, guestNamesList, today.format("MM-DD-YYYY"), emails);
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
// console.log("The emails to TA's and professors will be sent at: "+hour+":"+minute+":"+(second+20)+"\n");
sendEmailToFacultyJob.start();
