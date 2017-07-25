// helper file for the populateChinese.sh script
// populating the dates and attendants collections in the db

// helper method to convert weekday int to string
function numToWeekday(x) {
  if (x == 1) {
    return "Monday";
  } else if (x == 2) {
    return "Tuesday";
  } else if (x == 3) {
    return "Wednesday";
  } else if (x == 4) {
    return "Thursday";
  } else if (x == 5){
    return "Friday";
  } else {
    return "Error";
  }
};

var weekday = numToWeekday(day);

if (weekday === "Error") {
  print("\nYou entered a wrong integer for the weekday.");
  print("Please enter ONLY 1 integer that represents the day of the week");
  print("(1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday).");
  print("\nPlease try again.\n");

} else {

  // authorization
  var authResult = db.auth("languagetableapp", "centurybarrenfortysnake");

  if (authResult) {
    print("Successful authentication to the database. \n");

    // user's input
    var startDate = new Date(start.replace(/-/g, '\/'));
    var endDate = new Date(end.replace(/-/g, '\/'));

    // endDate + 1 day just for the while loop
    var lastDate = new Date(endDate.getTime() + 1*24*60*60000);

    while(startDate.getTime() !== lastDate.getTime()) {
      // make sure the day is what we want
      if (startDate.getDay() == day){

        // convert the date to the standardized string in db
        var dateString = startDate.toJSON();
        var timeZone = dateString.substring(10, dateString.length);
        if (timeZone !== "T05:00:00Z") {
          dateString = dateString.replace(timeZone, "T05:00:00Z")
        }

        // WARNING
        // assumes that Chinese is second language in the array!
        var returnValue = db.dates.findOneAndUpdate(
          { date: dateString },
          { $push: { 'vacancy.2.guestlist': id },
            $inc: { 'vacancy.2.seatsReserved': 1 }
          },
          { returnNewDocument : true }
        );

        if (returnValue) {
          db.attendants.findOneAndUpdate(
            { id: id },
            { $push:
              { attendance:
                { date: dateString,
                  language: 2,
                  course: course,
                  firstName: firstName,
                  lastName: lastName,
                  email: email
                }
              }
            },
            { upsert:true }
          );
        }

      }

      // increment to the next day
      startDate = new Date(startDate.getTime() + 1*24*60*60000);
    }

    print("Finished populating the db. Thanks! :) \n\n\n");

  } else {
    print("Error authenticating to the database. Please try again. \n\n\n");
  }
}
