/*
  AccountFields.jsx
  Email, school id, name
*/

var React = require('react');

var AccountFields = React.createClass({

  render : function() {
    return (
      <div>
        <form onSubmit={this.props.handleSubmit}>
            <label>Name: </label>
            <input type="text" onChange={this.props.setName} value={this.props.name} />

            <label>Midd ID: </label>
            <input type="text" onChange={this.props.setID} value={this.props.id} />


            <label>Email: </label>
            <input type="text" onChange={this.props.setEmail} value={this.props.email} />
            <br />
            <input className="btn" type="submit" value="Submit" />
        </form>
      </div>
    );
  }
});

module.exports = AccountFields;
