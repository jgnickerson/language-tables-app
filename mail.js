var nodemailer = require('nodemailer');
var moment = require('moment');
//import .env file to process.env
require('dotenv').config();

var smtpConfig = {
  host: 'smtp.gmail.com',
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
}

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(smtpConfig);

// setup e-mail data with unicode symbols
// var mailOptions = {
//     from: '"Language Tables" <LanguageTables@middlebury.com>', // sender address
//     to: 'gordonnickerson94@gmail.com', // list of receivers
//     subject: 'Language Tables Signup', // Subject line
//     text: 'You are signed up! *RESERVATION INFORMATION HERE*', // plaintext body
//     html: '<b>You are signed up! *RESERVATION INFORMATION HERE*</b>' // html body
// };

// send mail with defined transport object
var send = function(reservationObj, waitlist) {
  var language = ["Spanish", "French", "Chinese", "German"];
  var decodedString = reservationObj.language.toString() + reservationObj.id + reservationObj.date;
  var encodedString = new Buffer(decodedString).toString('base64');
  var cancelLink = 'http://basin.middlebury.edu:3000/cancel?reservation=' + encodedString;

  var text;
  if (waitlist) {
    text = "You are <u>waitlisted</u> for ";
  } else {
    text = "You are <u>signed up</u> for ";
  }
  text += language[reservationObj.language] + " Language Tables on " + moment(reservationObj.date).format('MM-DD-YYYY') + ". </br>";

  if (waitlist) {
    text += "You will receive another email if a spot opens up. Thank you for your patience. </br>";
  }

  text += "</br><a href= '"+cancelLink+"'>Cancel your reservation</a>";
  var mailOptions = {
    from: '"Language Tables" <LanguageTables@middlebury.com>', // sender address
    to: reservationObj.email, // list of receivers
    subject: 'Language Tables Signup', // Subject line
    text: text, // plaintext body
    html: '<b>' + text + '</b>' // html body
  }
  return transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}

// send mail to newly added guests
var sendNewGuests = function(email, language, date) {
  var languages = ["Spanish", "French", "Chinese", "German"];
  var text = "You just got a spot at " + languages[language] + " Language Tables for "+date.format('MM-DD-YYYY')+"!";

  var mailOptions = {
    from: '"Language Tables" <LanguageTables@middlebury.com>', // sender address
    to: email, // list of receivers
    subject: 'You got a spot at Language Tables', // Subject line
    text: text, // plaintext body
    html: '<b>' + text + '</b>' // html body
  }
  return transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}

// send mail to faculty
var sendProfTA = function(faculty, guestlist, date, emails) {
  var languages = ["Spanish", "French", "Chinese", "German"];
  var text = languages[faculty.language] + " Language Tables Attendance for " + date + ": <br/> <br/>";

  guestlist.forEach(function(guest, guestIndex) {
    text = text + guest + "<br/>";
  });

  var mailOptions = {
    from: '"Language Tables" <LanguageTables@middlebury.com>', // sender address
    to: emails, // list of receivers
    subject: 'Language Tables Attendance', // Subject line
    text: text, // plaintext body
    html: '<b>' + text + '</b>' // html body
  }
  return transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}

module.exports = {
  send: send,
  sendNewGuests: sendNewGuests,
  sendProfTA: sendProfTA
};
