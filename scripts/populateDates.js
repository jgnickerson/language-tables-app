// populating the dates collection in the db
// to be done at the beginning of each semester

// helper method to convert weekday int to string
function numToWeekday(x) {
  if (x === 0) {
    return "Sunday";
  } else if (x === 1) {
    return "Monday";
  } else if (x === 2) {
    return "Tuesday";
  } else if (x === 3) {
    return "Wednesday";
  } else if (x === 4) {
    return "Thursday";
  } else if (x === 5){
    return "Friday";
  } else {
    return "Saturday";
  }
};

// authorization
var authResult = db.auth("languagetableapp", "centurybarrenfortysnake");

if (authResult) {
  print("Successful authentication to the database. \n");

  // user's input
  var startDate = new Date(start);
  var endDate = new Date(end);

  // endDate + 1 day just for the while loop
  var lastDate = new Date(endDate.getTime() + 1*24*60*60000)

  var dateArray = [];

  while(startDate.getTime() !== lastDate.getTime()) {
    // make sure the day is not saturday or sunday
    if (startDate.getDay() !== 6 && startDate.getDay() !== 0) {

      // convert the date to the standardized string in db
      var dateString = startDate.toJSON();
      var timeZone = dateString.substring(10, dateString.length);
      if (timeZone !== "T05:00:00Z") {
        dateString = dateString.replace(timeZone, "T05:00:00Z")
      }

      // get the weekday string
      var weekday = numToWeekday(startDate.getDay());

      // craft the document
      var dateObj = {
        date: dateString,
        weekday: weekday,
        vacancy: []
      };

      db.baseline.find().forEach((o) => {

        var weekdayInfo = o.baseline.find((day) => {
          return day.weekday === dateObj.weekday;
        });

        dateObj.vacancy.push({
          language: o.language,
          seatsReserved: weekdayInfo.reserved,
          seatsAvailable: weekdayInfo.tablesOf6 * 6 + weekdayInfo.tablesOf8 * 8,
          tablesOf6: weekdayInfo.tablesOf6,
          tablesOf8: weekdayInfo.tablesOf8,
          waitlist: [],
          guestlist: Array(weekdayInfo.reserved).fill("RESERVED"),
          location: "inside"
        });

      });

      // push the document
      dateArray.push(dateObj);
    }

    // increment to the next day
    startDate = new Date(startDate.getTime() + 1*24*60*60000);
  }

  // printing to check just for now
  dateArray.forEach((obj) => {
    printjson(obj);
  });

  // insert all docs into the db
  //db.dates.insertMany();

} else {
  print("Error authenticating to the database. Please try again. \n");
}
