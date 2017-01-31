/*
  BaselineFields.jsx
  updating the tables of 6 and 8 for each language
*/

var React = require('react');

var BaselineFields = React.createClass({

  render : function() {
    return (
      <div>
        <form onSubmit={this.props.handleSubmit}>
            <h2>Monday</h2>
            <label>Tables of 6: </label>
            <input type="text" onChange={this.props.setMonday6} value={this.props.monday6} />
            <label>Tables of 8: </label>
            <input type="text" onChange={this.props.setMonday8} value={this.props.monday8} />

            <h2>Tuesday</h2>
            <label>Tables of 6: </label>
            <input type="text" onChange={this.props.setTuesday6} value={this.props.tuesday6} />
            <label>Tables of 8: </label>
            <input type="text" onChange={this.props.setTuesday8} value={this.props.tuesday8} />

            <h2>Wednesday</h2>
            <label>Tables of 6: </label>
            <input type="text" onChange={this.props.setWednesday6} value={this.props.wednesday6} />
            <label>Tables of 8: </label>
            <input type="text" onChange={this.props.setWednesday8} value={this.props.wednesday8} />

            <h2>Thursday</h2>
            <label>Tables of 6: </label>
            <input type="text" onChange={this.props.setThursday6} value={this.props.thursday6} />
            <label>Tables of 8: </label>
            <input type="text" onChange={this.props.setThursday8} value={this.props.thursday8} />

            <h2>Friday</h2>
            <label>Tables of 6: </label>
            <input type="text" onChange={this.props.setFriday6} value={this.props.friday6} />
            <label>Tables of 8: </label>
            <input type="text" onChange={this.props.setFriday8} value={this.props.friday8} />

            <br />
            <input className="btn" type="submit" value="Submit" />
        </form>
      </div>
    );
  }
});

module.exports = BaselineFields;
