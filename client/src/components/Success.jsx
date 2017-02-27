var React = require('react');

var Success = React.createClass({
  render : function() {
    if (this.props.success === "OK") {
      return (
        <div>
          <h2>You've made a reservation for Language Tables on {this.props.date.format("MMMM Do")}</h2>
          <p style={{"textAlign": "center"}}>Please check your email <b>{this.props.email}</b> for confirmation.</p>
          <a style={{"textAlign": "center", "display": "block"}} href="http://localhost:3000/">Click here to make another reservation.</a>
        </div>
      );
    } else {
      return (
        <div>
          <h2>There was an error. Please try again by clicking on the link below.</h2>
          <a style={{"textAlign": "center", "display": "block"}} href="http://localhost:3000/">Click here to make another reservation.</a>
        </div>
      )
    }

  }
});

module.exports = Success;
