var nodemailer = require('nodemailer');
var moment = require('moment');
var _ = require('lodash');
const constants = require('./constants.js');
//import .env file to process.env
require('dotenv').config();

var smtpConfig = {
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
}

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(smtpConfig);

// get the languages from the ./constants file
var languages = Object.entries(constants.languages);

// send mail with defined transport object
var send = function(reservationObj, waitlist) {
  var language = languages[reservationObj.language][0];
  if (language !== "ASL") {
    language = _.capitalize(language)
  }
  //var language = ["Spanish", "French", "Chinese", "German"];
  var languageString = reservationObj.language.toString();
  if (languageString.length === 1) {
    languageString = "0"+languageString;
  }

  var decodedString = languageString + reservationObj.id + reservationObj.date + reservationObj.name;
  var encodedString = new Buffer(decodedString).toString('base64');
  var cancelLink = 'http://basin.middlebury.edu:3000/cancel?reservation=' + encodedString;

  var text = "Dear "+reservationObj.name+", </br></br>";
  if (waitlist) {
    text += "You are <u>waitlisted</u> for ";
  } else {
    text += "You are <u>signed up</u> for ";
  }
  text += language + " Language Tables on " + moment(reservationObj.date).format("dddd, MMMM Do") + ". </br>";

  if (waitlist) {
    text += "You will receive another email if a spot opens up. Thank you for your patience. </br>";
  } else {
    text += "Please make sure to arrive to Redfield Proctor before the doors open at 12:30pm.</br>";
  }

  text += "If you are no longer planning to attend, please <a href= '"+cancelLink+"'>click here</a> to cancel your reservation. </br></br>";
  text += "Kind regards, </br>";
  text += "Language Tables";
  var mailOptions = {
    from: '"Language Tables" <LanguageTables@middlebury.edu>', // sender address
    to: reservationObj.email, // list of receivers
    subject: 'Language Tables Sign-up Confirmation', // Subject line
    text: text, // plaintext body
    html: text // html body
  }
  return transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('"Signup confirmation" message sent: ' + info.response);
  });
}

// send mail to newly added guests
var sendNewGuests = function(email, language, date) {
  var languageString = languages[language][0];
  if (languageString !== "ASL") {
    languageString = _.capitalize(languageString);
  }
  // var languages = ["Spanish", "French", "Chinese", "German"];
  var text = "You just got a spot at " + languageString + " Language Tables on "+date.format("dddd, MMMM Do")+"!";
  text += "</br>Please make sure to arrive to Redfield Proctor before the doors open at 12:30pm.</br>";
  text += "</br>Thank you, </br>";
  text += "Language Tables";

  var mailOptions = {
    from: '"Language Tables" <LanguageTables@middlebury.edu>', // sender address
    to: email, // list of receivers
    subject: 'You got a spot at Language Tables', // Subject line
    text: text, // plaintext body
    html: text // html body
  }
  return transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('"You just got a spot" message sent: ' + info.response);
  });
}

// send mail to faculty
var sendProfTA = function(faculty, guestlist, date, emails) {
  var language = languages[faculty.language][0];
  if (language !== "ASL") {
    language = _.capitalize(language);
  }
  //var languages = ["Spanish", "French", "Chinese", "German"];
  var text = language + " Language Tables Attendance on " + date + ": <br/> <br/>";

  guestlist.forEach(function(guest, guestIndex) {
    text = text + guest + "<br/>";
  });

  if (guestlist.length === 0) {
    text = text + "[None]"
  }

  var mailOptions = {
    from: '"Language Tables" <LanguageTables@middlebury.edu>', // sender address
    to: emails, // list of receivers
    subject: 'Language Tables Attendance', // Subject line
    text: text, // plaintext body
    html: text // html body
  }

  function trySending(mailOptions, language) {
    return transporter.sendMail(mailOptions, function(error, info){
      if(error){
        if (error.toString().indexOf("Authentication unsuccessful") !== -1) {
          console.log(error);
          console.log("Let's try again...");
          return trySending(mailOptions, language);
        }
        return console.log(error);
      }
      console.log(language+' "Weekly attendance" message sent: ' + info.response);
    });
  }

  return trySending(mailOptions, language);
}

var sendReminderEmail = function(guestObj, tomorrow) {
  // send the reminder emails to all guests at once (only called once)
  if (guestObj.id === "000GUEST") {
    var allTomorrowsObjects = _.filter(guestObj.attendance, function (o) {
      return o.date === tomorrow;
    });

    allTomorrowsObjects.forEach((tomorrowObj) => {
      var laterThanTomorrow = _.filter(guestObj.attendance, function(o) {
        return moment(o.date).isAfter(tomorrow) && o.name === tomorrowObj.name && o.email === tomorrowObj.email;
      });

      var languageString = languages[tomorrowObj.language][0];
      var text = "Dear "+tomorrowObj.name+", <br/><br/>This is a reminder that you are signed up for the ";
      text += languageString+" Language Tables <u>tomorrow, "+moment(tomorrow).format("MMMM Do")+"</u>. <br/>";

      if (laterThanTomorrow.length > 0) {
        text += "<br/>You are also signed up for the following dates: <br/><br/>";
        laterThanTomorrow.forEach(function(dateObj, dateObjIndex) {
          text += moment(dateObj.date).format("MMMM Do")+ " -- "+languages[dateObj.language][0]+"<br/>";
        });
      }
      text += "<br/>Thank you, <br/>Language Tables";

      var mailOptions = {
        from: '"Language Tables" <LanguageTables@middlebury.edu>', // sender address
        to: tomorrowObj.email, // list of receivers
        subject: 'Language Tables Reminder', // Subject line
        text: text, // plaintext body
        html: text // html body
      }

      transporter.sendMail(mailOptions, function(error, info){
        if(error){
          return console.log(error);
        }
        console.log('"Guest Reminder" message sent: ' + info.response);
      });
    });

    //no need to return anything

  // all the other non-guests
  } else {
    var tomorrowObj = _.find(guestObj.attendance, function(o) {
      return o.date === tomorrow;
    });

    var laterThanTomorrow = _.filter(guestObj.attendance, function(o) {
      return moment(o.date).isAfter(tomorrow);
    });
    //console.log(laterThanTomorrow);

    var languageString = languages[tomorrowObj.language][0];
    var text = "Dear "+tomorrowObj.name+", <br/><br/>This is a reminder that you are signed up for the ";
    text += languageString+" Language Tables <u>tomorrow, "+moment(tomorrow).format("MMMM Do")+"</u>. <br/>";

    if (laterThanTomorrow.length > 0) {
      text += "<br/>You are also signed up for the following dates: <br/><br/>";
      laterThanTomorrow.forEach(function(dateObj, dateObjIndex) {
        text += moment(dateObj.date).format("MMMM Do")+ " -- "+languages[dateObj.language][0]+"<br/>";
      });
    }
    text += "<br/>Thank you, <br/>Language Tables";

    var mailOptions = {
      from: '"Language Tables" <LanguageTables@middlebury.edu>', // sender address
      to: tomorrowObj.email, // list of receivers
      subject: 'Language Tables Reminder', // Subject line
      text: text, // plaintext body
      html: text // html body
    }
    return transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return console.log(error);
      }
      console.log('"Non-guest Reminder" message sent: ' + info.response);
    });
  }
}

var sendWeeklyReport = function(emailObj) {
  var fullPath = './weekly-reports/'+emailObj.folder+'/'+emailObj.language_string+'.xlsx';

  var language = emailObj.language_string;
  if (language !== "ASL") {
    language = _.capitalize(language);
  }

  var text = "Plese find the weekly report attached."

  var mailOptions = {
    from: '"Language Tables" <LanguageTables@middlebury.edu>', // sender address
    to: emailObj.emails, // list of receivers
    subject: language+' Language Tables Weekly Report', // Subject line
    text: text, // plaintext body
    html: text, // html body
    attachments: [
      {
        path: fullPath
      }
    ]
  }

  function trySending(mailOptions, language) {
    return transporter.sendMail(mailOptions, function(error, info){
      if(error){
        if (error.toString().indexOf("Authentication unsuccessful") !== -1) {
          console.log(error);
          console.log("Let's try again...");
          return trySending(mailOptions, language);
        }
        return console.log(error);
      }
      console.log(language+' "Weekly attendance" message sent: ' + info.response);
    });
  }

  return trySending(mailOptions, language);

}

module.exports = {
  send: send,
  sendNewGuests: sendNewGuests,
  sendProfTA: sendProfTA,
  sendReminderEmail: sendReminderEmail,
  sendWeeklyReport: sendWeeklyReport
};
