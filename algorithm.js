/*
  Language tables constraint satisfaction problem
*/

/*
  HELPER FUNCTIONS
*/

const mail = require('./mail.js');

var compare = function(a, b) {
  if (a.waitlist.length > b.waitlist.length)
    return -1;
  if (a.waitlist.length < b.waitlist.length)
    return 1;
  return 0;
}

var findIndexByKeyValue = function(array, key, value) {
  for (var i = 0; i < array.length; i ++) {
    if (array[i][key] === value) {
      return i;
    }
  }
  return null;
}

function getAllIndexes(arr, langID, date) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++) {
      if (parseInt(arr[i].language) === parseInt(langID) && arr[i].date === date) {
        indexes.push(i);
      }
    }
    return indexes;
}

var run = function(db, moment, _) {

  // Global Variables
  var totalSpareTablesOf6 = 0,
    totalSpareTablesOf8 = 0,
    waitlistQ = [],
    waitlistToGuests = [];


  // Get today's date from MomentJS
  var today = moment().startOf('day');
  var todayString = today.utc().format();

  // make sure we are in the correct timezone...
  var timeZoneString = todayString.substring(10, todayString.length);
  if (timeZoneString !== "T05:00:00Z") {
    todayString = _.replace(todayString, timeZoneString, "T05:00:00Z")
  }

  // Get tomorrow's object from database and run the algorithm
  var languages;
  db.collection('dates').find({date: todayString})
    .toArray(function(err, result) {
      if (err) {
        throw err;
      }
      if (result[0]) {
        console.log("\nTable-reallocation algorithm started...\n");
        
        languages = result[0].vacancy;

        // For each language in the object
        languages.forEach(function(language, languageIndex) {
          var numTablesOf8 = language.tablesOf8;
          var numTablesOf6 = language.tablesOf6;

          // If the language's waitlist is empty
          if (language.waitlist.length === 0) {
            var bestSpareOf6 = 0,
              bestSpareOf8 = 0;

            // test all possible combinations of spare tables of 6 and 8
            for (var i = 0; i <= numTablesOf8; i++) {
              for (var j = 0; j <= numTablesOf6; j++) {
                // if this arrangement of tables fits all guests
                if (i * 8 + j * 6 - language.seatsReserved >= 0) {
                  var currentSpareOf8 = numTablesOf8 - i;
                  var currentSpareOf6 = numTablesOf6 - j;

                  // if this arrangement is better than previous best
                  if ((currentSpareOf6 * 6 + currentSpareOf8 * 8) > (bestSpareOf6 * 6 + bestSpareOf8 * 8)) {
                    bestSpareOf8 = currentSpareOf8;
                    bestSpareOf6 = currentSpareOf6;
                  }
                }
              }
            }

            // add the best combination of spare tables to the total spare count
            totalSpareTablesOf8 += bestSpareOf8;
            totalSpareTablesOf6 += bestSpareOf6;

            // update the number of available seats and tables for this language
            language.seatsAvailable -= (bestSpareOf8 * 8 + bestSpareOf6 * 6);
            language.tablesOf8 -= bestSpareOf8;
            language.tablesOf6 -= bestSpareOf6;

          } else {
            // If the language has a waitlist, wait to analyze its table allocation.
            waitlistQ.push(language);
          }
        });

        // Sort the waitlist queue from longest waitlist to shortest
        waitlistQ.sort(compare);

        while (waitlistQ.length > 0) {

          // if there are spare tables of 8
          if (totalSpareTablesOf8 !== 0) {

            // give this table to the longest waitlist
            waitlistQ[0].tablesOf8 ++;
            totalSpareTablesOf8 --;
            waitlistQ[0].seatsAvailable += 8;

            // Remove 8 people from waitlist
            for (var i = 0; i < 8; i ++) {
              if (waitlistQ[0].waitlist.length !== 0) {
                var temp = waitlistQ[0].waitlist.shift();
                waitlistQ[0].guestlist.push(temp);
                waitlistQ[0].seatsReserved ++;

                waitlistToGuests.push({guestId: temp, language: waitlistQ[0].language});
              }
            }

            // if there are no more waitlisters for this language
            if (waitlistQ[0].waitlist.length === 0) {
              // remove language from the queue
              var removed = waitlistQ.shift();
              // and put it back into the languages array
              var index = findIndexByKeyValue(languages, "language", removed.language);
              languages[index] = removed;
            } else {
              // otherwise reinsert back to the queue and sort
              waitlistQ.sort(compare);
            }

          // else if there are spare tables of 6
          } else if (totalSpareTablesOf6 !== 0) {

            // give this table to the longest waitlist
            waitlistQ[0].tablesOf6 ++;
            totalSpareTablesOf6 --;
            waitlistQ[0].seatsAvailable += 6;

            // Remove 6 people from waitlist
            for (var i = 0; i < 6; i ++) {
              if (waitlistQ[0].waitlist.length !== 0) {
                var temp = waitlistQ[0].waitlist.shift();
                waitlistQ[0].guestlist.push(temp);
                waitlistQ[0].seatsReserved ++;

                waitlistToGuests.push({guestId: temp, language: waitlistQ[0].language});
              }
            }

            // if there are no more waitlisters for this language
            if (waitlistQ[0].waitlist.length === 0) {
              // remove language from the queue
              var removed = waitlistQ.shift();
              // and put it back into the languages array
              var index = findIndexByKeyValue(languages, "language", removed.language);
              languages[index] = removed;
            } else {
              // otherwise reinsert back to the queue and sort
              waitlistQ.sort(compare);
            }

          // if no spare tables to give out, just keep the remaining waitlisters
          // for the headwaiters to figure out at the entrance
          } else {
            var removed = waitlistQ.shift();
            var index = findIndexByKeyValue(languages, "language", removed.language);
            languages[index] = removed;
          }
        }

        // update the dates collection
        db.collection('dates').update(
          {date: todayString},
          {$set: {vacancy: languages}}
        );

        var guestGuests = [];
        guestGuests = _.remove(waitlistToGuests, (element) => {
          return element.guestId === "000GUEST";
        });

        var guestGuestsByLang = {};

        guestGuests.forEach((obj) => {
          if (guestGuestsByLang.hasOwnProperty(obj.language)) {
            guestGuestsByLang[JSON.stringify(obj.language)]++;
          } else {
            guestGuestsByLang[JSON.stringify(obj.language)] = 1;
          }
        });

        // deal with "000GUEST"s first (its ok if the call does not finish
        // before the next calls start)
        if (guestGuests.length > 0) {
          //find the guest attendant object
          db.collection('attendants').find({id: "000GUEST"}).toArray((err, result) => {
            if (err) {
              console.log(err);
            }
            if (result[0]) {
              var doc = result[0];
              var allRemovedGuestItems = [];

              // treat each language separately
              for (var lang in guestGuestsByLang) {
                if (guestGuestsByLang.hasOwnProperty(lang)) {

                  // console.log("removing all guests in language "+lang+"...")
                  // console.log(JSON.stringify(doc, null, 4));

                  // remove new guests from the waitlist in attendance collection
                  var guestIndexes = getAllIndexes(doc.waitlists, lang, todayString);
                  // augment indexes since the number of elements will be decreasing
                  // each iteration
                  for (var j = 0; j < guestIndexes.length; j++) {
                    guestIndexes[j] = guestIndexes[j]-j;
                  }

                  var removedGuestItems = [];
                  var count = parseInt(guestGuestsByLang[lang]);

                  while(count > 0) {

                    var temp = doc.waitlists.splice(guestIndexes[0], 1);
                    removedGuestItems.push(temp[0]);

                    guestIndexes.splice(0,1);
                    count--;

                  }

                  // add them to the guestlist in attendance collection
                  if (doc.attendance) {
                    doc.attendance = doc.attendance.concat(removedGuestItems);
                  } else {
                    doc.attendance = removedGuestItems;
                  }

                  // console.log(JSON.stringify(doc, null, 4));

                  allRemovedGuestItems = allRemovedGuestItems.concat(removedGuestItems);
                }
              }

              // save
              db.collection('attendants').save(doc).then(function(response) {
                // if successful
                if (response.result.ok) {
                  // make sure removedItems is not empty
                  if (allRemovedGuestItems.length > 0) {

                    allRemovedGuestItems.forEach((newGuest) => {
                      console.log("\nSeat given to 000GUEST for language "+newGuest.language+" on "+today.format("dddd, MMMM Do"));
                      mail.sendNewGuests(newGuest.email, newGuest.language, today, newGuest.firstName, newGuest.lastName, "000GUEST");

                    });

                  } else {
                    console.log("Error: no waitlist record in attendance collection. Student ID: " + newGuest.guestId);
                  }

                } else {
                  console.log("Error saving the new guest info. Did not send the email. Student ID: " + newGuest.guestId);
                }
              });
            }
          });
        }

        // there are all non-"000GUEST"s
        waitlistToGuests.forEach((newGuest, newGuestIndex) => {
          //find the new attendant by id
          db.collection('attendants').find({id: newGuest.guestId}).toArray((err, result) => {
            if (err) {
              console.log(err);
            }
            if (result[0]) {
              var doc1 = result[0];

              // console.log("removing an attendant...")
              // console.log(JSON.stringify(doc1, null, 4));
              // remove him/her from the waitlist in attendance collection
              var removedItems = _.remove(doc1.waitlists, (object) => {
                return object.date === todayString && object.language === newGuest.language;
              });

              // add him/her to the guestlist in attendance collection
              if (doc1.attendance) {
                doc1.attendance.push(removedItems[0]);
              } else {
                doc1.attendance = [removedItems[0]];
              }

              // console.log(JSON.stringify(doc1, null, 4));

              // save
              db.collection('attendants').save(doc1).then(function(response) {
                // if successful
                if (response.result.ok) {
                  // make sure removedItems is not empty
                  if (removedItems[0]) {
                    console.log("\nSeat given to "+newGuest.guestId+" for language "+removedItems[0].language+" on "+today);
                    mail.sendNewGuests(removedItems[0].email, removedItems[0].language, today, removedItems[0].firstName, removedItems[0].lastName, newGuest.guestId);
                  } else {
                    console.log("Error: no waitlist record in attendance collection. Student ID: " + newGuest.guestId);
                  }

                } else {
                  console.log("Error saving the new guest info. Did not send the email. Student ID: " + newGuest.guestId);
                }
              });
            }
          });
        });
      }
  });
}

module.exports = {
  run: run
};
