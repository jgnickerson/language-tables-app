/*
  AccountFields.jsx
  Email, school id, name
*/

var React = require('react');

var AccountFields = React.createClass({

  render : function() {
    return (
      <div>
        <h2>Student Info</h2>
        <ul className="form-fields">
          <li>
            <label>Name</label>
            <input type="text" ref="name" onChange={event => {this.props.setName(event.target.value)}} defaultValue={this.props.name} />
          </li>
          <li>
            <label>Midd ID</label>
            <input type="text" ref="middid" onChange={event => {this.props.setID(event.target.value)}} defaultValue={this.props.id} />
          </li>
          <li>
            <label>Email</label>
            <input type="text" ref="email" onChange={event => {this.props.setEmail(event.target.value)}} defaultValue={this.props.email} />
          </li>
          <li className="form-footer">
            <button className="btn -primary pull-right" onClick={() => this.props.saveValue()}>Save &amp; Continue</button>
          </li>
        </ul>
      </div>
    );
  }
});

module.exports = AccountFields;
