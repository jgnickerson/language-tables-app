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
    return { courses: [] }
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
                <input type="text" onChange={(event) => {this.props.setID(event)}} value={this.props.id}
                placeholder="00123456" maxLength="8"/>
                </div>
    }

    return (
      <div>
        <form onSubmit={this.props.handleSubmit}>
            <label>Name: </label>
            <input type="text" onChange={(event) => {this.props.setName(event)}} value={this.props.name}
              placeholder="First Last"/>

            {courseSelect}

            {middId}

            <label>Email: </label>
            <input type="text" onChange={(event) => {this.props.setEmail(event)}} value={this.props.email}
              placeholder="example@middlebury.edu"/>
            <br />
            <input className="btn" type="submit" value="Submit" />
        </form>
      </div>
    );
  }
});

module.exports = AccountFields;
