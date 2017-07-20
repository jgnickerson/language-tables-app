"use strict";
const bodyParser = require('body-parser');
const mail = require('./mail.js');
const constants = require('./constants.js');
const _ = require('lodash');
const excelbuilder = require('msexcel-builder');
const fs = require('fs');
const XLSX = require('xlsx');
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

//returns an array of language objects a list of dates
function getLanguageDate(dates, language) {
  if (typeof dates === 'string') {
    dates = [dates];
  }
  return new Promise((resolve, reject)=> {
    db.collection('dates').find({date: { $in: dates }, 'vacancy.language': language})
    .toArray((err, result) => {
      if (err) {
        reject(err);
      }

      const langObjects = result.map(dateObject => _.find(dateObject.vacancy, {'language': language}));
      resolve(langObjects);
    })
  });
}

function handleError(response, reason) {
  console.log(reason);
  response.sendStatus(500);
}

app.post('/restrictions', (req, res) => {
  const date = req.body.date;
  const language = req.body.language;
  const id = req.body.id;

  if (id !== "000GUEST") {
    //check if they've signed up for that day already, and if they have not, get language restrictions
    const languageRestrictions = getLanguageDate(date, language).then(langObjects =>{
      if (langObjects[0].guestlist.includes(id)) {
        res.send({ maySignup: false, message: "You have already signed up for this day."});
        return;
      } else {
        return db.collection('restrictions').findOne({language: language});
      }
    }, reason => {handleError(res, reason)});


    // check if there are language restrictions
    const periodDates = languageRestrictions.then(langRestrictions => {
      if (langRestrictions) {
        const period = langRestrictions.periods.find(period => period.dates.includes(date));

        if (moment().isBefore(period.signupStartDate)) {
          res.send({maySignup: false, message: period.signupErrorMessage});
          return;
        }

        return getLanguageDate(period.dates, language);

      } else {
        res.send({maySignup: true, message: ""});
        return;
      }
    }, reason => {handleError(res, reason)});


    Promise.all([languageRestrictions, periodDates]).then(results => {
      const langRestrictions = results[0];
      const periodDates = results[1];

      //we haven't yet sent a response, meaning we have to check period
      if (!res.headersSent) {
        let count = langRestrictions.signupsAllowed;
        periodDates.forEach(date => {
          if (date.guestlist.includes(id)) {
            count--;
          }
        });

        if (count <= 0) {
          res.send({maySignup: false, message: langRestrictions.errorMessage});
        } else {
          res.send({maySignup: true, message: ""});
        }
      }
    }, reason=> {handleError(res, reason)});

  //person is a Guest, and can signup
  } else {
    res.send({maySignup: true, message: ""});
  }
});


// '/languages' or '/languages?id=x' routes
app.get('/languages', (req, res) => {
  // if no id, output all the languages and their number in an array
  // *** is undefined the way to check "if x == NULL" in JS?
  if (req.query.id === undefined) {
    let languages = Object.entries(constants.languages);
    let date = moment().startOf('day').utc().format();

    let timeZoneString = date.substring(10, date.length);
    // console.log(timeZoneString);
    if (timeZoneString !== "T05:00:00Z") {
      date = _.replace(date, timeZoneString, "T05:00:00Z")
    }

    db.collection('dates').find({date: date})
      .toArray(function(err, result) {
      if (err) {
        throw err;
      }
      let tables;
      if (result[0]) {
        tables = result[0].vacancy;
      } else {
        tables = [];
      }

      languages = languages.map((lang) => {
        let tablesOf6, tablesOf8, location,
          langObj = _.find(tables, function(o) { return o.language === lang[1]; });
        if (langObj) {
          tablesOf6 = langObj.tablesOf6;
          tablesOf8 = langObj.tablesOf8;
          location = langObj.location;
        } else {
          tablesOf6 = 0;
          tablesOf8 = 0;
          location = "inside";
        }
        return {language       : lang[1],
                language_string: lang[0],
                tablesOf6      : tablesOf6,
                tablesOf8      : tablesOf8,
                location       : location}
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

  console.log("canceling a reservation...")
  //uncomment below for actual implementation
  var encodedString = req.query.reservation;

  var decodedString = new Buffer(encodedString, 'base64').toString('ascii');

  var language = Number.parseInt(decodedString.substring(0, 2), 10);
  var id = decodedString.substring(2, 10);
  var date = decodedString.substring(10, 30);
  var name = decodedString.substring(30, decodedString.length);

  let timeZoneString = date.substring(10, date.length);
  // console.log(timeZoneString);
  if (timeZoneString !== "T05:00:00Z") {
    date = _.replace(date, timeZoneString, "T05:00:00Z")
  }

  console.log("language: "+language +"\n");
  console.log("id: "+id +"\n");
  console.log("date: "+date +"\n");
  console.log("name: "+name +"\n");

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
        guestlist.push(luckyID[0]);

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
  var waitlisters = [];
  var promises = [];

  let timeZoneString = date.substring(10, date.length);
  // console.log(timeZoneString);
  if (timeZoneString !== "T05:00:00Z") {
    date = _.replace(date, timeZoneString, "T05:00:00Z")
  }

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
                  langAttendants.push({
                    id: "RESERVED",
                    name: "Teaching Assistant/Faculty",
                    language: lang.language
                  });
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

      promises.push(new Promise((resolve, reject) => {
        db.collection('attendants').find({ id: { $in: lang.waitlist }, 'waitlists.language': lang.language }).toArray()
        .then((result) => {
          if (result.length > 0) {
            var alreadyCheckedGuest = false;
            var langWaitlisters = [];
            result.forEach((item) => {
              if (item.id === "000GUEST" && !alreadyCheckedGuest) {
                alreadyCheckedGuest = true;
                var guests = _.filter(item.waitlists, (day) => {
                  return moment(day.date).isSame(date, 'day') && day.language === lang.language
                });
                guests.forEach((guest) => {
                  langWaitlisters.push({
                    id: item.id,
                    name: guest.name,
                    language: guest.language
                  })
                })
              } else {
                var theOneWeNeed = _.find(item.waitlists, (day) => {
                  return moment(day.date).isSame(date, 'day') && day.language === lang.language
                });

                if (theOneWeNeed !== undefined) {
                  langWaitlisters.push({
                    id: item.id,
                    name: theOneWeNeed.name,
                    language: theOneWeNeed.language,
                    checked: theOneWeNeed.checked ? theOneWeNeed.checked : false
                  });
                }
              }

            });
            waitlisters = waitlisters.concat(langWaitlisters);
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
      res.json({date: date, attendants: attendants, waitlisters: waitlisters});
    })
  })
  .catch((error) => {
    res.sendStatus(404);
  });
});

app.patch('/attendance', (req, res) => {
  let body = req.body; // {id: '00000000', language: '00'};
  let date = moment().startOf('day').utc().format();
  let attendants = db.collection('attendants');
  let dates = db.collection('dates');

  let timeZoneString = date.substring(10, date.length);
  // console.log(timeZoneString);
  if (timeZoneString !== "T05:00:00Z") {
    date = _.replace(date, timeZoneString, "T05:00:00Z")
  }

  // handle the change of location
  if (body.locationChange) {
    dates.update(
      { date: date, "vacancy.language": body.language },
      { $set: {"vacancy.$.location": body.location }},
    (err, result) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }

      res.sendStatus(200);
      return;
    });

  // handle checking off
  } else {
    if (body.waitlist) {
      // finds the student, moves him from waitlist to guestlist and checks their attendance

      // in attendants collection...
      attendants.find({ id : body.id }).forEach(function(doc) {

        // remove him/her from the waitlist in attendance collection
        var removedItems = _.remove(doc.waitlists, function(object) {
          return object.date === date && object.language === body.language
        });

        // add him/her to the guestlist in attendance collection
        removedItems.forEach(function(item) {
          item.checked = body.checked;
          if (doc.attendance) {
            doc.attendance.push(item);
          } else {
            doc.attendance = [item];
          }
        });

        // save
        attendants.save(doc).then(function(response) {
          // if successful
          if (response.result.ok) {
            // make sure removedItems is not empty
            if (removedItems[0]) {
              // update the dates collection...
              dates.find({date: date}).forEach(function(doc) {
                // find index of the language we need
                var index = doc.vacancy.findIndex((element) => {
                  return element.language === body.language;
                });

                // remove student from the waitlist in dates collection
                var removed = _.remove(doc.vacancy[index].waitlist, function(id) {
                  return id === body.id
                });

                // add him/her to the guestlist in dates collection
                removed.forEach(function(item) {
                  doc.vacancy[index].guestlist.push(item);

                  //increment seatsReserved and seatsAvailable
                  doc.vacancy[index].seatsReserved ++;
                  doc.vacancy[index].seatsAvailable ++;
                });

                // save
                dates.save(doc).then(function(response) {
                  if (response.result.ok) {
                    // make sure removed is not empty
                    if (removed[0]) {
                      res.sendStatus(200);
                    } else {
                      console.log("Error: no waitlist record in dates collection. Student ID: " + body.id);
                      res.sendStatus(500);
                    }
                  } else {
                    console.log("Error saving the new guest info in dates collection. Student ID: " + body.id);
                    res.sendStatus(500);
                  }
                });
              });

            } else {
              console.log("Error: no waitlist record in attendance collection. Student ID: " + body.id);
              res.sendStatus(500);
            }

          } else {
            console.log("Error saving the new guest info in attendance collection. Student ID: " + body.id);
            res.sendStatus(500);
          }
        });
      });

    } else {
      //finds the student and either "checks" or "unchecks" their attendance for today
      attendants.update(
        { id : body.id, attendance: {  $elemMatch : { date : date, language : body.language }}},
        { $set : { "attendance.$.checked" : body.checked }},
      (err, result) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
          return;
        }

        res.sendStatus(200);
        return;
      });
    }
  }
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
  cronTime: "00 15 11 * * 1-5",
  onTick: function() {
    /*
     * Runs Monday through Friday
     * at 11:15:00 AM.
     */
     algorithm.run(db, moment, _);
  },
  start: false,
  timeZone: 'America/New_York'
});


// for testing:
// second+" "+minute+" "+hour+" * * 1-5"
var sendDailyEmailToFacultyJob = new CronJob({
  cronTime: "00 30 14 * * 1-5",
  onTick: function() {
    /*
     * Runs every weekday (Monday through Friday)
     * at 14:30:00 PM.
     */
     var today = moment().startOf('day').utc().format();

     var timeZoneString = today.substring(10, today.length);
     // console.log(timeZoneString);
     if (timeZoneString !== "T05:00:00Z") {
       today = _.replace(today, timeZoneString, "T05:00:00Z")
     }

     //get the faculty collection
     db.collection('faculty').find().toArray((err, result) => {
       if (err) {
         console.log(err);
         return;
       }
       //for each language department
       result.forEach(function(object, objectIndex) {
         db.collection('dates').find({date: today}).toArray((err, result) => {
           if (err) {
             console.log(err);
             return;
           }

           // make sure to operate only on defined variables
           if (result[0]) {
             var guestList = result[0].vacancy[object.language].guestlist;
             var guestNamesList = [];
             var emails = [];

             //get emails of TA's and Professors for this language
             object.faculty.forEach((facultyMember, facultyMemberIndex) => {
               if (facultyMember.daily === true) {
                 emails.push(facultyMember.email);
               }
             });

             //no need to go through this hell if no emails to send to
             if (emails.length > 0) {
               var reservedCount = _.countBy(guestList, _.identity)["RESERVED"];
               var lengthToSend = guestList.length - reservedCount;
               var alreadyAddedAllGuests = false;
               var emailSent = false;

               var promises = [];

               //get the names of the attendants by their id
               guestList.forEach((guestId, guestIndex) => {
                 promises.push(new Promise((resolve, reject) => {
                     db.collection('attendants').find({id: guestId}).toArray((err, result) => {
                       if (err) {
                         console.log(err);
                         return;
                       }
                       if (guestId !== "RESERVED") {

                         if (guestId === "000GUEST") {
                           if (!alreadyAddedAllGuests) {
                             alreadyAddedAllGuests = true;
                             var theMany = _.filter(result[0].attendance, {'date': today, 'language': object.language, 'checked':true});
                             theMany.forEach((one) => {
                               guestNamesList.push(one.name);
                             });
                           }
                         } else {
                           var theOne = _.find(result[0].attendance, {'date': today, 'language': object.language, 'checked':true});
                           if (theOne !== undefined) {
                             guestNamesList.push(theOne.name);
                           }
                         }
                      }

                      resolve();

                     });

                 }));
               });

               Promise.all(promises).then(() => {
                 guestNamesList = _.sortBy(guestNamesList, [_.identity]);
                 mail.sendProfTA(object, guestNamesList, moment(today).format("dddd, MMMM Do"), emails);
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

// for testing:
// cronTime: (second)+" "+minute+" "+hour+" * * 5"
var sendWeeklyEmailToFacultyJob = new CronJob({
  cronTime: "00 00 16 * * 5",
  onTick: function() {
    /*
     * Runs every Friday
     * at 16:00:00 PM.
     */
    var today = moment().startOf('day').utc().format();

    var timeZoneString = today.substring(10, today.length);
    // console.log(timeZoneString);
    if (timeZoneString !== "T05:00:00Z") {
      today = _.replace(today, timeZoneString, "T05:00:00Z")
    }

    var thisWeek = [today];
    for (var i = 1; i < 5; i++) {
      let day = moment(today).subtract(i, 'day').utc().format();
      let timeZoneString = day.substring(10, day.length);
      if (timeZoneString !== "T05:00:00Z") {
        day = _.replace(day, timeZoneString, "T05:00:00Z")
      }
      thisWeek.push(day);
    }

    //check if there were any language tables this week
    //if not, do not send the weekly report
    db.collection('dates').find({date: {$in: thisWeek}}).toArray((err, yestables) => {
      if (err) {
        console.log(err);
      }

      // if there were tables this week
      if (yestables[0]) {

        //get the faculty collection
        db.collection('baseline').find().toArray((err, baselineResult) => {
          if (err) {
            console.log(err);
            //return;
          }
          db.collection('attendants').find(
            {id: {$nin: ["000GUEST", "RESERVED"]}}
          ).toArray((err, attendantsResult) => {
            if (err) {
              console.log(err);
              //return;
            }

            baselineResult.forEach(function(langObj) {
              // Create a new workbook file in current working-path
              var fileName = langObj.language_string+".xlsx";
              var dir = './weekly-reports/'+moment().startOf('day').utc().format().substring(0,10);

              if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
              }
              var workbook = excelbuilder.createWorkbook(dir, fileName)
              var coursePromises = [];

              /*JAPANESE DEPARTMENT WANTS LASTNAMES TOO, LATER INCORPORATE FOR ALL LANGS*/
              if (langObj.language === 7) {
                langObj.courses.forEach(function(courseVal) {
                  //Faculty/Staff causes error?.. don't need their info anyway
                  if (courseVal !== "Faculty/Staff") {
                    coursePromises.push(new Promise((resolve, reject) => {

                      var sheet = workbook.createSheet(courseVal, 10, 100);
                      // format the cells
                      sheet.width(1, 20);
                      sheet.width(2, 20);
                      sheet.width(3, 20);
                      sheet.width(4, 10);
                      sheet.width(5, 10);
                      sheet.width(6, 10);
                      sheet.width(7, 10);
                      sheet.width(8, 10);
                      sheet.width(9, 20);
                      sheet.width(10, 20);

                      // put in the data
                      sheet.set(1, 1, 'Last Name');
                      sheet.set(2, 1, 'First Name');
                      sheet.set(3, 1, 'ID');
                      sheet.set(4, 1, 'Monday');
                      sheet.set(5, 1, 'Tuesday');
                      sheet.set(6, 1, 'Wednesday');
                      sheet.set(7, 1, 'Thursday');
                      sheet.set(8, 1, 'Friday');
                      sheet.set(9, 1, 'THIS WEEK [TOTAL]');
                      sheet.set(10, 1, 'THIS SEMESTER [TOTAL]');

                      // make the first row bold
                      for (var i = 1; i < 11; i++) {
                        sheet.font(i, 1, {bold:'true'});
                      }

                      var courseAttendants = _.filter(attendantsResult,
                        { attendance: [ {
                            course: courseVal,
                            language: langObj.language
                        } ]});
                      //console.log(courseAttendants);
                      if (courseAttendants) {
                        for (var i = 0; i < courseAttendants.length; i++) {
                          if (courseAttendants[i].id) {
                            var nameArray = courseAttendants[i].attendance[0].name.split(/[, ]+/);

                            //hardcoded exception for now...
                            if (courseAttendants[i].attendance[0].name === "Madison Jean Philippe") {
                              var lastName = nameArray.pop();
                              lastName = nameArray.pop() + " "+ lastName;

                              var firstName = nameArray.join(' ');

                            } else {
                              var lastName = nameArray.pop();

                              var firstName = nameArray.join(' ');
                            }

                            sheet.set(1, i+2, lastName);
                            sheet.set(2, i+2, firstName);
                            sheet.set(3, i+2, courseAttendants[i].id);

                            var totalVisits = _.remove(courseAttendants[i].attendance, {course: courseVal, checked: true});
                            sheet.set(10, i+2, totalVisits.length);

                            var thisWeekVisits = _(totalVisits).keyBy('date').at(thisWeek).filter().value();
                            var monday = 0;
                            var tuesday = 0;
                            var wednesday = 0;
                            var thursday = 0;
                            var friday = 0;

                            thisWeekVisits.forEach((visit) => {
                              if (moment(visit.date).day() == 1) {
                                monday++;
                              } else if(moment(visit.date).day() == 2) {
                                tuesday++;
                              } else if(moment(visit.date).day() == 3) {
                                wednesday++;
                              } else if(moment(visit.date).day() == 4) {
                                thursday++;
                              } else if(moment(visit.date).day() == 5) {
                                friday++;
                              }
                            });

                            sheet.set(4, i+2, monday);
                            sheet.set(5, i+2, tuesday);
                            sheet.set(6, i+2, wednesday);
                            sheet.set(7, i+2, thursday);
                            sheet.set(8, i+2, friday);

                            sheet.set(9, i+2, thisWeekVisits.length);
                          }
                        }
                      }

                      resolve();

                    }));
                  }
                });
              } else {
                langObj.courses.forEach(function(courseVal) {
                  //Faculty/Staff causes error?.. don't need their info anyway
                  if (courseVal !== "Faculty/Staff") {
                    coursePromises.push(new Promise((resolve, reject) => {

                      var sheet = workbook.createSheet(courseVal, 9, 100);
                      // format the cells
                      sheet.width(1, 20);
                      sheet.width(2, 20);
                      sheet.width(3, 10);
                      sheet.width(4, 10);
                      sheet.width(5, 10);
                      sheet.width(6, 10);
                      sheet.width(7, 10);
                      sheet.width(8, 20);
                      sheet.width(9, 20);

                      // put in the data
                      sheet.set(1, 1, 'Name');
                      sheet.set(2, 1, 'ID');
                      sheet.set(3, 1, 'Monday');
                      sheet.set(4, 1, 'Tuesday');
                      sheet.set(5, 1, 'Wednesday');
                      sheet.set(6, 1, 'Thursday');
                      sheet.set(7, 1, 'Friday');
                      sheet.set(8, 1, 'THIS WEEK [TOTAL]');
                      sheet.set(9, 1, 'THIS SEMESTER [TOTAL]');

                      // make the first row bold
                      for (var i = 1; i < 10; i++) {
                        sheet.font(i, 1, {bold:'true'});
                      }

                      var courseAttendants = _.filter(attendantsResult,
                        { attendance: [ {
                            course: courseVal,
                            language: langObj.language
                        } ]});
                      //console.log(courseAttendants);
                      if (courseAttendants) {
                        for (var i = 0; i < courseAttendants.length; i++) {
                          if (courseAttendants[i].id) {
                            sheet.set(1, i+2, courseAttendants[i].attendance[0].name);
                            sheet.set(2, i+2, courseAttendants[i].id);

                            var totalVisits = _.remove(courseAttendants[i].attendance, {course: courseVal, checked: true});
                            sheet.set(9, i+2, totalVisits.length);

                            var thisWeekVisits = _(totalVisits).keyBy('date').at(thisWeek).filter().value();
                            var monday = 0;
                            var tuesday = 0;
                            var wednesday = 0;
                            var thursday = 0;
                            var friday = 0;

                            thisWeekVisits.forEach((visit) => {
                              if (moment(visit.date).day() == 1) {
                                monday++;
                              } else if(moment(visit.date).day() == 2) {
                                tuesday++;
                              } else if(moment(visit.date).day() == 3) {
                                wednesday++;
                              } else if(moment(visit.date).day() == 4) {
                                thursday++;
                              } else if(moment(visit.date).day() == 5) {
                                friday++;
                              }
                            });

                            sheet.set(3, i+2, monday);
                            sheet.set(4, i+2, tuesday);
                            sheet.set(5, i+2, wednesday);
                            sheet.set(6, i+2, thursday);
                            sheet.set(7, i+2, friday);

                            sheet.set(8, i+2, thisWeekVisits.length);
                          }
                        }
                      }

                      resolve();

                    }));
                  }
                });
              }

              Promise.all(coursePromises).then(() => {
                workbook.save(function(err) {
                  if (err) {
                    console.log("ERROR creating workbook for "+ langObj.language_string);
                    console.log(err);
                    workbook.cancel();
                  } else {
                    console.log('The workbook for '+langObj.language_string+' was created.');

                    //send the email here
                    db.collection('faculty').find({language: langObj.language}).toArray((err, facultyResult) => {
                      if (err) {
                        console.log(err);
                        //return;
                      }

                      var emails = _.filter(facultyResult[0].faculty, {weekly: true});
                      emails = emails.map((emailObj) => {
                        return emailObj.email;
                      });

                      var emailObj = {
                        language: langObj.language,
                        language_string: langObj.language_string,
                        folder: moment().startOf('day').utc().format().substring(0,10),
                        emails: emails
                      };

                      mail.sendWeeklyReport(emailObj);
                    });
                  }
                });
              });
            });
          });
        });

      // if there were no tables this week
      } else {
        console.log("\n Did not generate weekly report -- no language tables this week.\n");
      }
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
    let tomorrow = moment().startOf('day').add(1, 'day').utc().format();

    let timeZoneString = tomorrow.substring(10, tomorrow.length);
    // console.log(timeZoneString);
    if (timeZoneString !== "T05:00:00Z") {
      tomorrow = _.replace(tomorrow, timeZoneString, "T05:00:00Z")
    }

    db.collection('dates').find({date: tomorrow}).toArray((err, result) => {
      if (err) {
        throw err;
      }

      // make sure to only operate on defined values
      if (result[0]) {
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
                    mail.sendReminderEmail(result[0], tomorrow);
                  });
                }
              } else {
                db.collection('attendants').find({id: guest}).toArray((err, result) => {
                  mail.sendReminderEmail(result[0], tomorrow);
                });
              }
            }

          });
        });
      }
    });
  },
  start: false,
  timeZone: 'America/New_York'
});

tableAllocationJob.start();
sendWeeklyEmailToFacultyJob.start()
sendDailyEmailToFacultyJob.start();
sendReminderEmailsJob.start();
