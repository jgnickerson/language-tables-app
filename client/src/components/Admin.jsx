import React from 'react';
import CheckboxList from './CheckboxList';
import moment from 'moment';
import _ from 'lodash';

var mockAttendants = [
  {id: "00123123", name: "Gordon Nickerson", "email": "jnickerson@middlebury.edu"},
  {id: "00434434", name: "Amir Amangeldi", "email": "aamangeldi@middlebury.edu"},
  {id: "00987987", name: "Pete Huffman", "email": "phuffman@middlebury.edu"}
]

var Admin = React.createClass({
  getInitialState: function() {
    return ({
      date: "",
      attendants: []
    })
  },

  componentWillMount: function() {
    let date = moment().startOf('day');
    //let request = new XMLHttpRequest();
    //request.open('GET', '/admin/', true);
    //request.onload = function() {}
    //request.onerror = function() {}

    let checkboxItems = this.formatCheckboxItems(mockAttendants);

    this.setState({
      date: date,
      checkboxItems: checkboxItems
    });
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
