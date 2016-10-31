import React from 'react'
import $ from 'jquery'
import BigCalendar from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment'
import InfiniteCalendar from 'react-infinite-calendar'
import 'react-infinite-calendar/styles.css'

BigCalendar.setLocalizer(BigCalendar.momentLocalizer(moment))

var events = [
  {
    'title': 'All Day Event',
    'allDay': true,
    'start': new Date(2015, 3, 0),
    'end': new Date(2015, 3, 0)
  }
]

var Calendar = React.createClass({
  getInitialState: function() {
    return({ events: [] })
  },

  componentWillMount: function() {
    $.ajax({
      url: 'http://localhost:3000/languages?id=' + this.props.language,
      type: 'GET',
      datatype: 'json',
      success: function(response) {
        this.setState({ events: response });
      }
    })
  },

  render : function() {
    return (
      <div>
        <h2>Date</h2>
        <InfiniteCalendar
          width={400}
          height={400}
          selectedDate={this.today}
          onSelect={(data) => {this.props.onChange(data)}}
          disabledDays={[0,6]}
          minDate={this.minDate}
          ref={"dateCalendar"}
          keyboardSupport={true}
        />
      </div>
    );
  }
});

module.exports = Calendar;



// <BigCalendar
//   {...this.props}
//   defaultDate={new Date()}
//   timeslots={0}
//   events={events}
//   toolbar={false}
// />
