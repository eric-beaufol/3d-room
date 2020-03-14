import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { hot } from 'react-hot-loader/root'
import Home from '../Home/Home.js'
import styles from './App.css'

class App extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Router>
        <div className={styles.app}>
          <Route exact path="/" component={Home}/>
        </div>
      </Router>
    );
  }
}

export default hot(App)