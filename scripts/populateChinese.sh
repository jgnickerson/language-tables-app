#!/bin/bash
#a bash script to populate !!existing!! dates with the Chinese LT Schedule

#helper function to validate the input dates (must be in format YYYY-MM-DD)
#if valid returns 1, if invalid returns 0
function validate {

  #originally valid
  isvalid=1

  #first check if this day exists in time + format
  date "+%Y-%m-%d" -d "$1" > /dev/null  2>&1
    is_valid_date=$?

  #in Mac OS line 18 (i.e. the next if statement) should look like this:
  if ! perl -mTime::Piece -e "Time::Piece->strptime(\"$1\", \"%Y-%m-%d\")" 2> /dev/null
  #if [[ $is_valid_date -ne 0 ]]
    then isvalid=0
  fi

  #check the length just in case
  if [[ ${#1} -ne 10 ]]
    then isvalid=0
  fi
}

#helper function to validate the midd id (must be 8 characters)
#if valid returns 1, if invalid returns 0
function validateID {
  #originally valid
  isvalidID=1

  #check the length
  if [[ ${#1} -ne 8 ]]
    then isvalidID=0
  fi
}

#helper function to validate the weekday (must be 1 char)
#if valid returns 1, if invalid returns 0
function validateWeekday {
  #originally valid
  isvalidDay=1

  #check the length
  if [[ ${#1} -ne 1 ]]
    then isvalidDay=0
  fi
}

#helper function to validate the course (must be 9 chars)
#in the format CHNS 0103
#if valid returns 1, if invalid returns 0
function validateCourse {
  #originally valid
  isvalidCourse=1

  temp=$1" "$2

  #check the length
  if [[ ${#temp} != 9 ]]; then
    isvalidCourse=0
  fi

  if [[ $temp != *"CHNS 0"* ]]; then
    isvalidCourse=0
  fi
}

echo -e "\n\n\nYou are about to populate the database with information from the Chinese LT Schedule for one person."
echo -e "\nFirst, enter the range of dates for the period that the schedule covers."
echo -e "Please make sure that each date is in the format YYYY-MM-DD."
echo -e "\nEnter the start date:"
read var1

#validate the start date
validate $var1

while [[  $isvalid -eq 0 ]]
do
  echo -e "ERROR: '$var1' is not a valid format."
  echo -e "\nPlease enter the start date again:"
  read var1
  validate $var1
done


echo -e "\nEnter the end date:"
read var2

#validate the end date
validate $var2

while [[  $isvalid -eq 0 ]]
do
  echo -e "ERROR: '$var2' is not a valid format."
  echo -e "\nPlease enter the end date again:"
  read var2
  validate $var2
done


echo -e "\nNext, fill out the person's information."
echo -e "Please make sure that Midd ID # is 8 characters long and includes 2 leading zeros."
echo -e "Please capitalize first and last names."
echo -e "Please make sure the course is in the format 'CHNS 0103' (9 characters)."
echo -e "\nEnter Midd ID #:"
read var3

validateID $var3

while [[  $isvalidID -eq 0 ]]
do
  echo -e "ERROR: '$var3' is not a valid format."
  echo -e "\nPlease enter Midd ID # again:"
  read var3
  validateID $var3
done

echo -e "\nEnter first name:"
read var4

echo -e "\nEnter last name:"
read var5

echo -e "\nEnter email:"
read var6

echo -e "\nEnter course:"
read var7

validateCourse $var7

while [[  $isvalidCourse -eq 0 ]]
do
  echo -e "ERROR: '$var7' is not a valid format."
  echo -e "\nPlease enter the course again:"
  read var7
  validateCourse $var7
done

echo -e "\nNow, enter the day of the week assigned to the person."
echo -e "Please enter ONLY 1 integer that represents the day of the week"
echo -e "(1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday)."
echo -e "\nEnter weekday:"
read var8

validateWeekday $var8

while [[  $isvalidDay -eq 0 ]]
do
  echo -e "ERROR: '$var8' is not a valid format."
  echo -e "\nPlease weekday again:"
  read var8
  validateWeekday $var8
done


#double-check
echo -e "\n\n\nPLEASE DOUBLE-CHECK THE INFORMATION YOU ENTERED:"
echo -e "   Period start date: "$var1
echo -e "   Period end date:   "$var2
echo -e "   Midd ID #:         "$var3
echo -e "   First name         "$var4
echo -e "   Last name:         "$var5
echo -e "   Email:             "$var6
echo -e "   Course:            "$var7
echo -e "   Weekday:           "$var8

#helper funciton to confirm double-check
function ask_double_check {
  echo -e "\n\nIs the above information correct? ('Y/y' or 'N/n')"
  read answer

  if [ "$answer" = "Y" ] || [ "$answer" = "y" ]; then
    echo -e "\nPopulating the db with with information... \n"

    string="var start='$var1'; var end='$var2'; var id='$var3'; var firstName='$var4'; var lastName='$var5'; var email='$var6'; var course='$var7'; var day='$var8';"
    mongo localhost:3001/lt --eval "$string" populateChinese.js
  elif [ "$answer" = "N" ] || [ "$answer" = "n" ]; then
    echo -e "\nThe info is not correct. Cancelling... \n"
  else
    echo -e "Sorry, I don't understand."
    ask_double_check
  fi
}

#call the function to confirm!
ask_double_check
