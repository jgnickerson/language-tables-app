/*
  AccountFields.jsx
  Email, school id, name
*/

//var React = require('react');
import React from 'react';
import Select from 'react-select';
import $ from 'jquery';
import _ from 'lodash';

var AccountFields = React.createClass({

  getInitialState: function() {
    return {
      courses: [],
      firstName: "",
      lastName: "",
      id: "",
      email: ""
    }
  },

  componentWillMount: function() {
    $.ajax({
        url: 'http://basin.middlebury.edu:3000/courses?lang='+this.props.language,
        datatype: 'json',
        success: (response) => {
          let options = response.map(function(item) {
            return {
              label: item,
              value: item
            }
          });
          this.setState({ courses: options });
        },
        error: function(error) {
          console.log(error);
        }
    });
  },

  checkID: function(id) {
    // restricting the user to only type in digits
    let text = id;
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

  checkForEnter: function(e, field) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) {
      if (field === 'firstName') {
        this.props.setFirstName(this.state.firstName);
      }
      if (field === 'lastName') {
        this.props.setLastName(this.state.lastName);
      }
      if (field === 'id') {
        this.props.setID(this.state.id);
      }
      if (field === 'email') {
        this.props.setEmail(this.state.email);
      }
    }
  },

  render : function() {
    let courseSelect, middId;

    if (this.state.courses) {
      courseSelect = <div>
                      <label>Course enrollment: </label>
                      <Select
                        name="course-select"
                        placeholder="Select a course..."
                        value={this.props.course}
                        options={this.state.courses}
                        onChange={(course) => {this.props.courseChange(course)}}
                        clearable={true}
                      />
                      <br />
                      </div>
    }

    if (this.props.course !== "Middlebury College Guest") {
      middId = <div>
                <label>Midd ID: </label>
                <input type="text"
                  onBlur={() => {this.props.setID(this.state.id)}}
                  value={this.state.id}
                  onKeyDown={(event) => {this.checkForEnter(event, 'id')}}
                  onChange={(event) => {this.checkID(event.target.value)}}
                placeholder="00123456" maxLength="8"/>
                </div>
    }

    return (
      <div>
        <form onSubmit={this.props.handleSubmit}>
            <label>Name: </label>
            <div style={{display: "inline", width: "450px"}}>
              <input type="text-name-left"
                onBlur={() => {this.props.setFirstName(this.state.firstName)}}
                onKeyDown={(event) => {this.checkForEnter(event, 'firstName')}}
                onChange={(event) => {this.setState({firstName: event.target.value})}}
                value={this.state.firstName}
                placeholder="First"/>

              <input type="text-name-right"
                onBlur={() => {this.props.setLastName(this.state.lastName)}}
                onKeyDown={(event) => {this.checkForEnter(event, 'lastName')}}
                onChange={(event) => {this.setState({lastName: event.target.value})}}
                value={this.state.lastName}
                placeholder="Last"/>
            </div>

            {courseSelect}

            {middId}

            <label>Email: </label>
            <input type="text"
              onBlur={() => {this.props.setEmail(this.state.email)}}
              onKeyDown={(event) => {this.checkForEnter(event, 'email')}}
              onChange={(event) => {this.setState({email: event.target.value})}}
              value={this.state.email}
              placeholder="example@middlebury.edu"/>
            <br />
            <input className="btn" type="submit" value="Submit" />
        </form>
      </div>
    );
  }
});

module.exports = AccountFields;
