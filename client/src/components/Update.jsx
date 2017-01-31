import React from 'react';
import BaselineFields from './BaselineFields';
import LanguageSelect from './LanguageSelect';
import AddLanguage from './AddLanguage';

import $ from 'jquery';

var Update = React.createClass({
  getInitialState: function() {
    return {
      language        : '',
      newLanguage     : '',

      monday6  : '',
      monday8  : '',

      tuesday6  : '',
      tuesday8  : '',

      wednesday6  : '',
      wednesday8  : '',

      thursday6  : '',
      thursday8  : '',

      friday6  : '',
      friday8  : '',
    };
  },

  getBaseline: function(language) {
    let promise = new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open('GET', '/update?lang='+language, true);
      request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
          let response = JSON.parse(request.responseText);
          resolve(response);
        } else {
          reject();
        }
      };
      request.send();
    });

    return promise;
  },

  handleLanguageChange: function(language, value) {
    this.getBaseline(language).then((response) => {
      this.setState({
        value : value,
        language : language,

        monday6  : response[0].tablesOf6,
        monday8  : response[0].tablesOf8,

        tuesday6  : response[1].tablesOf6,
        tuesday8  : response[1].tablesOf8,

        wednesday6  : response[2].tablesOf6,
        wednesday8  : response[2].tablesOf8,

        thursday6  : response[3].tablesOf6,
        thursday8  : response[3].tablesOf8,

        friday6  : response[4].tablesOf6,
        friday8  : response[4].tablesOf8,
      });
    });
  },

  setNewLanguage: function(event) {
    this.setState({
      newLanguage : event.target.value
    });

    if (event.target.value === '') {
      this.setState({
        monday6  : '',
        monday8  : '',

        tuesday6  : '',
        tuesday8  : '',

        wednesday6  : '',
        wednesday8  : '',

        thursday6  : '',
        thursday8  : '',

        friday6  : '',
        friday8  : '',
      });
    }
  },

  handleSubmit : function(event) {
    event.preventDefault();
    let submitObj = {
                      language : this.state.language,
                      baseline : [{ weekday: 'Monday',    tablesOf6: this.state.monday6,    tablesOf8: this.state.monday8 },
                                  { weekday: 'Tuesday',   tablesOf6: this.state.tuesday6,   tablesOf8: this.state.tuesday8 },
                                  { weekday: 'Wednesday', tablesOf6: this.state.wednesday6, tablesOf8: this.state.wednesday8 },
                                  { weekday: 'Thursday',  tablesOf6: this.state.thursday6,  tablesOf8: this.state.thursday8 },
                                  { weekday: 'Friday',    tablesOf6: this.state.friday6,    tablesOf8: this.state.friday8 }]
                    };
    this.postSubmission(submitObj);
  },

  postSubmission : function(submitObj) {
    var request = new XMLHttpRequest();
    request.open('POST', '/update', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(submitObj));
  },

  setMonday6 : function(event) {
    this.setState({
      monday6 : event.target.value
    });
  },

  setMonday8 : function(event) {
    this.setState({
      monday8 : event.target.value
    });
  },

  setTuesday6 : function(event) {
    this.setState({
      tuesday6 : event.target.value
    });
  },

  setTuesday8 : function(event) {
    this.setState({
      tuesday8 : event.target.value
    });
  },

  setWednesday6 : function(event) {
    this.setState({
      wednesday6 : event.target.value
    });
  },

  setWednesday8 : function(event) {
    this.setState({
      wednesday8 : event.target.value
    });
  },

  setThursday6 : function(event) {
    this.setState({
      thursday6 : event.target.value
    });
  },

  setThursday8 : function(event) {
    this.setState({
      thursday8 : event.target.value
    });
  },

  setFriday6 : function(event) {
    this.setState({
      friday6 : event.target.value
    });
  },

  setFriday8 : function(event) {
    this.setState({
      friday8 : event.target.value
    });
  },


  render : function() {
    let languageSelect, information, addLanguage, or;

    if (this.state.language === '') {
      addLanguage = (<AddLanguage
                        newLanguage={this.state.newLanguage}
                        setNewLanguage={this.setNewLanguage}
                      />);
    }

    if (this.state.newLanguage === '') {
      languageSelect = (<LanguageSelect
                          language={this.state.language}
                          onChange={this.handleLanguageChange}
                        />);
    }

    if (this.state.language === '' && this.state.newLanguage === '') {
      or = (<label type="or">OR</label>);
    }

    if (this.state.language !== '' || this.state.newLanguage !== '') {

      information = <div>
                      <BaselineFields
                          language={this.state.language}

                          setMonday6={this.setMonday6}
                          setMonday8={this.setMonday8}

                          monday6={this.state.monday6}
                          monday8={this.state.monday8}

                          setTuesday6={this.setTuesday6}
                          setTuesday8={this.setTuesday8}

                          tuesday6={this.state.tuesday6}
                          tuesday8={this.state.tuesday8}

                          setWednesday6={this.setWednesday6}
                          setWednesday8={this.setWednesday8}

                          wednesday6={this.state.wednesday6}
                          wednesday8={this.state.wednesday8}

                          setThursday6={this.setThursday6}
                          setThursday8={this.setThursday8}

                          thursday6={this.state.thursday6}
                          thursday8={this.state.thursday8}

                          setFriday6={this.setFriday6}
                          setFriday8={this.setFriday8}

                          friday6={this.state.friday6}
                          friday8={this.state.friday8}

                          handleSubmit={this.handleSubmit}
                      />
                    </div>
    }
    return (
      <div>
        <h1>Baseline Table Allocation Update</h1>
        <br/>
        {addLanguage}
        <br/>
        {or}
        {languageSelect}
        {information}
      </div>
    );
  }
});

module.exports = Update;
