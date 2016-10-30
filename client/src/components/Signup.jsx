import React from 'react';
import Language from './Language';
import Calendar from './Calendar';
import AccountFields from './AccountFields';
import Confirmation from './Confirmation';

var Signup = React.createClass({
  getInitialState: function() {
    return {
      name      : null,
      id        : null,
      email     : null,
      language  : null,
      date      : null,
      submit    : null
    };
  },

  setDate : function(dt) {
    this.setState({
      date : dt.toDate()
    });
  },

  handleLanguageChange: function(language) {
    this.setState({ language : language });
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

  setEmail : function(em) {
    this.setState({
      email : em
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
      date : this.state.date,
      language : this.state.language
    }

    return reservation;
  },

  handleSubmission : function(data) {
    console.log("Submitting data ... in theory");
  },

  render : function() {
    let calendar, information, confirmation;

    if (this.state.language) {
      calendar =  <Calendar saveValues={this.setDate} />
    }

    if (this.state.date) {
      information = <AccountFields
                        name={this.state.name}
                        setName={this.setName}
                        email={this.state.email}
                        setEmail={this.setEmail}
                        id={this.state.id}
                        setID={this.setID}
                        saveValue={this.setSubmit}
                    />
    }

    if (this.state.submit) {
      confirmation = <Confirmation fieldValues={this.formatData()}
                                    submitValues={this.handleSubmission}/>
    }

    return (
      <main>
        <Language     language={this.state.language}
                      saveValues={this.setLanguage} />
        {calendar}
        {information}
        {confirmation}
      </main>
    );
  }
});

module.exports = Signup;
