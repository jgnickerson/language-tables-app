**to start the database, run the following command in a separate terminal window
from the top directory (../language-tables-app):**

  mongod --dbpath db

**to check how values update in the database, run the following commands in a
separate terminal window from the top directory (../language-tables-app):**

  mongo
  *once the mongo shell starts, connect to the 'lt' database*
  use lt

  *to check values in 'attendants' collection, run:*
  db.attendants.find().pretty()
  *to check values in 'dates' collection, run:*
  db.dates.find().pretty()




**to run the server only, run the following command from the top directory:**

  ./node_modules/.bin/babel-node server.js
