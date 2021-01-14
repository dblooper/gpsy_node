import './App.css';
import TrackDashboard from './components/TrackDashboard';
import {makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  darkPalette: {
    backgroundColor: theme.palette.background.paper
  }
}))

function App() {
  const classes = useStyles();
  return (
    <div className={classes.darkPalette}>
        <TrackDashboard></TrackDashboard>
    </div>
  );
}

export default App;
