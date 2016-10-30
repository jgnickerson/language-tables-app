var React = require('react');

var Success = React.createClass({
  render : function() {
    return (
      <div>
        <h2>You've made a reservation with the devil!</h2>
        <p>Please check your email <b>{this.props.fieldValues.email}</b> for confirmation.</p>
      </div>
    );
  }
});

module.exports = Success;
