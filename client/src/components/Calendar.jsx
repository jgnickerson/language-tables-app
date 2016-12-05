import React from 'react'
import _ from 'lodash'
import $ from 'jquery'
import moment from 'moment'
import FullCalendar from 'rc-calendar/lib/FullCalendar'
import RCalendar from 'rc-calendar'
import Select from 'rc-select'
import 'rc-select/assets/index.css'
import 'rc-calendar/assets/index.css'
import '../styles/main.css'



//change the date availability to be a prop that gets passed down from signup
var Calendar = React.createClass({
  getInitialState: function() {
    return({ events: [] })
  },

  componentWillMount: function() {
    this.getLanguage().then((response) => {
      this.setState({
        events: _.forEach(response, (event) => {
          event.date = moment(event.date)
        })
      });
    });
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.language !== this.props.language) {
      this.getLanguage().then((response) => {
        this.setState({
          events: _.forEach(response, (event) => {
            event.date = moment(event.date)
          })
        });
      });
    }
  },

  getLanguage: function() {
    let promise = new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open('GET', '/languages?id=' + this.props.language, true);
      request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
          let response = JSON.parse(request.responseText);
          resolve(response);
        } else {
          reject();
        }
      };

      request.send();
    })


    return promise;
  },

  checkAvailability: function(date) {
    let availability = _.find(this.state.events, function(event) {
      let sameDay = moment(date).isSame(event.date, 'day');
      let isTodayOrFuture = event.date.isSameOrAfter(moment(), 'day');
      return sameDay && isTodayOrFuture;
    });

    return availability;
  },

  onDateChange: function(date) {
    let availability = this.checkAvailability(date);
    date = moment(date).startOf("day");


    if (availability && availability.seats === 0) {
      this.props.onChange(date, false);
    } else if (availability) {
      this.props.onChange(date, true);
    } else {
      //reset chosen date to null if user tries to pick
      //a date with no language tables ("unavailable");
      this.props.onChange(null, null);
    }
  },

  content: function(date) {
    let content;
    let availability = this.checkAvailability(date);
    let selected = '';
    if (this.props.date) {
      selected = this.props.date.isSame(date, 'day') ? 'selected' : '';
    }

    //can only sign up for waitlist before 7:55pm
    let canSignupForWaitlist = moment().isBefore(moment(date).startOf('day').subtract(4,'hours').subtract(5, 'minutes'));

    //waitlist
    if (availability && availability.seats === 0 && canSignupForWaitlist) {
      content = (
        <div className={'date-cell waitlist ' + selected}>
        {date.format("D")}
        </div>
      );
    //open seats
  } else if (availability && availability.seats > 0) {
      content = (
        <div className={'date-cell available ' + selected}>
        {date.format("D")}
        </div>
      );
    //no language tables on this day
    } else {
      content = (
        <div className={'date-cell unavailable'}>
        {date.format("D")}
        </div>
      );
    }

    return content;
  },

  render : function() {
    return (
      <div>
        <h2>Date</h2>
        <FullCalendar
          Select={Select}
          fullscreen={false}
          onSelect={this.onDateChange}
          dateCellRender={this.content}
        />
      </div>
    );
  }
});

module.exports = Calendar;
