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
var ObjectID = require('mongodb').ObjectID;

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
      } else if (langObjects[0].waitlist.includes(id)) {
        res.send({ maySignup: false, message: "You are already waitlisted for this day."});
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
                               firstName: req.body.firstName,
                               lastName: req.body.lastName,
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
                               firstName: req.body.firstName,
                               lastName: req.body.lastName,
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

function isNumeric(n) {
  return !Number.isNaN(parseFloat(n)) && isFinite(n);
}

// '/cancel' or '/cancel?reservation=x' routes
app.get('/cancel', (req, res) => {

  console.log("canceling a reservation...")
  var encodedString = req.query.reservation;
  var decodedString = new Buffer(encodedString, 'base64').toString('ascii');

  var language = Number.parseInt(decodedString.substring(0, 2), 10);
  var id = decodedString.substring(2, 10);
  var date = decodedString.substring(10, 30);
  //var name = decodedString.substring(30, decodedString.length);

  var firstNameLen;
  var firstNameFirstChar;
  //assume first names lengths are no longer than 2 digits
  //we also know definitely that 30th char is a number
  var condition = isNumeric(decodedString.substring(30, 32))
  if (condition) {
    firstNameLen = Number.parseInt(decodedString.substring(30, 32), 10);
    firstNameFirstChar = 32;
  } else {
    firstNameLen = Number.parseInt(decodedString.substring(30, 31), 10);
    firstNameFirstChar = 31;
  }

  var lastNameFirstChar = firstNameFirstChar + firstNameLen;

  var firstName = decodedString.substring(firstNameFirstChar, lastNameFirstChar);
  var lastName = decodedString.substring(lastNameFirstChar, decodedString.length);


  let timeZoneString = date.substring(10, date.length);
  // console.log(timeZoneString);
  if (timeZoneString !== "T05:00:00Z") {
    date = _.replace(date, timeZoneString, "T05:00:00Z")
  }
  //console.log(decodedString);
  console.log("firstNameLen: "+ firstNameLen);
  console.log("language: "+language);
  console.log("id: "+id);
  console.log("date: "+date);
  console.log("firstName: "+firstName);
  console.log("lastName: "+lastName +"\n");

  // in attendants collection...
  db.collection('attendants').find({ id : id }).toArray((err, result) => {
    if (err) {
      console.log(err);
      //send the error message to the user
      res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
      return;
    }

    var doc1 = result[0];

    // console.log("\nATTENDANTS DOC FOR THE ONE WHO IS CANCELLING [BEFORE]:");
    // console.log(JSON.stringify(doc1, null, 4));

    // find the record in both guestlist and waitlist (if exists)
    var indexGuest = doc1.attendance ? doc1.attendance.findIndex((object) => {
      return object.date === date && object.language === language && object.firstName === firstName && object.lastName === lastName;
    }) : -1;

    var indexWait = doc1.waitlists ? doc1.waitlists.findIndex((object) => {
      return object.date === date && object.language === language && object.firstName === firstName && object.lastName === lastName;
    }) : -1;

    if (indexGuest === -1 && indexWait === -1){
      // no record exists in attendance collection
      console.log("Error finding the guest info in attendants collection (for cancellation). Student ID: " + id)
      res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">No record of this reservation exists. It is likely that you have already cancelled this reservation.</p>');
      return;

    } else {

      // if appear both on guestlist and waitlist, prioritize guestlist
      // so that next on the line gets a seat -- guests can be figured out by the
      // headwaiter at the entrance.
      // (may happen with guests, since they are not restricted in signups)
      if (indexGuest > -1 && indexWait > -1) {
        indexWait = -1;
      }

      if (indexGuest > -1) {
        // remove from guestlist
        var removedItem = doc1.attendance.splice(indexGuest, 1);
      }

      if (indexWait > -1) {
        // remove from waitlist
        var removedItem = doc1.waitlists.splice(indexWait, 1);
      }

      // update the dates collection...
      db.collection('dates').find({date: date}).toArray((err, result) => {
        if (err) {
          console.log(err);
          //send the error message to the user
          res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
          return;
        }

        var doc2 = result[0];
        // console.log("\nDATES DOC [BEFORE]:");
        // console.log(JSON.stringify(doc2, null, 4));

        var indexLang = doc2.vacancy.findIndex((object) => {
          return object.language === language;
        });

        if (indexLang > -1) {

          var indexWaitInDates = doc2.vacancy[indexLang].waitlist.findIndex((element) => {
            return element === id;
          });
          var indexGuestInDates = doc2.vacancy[indexLang].guestlist.findIndex((element) => {
            return element === id;
          });

          if (indexGuestInDates === -1 && indexWaitInDates === -1){
            // no record exists in attendance collection
            console.log("Error finding the guest info in dates collection (for cancellation). Student ID: " + id)
            res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">No record of this reservation exists. It is likely that you have already cancelled this reservation.</p>');
            return;

          } else {

            // if appear both on guestlist and waitlist, prioritize guestlist
            // so that next on the line gets a seat -- guests can be figured out by the
            // headwaiter at the entrance.
            // (may happen with guests, since they are not restricted in signups)
            if (indexGuestInDates > -1 && indexWaitInDates > -1) {
              indexWaitInDates = -1;
            }

            // person who would get a seat as a result
            var luckyID;

            if (indexWaitInDates > -1) {
              // remove from waitlist
              var removedItemInDates = doc2.vacancy[indexLang].waitlist.splice(indexWaitInDates, 1);

            }

            if (indexGuestInDates > -1) {
              // remove from guestlist
              var removedItemInDates = doc2.vacancy[indexLang].guestlist.splice(indexGuestInDates, 1);
              doc2.vacancy[indexLang].seatsReserved--;

              // if waitlist is not empty
              if (doc2.vacancy[indexLang].waitlist.length > 0) {
                // give the lucky person what he/she wants (a seat :D)
                luckyID = doc2.vacancy[indexLang].waitlist.splice(0, 1);

                // push waitlist[0] to guestlist
                doc2.vacancy[indexLang].guestlist.push(luckyID[0]);

                // increment the number of seats reserved
                doc2.vacancy[indexLang].seatsReserved++;

              }
            }

            //console.log("\nLuckyID: "+luckyID);

            // then if all successful and if lucky person exists
            if (luckyID) {
              // now deal with the lucky person in attendants collection
              db.collection('attendants').find({ id : luckyID[0] }).toArray((err, result) => {
                if (err) {
                  console.log(err);
                  //send the error message to the user
                  res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                  return;
                }

                var doc3;
                // if the one who is cancelling is 000GUEST and the lucky person is
                // 000GUEST too, then set to the already updated doc1
                if (luckyID[0] === id) {
                  doc3 = Object.assign({}, doc1);
                } else {
                  doc3 = result[0];
                }

                // console.log("\nATTENDANTS DOC FOR THE LUCKY PERSON [BEFORE]:");
                // console.log(JSON.stringify(doc3, null, 4));

                if (doc3.waitlists) {
                  // remove him/her from the waitlist in attendance collection
                  var indexLucky = doc3.waitlists.findIndex((object) => {
                    return object.date === date && object.language === language;
                  });

                  //make sure the record actually exists
                  if (indexLucky > -1) {

                    var removedItem3 = doc3.waitlists.splice(indexLucky, 1);
                    if (doc3.attendance) {
                      doc3.attendance.push(removedItem3[0]);
                    } else {
                      doc3.attendance = [removedItem3[0]];
                    }

                    // then save all 3 docs and send an email if success
                    db.collection('attendants').save(doc1).then((response) => {
                      if (response.result.ok) {

                        db.collection('dates').save(doc2).then((response) => {
                          if (response.result.ok) {

                            db.collection('attendants').save(doc3).then((response) => {
                              if (response.result.ok) {

                                mail.sendNewGuests(removedItem3[0].email, removedItem3[0].language, moment(date).startOf('day'), removedItem3[0].firstName, removedItem3[0].lastName, luckyID[0]);

                                // send a SUCCESS message to the user!
                                res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">You have successfully canceled your reservation.</p>');
                                return;



                              } else {
                                console.log("Error saving the lucky person's info in attendants collection (cancellation). Student ID: " + luckyID[0]);
                                res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                                return;
                              }
                            });

                          } else {
                            console.log("Error saving the guest info in dates collection (cancellation). Student ID: " + id);
                            res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                            return;
                          }
                        });

                      } else {
                        console.log("Error saving the guest info in attendants collection (cancellation). Student ID: " + id);
                        res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                        return;
                      }
                    });

                  } else {
                    // no record exists in attendance collection
                    console.log("Error finding the lucky person's info in dates collection.");
                    res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                    return;
                  }

                } else {
                  console.log("Error finding the lucky person's record in attendants collection.");
                  //send the error message to the user
                  res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                  return;
                }

              });
            } else {
              // just save the first 2 docs
              db.collection('attendants').save(doc1).then((response) => {
                if (response.result.ok) {

                  db.collection('dates').save(doc2).then((response) => {
                    if (response.result.ok) {

                      // send a SUCCESS message to the user!
                      res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">You have successfully canceled your reservation.</p>');
                      return;



                    } else {
                      console.log("Error saving the guest info in dates collection (cancellation). Student ID: " + id);
                      res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                      return;
                    }
                  });

                } else {
                  console.log("Error saving the guest info in attendants collection (cancellation). Student ID: " + id);
                  res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">Something went wrong. Please try again later.</p>');
                  return;
                }
              });

              // console.log("\nATTENDANTS DOC FOR THE ONE WHO IS CANCELLING [AFTER]:");
              // console.log(JSON.stringify(doc1, null, 4));
              //
              // console.log("\nDATES DOC [AFTER]:");
              // console.log(JSON.stringify(doc2, null, 4));

            }
          }
        } else {
          // no language record exists in dates collection
          console.log("Error finding the language info in dates collection (for cancellation). Student ID: " + id)
          res.send('<p align="center" style="font-size: 30;color: 616161;margin-top: 30;">No record of this reservation exists. It is likely that you have already cancelled this reservation.</p>');
          return;
        }
      });
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
                    firstName: guest.firstName,
                    lastName: guest.lastName,
                    language: guest.language,
                    checked: guest.checked ? guest.checked : false
                  })
                })
              } else if (item.id === "RESERVED") {
                for (var i = 0; i < countReserved; i++) {
                  langAttendants.push({
                    id: "RESERVED",
                    firstName: "Teaching Assistant",
                    lastName: "/ Faculty",
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
                    firstName: theOneWeNeed.firstName,
                    lastName: theOneWeNeed.lastName,
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
                    firstName: guest.firstName,
                    lastName: guest.lastName,
                    language: guest.language,
                    index: lang.waitlist.indexOf(item.id)
                  })
                })
              } else {
                var theOneWeNeed = _.find(item.waitlists, (day) => {
                  return moment(day.date).isSame(date, 'day') && day.language === lang.language
                });

                if (theOneWeNeed !== undefined) {
                  langWaitlisters.push({
                    id: item.id,
                    firstName: theOneWeNeed.firstName,
                    lastName: theOneWeNeed.lastName,
                    language: theOneWeNeed.language,
                    index: lang.waitlist.indexOf(item.id),
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
  let id = body.key.substring(0, 8);

  let timeZoneString = date.substring(10, date.length);
  // console.log(timeZoneString);
  if (timeZoneString !== "T05:00:00Z") {
    date = _.replace(date, timeZoneString, "T05:00:00Z")
  }

  // handle the change of location
  if (body.locationChange) {
    db.collection('dates').update(
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
    //waitlist
    if (body.waitlist) {
      // finds the student, moves him from waitlist to guestlist and checks their attendance

      // in attendants collection...
      db.collection('attendants').find({ id : id }).toArray((err, result) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        }

        var doc1 = result[0];
        //console.log(JSON.stringify(doc1, null, 4));
        //console.log("1");
        if (doc1.waitlists) {
          // remove him/her from the waitlist in attendance collection
          var index = doc1.waitlists.findIndex((object) => {
            return object.date === date && object.language === body.language && object.firstName === body.firstName && object.lastName === body.lastName;
          });

          //make sure the record actually exists
          if (index > -1) {

            var removedItem = doc1.waitlists.splice(index, 1);
            removedItem[0].checked = body.checked;
            if (doc1.attendance) {
              doc1.attendance.push(removedItem[0]);
            } else {
              doc1.attendance = [removedItem[0]];
            }

            //console.log(JSON.stringify(doc1, null, 4));
            //console.log("1");
            //save
            db.collection('attendants').save(doc1).then((response) => {
              if (response.result.ok) {
                // update the dates collection...
                db.collection('dates').find({date: date}).toArray((err, result) => {
                  if (err) {
                    console.log(err);
                    res.sendStatus(500);
                  }

                  var doc2 = result[0];
                  //console.log(JSON.stringify(doc2, null, 4));
                  //console.log("2");

                  if (doc2.vacancy) {
                    // find index of the language we need
                    var langIndex = doc2.vacancy.findIndex((element) => {
                      return element.language === body.language;
                    });

                    // remove student from the waitlist in dates collection
                    var i = doc2.vacancy[langIndex].waitlist.indexOf(id);

                    // make sure the record actually exists
                    if (i > -1) {
                      var removed = doc2.vacancy[langIndex].waitlist.splice(i, 1);

                      // add him/her to the guestlist in dates collection
                      doc2.vacancy[langIndex].guestlist.push(removed[0]);

                      //increment seatsReserved and seatsAvailable
                      doc2.vacancy[langIndex].seatsReserved ++;
                      doc2.vacancy[langIndex].seatsAvailable ++;

                      //console.log(JSON.stringify(doc2, null, 4));
                      //console.log("2");

                      // save
                      db.collection('dates').save(doc2).then((response) => {
                        if (response.result.ok) {
                            // success!
                            res.sendStatus(200);
                        } else {
                          console.log("Error saving the new guest info in dates collection. Student ID: " + id);
                          res.sendStatus(500);
                        }
                      });
                    } else {
                      console.log("Error: no waitlist record in dates collection. Student ID: " + id);
                      res.sendStatus(500);
                    }
                  } else {
                    console.log("Error: no waitlist record in dates collection. Student ID: " + id);
                    res.sendStatus(500);
                  }
                });
              } else {
                console.log("Error saving the new guest info in attendance collection. Student ID: " + id);
                res.sendStatus(500);
              }
            });
          } else {
            console.log("Error: no waitlist record in attendance collection. Student ID: " + id);
            res.sendStatus(500);
          }
        } else {
          console.log("Error: no waitlist record in attendance collection. Student ID: " + id);
          res.sendStatus(500);
        }
      });


    //guestlist
    } else {
      if (id !== "000GUEST") {
        //finds the student and either "checks" or "unchecks" their attendance for today
        db.collection('attendants').update(
          { id : id, attendance: {  $elemMatch : { date : date, language : body.language, firstName: body.firstName, lastName: body.lastName }}},
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
      } else {
        // guests have a weird situation where...
        // if more than 1 guest have exactly the same name,
        // it's possible that the above logic won't allow check one of them on/off
        // since elemMatch looks only at the first item... hence:
        db.collection('attendants').find({ id : id }).toArray((err, result) => {
          if (err) {
            console.log(err);
            res.sendStatus(500);
          }

          var doc = result[0];
          //console.log(JSON.stringify(doc, null, 4));
          var didTheCheck = false;
          if (doc.attendance) {
            doc.attendance.forEach((object) => {
              if (object.date === date && object.language === body.language && object.firstName === body.firstName && object.lastName === body.lastName) {
                // if havent yet checked on/off the person
                if (!didTheCheck) {
                  if (typeof object.checked === 'undefined') {
                    object.checked = body.checked;
                    didTheCheck = true;
                  } else {
                    if (object.checked !== body.checked) {
                      object.checked = body.checked;
                      didTheCheck = true;
                    }
                  }
                }
              }
            });
            //console.log(JSON.stringify(doc, null, 4));

            // save
            db.collection('attendants').save(doc).then((response) => {
              if (response.result.ok) {
                  // success!
                  res.sendStatus(200);
              } else {
                console.log("Error saving the new guest info in attendants collection. Student ID: " + id);
                res.sendStatus(500);
              }
            });

          } else {
            console.log("Error: no guestlist record in attendance collection. Student ID: " + id);
            res.sendStatus(500);
          }
        });
      }
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
// cronTime: second+" "+minute+" "+hour+" * * 1-5",
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
                               guestNamesList.push(one.firstName+" "+one.lastName);
                             });
                           }
                         } else {
                           var theOne = _.find(result[0].attendance, {'date': today, 'language': object.language, 'checked':true});
                           if (theOne !== undefined) {
                             guestNamesList.push(theOne.firstName+" "+theOne.lastName);
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

    //find the largest value i.e. the most recent semester
    db.collection('semesters').find({}).toArray((err, semestersResult) => {
      if (err) {
        console.log(err);
      }
      //sort in descending order (first item == most recent)
      var allSemesters = semestersResult.sort(function(a, b){return b.semester-a.semester});
      //get the current semester dates
      var thisSemester = allSemesters[0].dates;

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

                          var temp = JSON.parse(JSON.stringify(courseAttendants))
                          var totalVisits = _.remove(temp[i].attendance, {course: courseVal, checked: true});
                          var thisSemesterVisits = _(totalVisits).keyBy('date').at(thisSemester).filter().value();

                          // only put the numbers from this semester
                          if (courseAttendants[i].id && thisSemesterVisits.length > 0) {
                            //console.log(courseAttendants[i]);
                            var firstName = courseAttendants[i].attendance[0].firstName;
                            var lastName = courseAttendants[i].attendance[0].lastName;

                            sheet.set(1, i+2, lastName);
                            sheet.set(2, i+2, firstName);
                            sheet.set(3, i+2, courseAttendants[i].id);
                            sheet.set(10, i+2, thisSemesterVisits.length);

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

    });

  },
  start: false,
  timeZone: 'America/New_York'
});

// for testing:
// second+" "+minute+" "+hour+" * * 1-5"
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
