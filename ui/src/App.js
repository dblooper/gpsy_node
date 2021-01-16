import './App.css';
import {makeStyles } from '@material-ui/core/styles';
import Dashboard from './components/Dashboard';

const useStyles = makeStyles(theme => ({
  darkPalette: {
    backgroundColor: theme.palette.background.paper
  }
}))

function App() {
  const classes = useStyles();
  return (
    <div className={classes.darkPalette}>
        <Dashboard></Dashboard>
    </div>
  );
}

export default App;
