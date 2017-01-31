import React from 'react';
import LanguageSelect from './LanguageSelect';
import Calendar from './Calendar';
import AccountFields from './AccountFields';
import Success from './Success';
import moment from 'moment';
import $ from 'jquery';
import Header from '../svg/header.svg';

var Signup = React.createClass({
  getInitialState: function() {
    return {
      name           : '',
      id             : '',
      email          : '',
      language       : null,
      date           : '',
      seatsAvailable : null,
      submitSuccess  : null,
    };
  },

  handleLanguageChange: function(language) {
    this.setState({ language: language });
  },

  //if an invalid date is chosen after a valid one, must clear the date field so they can't continue
  handleDateChange : function(date, seatsAvailable) {
    this.setState({ date: date, seatsAvailable: seatsAvailable });
  },

  setName : function(event) {
    this.setState({
      name : event.target.value
    });
  },

  setID : function(event) {
    this.setState({
      id : event.target.value
    });
  },

  setEmail : function(event) {
    this.setState({
      email : event.target.value
    });
  },

  handleSubmit : function(event) {
    event.preventDefault();
    this.postSubmission();
  },

  formatData : function() {
    var reservation = {
      name : this.state.name,
      id : this.state.id,
      email : this.state.email,
      date : this.state.date.utc().format(),
      language : this.state.language
    }

    return reservation;
  },

  postSubmission : function() {
    let submission = this.formatData();
    $.ajax({
      url:'http://localhost:3000/signup',
      type: 'POST',
      datatype: 'json',
      data: JSON.stringify(submission),
      contentType: "application/json",
      success: function(response) {
        console.log("Success: ", response);
        this.setState({ submitSuccess: true });
      }.bind(this),
      error: function(error) {
        console.log(error);
        this.setState({ submitSuccess: false });
      }.bind(this)
    })
  },

  onHeaderClick : function() {
    window.location.reload();
  },

  render : function() {
    let calendar, information, confirmation;
    let header = <Header className='normal'
                    onClick={this.onHeaderClick}/>;
    let language = (<LanguageSelect
                      language={this.state.language}
                      onChange={this.handleLanguageChange}
                    />);

    //If a language has been selected, show the calendar
    if (this.state.language !== null) {
      calendar = <Calendar
                    language={this.state.language}
                    date={this.state.date}
                    onChange={this.handleDateChange}
                  />
    }


    if (this.state.date) {
      let message, date = this.state.date.format("MMMM Do");
      if (this.state.seatsAvailable) {
        message = "You are signing up for "+this.state.language+" on " + date;
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
                          handleSubmit={this.handleSubmit}
                      />
                    </div>
    }

    if (this.state.submitSuccess !== null) {
      language = null;
      calendar = null;
      information = null;
      confirmation = <Success
                        success={this.state.submitSuccess}
                        date={this.state.date}
                        email={this.state.email}
                      />
    }

    return (
      <div>
        {header}
        {language}
        {calendar}
        <br/>
        {information}
        {confirmation}
        <br/>
      </div>
    );
  }
});

module.exports = Signup;
