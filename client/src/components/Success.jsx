var React = require('react');

var Success = React.createClass({
  render : function() {
    return (
      <div>
        <h2>You've made a reservation for Language Tables on {this.props.date.format("MMMM Do")}</h2>
        <p style={{"text-align": "center"}}>Please check your email <b>{this.props.email}</b> for confirmation.</p>
      </div>
    );
  }
});

module.exports = Success;
