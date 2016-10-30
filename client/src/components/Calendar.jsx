/*
  Calendar.jsx
  User selects language table date
*/
import InfiniteCalendar from 'react-infinite-calendar';
var React = require('react');
require('react-infinite-calendar/styles.css');

var Calendar = React.createClass({
  today : new Date(),
  minDate : (Number(new Date() - (24*60*60*1000) * 7)),

  render : function() {
    return (
      <div>
        <h2>Date</h2>
        <ul className="form-fields">
          <li>
            <InfiniteCalendar
              width={400}
              height={200}
              selectedDate={this.today}
              onSelect={(data) => {this.props.saveValues(data)}}
              disabledDays={[0,6]}
              minDate={this.minDate}
              ref={"dateCalendar"}
              keyboardSupport={true}
            />
          </li>
        </ul>
      </div>
    );
  }
});

module.exports = Calendar;
