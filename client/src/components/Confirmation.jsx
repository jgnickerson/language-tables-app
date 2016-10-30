/*
  Confirmation.jsx
  Single page form
*/

var React = require('react');

var Confirmation = React.createClass({
  render : function() {
    return (
      <div>
        <h2>Confirm reservation</h2>
        <ul>
          <li><b>Name:     </b>{this.props.fieldValues.name}</li>
          <li><b>Email:    </b>{this.props.fieldValues.email}</li>
          <li><b>ID:       </b>{this.props.fieldValues.id}</li>
          <li><b>Date:     </b>{this.props.fieldValues.date.toString()}</li>
          <li><b>Language: </b>{this.props.fieldValues.language}</li>
        </ul>
        <ul className="form-fields">
          <li className="form-footer">
            <button className="btn -primary pull-right" onClick={data => {this.props.submitValues(data)}}>Submit Reservation</button>
          </li>
        </ul>
      </div>
    );
  }
});

module.exports = Confirmation;
