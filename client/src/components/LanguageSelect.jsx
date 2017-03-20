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
            let string;
            if (item.language_string === "ASL") {
              string = item.language_string;
            } else {
              string = _.capitalize(item.language_string);
            }
            return {
              label: string,
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
          onChange={(language) => {this.props.onChange(language)}}
          clearable={true}
        />
      </div>
    );
  }
});

module.exports = LanguageSelect;
