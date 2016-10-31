"use strict";
const bodyParser = require('body-parser');

const express = require('express');
const app = express();

// group these constants in a new file
const SPANISH = 0;
const FRENCH = 1;
const CHINESE = 2;

//parse request.body as json
app.use(bodyParser.json());

//set the port
app.set('port', (process.env.PORT || 3000));

app.use(express.static('client/build'));

//connect to the database and store the reference
var MongoClient = require('mongodb').MongoClient;
var db;

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
    db.collection('dates').find({}, { language: 1, language_string: 1 }).toArray(function(err, result) {
      if (err) {
        throw err;
      }
      res.send(result);
    });

  // if id is specified, return an object with dates and seats
  } else {
    var temp = Number.parseInt(req.query.id);
    db.collection('dates').find({language:temp}).toArray(function(err, result) {
      if (err) {
        throw err;
      }
      res.send(result[0].visits);
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

  //find a record of the attendant
  db.collection('attendants').find({student_id:req.body.id}).toArray(function(err, result) {
    if (err) {
      throw err;
    }

    //if the attendant is already registered
    if (result[0] != undefined) {
      //add a new record of attendance
      db.collection('attendants').update(
        {student_id: req.body.id},
        {$push: {attendance: {date:req.body.date, language:req.body.language}}}
      );
    }

    //if the attendant is not registered
    else {
      //create a new attendant with the new record of attendance
      db.collection('attendants').insert({
        student_id: req.body.id,
        name: req.body.name,
        email: req.body.email,
        attendance: [
          {date:req.body.date, language:req.body.language}
        ]
      });
    }

    //decrement the number of seats at the given language at the given date
    db.collection('dates').update(
      {language:req.body.language, "visits.date":req.body.date},
      {$inc: {"visits.$.seats":-1}}
    );

  });

  //send a success status to the client
  res.sendStatus(200);
});
