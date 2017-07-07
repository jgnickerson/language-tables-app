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

  // need to know info for each date by weekday
  var baseline = db.baseline.find();

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
      var obj = {
        date: dateString,
        weekday: weekday,
        vacancy: []
      };

      // push the document
      dateArray.push(obj);
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


// {"date": "2017-02-20T05:00:00Z",
//  "weekday": "Monday",
//  "vacancy": [
//     {"language": 0,
//     "seatsReserved": 2,
//     "seatsAvailable": 12,
//     "tablesOf6": 2,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED"]},
//     {"language": 1,
//     "seatsReserved": 0,
//     "seatsAvailable": 0,
//     "tablesOf6": 0,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": []},
//     {"language": 2,
//     "seatsReserved": 18,
//     "seatsAvailable": 18,
//     "tablesOf6": 3,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED","RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED"]},
//     {"language": 3,
//     "seatsReserved": 2,
//     "seatsAvailable": 18,
//     "tablesOf6": 3,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED"]},
//     {"language": 4,
//     "seatsReserved": 2,
//     "seatsAvailable": 8,
//     "tablesOf6": 0,
//     "tablesOf8": 1,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED"]},
//     {"language": 5,
//     "seatsReserved": 0,
//     "seatsAvailable": 0,
//     "tablesOf6": 0,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": []},
//     {"language": 6,
//     "seatsReserved": 2,
//     "seatsAvailable": 12,
//     "tablesOf6": 2,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED"]},
//     {"language": 7,
//     "seatsReserved": 8,
//     "seatsAvailable": 8,
//     "tablesOf6": 0,
//     "tablesOf8": 1,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED", "RESERVED"]},
//     {"language": 8,
//     "seatsReserved": 1,
//     "seatsAvailable": 6,
//     "tablesOf6": 1,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": ["RESERVED"]},
//     {"language": 9,
//     "seatsReserved": 2,
//     "seatsAvailable": 16,
//     "tablesOf6": 0,
//     "tablesOf8": 2,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED"]},
//     {"language": 10,
//     "seatsReserved": 2,
//     "seatsAvailable": 16,
//     "tablesOf6": 0,
//     "tablesOf8": 2,
//     "waitlist": [],
//     "guestlist": ["RESERVED", "RESERVED"]},
//     {"language": 11,
//     "seatsReserved": 1,
//     "seatsAvailable": 6,
//     "tablesOf6": 1,
//     "tablesOf8": 0,
//     "waitlist": [],
//     "guestlist": ["RESERVED"]}
//   ]
// }
//
// print(cursor);
// while ( cursor.hasNext() ) {
//    printjson( cursor.next() );
// }


// result = db.auth("languagetableapp", "centurybarrenfortysnake");
// print("success? : "+result);
