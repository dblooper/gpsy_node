import './App.css';
import {makeStyles } from '@material-ui/core/styles';
import Dashboard from './dashboard/Dashboard';
import Login from './login/Login';
import Register from './register/Register';
import {Route, Switch} from 'react-router-dom';
import ScrollToTop from './components/scroll-to-top/ScrollToTop';
import Home from './home/Home';

const useStyles = makeStyles(theme => ({
  darkPalette: {
    backgroundColor: theme.palette.background.paper
  }
}))

function App() {
  const classes = useStyles();
  return (
    <div className={classes.darkPalette}>
        <ScrollToTop>
          <Switch>
            <Route path="/register" component={Register} />
            <Route path="/login" component={Login} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/" exact component={Home} />
          </Switch>
        </ScrollToTop> 
    </div>
  );
}

export default App;
