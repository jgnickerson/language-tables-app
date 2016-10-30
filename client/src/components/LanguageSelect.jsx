import React from 'react';
import Select from 'react-select';

var options   = [
  {
    label: 'French',
    value: 'french'
  },

  {
    label: 'Spanish',
    value: 'spanish'
  },

  {
    label: 'German',
    value: 'german'
  },

  {
    label: 'Chinese',
    value: 'chinese'
  }];

var LanguageSelect = React.createClass({
  render: function() {
    return (
      <div>
        <h2>Language</h2>
        <Select
          name="language-select"
          value={this.props.language}
          options={options}
          onChange={this.props.onChange}
        />
      </div>
    );
  }
});

module.exports = LanguageSelect;
