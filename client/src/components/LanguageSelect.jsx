import React from 'react';
import Select from 'react-select';
import $ from 'jquery';
import _ from 'lodash';

//0th selection item greyed out because its value is 0
var LanguageSelect = React.createClass({
  getInitialState: function() {
    return { languages: [] }
  },

  componentWillMount: function() {
    $.ajax({
        url: 'http://localhost:3000/languages',
        datatype: 'json',
        success: (response) => {
          let options = response.map(function(item) {
            return {
              label: _.capitalize(item.language_string),
              value: item.language
            }
          });
          this.setState({ languages: options });
        },
        error: function(error) {
          console.log(error);
        }
    });
  },

  render: function() {
    return (
      <div>
        <br/>
        <Select
          name="language-select"
          placeholder="Select a language..."
          value={this.props.language}
          options={this.state.languages}
          onChange={this.props.onChange}
          clearable={false}
        />
      </div>
    );
  }
});

module.exports = LanguageSelect;
