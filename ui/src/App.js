import './App.css';
import {makeStyles } from '@material-ui/core/styles';
import Dashboard from './components/Dashboard';
import Login from './login/Login';
import Register from './register/Register';

const useStyles = makeStyles(theme => ({
  darkPalette: {
    backgroundColor: theme.palette.background.paper
  }
}))

function App() {
  const classes = useStyles();
  return (
    <div className={classes.darkPalette}>
        {/* <Login></Login> */}
        <Register></Register>
        {/* <Dashboard></Dashboard> */}
     
    </div>
  );
}

export default App;
