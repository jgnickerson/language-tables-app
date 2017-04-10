import React from 'react';
import ReactDOM from 'react-dom';
import Signup from './components/Signup';
import Admin from './components/Admin';
import Update from './components/Update';
import Login from './components/Login';
import styles from './styles/main';
import 'react-select/dist/react-select.css';

const App = React.createClass({
  getInitialState: function() {
    return {
      route: window.location.hash.substr(1),
      isAuthenticated: false
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
    const authenticate = () => this.setState({isAuthenticated: true});

    let Child;
    switch (this.state.route) {
        case 'admin': Child = this.state.isAuthenticated ? <Admin/> : <Login authenticate={authenticate}/>; break;
        case 'update': Child = <Update/>; break;
        default: Child = <Signup/>;
    }
    return (
        <div className="container">
          {Child}
        </div>
    );
  }
});

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
