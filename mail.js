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
var send = function(reservationObj) {
  var language = ["Spanish", "French", "Chinese"];
  var text = "You are signed up for " + language[reservationObj.language] + " Language Tables on " + moment(reservationObj.date).format('MM-DD-YYYY') + "!";
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

module.exports.send = send;
