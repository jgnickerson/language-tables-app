import React from 'react';
import ReactDOM from 'react-dom';
import Signup from './components/Signup';
import Admin from './components/Admin';
import styles from './styles/main';
import 'react-select/dist/react-select.css';

const App = React.createClass({
  getInitialState: function() {
    return {
      route: window.location.hash.substr(1)
    }
  },

  componentDidMount: function() {
    window.addEventListener('hashchange', () => {
      this.setState({
        route: window.location.hash.substr(1)
      })
    })
  },

  render: function() {
    let Child;
    switch (this.state.route) {
        case 'admin': Child = Admin; break;
        default: Child = Signup;
    }
    return (
        <div className="container">
          <Child />
        </div>
    );
  }
});

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
