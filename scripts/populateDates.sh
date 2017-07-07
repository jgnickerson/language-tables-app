echo -e "\nPlease enter the range of dates for the upcoming semester. \nPLEASE MAKE SURE THAT EACH DATE IS IN THE FORMAT YYYY-MM-DD.\n"
echo -e "Start date:"
read var1

echo -e "\nEnd date:"
read var2

string="var start='$var1'; var end='$var2';"

mongo localhost:3001/lt --eval "$string" populateDates.js
