import React from 'react';

var AddLanguage = React.createClass({
  getInitialState: function() {
    return { language: '' }
  },

  render: function() {
    return (
      <div>
        <input
          type="text"
          name="language-add"
          placeholder="Add a language..."
          value={this.props.newLanguage}
          onChange={this.props.setNewLanguage}
        />
      </div>
    );
  }
});

module.exports = AddLanguage;
