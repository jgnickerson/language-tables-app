import React from 'react';

var Login = React.createClass({
  getInitialState: function() {
    return {
      password: '',
      incorrect: false,
    }
  },

  authenticate: function (e) {
    e.preventDefault();
    if (this.state.password === "123LTapp") {
      this.props.authenticate();
    } else {
      this.setState({incorrect: true})
    }
  },

  render: function() {
    let error = this.state.incorrect ? "Incorrect Password...Try again" : null;
    return (
      <div>
        <h2>Admin Page Login</h2>
        <form>
          <input type="password"
            placeholder="Enter the Admin password..."
            value={this.state.password}
            onChange={(e)=>{this.setState({password:e.target.value})}}
            />
          <label type="errorMessage">{error}</label>

          <button type="submit" className="btn pull-right" onClick={this.authenticate}>Submit</button>
          <a href="/" className="btn pull-right">Back</a>
        </form>
      </div>
    )
  }
});

module.exports = Login;
