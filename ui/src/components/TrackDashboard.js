import React from 'react';
import { fade, makeStyles, useTheme } from '@material-ui/core/styles';
import SideDrawer from './drawer/SideDrawer'
import Navbar from '../components/navbar/Navbar'
import Grid from './grid/Grid'

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

export default function TrackDashboard(props) {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = React.useState(props.open);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className={classes.root}>
      <Navbar handleDrawerToggle={handleDrawerToggle}></Navbar>
      <div className={classes.trackContent}>
        <SideDrawer
          username='Daniel'
          dateFrom={new Date().toISOString().substring(0,10)} 
          spotifyUrl='/sdfhg.com'
          handleDrawerToggle={handleDrawerToggle} mobileOpen={mobileOpen}></SideDrawer>
        <Grid></Grid>
        </div>
    </div>
  );
}