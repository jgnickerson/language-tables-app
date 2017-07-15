#!/bin/bash
#a bash script to populate dates


#helper function to validate the input dates (must be in format YYYY-MM-DD)
#if valid returns 1, if invalid returns 0
function validate {

  #originally valid
  isvalid=1

  #first check if this day exists in time + format
  date "+%Y-%m-%d" -d "$1" > /dev/null  2>&1
    is_valid_date=$?

  #in Mac OS line 18 (i.e. the next if statement) should look like this:
  #if ! perl -mTime::Piece -e "Time::Piece->strptime(\"$1\", \"%Y-%m-%d\")" 2> /dev/null
  if [[ $is_valid_date -ne 0 ]]
    then isvalid=0
  fi

  #check the length just in case
  if [[ ${#1} -ne 10 ]]
    then isvalid=0
  fi
}


echo -e "\n\n\nYou are about to specify the range of dates for the upcoming semester."
echo -e "Please make sure that each date is in the format YYYY-MM-DD."
echo -e "Note that no data entries will be created for weekends and academic breaks."
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

#declare the string to store the break dates in
BREAKS=""

#helper funciton to ask about academic breaks
function ask_break {
  echo -e "\nAre there any (more) academic breaks this semester? ('Y/y' or 'N/n')"
  read answer

  if [ "$answer" = "Y" ] || [ "$answer" = "y" ]; then
    #start date
    echo -e "\nEnter the start date of the break:"
    read var3
    validate $var3

    while [[  $isvalid -eq 0 ]]
    do
      echo -e "ERROR: '$var3' is not a valid format."
      echo -e "\nPlease enter the start date of the break again:"
      read var3
      validate $var3
    done

    #append to the array
    BREAKS=$BREAKS$var3


    #end date
    echo -e "\nEnter the end date of the break:"
    read var4
    validate $var4

    while [[  $isvalid -eq 0 ]]
    do
      echo -e "ERROR: '$var4' is not a valid format."
      echo -e "\nPlease enter the end date of the break again:"
      read var4
      validate $var4
    done

    #append to the array
    BREAKS=$BREAKS$var4

    ask_break

  elif [ "$answer" = "N" ] || [ "$answer" = "n" ]; then
    return
  else
    echo -e "Sorry, I don't understand."
    ask_break
  fi
}

#call the function to ask about academic breaks
ask_break

#double-check
echo -e "\n\n\nPLEASE DOUBLE-CHECK THE INFORMATION YOU ENTERED:"
echo -e "   Semester start date: "$var1
echo -e "   Semester end date: "$var2
echo -e "   Academic breaks: "

if [ -z "$BREAKS" ]; then
    echo "      none"
else
  for (( i=0;i<${#BREAKS};i=i+20 )) do
      echo -e "      from "${BREAKS:$i:10}" to "${BREAKS:$i+10:10}
  done
fi

#helper funciton to confirm double-check
function ask_double_check {
  echo -e "\n\nIs the above information correct? ('Y/y' or 'N/n')"
  read answer

  if [ "$answer" = "Y" ] || [ "$answer" = "y" ]; then
    echo -e "\nPopulating the db with dates... \n"

    string="var start='$var1'; var end='$var2'; var breaks='$BREAKS';"

    mongo localhost:3001/lt --eval "$string" populateDates.js
  elif [ "$answer" = "N" ] || [ "$answer" = "n" ]; then
    echo -e "\nThe info is not correct. Cancelling... \n"
  else
    echo -e "Sorry, I don't understand."
    ask_double_check
  fi
}

#call the function to confirm!
ask_double_check
