import React from 'react'
import _ from 'lodash'
import $ from 'jquery'
import moment from 'moment'
import RCalendar from 'rc-calendar'
import styles from 'rc-calendar/assets/index.css'

//change the date availability to be a prop that gets passed down from signup
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
        this.setState({
          events: _.forEach(response, (event) => {
            event.date = moment(event.date)
          })
        });
      }.bind(this)
    })
  },

  render : function() {
    return (
      <div>
        <h2>Date</h2>
        <RCalendar
          showToday={false}
          showDateInput={false}
          onSelect={this.checkDate}
        />
      </div>
    );
  },

  checkDate: function(date) {
    let availability = _.find(this.state.events, function(event) {
      return moment(date, "MM-DD-YYYY").isSame(event.date, 'day');
    });

    let message = "There is no availability on " + date.format("MM-DD");
    if (availability) {
       message = "There are " + availability.seats + " seats available on " + availability.date.format("MM-DD");
    }
    window.alert(message);

    if (availability) {
      this.props.onChange(availability.date);
    }
  }
});

module.exports = Calendar;
