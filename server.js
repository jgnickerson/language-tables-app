"use strict";
const bodyParser = require('body-parser');
const mail = require('./mail.js');

mail.send();

const express = require('express');
const app = express();

const SPANISH = 0;
const FRENCH = 1;
const CHINESE = 2;

var mockDates = {
  [SPANISH]: [
    {date:'10/28', seats: 5},
    {date:'10/29', seats: 4},
    {date:'10/30', seats: 3},
    {date:'10/31', seats: 2},
    {date:'11/1', seats: 1},
  ],
  [FRENCH]: [
    {date:'10/28', seats: 1},
    {date:'10/29', seats: 2},
    {date:'10/30', seats: 3},
    {date:'10/31', seats: 4},
    {date:'11/1', seats: 5},
  ],
  [CHINESE]: [
    {date:'10/28', seats: 0},
    {date:'10/29', seats: 0},
    {date:'10/30', seats: 0},
    {date:'10/31', seats: 0},
    {date:'11/1', seats: 0},
  ]
}

var mockAttendants = {
    ["00592352"]: {
        name:"amir",
        email:"aamangeldi@middlebury.edu",
        attendance: [{date:'10/28', language: SPANISH}]
    },
    ["00555555"]: {
        name:"gordon",
        email:"jgnickerson@middlebury.edu",
        attendance: [{date:'10/28', language: FRENCH}]
    }
}

//parse request.body as json
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 3000));

app.use(express.static('client/build'));

// '/language?id=0';
app.get('/language', (req, res) => {
  let language = req.query.id;
  res.send(mockDates[language]);
});

app.post('/signup', (req, res) => {
  //assuming there is a seat at the given date and language table
  //since calendar won't allow picking dates with seats = 0
  // ********
  // TO DO: check if sth went wrong at each step and res.sendStatus(400) there.
  // ********

  //if the attendant is already registered
  if (mockAttendants[req.body.id] != null) {
      mockAttendants[req.body.id].attendance.push({date:req.body.date, language:req.body.language});
  }
  //if the attendant is not registered
  else {
      mockAttendants[req.body.id] = {
              name:req.body.name,
              email:req.body.email,
              attendance: [{date:req.body.date, language:req.body.language}]
          };
  }

  //now decrement the seats at the language table for that date
  var data = mockDates[req.body.language];
  var i;

  for (i = 0; i < data.length; i++) {
      if (data[i] && data[i].date == req.body.date) {
          data[i].seats--;
      }
  }
  console.log(mockAttendants);
  console.log(mockDates);
  res.sendStatus(200);
});



app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
