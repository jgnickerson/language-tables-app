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
      course         : '',
      id             : '',
      email          : '',
      language       : null,
      date           : '',
      seatsAvailable : null,
      submitSuccess  : null,
      errorMessage   : null,
    };
  },

  handleLanguageChange: function(language) {
    this.setState({
      language       : language,
      date           : '',
      seatsAvailable : null,
      errorMessage   : null,
      course         : ''
    });
  },

  courseChange: function(course) {
    if (course === "Middlebury College Guest") {
      this.setState({
        id: "000GUEST"
      });
    } else {
      this.setState({
        id: ""
      });
    }
    this.setState({
      course : course,
    });
  },

  //if an invalid date is chosen after a valid one, must clear the date field so they can't continue
  handleDateChange : function(date, seatsAvailable) {
    let registrationIsOpen = moment().isBefore(moment(date).startOf('day').add(13, 'hours').add(45, 'minutes'));
    if (registrationIsOpen && seatsAvailable > 0) {
      this.setState({ date: date, seatsAvailable: seatsAvailable });
    }
  },

  setName : function(event) {
    this.setState({
      name : event.target.value
    });
  },

  setID : function(event) {
     // restricting the user to only type in digits
     let text = event.target.value;
     let newText = '';
     let numbers = '0123456789';

      if (text.length < 1) {
        this.setState({ id: ''});
      }
      for (var i=0; i < text.length; i++) {
        if (numbers.indexOf(text[i]) > -1 ) {
          newText = newText + text[i];
        }
        this.setState({ id: newText });
      }
  },

  setEmail : function(event) {
    this.setState({
      email : event.target.value
    });
  },

  handleSubmit : function(event) {
    event.preventDefault();
    // TODO: CHANGE THIS HARDCODED MESS
    if (this.state.language === 2 && moment().isBefore('2017-02-24')) {
      this.setState({
        errorMessage: "Chinese department will allow online sign-ups starting on Friday, February 24th. Until then, you don't need to sign up online."
      });
    } else if (this.state.language === 3 && moment(this.state.date).isAfter('2017-03-31')) {
      this.setState({
        errorMessage: "Please choose an earlier date. For now, French department does not allow signing up for the dates after March 31st."
      });
    } else if (this.state.language === 7 && moment().isBefore('2017-02-23')) {
      this.setState({
        errorMessage: "Japanese department will allow online sign-ups starting on Thursday, February 23th. Until then, you don't need to sign up online."
      });
    } else if (this.state.id.length !== 8 && this.state.id !== "000GUEST") {
      this.setState({
        errorMessage: "ID number has to be 8 digits."
      });
    } else if (this.state.name === '') {
      this.setState({
        errorMessage: "Please, enter a name."
      });
    } else if (this.state.email === '') {
      this.setState({
        errorMessage: "Please, enter an email address."
      });
    } else if (this.state.course === '') {
      this.setState({
        errorMessage: "Please, select a course enrollment status."
      });
    } else if (this.state.language === 10 && this.state.id !== "000GUEST") {
        this.checkRestrictions();
    } else {
      this.setState({
        errorMessage: null
      });
      this.postSubmission();
    }
  },

  checkRestrictions : function() {
    let information = this.formatData();
    $.ajax({
        url: 'http://basin.middlebury.edu:3000/restrictions',
        type: 'POST',
        datatype: 'json',
        data: JSON.stringify(information),
        contentType: "application/json",
        success: (response) => {
          if (response) {
            this.setState({
              errorMessage: null
            });
            this.postSubmission();
          } else {
            this.setState({
              errorMessage: "Please choose a different date. Spanish department only allows 1 sign-up every 2-week period."
            });
          }
        },
        error: function(error) {
          console.log(error);
        }
    });
  },

  formatData : function() {
    var reservation = {
      name : this.state.name,
      course: this.state.course,
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
      url:'http://basin.middlebury.edu:3000/signup',
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
    let calendar, information, confirmation, errorMessage;

    //TODO: POSSIBLY REMOVE THE TEMPORARY WARNING
    let warning, warningText;

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

    if (this.state.language === 2) {
      warningText = "Please only sign up for the days that you are assigned by the Chinese Department."
    }
    warning = <div><h2 type="warning">{warningText}</h2></div>



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
                          handleSubmit={this.handleSubmit}
                          language={this.state.language}
                          course={this.state.course}
                          courseChange={this.courseChange}
                      />
                    </div>
    }

    if (this.state.errorMessage !== null) {
      errorMessage = <div><br/><label type="errorMessage">{this.state.errorMessage}</label></div>
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
        {warning}
        {calendar}
        <br/>
        {information}
        {errorMessage}
        {confirmation}
        <br/>
      </div>
    );
  }
});

module.exports = Signup;
