import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import { brown, yellow, green } from '@material-ui/core/colors';
import {BrowserRouter} from 'react-router-dom'
import {createStore} from 'redux';
import allReducers from './reducers/index'
import {Provider} from 'react-redux';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    secondary: {
      main: green[400],
    },
    primary: {
      light: '#757ce8',
      main: yellow[200],
    },
    neutral: {
      main: '#fff'
    }
  },
});

const store = createStore(allReducers, 
  /* preloadedState, */
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <React.StrictMode>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </React.StrictMode>
      </BrowserRouter>
    </Provider>
  ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
