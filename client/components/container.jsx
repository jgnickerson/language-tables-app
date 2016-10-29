import React from 'react';
import ReactDOM from 'react-dom';
import Calendar from './calendar.jsx';
import InfiniteCalendar from 'react-infinite-calendar';
import 'react-infinite-calendar/styles.css';

class Container extends React.Component {
  render() {
    return (
      <div>
        <h1>Language Tables Signup</h1>
        <InfiniteCalendar
          width={ 400 }
          height={ 600 }
          selectedDate={ new Date() }
          disabledDays={ [0,6] }
          keyboardSupport={ true }
        />
      </div>
    )
  }
}

ReactDOM.render(<Container/>, document.getElementById('container'));
