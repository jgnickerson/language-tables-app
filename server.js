"use strict";
const bodyParser = require('body-parser');

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

//parse request.body as json
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 3000));

app.use(express.static('client'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// '/language?id=0';
app.get('/language', (req, res) => {
  let language = req.query.id;
  res.send(mockDates[language]);
});

app.post('/signup', (req, res) => {
  console.log(req.body);
  res.send(req.body);
});



app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
