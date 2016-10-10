import React from 'react';
import InfiniteCalendar from 'react-infinite-calendar';
//import moment from 'moment';

let today = new Date();
let minDate = new Date();

class Calendar extends React.Component {
  render() {
    return (
      <InfiniteCalendar
        width={ 400 }
        height={ 600 }
        selectedDate={ today }
        disabledDays={ [0,6] }
        minDate={ minDate }
        keyboardSupport={ true }
      />
    )
  }
}
