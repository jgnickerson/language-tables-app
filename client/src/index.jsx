import React from 'react';
import ReactDOM from 'react-dom';
import Signup from './components/Signup'
import styles from './styles/main';

class App extends React.Component {
  render() {
    return (
        <div className="container">
          <Signup />
        </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
