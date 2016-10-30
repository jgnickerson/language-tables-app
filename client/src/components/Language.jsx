import React from 'react';
import Dropdown from './Dropdown';
import Select from 'react-select';

var options   = [
  {
    description: 'French',
    code: 'french'
  },

  {
    description: 'Spanish',
    code: 'spanish'
  },

  {
    description: 'German',
    code: 'german'
  },

  {
    description: 'Chinese',
    code: 'chinese'
  }];

var Language = React.createClass({
  render : function() {
    return (
      <div>
        <h2>Language</h2>
        <ul className="form-fields">
          <li>
            <Dropdown
              id="dropdownLanguage"
              options={options}
              value={this.props.language}
              labelField='description'
              valueField='code'
              onChange={(data) => this.props.saveValues(data)}
            />
          </li>
        </ul>
      </div>
    );
  }
});

module.exports = Language;
