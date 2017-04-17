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
      errorMessages   : [],
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
    if (this.state.name === '') {
      errors.push("Name required.");
      // this.setState({
      //   errorMessage: "Please, enter a name."
      // });
    }

    if (this.state.course === '') {
      errors.push("Courses Selection Required.");
      // this.setState({
      //   errorMessage: "Please, select a course enrollment status."
      // });
    }

    if (this.state.id.length !== 8 && this.state.id !== "000GUEST") {
      errors.push("Valid 8-digit ID Required.");
      // this.setState({
      //   errorMessage: "ID number has to be 8 digits."
      // });
    }

    if (this.state.email === '') {
      errors.push("Email Required.")
      // this.setState({
      //   errorMessage: "Please, enter an email address."
      // });
    }

    if (!this.validEmail(this.state.email)) {
      errors.push("Valid Email Required.")
      // this.setState({
      //   errorMessage: "Please, enter a valid email address."
      // });
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


    // // check specific department restrictions
    // // TODO: CHANGE THIS HARDCODED MESS
    // if (this.state.language === 2 && this.state.id !== "000GUEST") {
    //   //CHINESE
    //
    //   let period1 = ["2017-02-27T05:00:00Z", "2017-02-28T05:00:00Z", "2017-03-01T05:00:00Z",
    //     "2017-03-02T05:00:00Z", "2017-03-03T05:00:00Z", "2017-03-06T05:00:00Z",
    //     "2017-03-07T05:00:00Z", "2017-03-08T05:00:00Z", "2017-03-09T05:00:00Z",
    //     "2017-03-10T05:00:00Z", "2017-03-13T05:00:00Z", "2017-03-14T05:00:00Z",
    //     "2017-03-15T05:00:00Z", "2017-03-16T05:00:00Z", "2017-03-17T05:00:00Z"];
    //
    //   let period2 = ["2017-03-20T05:00:00Z", "2017-03-21T05:00:00Z", "2017-03-22T05:00:00Z",
    //   "2017-03-23T05:00:00Z", "2017-04-03T05:00:00Z", "2017-04-04T05:00:00Z", "2017-04-05T05:00:00Z",
    //   "2017-04-06T05:00:00Z", "2017-04-07T05:00:00Z"];
    //
    //   let period3 = ["2017-04-10T05:00:00Z", "2017-04-11T05:00:00Z", "2017-04-12T05:00:00Z",
    //   "2017-04-13T05:00:00Z", "2017-04-14T05:00:00Z", "2017-04-17T05:00:00Z",
    //   "2017-04-18T05:00:00Z", "2017-04-19T05:00:00Z", "2017-04-20T05:00:00Z",
    //   "2017-04-21T05:00:00Z", "2017-04-24T05:00:00Z", "2017-04-25T05:00:00Z",
    //   "2017-04-26T05:00:00Z", "2017-04-27T05:00:00Z", "2017-04-28T05:00:00Z"];
    //
    //   let period4 = ["2017-05-01T05:00:00Z", "2017-05-02T05:00:00Z", "2017-05-03T05:00:00Z",
    //     "2017-05-04T05:00:00Z", "2017-05-05T05:00:00Z", "2017-05-08T05:00:00Z",
    //     "2017-05-09T05:00:00Z", "2017-05-10T05:00:00Z", "2017-05-11T05:00:00Z",
    //     "2017-05-12T05:00:00Z"];
    //
    //   // make sure the sign up for the given date is open
    //   if (date === "2017-02-24T05:00:00Z") {
    //     this.setState({
    //       errorMessage: "Sign-up for the week 2/20-2/24 is not required."
    //     });
    //     return;
    //   } else if (period1.includes(date) && moment().isBefore(moment('2017-02-24T05:00:00Z'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 2/27-3/17 will open on Friday, February 24th."
    //     });
    //     return;
    //   } else if (period2.includes(date) && moment().isBefore(moment('2017-03-17T05:00:00Z'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 3/20-4/7 will open on Friday, March 17th."
    //     });
    //     return;
    //   } else if (period3.includes(date) && moment().isBefore(moment('2017-04-07T05:00:00Z'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 4/10-4/28 will open on Friday, April 7th."
    //     });
    //     return;
    //   } else if (period4.includes(date) && moment().isBefore(moment('2017-04-28T05:00:00Z'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 5/1-5/12 will open on Friday, April 28th."
    //     });
    //     return;
    //   } else {
    //     // if sign up is open, check the max of 2 restrictions per week
    //
    //     this.setState({
    //       errorMessage: "Pending..."
    //     });
    //     this.checkRestrictions();
    //     return;
    //   }
    //
    //
    // } else if (this.state.language === 7 && this.state.id !== "000GUEST") {
    //   //JAPANESE
    //
    //   let period1 = ["2017-02-27T05:00:00Z", "2017-02-28T05:00:00Z", "2017-03-01T05:00:00Z",
    //     "2017-03-02T05:00:00Z", "2017-03-03T05:00:00Z", "2017-03-06T05:00:00Z",
    //     "2017-03-07T05:00:00Z", "2017-03-08T05:00:00Z", "2017-03-09T05:00:00Z",
    //     "2017-03-10T05:00:00Z"];
    //
    //   let period2 = ["2017-03-13T05:00:00Z", "2017-03-14T05:00:00Z", "2017-03-15T05:00:00Z",
    //   "2017-03-16T05:00:00Z", "2017-03-17T05:00:00Z", "2017-03-20T05:00:00Z",
    //   "2017-03-21T05:00:00Z", "2017-03-22T05:00:00Z", "2017-03-23T05:00:00Z"];
    //
    //   let period3 = ["2017-04-03T05:00:00Z", "2017-04-04T05:00:00Z", "2017-04-05T05:00:00Z",
    //   "2017-04-06T05:00:00Z", "2017-04-07T05:00:00Z", "2017-04-10T05:00:00Z",
    //   "2017-04-11T05:00:00Z", "2017-04-12T05:00:00Z", "2017-04-13T05:00:00Z",
    //   "2017-04-14T05:00:00Z"];
    //
    //   let period4 = ["2017-04-17T05:00:00Z", "2017-04-18T05:00:00Z", "2017-04-19T05:00:00Z",
    //     "2017-04-20T05:00:00Z", "2017-04-21T05:00:00Z", "2017-04-24T05:00:00Z",
    //     "2017-04-25T05:00:00Z", "2017-04-26T05:00:00Z", "2017-04-27T05:00:00Z",
    //     "2017-04-28T05:00:00Z"];
    //
    //   let period5 = ["2017-05-01T05:00:00Z", "2017-05-02T05:00:00Z", "2017-05-03T05:00:00Z",
    //     "2017-05-04T05:00:00Z", "2017-05-05T05:00:00Z", "2017-05-08T05:00:00Z",
    //     "2017-05-09T05:00:00Z", "2017-05-10T05:00:00Z", "2017-05-11T05:00:00Z",
    //     "2017-05-12T05:00:00Z"];
    //
    //   // make sure the sign up for the given date is open
    //   if (date === "2017-02-24T05:00:00Z") {
    //     this.setState({
    //       errorMessage: "Sign-up for the week 2/20-2/24 is not required."
    //     });
    //     return;
    //   } else if (period1.includes(date) && moment().isBefore(moment('2017-02-23T05:00:00Z').add(19, 'hours'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 2/27-3/10 will open at 7pm on Thursday, February 23rd."
    //     });
    //     return;
    //   } else if (period2.includes(date) && moment().isBefore(moment('2017-03-09T05:00:00Z').add(19, 'hours'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 3/13-3/23 will open at 7pm on Thursday, March 9th."
    //     });
    //     return;
    //   } else if (period3.includes(date) && moment().isBefore(moment('2017-03-23T05:00:00Z').add(19, 'hours'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 4/3-4/14 will open at 7pm on Thursday, March 23rd."
    //     });
    //     return;
    //   } else if (period4.includes(date) && moment().isBefore(moment('2017-04-13T05:00:00Z').add(19, 'hours'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 4/17-4/28 will open at 7pm on Thursday, April 13th."
    //     });
    //     return;
    //   } else if (period5.includes(date) && moment().isBefore(moment('2017-04-27T05:00:00Z').add(19, 'hours'))) {
    //     this.setState({
    //       errorMessage: "Sign-up for the period 5/1-5/12 will open at 7pm on Thursday, April 27th."
    //     });
    //     return;
    //   } else {
    //
    //     // if signup is open, check the max of 3 restrictions
    //     this.setState({
    //       errorMessage: "Pending..."
    //     });
    //     this.checkRestrictions();
    //     return;
    //   }
    // }

    // if (this.state.language === 10 && this.state.id !== "000GUEST") {
    //     this.checkRestrictions();
    // }

    // if no errors, go to postSubmission
    // if (!this.state.errorMessage) {
    //   this.postSubmission();
    // }
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
      name : this.state.name,
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
                          name={this.state.name}
                          setName={(event) => {this.setName(event)}}
                          email={this.state.email}
                          setEmail={(event) => {this.setEmail(event)}}
                          id={this.state.id}
                          setID={(event) => {this.setID(event)}}
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
