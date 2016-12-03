import React from 'react';
import LanguageSelect from './LanguageSelect';
import Calendar from './Calendar';
import AccountFields from './AccountFields';
import Confirmation from './Confirmation';
import moment from 'moment'
import $ from 'jquery'

var Signup = React.createClass({
  getInitialState: function() {
    return {
      name           : null,
      id             : null,
      email          : null,
      language       : null,
      date           : null,
      seatsAvailable : null,
      submit         : null
    };
  },

  handleLanguageChange: function(language) {
    this.setState({ language: language });
  },

  //if an invalid date is chosen after a valid one, must clear the date field so they can't continue
  handleDateChange : function(date, seatsAvailable) {
    this.setState({ date: date, seatsAvailable: seatsAvailable });
  },

  setName : function(nm) {
    this.setState({
      name : nm
    });
  },

  setID : function(id) {
    this.setState({
      id : id
    });
  },

  setEmail : function(email) {
    this.setState({
      email : email
    });
  },

  setSubmit : function() {
    // Send changes to confirmation
    console.log(this.state);
    this.setState({
      submit : 1
    });
  },

  formatData : function() {
    var reservation = {
      name : this.state.name,
      id : this.state.id,
      email : this.state.email,
      date : this.state.date.toDate(),
      language : this.state.language
    }

    return reservation;
  },

  handleSubmission : function() {
    let res = this.formatData();
    console.log(res);
    console.log("Submitting data ... in theory");
    $.ajax({
      url:'http://localhost:3000/signup',
      type: 'POST',
      datatype: 'json',
      data: JSON.stringify(res),
      contentType: "application/json",
      success: function(response) {
        console.log("success!");
        console.log(response);
      },
      error: function(error) {
        console.log(error);
      }
    })
  },

  render : function() {
    let calendar, information, confirmation;

    //If a language has been selected, show the calendar
    if (this.state.language !== null) {
      calendar = <Calendar
                    language={this.state.language}
                    onChange={this.handleDateChange}
                  />
    }


    if (this.state.date) {
      let message, date = this.state.date.format("MMMM Do");
      if (this.state.seatsAvailable) {
        message = "You are signing up for " + date;
      } else {
        message = "You are signing up for the waitlist on " + date;
      }
      information = <div>
                      <h2>{message}</h2>
                      <AccountFields
                          name={this.state.name}
                          setName={this.setName}
                          email={this.state.email}
                          setEmail={this.setEmail}
                          id={this.state.id}
                          setID={this.setID}
                          saveValue={this.setSubmit}
                      />
                    </div>
    }

    if (this.state.submit) {
      confirmation = <Confirmation fieldValues={this.formatData()}
                                    submitValues={this.handleSubmission}/>
    }

    return (
      <div>
        <LanguageSelect
          language={this.state.language}
          onChange={this.handleLanguageChange}
        />
        {calendar}
        <br/>
        {information}
        {confirmation}
      </div>
    );
  }
});

module.exports = Signup;
