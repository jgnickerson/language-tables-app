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
      firstName      : '',
      lastName       : '',
      course         : '',
      id             : '',
      email          : '',
      language       : null,
      date           : '',
      seatsAvailable : null,
      submitSuccess  : null,
      errorMessages   : [],
    };
  },

  handleLanguageChange: function(language) {
    this.setState({
      language       : language,
      date           : '',
      seatsAvailable : null,
      errorMessages   : [],
      course         : ''
    });
  },

  courseChange: function(course) {
    //TODO: need componentWillMount?... to handle the id changes
    if (course === "Middlebury College Guest") {
      this.setState({
        id: "000GUEST",
        course : course
      });
    } else {
      if (this.state.id === "000GUEST") {
        this.setState({
          id: "",
          course : course
        });
      } else {
        this.setState({
          course : course,
        });
      }
    }
  },

  //if an invalid date is chosen after a valid one, must clear the date field so they can't continue
  handleDateChange : function(date, seatsAvailable) {
    let registrationIsOpen = moment().isBefore(moment(date).startOf('day').add(13, 'hours').add(45, 'minutes'));

    if (registrationIsOpen) {
      this.setState({ date: date, seatsAvailable: seatsAvailable });
    }
  },

  validEmail : function(email) {
    if (this.state.id !== "000GUEST" && email.indexOf("@middlebury.edu") === -1) {
      return false;
    }
    if (this.state.id === "000GUEST" && (email.indexOf("@") === -1
        || email.indexOf(".") === -1))  {
      return false;
    }
    // restricting the user to only type in characters

    let newText = '';
    let invalidChars = " 0123456789~!#$%^&*()_-=+|\"':;[]/";

     for (var i=0; i < email.length; i++) {
       if (invalidChars.indexOf(email[i]) > -1 ) {
         return false;
       }
     }

     return true;
  },

  handleSubmit : function(event) {
    event.preventDefault();
    //make sure the date is T05 not T04
    let date = this.state.date.utc().format();
    let timeZoneString = date.substring(10, date.length);
    if (timeZoneString !== "T05:00:00Z") {
      date = _.replace(date, timeZoneString, "T05:00:00Z")
    }

    let errors = [];

    // check basic info is valid
    if (this.state.firstName === '') {
      errors.push("First name required.");
    }

    if (this.state.lastName === '') {
      errors.push("Last name required.");
    }

    if (this.state.course === '') {
      errors.push("Courses Selection Required.");
    }

    if (this.state.id.length !== 8 && this.state.id !== "000GUEST") {
      errors.push("Valid 8-digit ID Required.");
    }

    if (this.state.email === '') {
      errors.push("Email Required.")
    }

    if (!this.validEmail(this.state.email)) {
      errors.push("Valid Email Required.")

    }

    if (errors.length === 0) {
      this.checkRestrictions((response)=> {
        if (response.maySignup) {
          this.postSubmission();
        } else {
          errors.push(response.message);
          this.setState({errorMessages: errors});
        }
      });
    } else {
      this.setState({errorMessages: errors});
    }
  },

  checkRestrictions : function(callback) {
    let information = this.formatData();
    $.ajax({
        url: 'http://basin.middlebury.edu:3000/restrictions',
        type: 'POST',
        datatype: 'json',
        data: JSON.stringify(information),
        contentType: "application/json",
        success: callback,
        error: (error) => {
          console.log(error);
        }
    });
  },

  formatData : function() {
    let date = this.state.date.utc().format();
    let timeZoneString = date.substring(10, date.length);
    if (timeZoneString !== "T05:00:00Z") {
      date = _.replace(date, timeZoneString, "T05:00:00Z")
    }


    var reservation = {
      firstName : _.capitalize(_.trim(this.state.firstName)),
      lastName : _.capitalize(_.trim(this.state.lastName)),
      course: this.state.course,
      id : this.state.id,
      email : this.state.email,
      date : date,
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
        this.setState({ submitSuccess: response });
      }.bind(this),
      error: function(error) {
        console.log(error);
        this.setState({ submitSuccess: false });
      }.bind(this)
    })
  },

  render : function() {
    let calendar, information, confirmation, errorMessages, warningText;

    let header = <Header className='normal'
                    onClick={(event) => {window.location.reload()}}/>;
    let language = (<LanguageSelect
                      language={this.state.language}
                      onChange={(language) => {this.handleLanguageChange(language)}}
                    />);

    //If a language has been selected, show the calendar
    if (this.state.language !== null) {
      calendar = <Calendar
                    language={this.state.language}
                    date={this.state.date}
                    onChange={(date, seatsAvailable) => {this.handleDateChange(date, seatsAvailable)}}
                  />
    }

    if (this.state.language === 2) {
      warningText = <div><h2 type="warning">{"Please only sign up for the days that you are assigned by the Chinese Department."}</h2></div>
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
                          firstName={this.state.firstName}
                          lastName={this.state.lastName}
                          setFirstName={(firstName) => {this.setState({firstName: firstName})}}
                          setLastName={(lastName) => {this.setState({lastName: lastName})}}
                          email={this.state.email}
                          setEmail={(email) => {this.setState({email: email})}}
                          id={this.state.id}
                          setID={(id) => {this.setState({id: id})}}
                          handleSubmit={(event) => {this.handleSubmit(event)}}
                          language={this.state.language}
                          course={this.state.course}
                          courseChange={(course) => {this.courseChange(course)}}
                      />
                    </div>
    }

    if (this.state.errorMessages !== null) {
      const labels = this.state.errorMessages.map((message, i) => <label key={i} type="errorMessage">{message}</label> );
      errorMessages = <div><br/>{labels}</div>
    }

    if (this.state.submitSuccess !== null) {
      language = null;
      warningText = null;
      calendar = null;
      information = null;
      errorMessages = [];
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
        {warningText}
        {calendar}
        <br/>
        {errorMessages}
        {information}
        {confirmation}
        <br/>
      </div>
    );
  }
});

module.exports = Signup;
