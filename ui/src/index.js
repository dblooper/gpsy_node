import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import { brown, yellow, green } from '@material-ui/core/colors';
import {BrowserRouter} from 'react-router-dom'
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

ReactDOM.render(
  <BrowserRouter>
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  </BrowserRouter>
  ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
