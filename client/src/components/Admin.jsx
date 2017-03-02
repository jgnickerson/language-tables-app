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

  updateCheckboxItems: function() {
    //get checkbox items
    let request1 = new XMLHttpRequest();
    request1.open('GET', '/attendance/', true);
    request1.onload = () => {
      if (request1.status >= 200 && request1.status < 400) {
        let response = JSON.parse(request1.responseText);
        //console.log(response);

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

  componentDidMount: function() {
    this.interval = setInterval(this.updateCheckboxItems, 2000);
  },

  componentWillUnmount: function() {
    clearInterval(this.interval);
  },

  formatCheckboxItems: function (attendants) {
    let i = 0;
    let checklistItems = attendants.map((attendant) => {
      let isChecked, key,
        label = attendant.name + " - " + attendant.id,
        language = attendant.language;

        if (attendant.id === "RESERVED"){
          key = i++;
          key = attendant.id+key;
          isChecked = true;
        } else if (attendant.id ==="000GUEST") {
          key = attendant.id+attendant.name;
          isChecked = true;
        } else {
          key = attendant.id;
          isChecked = attendant.checked;
        }

      return {
        label: label,
        key: key,
        language: language,
        isChecked: isChecked
      }
    });

    return checklistItems;
  },

  handleCheck: function(key, value, language) {
    let request = new XMLHttpRequest();
    request.open('PATCH', '/attendance', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        //console.log("successful request");
        //only actually change the state of the checkbox item if the request succeeds.
        this.setState({
          checkboxItems: this.state.checkboxItems.map((item) => {
            if (item.key === key) {
              item.isChecked = value;
            }
            return item;
          })
        });
      }
    }
    request.send(JSON.stringify({
      id: key,
      language: language,
      checked: value
    }))
  },


  createCheckboxLists: function() {
    let lists = [];
    this.state.languages.forEach((lang) => {
      let langAttendants = _.filter(this.state.checkboxItems, (person) => {
        return person.language === lang.language;
      });
      langAttendants = _.sortBy(langAttendants, [function(o) { return o.label; }]);

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
    let totalCheckedIn = 0,
      totalAttendants = 0,
      totalTablesOf6 = 0,
      totalTablesOf8 = 0;
    this.state.checkboxItems.forEach((item) => {
      if (item.isChecked) {
        totalCheckedIn += 1;
      }
      totalAttendants += 1;
    });

    this.state.languages.forEach((item) => {
      totalTablesOf6 += item.tablesOf6;
      totalTablesOf8 += item.tablesOf8;
    });
    return (
      <div>
        <h2>{date}</h2>
        {"TOTAL ATTENDANTS:       "}<b>{totalCheckedIn+" / "+totalAttendants}</b><br/>
        {"TOTAL TABLES OF 6:      "}<b>{totalTablesOf6+" / 12"}</b><br/>
        {"TOTAL TABLES OF 8:      "}<b>{totalTablesOf8+" / 6 "}</b><br/>
        <form onSubmit={this.handleSubmit}>
          {this.createCheckboxLists()}
        </form>
      </div>
    );
  }
});

module.exports = Admin;
