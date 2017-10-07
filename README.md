**If this is your first time running**

  npm install -g gulp
  mkdir ./db

**delete ./node_modules & ./client/node_modules & install node
packages in ./ and in ./client**

  npm install

**Ensure you have a .env file**

  get it from a homie

**if you have no data in db, you should copy it from the live instance
run the following commands in a separate terminal window from the top
directory (../language-tables-app)
(more details on this in the 'technical specialist' manual)**

  *first make sure that all the mongo users are set up*

  *then connect*
  mongo --port 'port' -u 'username' -p 'password' --authenticationDatabase "lt"

  *once the mongo shell starts, connect to the 'lt' database
  (it will be created if it does not exist)*
  use lt

  *copy the db from basin*
  db.copyDatabase("lt", "lt", basinURL:port, 'username', 'password')

  *to check values in 'attendants' collection, run:*
  db.attendants.find().pretty()

**to start the server, start mongodb, and webpack the front end
(if starting a development local version, please make sure that
'basin.middlebury.edu' is changed to 'localhost' in the 5 files
mentioned in the manual before running the command)**

  *(add '&' at the end if you want the process to run in the background)*
  gulp start
