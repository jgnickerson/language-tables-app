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

  // <RCalendar
  //   showToday={false}
  //   showDateInput={false}
  //   onSelect={this.checkDate}
  // />
  content: function(date) {
    let content;
    let availability = this.checkDate(date);

    console.log(availability && availability.seats === 0);
    if (availability && availability.seats === 0) {
      content = (
        <div className={"date-cell waitlist"}>
        {date.format("D")}
        </div>
      );
    } else if (availability) {
      content = (
        <div className={'date-cell available'}>
        {date.format("D")}
        </div>
      );
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
          style={{ margin:10 }}
          Select={Select}
          fullscreen={false}
          //onSelect={this.checkDate}
          dateCellRender={this.content}
        />
      </div>
    );
  },

  checkDate: function(date) {
    let availability = _.find(this.state.events, function(event) {
      return moment(date, "MM-DD-YYYY").isSame(event.date, 'day');
    });

    return availability;

    // let message = "There is no availability on " + date.format("MM-DD");
    // if (availability) {
    //    message = "There are " + availability.seats + " seats available on " + availability.date.format("MM-DD");
    // }
    // window.alert(message);

    // if (availability) {
    //   this.props.onChange(availability.date);
    // }

  }
});

module.exports = Calendar;
