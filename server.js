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

app.get('/courses', (req, res) => {
  let language_id = Number.parseInt(req.query.lang);
  db.collection('baseline').find({language: language_id},{'courses': 1})
    .toArray(function(err, results) {
      if (err) {
        throw err;
      }
      res.send(results[0].courses);
  });
});

//TODO: MAKE THIS MORE GENERIC! (Also maybe GET not POST?)
app.post('/restrictions', (req, res) => {
  //just for now :(
  //sad two week periods

  //check Spanish restrictions
  if (req.body.language === 10) {
    let period1 = ["2017-02-20T05:00:00Z", "2017-02-21T05:00:00Z", "2017-02-22T05:00:00Z",
      "2017-02-23T05:00:00Z", "2017-02-24T05:00:00Z", "2017-02-27T05:00:00Z",
      "2017-02-28T05:00:00Z", "2017-03-01T05:00:00Z", "2017-03-02T05:00:00Z",
      "2017-03-03T05:00:00Z"];

    let period2 = ["2017-03-06T05:00:00Z", "2017-03-07T05:00:00Z", "2017-03-08T05:00:00Z",
      "2017-03-09T05:00:00Z", "2017-03-10T05:00:00Z", "2017-03-13T05:00:00Z",
      "2017-03-14T05:00:00Z", "2017-03-15T05:00:00Z", "2017-03-16T05:00:00Z",
      "2017-03-17T05:00:00Z"];

    let period3 = ["2017-03-20T05:00:00Z", "2017-03-21T05:00:00Z", "2017-03-22T05:00:00Z",
      "2017-03-23T05:00:00Z", "2017-03-24T05:00:00Z"];

    let period4 = ["2017-04-03T05:00:00Z", "2017-04-04T05:00:00Z", "2017-04-05T05:00:00Z",
      "2017-04-06T05:00:00Z", "2017-04-07T05:00:00Z", "2017-04-10T05:00:00Z",
      "2017-04-11T05:00:00Z", "2017-04-12T05:00:00Z", "2017-04-13T05:00:00Z",
      "2017-04-14T05:00:00Z"];

    let period5 = ["2017-04-17T05:00:00Z", "2017-04-18T05:00:00Z", "2017-04-19T05:00:00Z",
      "2017-04-20T05:00:00Z", "2017-04-21T05:00:00Z", "2017-04-24T05:00:00Z",
      "2017-04-25T05:00:00Z", "2017-04-26T05:00:00Z", "2017-04-27T05:00:00Z",
      "2017-04-28T05:00:00Z"];

    let period6 = ["2017-05-01T05:00:00Z", "2017-05-02T05:00:00Z", "2017-05-03T05:00:00Z",
      "2017-05-04T05:00:00Z", "2017-05-05T05:00:00Z", "2017-05-08T05:00:00Z",
      "2017-05-09T05:00:00Z", "2017-05-10T05:00:00Z", "2017-05-11T05:00:00Z",
      "2017-05-12T05:00:00Z"];

    let maySignUp = true;
    let dates = [];

    if (period1.includes(req.body.date)) {
      dates = period1;
    } else if (period2.includes(req.body.date)) {
      dates = period2;
    } else if (period3.includes(req.body.date)) {
      dates = period3;
    } else if (period4.includes(req.body.date)) {
      dates = period4;
    } else if (period5.includes(req.body.date)) {
      dates = period5;
    } else if (period6.includes(req.body.date)) {
      dates = period6;
    }

    db.collection('dates').find({date: { $in: dates }, 'vacancy.language': req.body.language})
      .toArray(function(err,result) {
        if (err) {
          throw err;
        }
        result.forEach((obj) => {
          let langObj = _.find(obj.vacancy, { 'language': req.body.language });
          if (langObj.guestlist.includes(req.body.id)) {
            maySignUp = false;
          }
        });
        res.send(maySignUp);
    });

  // check Japanese restrictions
  } else if (req.body.language === 7) {
    let period1 = ["2017-02-27T05:00:00Z", "2017-02-28T05:00:00Z", "2017-03-01T05:00:00Z",
      "2017-03-02T05:00:00Z", "2017-03-03T05:00:00Z", "2017-03-06T05:00:00Z",
      "2017-03-07T05:00:00Z", "2017-03-08T05:00:00Z", "2017-03-09T05:00:00Z",
      "2017-03-10T05:00:00Z"];

    let period2 = ["2017-03-13T05:00:00Z", "2017-03-14T05:00:00Z", "2017-03-15T05:00:00Z",
    "2017-03-16T05:00:00Z", "2017-03-17T05:00:00Z", "2017-03-20T05:00:00Z",
    "2017-03-21T05:00:00Z", "2017-03-22T05:00:00Z", "2017-03-23T05:00:00Z"];

    let period3 = ["2017-04-03T05:00:00Z", "2017-04-04T05:00:00Z", "2017-04-05T05:00:00Z",
    "2017-04-06T05:00:00Z", "2017-04-07T05:00:00Z", "2017-04-10T05:00:00Z",
    "2017-04-11T05:00:00Z", "2017-04-12T05:00:00Z", "2017-04-13T05:00:00Z",
    "2017-04-14T05:00:00Z"];

    let period4 = ["2017-04-17T05:00:00Z", "2017-04-18T05:00:00Z", "2017-04-19T05:00:00Z",
      "2017-04-20T05:00:00Z", "2017-04-21T05:00:00Z", "2017-04-24T05:00:00Z",
      "2017-04-25T05:00:00Z", "2017-04-26T05:00:00Z", "2017-04-27T05:00:00Z",
      "2017-04-28T05:00:00Z"];

    let period5 = ["2017-05-01T05:00:00Z", "2017-05-02T05:00:00Z", "2017-05-03T05:00:00Z",
      "2017-05-04T05:00:00Z", "2017-05-05T05:00:00Z", "2017-05-08T05:00:00Z",
      "2017-05-09T05:00:00Z", "2017-05-10T05:00:00Z", "2017-05-11T05:00:00Z",
      "2017-05-12T05:00:00Z"];

    let maySignUp = true;
    let dates = [];

    if (period1.includes(req.body.date)) {
      dates = period1;
    } else if (period2.includes(req.body.date)) {
      dates = period2;
    } else if (period3.includes(req.body.date)) {
      dates = period3;
    } else if (period4.includes(req.body.date)) {
      dates = period4;
    } else if (period5.includes(req.body.date)) {
      dates = period5;
    }

    db.collection('dates').find({date: { $in: dates }, 'vacancy.language': req.body.language})
      .toArray(function(err,result) {
        if (err) {
          throw err;
        }
        let count = 0;
        result.forEach((obj) => {
          let langObj = _.find(obj.vacancy, { 'language': req.body.language });
          //console.log(langObj);
          if (langObj.guestlist.includes(req.body.id)) {
            count++;
            if (count === 3) {
              maySignUp = false;
            }
          }
        });
        res.send(maySignUp);
    });

  // check Chinese restrictions
  } else if (req.body.language === 2) {
    let week1 = ["2017-02-27T05:00:00Z", "2017-02-28T05:00:00Z", "2017-03-01T05:00:00Z",
      "2017-03-02T05:00:00Z", "2017-03-03T05:00:00Z"];
    let week2 = ["2017-03-06T05:00:00Z", "2017-03-07T05:00:00Z", "2017-03-08T05:00:00Z",
      "2017-03-09T05:00:00Z", "2017-03-10T05:00:00Z"]
    let week3 = ["2017-03-13T05:00:00Z", "2017-03-14T05:00:00Z", "2017-03-15T05:00:00Z",
      "2017-03-16T05:00:00Z", "2017-03-17T05:00:00Z"];
    let week4 = ["2017-03-20T05:00:00Z", "2017-03-21T05:00:00Z", "2017-03-22T05:00:00Z",
      "2017-03-23T05:00:00Z"];
    let week5 = ["2017-04-03T05:00:00Z", "2017-04-04T05:00:00Z", "2017-04-05T05:00:00Z",
      "2017-04-06T05:00:00Z", "2017-04-07T05:00:00Z"];
    let week6 = ["2017-04-10T05:00:00Z", "2017-04-11T05:00:00Z", "2017-04-12T05:00:00Z",
      "2017-04-13T05:00:00Z", "2017-04-14T05:00:00Z"];
    let week7 = ["2017-04-17T05:00:00Z", "2017-04-18T05:00:00Z", "2017-04-19T05:00:00Z",
      "2017-04-20T05:00:00Z", "2017-04-21T05:00:00Z"];
    let week8 = ["2017-04-24T05:00:00Z", "2017-04-25T05:00:00Z", "2017-04-26T05:00:00Z",
      "2017-04-27T05:00:00Z", "2017-04-28T05:00:00Z"];
    let week9 = ["2017-05-01T05:00:00Z", "2017-05-02T05:00:00Z", "2017-05-03T05:00:00Z",
      "2017-05-04T05:00:00Z", "2017-05-05T05:00:00Z"];
    let week10 = ["2017-05-08T05:00:00Z", "2017-05-09T05:00:00Z", "2017-05-10T05:00:00Z",
      "2017-05-11T05:00:00Z", "2017-05-12T05:00:00Z"];

    let maySignUp = true;
    let dates = [];

    if (week1.includes(req.body.date)) {
      dates = week1;
    } else if (week2.includes(req.body.date)) {
      dates = week2;
    } else if (week3.includes(req.body.date)) {
      dates = week3;
    } else if (week4.includes(req.body.date)) {
      dates = week4;
    } else if (week5.includes(req.body.date)) {
      dates = week5;
    } else if (week6.includes(req.body.date)) {
      dates = week6;
    } else if (week7.includes(req.body.date)) {
      dates = week7;
    } else if (week8.includes(req.body.date)) {
      dates = week8;
    } else if (week9.includes(req.body.date)) {
      dates = week9;
    } else if (week10.includes(req.body.date)) {
      dates = week10;
    }

    db.collection('dates').find({date: { $in: dates }, 'vacancy.language': req.body.language})
      .toArray(function(err,result) {
        if (err) {
          throw err;
        }
        let count = 0;
        result.forEach((obj) => {
          let langObj = _.find(obj.vacancy, { 'language': req.body.language });
          //console.log(langObj);
          if (langObj.guestlist.includes(req.body.id)) {
            count++;
            if (count === 2) {
              maySignUp = false;
            }
          }
        });
        res.send(maySignUp);
    });
  }
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
      let tables, langObj, tablesOf6, tablesOf8;
      if (result[0] !== undefined) {
        tables = result[0].vacancy;
      } else {
        tables = [];
      }

      languages = languages.map((lang) => {
        langObj = _.find(tables, function(o) { return o.language === lang[1]; });
        if (langObj !== undefined) {
          tablesOf6 = langObj.tablesOf6;
          tablesOf8 = langObj.tablesOf8;
        } else {
          tablesOf6 = 0;
          tablesOf8 = 0;
        }
        return {language       : lang[1],
                language_string: lang[0],
                tablesOf6      : tablesOf6,
                tablesOf8      : tablesOf8}
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
            seats: element.vacancy[0].seatsAvailable - element.vacancy[0].seatsReserved,
            tablesOf6: element.vacancy[0].tablesOf6,
            tablesOf8: element.vacancy[0].tablesOf8,
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
  let guestlistFull = false;

  let date = req.body.date;
  let timeZoneString = date.substring(10, date.length);
  // console.log(timeZoneString);
  if (timeZoneString !== "T05:00:00Z") {
    date = _.replace(date, timeZoneString, "T05:00:00Z")
  }

  db.collection('dates').find({date:date}).toArray(function(err, result) {
    if (err) {
      console.log(err);
      res.send(500);
      return;
    }

    let language = result[0].vacancy[req.body.language]

    if (language.seatsAvailable - language.seatsReserved === 0) {
      guestlistFull = true;
    }

    if (guestlistFull) {
      //add a new record of waitlists for the student
      db.collection('attendants').update(
        { id: req.body.id },
        {
         $push: { waitlists: { date: date,
                               language: req.body.language,
                               course: req.body.course,
                               name: req.body.name,
                               email: req.body.email } }
        },
        { upsert: true },
        function(err, result) {
          if (err) {
            console.log(err);
            res.send(500);
            return;
          }

          //add the student id to the date's waitlist
          db.collection('dates').update(
            {date: date, "vacancy.language": req.body.language},
            {$push: {"vacancy.$.waitlist": req.body.id}},
            function(err, result) {
              if (err) {
                console.log(err);
                res.send(500);
                return;
              }

              //send a waitlister message
              mail.send(req.body, true);
              //send a success status to the client
              res.sendStatus(200);

          });
        }
      );



    } else {
      //add a new record of attendance for the student
      db.collection('attendants').update(
        { id: req.body.id },
        {
         $push: { attendance: { date: date,
                               language: req.body.language,
                               course: req.body.course,
                               name: req.body.name,
                               email: req.body.email } }
        },
        { upsert: true },
        function(err, result) {
          if (err) {
            console.log(err);
            res.send(500);
            return;
          }

          //increment the number of reserved seats at the given language at the given date
          db.collection('dates').update(
            { date: date, "vacancy.language": req.body.language },
            {
              $inc: {"vacancy.$.seatsReserved": 1},
              $push: {"vacancy.$.guestlist": req.body.id}
            }, function(err, result) {
              if (err) {
                console.log(err);
                res.send(500);
                return;
              }

              //send a guestlist message
              mail.send(req.body, false);
              //send a success status to the client
              res.sendStatus(200);
            }
          );
        }
      );
    }
  });
});

// '/cancel' or '/cancel?reservation=x' routes
app.get('/cancel', (req, res) => {

  //uncomment below for actual implementation
  var encodedString = req.query.reservation;
  //var string = "1006666662016-12-05T05:00:00.000Z"
  //var encodedString = new Buffer(string).toString('base64');
  var decodedString = new Buffer(encodedString, 'base64').toString('ascii');

  var language = Number.parseInt(decodedString.substring(0, 2), 10);
  var id = decodedString.substring(2, 10);
  var date = decodedString.substring(10, 30);
  var name = decodedString.substring(30, decodedString.length);

  // console.log(language +"\n");
  // console.log(id +"\n");
  // console.log(date +"\n");
  // console.log(name +"\n");

  let timeZoneString = date.substring(10, date.length);
  // console.log(timeZoneString);
  if (timeZoneString !== "T05:00:00Z") {
    date = _.replace(date, timeZoneString, "T05:00:00Z")
  }

  // remove the reservation from dates collection
  db.collection('dates').find(
    {'date': date},
    {'vacancy': {$elemMatch: {'language': language}}}).toArray((err, result) => {
    if (err) {
      console.log(err);
      res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
      return;
    }

    //for convenience
    var waitlist = result[0].vacancy[0].waitlist;
    var guestlist = result[0].vacancy[0].guestlist;
    var seatsReserved = result[0].vacancy[0].seatsReserved;

    // if the attendant is on the waitlist for that language on that day
    if (waitlist.includes(id)) {

      // remove him from wailtlist
      var index = waitlist.indexOf(id);
      waitlist.splice(index, 1);

      // update the waitlist in attendants collection
      db.collection('attendants').update(
        { id: id },
        { $pull: { 'waitlists': { 'date' : date, 'language' : language, 'name' : name } } },
        function(err, results) {
          if (err) {
            console.log(err);
            res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
            return;
          }

          // update the waitlist in dates collection
          db.collection('dates').update(
            {'date': date, 'vacancy.language': language},
            {$set: {'vacancy.$.waitlist': waitlist}},
            function(err, result) {
              if (err) {
                console.log(err);
                res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
                return;
              }
            }
          );
        }
      );


    //if the attendant is on the guestlist for that language on that day
    } else if (guestlist.includes(id)) {

      // remove him from the guestlist
      var index = guestlist.indexOf(id);
      guestlist.splice(index, 1);

      // decrement the number of seats reserved
      seatsReserved--;

      //declare here, so we can check later
      let luckyID, luckyAttendant;

      // if waitlist is not empty
      if (waitlist.length > 0) {

        // remove waitlist[0]
        luckyID = waitlist.splice(0, 1);
        // push waitlist[0] to guestlist
        guestlist.push(luckyPerson[0]);

        // increment the number of seats reserved
        seatsReserved++;

        //send an email to the lucky person
        db.collection('attendants').find( { id: luckyID[0] },
          { 'waitlists': { $elemMatch: { 'date' : date, 'language' : language } } })
          .toArray((err, result) => {
          if (err) {
            console.log(err);
            res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
            return;
          }

          //used to send email after database is finished updating
          luckyAttendant = result[0].waitlists[0];

          // update the waitlists/attendance for the lucky person in attendants collection
          db.collection('attendants').bulkWrite([
            { updateOne: {
              filter: { id: luckyID[0] },
              update: { $pull: { 'waitlists': result[0].waitlists[0] } }
            }},
            { updateOne: {
              filter: { id: luckyID[0] },
              update: { $push: { 'attendance': result[0].waitlists[0] } }
            }}], { ordered: true },
            function(err, result) {
              if (err) {
                console.log(err);
                res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
                return;
              }

              // update the waitlist in dates collection
              db.collection('dates').update(
                {'date': date, 'vacancy.language': language},
                {$set: {'vacancy.$.waitlist': waitlist}},
                function(err, result) {
                  if (err) {
                    console.log(err);
                    res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
                    return;
                  }
                }
              );
            });
          });
        }

      // update the guestlist, number of seats in dates collection
      db.collection('dates').bulkWrite([
        { updateOne: {
          filter: {'date': date, 'vacancy.language': language},
          update: {$set: {'vacancy.$.guestlist': guestlist}}
        }},
        { updateOne: {
          filter: {'date': date, 'vacancy.language': language},
          update: {$set: {'vacancy.$.seatsReserved': seatsReserved}}
        }}], { ordered: true },
        function(err, result) {
          if (err) {
            console.log(err);
            res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
            return;
          }

          // update the attendance in attendants collection
          db.collection('attendants').update(
            { id: id },
            { $pull: { 'attendance': { 'date' : date, 'language' : language, 'name' : name } }
          }, function(err, result) {
            if (err) {
              console.log(err);
              res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again.</p>');
              return;
            }
          });

          if (luckyID && luckyAttendant) {
            mail.sendNewGuests(luckyAttendant.email, language, moment(date));
          }

          //successfully removed the attendant from all necessary places in the db, so send a success message
          res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">You have successfully canceled your reservation.</p>');
        }
      );
    }
  });
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
  var date = moment().startOf('day').utc().format();
  var attendants = [];
  var promises = [];

  //get today's date object
  db.collection('dates').find({ date: date }).toArray()
  .then((result) => {
    result[0].vacancy.forEach((lang) => {
      var countReserved = _.countBy(lang.guestlist, _.identity)["RESERVED"];
      promises.push(new Promise((resolve, reject) => {
        db.collection('attendants').find({ id: { $in: lang.guestlist }, 'attendance.language': lang.language }).toArray()
        .then((result) => {
          if (result.length > 0) {
            var alreadyCheckedGuest = false;
            var langAttendants = [];
            result.forEach((item) => {
              if (item.id === "000GUEST" && !alreadyCheckedGuest) {
                alreadyCheckedGuest = true;
                var guests = _.filter(item.attendance, (day) => {
                  return moment(day.date).isSame(date, 'day') && day.language === lang.language
                });
                guests.forEach((guest) => {
                  langAttendants.push({
                    id: item.id,
                    name: guest.name,
                    language: guest.language
                  })
                })
              } else if (item.id === "RESERVED") {
                for (var i = 0; i < countReserved; i++) {
                  if (lang.language === 2 || lang.language === 7) {
                    langAttendants.push({
                      id: "RESERVED",
                      name: "Temporary",
                      language: lang.language
                    });
                  } else {
                    langAttendants.push({
                      id: "RESERVED",
                      name: "Teaching Assistant/Faculty",
                      language: lang.language
                    });
                  }
                }
              } else {
                var theOneWeNeed = _.find(item.attendance, (day) => {
                  return moment(day.date).isSame(date, 'day') && day.language === lang.language
                });

                if (theOneWeNeed !== undefined) {
                  langAttendants.push({
                    id: item.id,
                    name: theOneWeNeed.name,
                    language: theOneWeNeed.language,
                    checked: theOneWeNeed.checked ? theOneWeNeed.checked : false
                  });
                }
              }

            });
            attendants = attendants.concat(langAttendants);
          }
          resolve();
        })
        .catch((error) => {
          console.log(error);
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

app.patch('/attendance', (req, res) => {
  let student = req.body; // {id: '00000000', language: '00'};
  let date = moment().startOf('day').utc().format();
  console.log(date);
  let attendants = db.collection('attendants');

  //finds the student and either "checks" or "unchecks" their attendance for today
  attendants.update(
    { id : student.id, attendance: {  $elemMatch : { date : date, language : student.language }}},
    { $set : { "attendance.$.checked" : student.checked }},
  (err, result) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
      return;
    }

    //console.log(result);

    res.sendStatus(200);
    return;
  });
});

// **** FOR TESTING *****
var timeToRun = moment().add(10, 'seconds');

var hour = timeToRun.hour();
var minute = timeToRun.minutes();
var second = timeToRun.seconds();
// ******

// for testing:
// cronTime: second+" "+minute+" "+hour+" * * 0-4",
var tableAllocationJob = new CronJob({
  cronTime: "00 00 20 * * 0-4",
  onTick: function() {
    /*
     * Runs Sunday through Thursday
     * at 20:00:00 PM.
     */
     algorithm.run(db, moment);
  },
  start: false,
  timeZone: 'America/New_York'
});


// for testing:
// second+" "+minute+" "+hour+" * * 1-5"
var sendEmailToFacultyJob = new CronJob({
  cronTime: "00 30 14 * * 1-5",
  onTick: function() {
    /*
     * Runs every weekday (Monday through Friday)
     * at 14:30:00 PM.
     */
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
             if (facultyMember.daily === true) {
               emails.push(facultyMember.email);
             }
           });

           var reservedCount = _.countBy(guestList, _.identity)["RESERVED"];
           var lengthToSend = guestList.length - reservedCount;
           var alreadyAddedAllGuests = false;
           var emailSent = false;

           //get the names of the attendants by their id
           guestList.forEach((guestId, guestIndex) => {
             if (guestId !== "RESERVED") {
               db.collection('attendants').find({id: guestId}).toArray((err, result) => {
                 if (err) {
                   throw err;
                 }

                 if (guestId === "000GUEST") {
                   if (!alreadyAddedAllGuests) {
                     alreadyAddedAllGuests = true;
                     var theMany = _.filter(result[0].attendance, {'date': today.utc().format(), 'language': object.language});
                     theMany.forEach((one) => {
                       guestNamesList.push(one.name);
                     });
                   }
                 } else {
                   var theOne = _.find(result[0].attendance, {'date': today.utc().format(), 'language': object.language});
                   if (theOne !== undefined) {
                     guestNamesList.push(theOne.name);
                   }
                 }

                 // send the email if all names are added (one per lang)
                 if (guestNamesList.length === lengthToSend && !emailSent) {
                   emailSent = true;
                   guestNamesList = _.sortBy(guestNamesList, [_.identity]);
                   mail.sendProfTA(object, guestNamesList, today.format("dddd, MMMM Do"), emails);
                 }
               });
             }
           });
         });
       });
     });
  },
  start: false,
  timeZone: 'America/New_York'
});

var sendReminderEmailsJob = new CronJob({
  cronTime: "00 00 15 * * 0-4",
  onTick: function() {
    /*
     * Runs Sunday through Thursday
     * at 15:00:00 PM.
     */

    //send reminder emails the day before
    let tomorrow = moment().startOf('day').add(1, 'day');

    db.collection('dates').find({date: tomorrow.utc().format()}).toArray((err, result) => {
      if (err) {
        throw err;
      }
      let alreadySentToGUESTS = false;
      let guestlistsForTomorrow = result[0].vacancy;
      guestlistsForTomorrow.forEach((langObj, langObjIndex) => {
        langObj.guestlist.forEach((guest, guestIndex) => {

          if (guest !== "RESERVED") {
            if (guest === "000GUEST") {
              if (alreadySentToGUESTS === false) {
                // and don't send the email to guests again
                alreadySentToGUESTS = true;
                // send the reminder emails to all guests in one go
                db.collection('attendants').find({id: guest}).toArray((err, result) => {
                  mail.sendReminderEmail(result[0], tomorrow.utc().format());
                });
              }
            } else {
              db.collection('attendants').find({id: guest}).toArray((err, result) => {
                mail.sendReminderEmail(result[0], tomorrow.utc().format());
              });
            }
          }

        });
      });
    });
  },
  start: false,
  timeZone: 'America/New_York'
});

// TODO: start the tableAllocationJob week 2
// tableAllocationJob.start();

sendEmailToFacultyJob.start();
sendReminderEmailsJob.start();
