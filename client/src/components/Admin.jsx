import React from 'react';
import Scroll from 'react-scroll';

import CheckboxList from './CheckboxList';
import moment from 'moment';
import _ from 'lodash';

let Link = Scroll.Link;
let Element = Scroll.Element;

var Admin = React.createClass({
  getInitialState: function() {
    return ({
      date: "",
      checkboxItems: [],
      checkboxWaitlist: [],
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
        let checkboxWaitlist = this.formatCheckboxItems(response.waitlisters);

        this.setState({
          date: response.date,
          checkboxItems: checkboxItems,
          checkboxWaitlist: checkboxWaitlist
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
      checked: value,
      waitlist: false
    }));
  },

  handleWaitlistCheck: function(key, value, language) {
    let request = new XMLHttpRequest();
    request.open('PATCH', '/attendance', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        //console.log("successful request");
        //only actually change the state of the checkbox item if the request succeeds.
        this.setState({
          checkboxWaitlist: this.state.checkboxWaitlist.map((item) => {
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
      checked: value,
      waitlist: true
    }));
  },

  handleLocationChange: function(language, location) {
    let request = new XMLHttpRequest();
    request.open('PATCH', '/attendance', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        // if the request succeeds.
        // set the location of the given language's tables (inside vs outside)
        this.setState({
          languages: this.state.languages.map((item) => {
          // change the location of the given lang
          if (item.language === language) {
            item.location = location;
          }
          return item;
          })
        });
      }
    }
    request.send(JSON.stringify({
      locationChange: true,
      language: language,
      location: location
    }));
  },

  createNavBar: function() {
    let navBarItems = this.state.languages.map((lang) => {
      let langString = lang.language_string === "ASL" ? "ASL" : _.capitalize(lang.language_string);
      return (<li className="admin-nav-bar"><Link to={lang.language_string} offset={-70} smooth={true} duration={250}>{langString}</Link></li>)
    });

    return (
      <div className="admin-nav-bar">
        <ul className="admin-nav-bar">{navBarItems}</ul>
      </div>

    )
  },

  createCheckboxLists: function() {
    let lists = [];
    this.state.languages.forEach((lang) => {
      let langAttendants = _.filter(this.state.checkboxItems, (person) => {
        return person.language === lang.language;
      });
      langAttendants = _.sortBy(langAttendants, [function(o) { return o.label; }]);

      let waitlisters = _.filter(this.state.checkboxWaitlist, (person) => {
        return person.language === lang.language;
      });
      // TODO: sort?

      let list;
      let languageString;
      if (lang.language_string !== "ASL") {
	       languageString = _.capitalize(lang.language_string);
      } else {
	       languageString = lang.language_string;
      }

      list = (
          <Element id={lang.language_string}>
            <div key={lang.language_string}>
              <div type="centered">
                <h3>{languageString}</h3>
                <select value={lang.location} onChange={(event)=>{this.handleLocationChange(lang.language, event.target.value)}}>
                  <option value="inside">inside</option>
                  <option value="outside">outside</option>
                </select>
              </div>

              <label type="tablesOf">{"Tables of 6: "+lang.tablesOf6}</label>
              <label type="tablesOf">{"Tables of 8: "+lang.tablesOf8}</label>
              <br/>

              <label className="checkboxListGuestlist">{"Guestlist:"}</label>
              <CheckboxList items={langAttendants} onChange={this.handleCheck} />
              <br/>
              <label className="checkboxListWaitlist">{"Waitlist:"}</label>
              <CheckboxList items={waitlisters} onChange={this.handleWaitlistCheck}/>
              <br/>
            </div>
          </Element>

      );

      lists.push(list);
    });

    return lists;
  },

  render : function() {
    let date = moment().format("dddd, MMMM Do YYYY");
    let totalCheckedIn = 0,
      totalAttendants = 0,
      totalTablesOf6 = 0,
      totalTablesOf8 = 0,
      insideCheckedIn = 0,
      insideAttendants = 0,
      outsideCheckedIn = 0,
      outsideAttendants = 0;
    this.state.checkboxItems.forEach((item) => {
      let location = this.state.languages.find((lang) => lang.language === item.language).location;
      if (item.isChecked) {
        totalCheckedIn += 1;
        if (location === "inside") {
          insideCheckedIn += 1;
        } else {
          outsideCheckedIn += 1;
        }
      }

      totalAttendants += 1;
      if (location === "inside") {
        insideAttendants += 1;
      } else {
        outsideAttendants +=1;
      }
    });

    let navBar = this.createNavBar();

    this.state.languages.forEach((item) => {
      totalTablesOf6 += item.tablesOf6;
      totalTablesOf8 += item.tablesOf8;
    });
    return (
      <div>
        {navBar}
        <div className="admin-below-nav">
          <h2>{date}</h2>
          <div type="centered">
          {"TOTAL ATTENDANTS: "}<b>{totalCheckedIn+" / "+totalAttendants}</b><br/>
          {"(inside: "}<b>{insideCheckedIn+" / "+insideAttendants}</b>{", outside: "}<b>{outsideCheckedIn+" / "+outsideAttendants}</b>{")"}<br/>
          <br/>
          {"TOTAL TABLES OF 6: "}<b>{totalTablesOf6+" / 12"}</b><br/>
          {"TOTAL TABLES OF 8: "}<b>{totalTablesOf8+" / 6 "}</b><br/>
          </div>
          <br/>
          <form onSubmit={this.handleSubmit}>
            {this.createCheckboxLists()}
          </form>
        </div>
      </div>
    );
  }
});

module.exports = Admin;
