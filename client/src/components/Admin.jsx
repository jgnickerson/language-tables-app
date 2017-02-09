import React from 'react';
import CheckboxList from './CheckboxList';
import moment from 'moment';
import _ from 'lodash';

var Admin = React.createClass({
  getInitialState: function() {
    return ({
      date: "",
      checkboxItems: [],
      languages: []
    })
  },

  componentWillMount: function() {
    //get checkbox items
    let request1 = new XMLHttpRequest();
    request1.open('GET', '/attendance/', true);
    request1.onload = () => {
      if (request1.status >= 200 && request1.status < 400) {
        let response = JSON.parse(request1.responseText);
        console.log(response);
        let checkboxItems = this.formatCheckboxItems(response.attendants);
        this.setState({
          date: response.date,
          checkboxItems: checkboxItems
        });
      }
    };

    //get languages obj
    let request2 = new XMLHttpRequest();
    request2.open('GET', '/languages', true);
    request2.onload = () => {
      if (request2.status >= 200 && request2.status < 400) {
        let response = JSON.parse(request2.responseText);
        this.setState({
          languages: response
        });
      }
    };

    request1.send();
    request2.send();
  },

  formatCheckboxItems: function (attendants) {
    let checklistItems = attendants.map((attendant) => {
      return {
        label: attendant.name + " - " + attendant.id,
        key: attendant.id,
        language: attendant.language,
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
    let attendants = _.groupBy(_.filter(this.state.checkboxItems, (item) => {
      return item.isChecked;
    }), 'language');
    let absent = _.groupBy(_.filter(this.state.checkboxItems, (item) => {
      return !item.isChecked;
    }), 'language');

    attendants = _.mapValues(attendants, (value) => {
      return _.map(value, (attendant) => {
        return attendant.key;
      })
    });

    absent = _.mapValues(absent, (value) => {
      return _.map(value, (absentee) => {
        return absentee.key;
      })
    });

    this.postAttendance({ date: date, attendants: attendants, absent: absent });
    //**DELETE THIS**//
    let request = new XMLHttpRequest();
    request.open('GET', '/demo/', true);
    request.send();
    window.location.reload();

    //**************//
  },

  postAttendance: function(attendanceObj) {
    var request = new XMLHttpRequest();
    request.open('POST', '/attendance', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(attendanceObj));
  },

  createCheckboxLists: function() {
    let lists = [];
    this.state.languages.forEach((lang) => {
      let langAttendants = _.filter(this.state.checkboxItems, (person) => {
        return person.language === lang.language;
      })

      let list;
      let languageString;
      if (lang.language_string !== "ASL") {
	languageString = _.capitalize(lang.language_string);
      } else {
	languageString = lang.language_string;
      }
      //if (langAttendants.length > 0) {
        list = (
          <div key={lang.language_string}>
            <h3>{languageString}</h3>
            <label type="tablesOf">{"Tables of 6: "+lang.tablesOf6}</label>
            <label type="tablesOf">{"Tables of 8: "+lang.tablesOf8}</label>
            <br/>

            <CheckboxList items={langAttendants} onChange={this.handleCheck} />
            <br/>
          </div>
        )
      //}
      lists.push(list);
    });

    return lists;
  },

  render : function() {
    let date = moment().format("dddd, MMMM Do YYYY");
    return (
      <div>
        <h2>{date}</h2>
        <form onSubmit={this.handleSubmit}>
          {this.createCheckboxLists()}
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
