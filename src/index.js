import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Link, BrowserRouter as Router } from 'react-router-dom'
import './index.css';
import App from './App';
import Communication from './communication'
import * as serviceWorker from './serviceWorker';

const routing = (
    <Router>
        <div>
            <div align="center">
            <Link to="/verify">
                <button align="center">Verify</button>
            </Link> &nbsp;
            <Link to="/communication">
                <button align="center">Communication</button>
            </Link>
            </div>

            <Route path="/verify" component={App} />
            <Route path="/communication" component={Communication} />
        </div>
    </Router>
    )

ReactDOM.render(routing, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
