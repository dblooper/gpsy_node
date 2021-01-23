import React from 'react';
import { fade, makeStyles, useTheme } from '@material-ui/core/styles';
import SideDrawer from '../../components/drawer/SideDrawer'
import Navbar from '../../components/navbar/Navbar'
import Grid from '../tracks/grid/Grid'
import {useSelector} from 'react-redux';

const useStyles = makeStyles((theme) => ({
  root: {
         display: 'block',
       },
    trackContent: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    overflow: 'visible',
    flexShrink: '0'
  }
}))

export default function Dashboard(props) {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = React.useState(props.open);
  const user = useSelector(state => state.logged);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className={classes.root}>
      <Navbar handleDrawerToggle={handleDrawerToggle}></Navbar>
      <div className={classes.trackContent}>
        <SideDrawer
          handleDrawerToggle={handleDrawerToggle} mobileOpen={mobileOpen}></SideDrawer>
        {/* <div>Hello world</div> */}
        <Grid></Grid>
        </div>
    </div>
  );
}