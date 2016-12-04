import React from 'react';
import CheckboxList from './CheckboxList';
import moment from 'moment';
import _ from 'lodash';

var Admin = React.createClass({
  getInitialState: function() {
    return ({
      date: "",
      checkboxItems: []
    })
  },

  componentWillMount: function() {
    let request = new XMLHttpRequest();
    request.open('GET', '/attendance/', true);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        let response = JSON.parse(request.responseText);
        console.log(response);

        let checkboxItems = this.formatCheckboxItems(response.attendants);
        this.setState({
          date: response.date,
          checkboxItems: checkboxItems
        });
      } else {
        //there was an error lol
      }
    }.bind(this);
    request.onerror = function() {
      //oopsies, error lol
    };

    request.send();
  },

  formatCheckboxItems: function (attendants) {
    let checklistItems = attendants.map((attendant) => {
      return {
        label: attendant.name + " - " + attendant.id,
        key: attendant.id,
        isChecked: false
      }
    })

    return checklistItems;
  },

  handleCheck: function(key, value) {
    this.setState({
      checkboxItems: this.state.checkboxItems.map((item) => {
        if (item.key === key) {
          item.isChecked = value;
        }
        return item;
      })
    })
  },

  handleSubmit: function(event) {
    event.preventDefault();
    let date = this.state.date;
    let attendants = _.filter(this.state.checkboxItems, (item) => {
      return item.isChecked;
    }).map((item) => {
      return item.key;
    });

    this.postAttendance({ date: date, attendants: attendants })
  },

  postAttendance: function(attendanceObj) {
    console.log(attendanceObj);
  },

  render : function() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <CheckboxList
            items={this.state.checkboxItems}
            onChange={this.handleCheck}
          />
          <input
            className="btn"
            type="submit"
            value="Submit"
          />
        </form>
      </div>
    );
  }
});

module.exports = Admin;
