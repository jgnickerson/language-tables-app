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
      errorMessage   : null,
    };
  },

  handleLanguageChange: function(language) {
    this.setState({
      language       : language,
      date           : '',
      seatsAvailable : null
    });
  },

  //if an invalid date is chosen after a valid one, must clear the date field so they can't continue
  handleDateChange : function(date, seatsAvailable) {
    let registrationIsOpen = moment().isBefore(moment(date).startOf('day').add(11, 'hours').add(15, 'minutes'));
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

  handleSubmit : function(event) {
    event.preventDefault();
    if (this.state.id.length !== 8) {
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
    } else {
      this.setState({
        errorMessage: null
      });
      this.postSubmission();
    }
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
