import React, {useEffect} from 'react';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Avatar from '../avatar/Avatar';
import { Archive, Create, LibraryMusic, PhonelinkRing, QueueMusic, Timelapse } from '@material-ui/icons';
import CustomStepper from '../stepper/CustomStepper';
import {useSelector} from 'react-redux';
import axios from '../../axios';
import axiosToken from 'axios';
import Link from '@material-ui/core/Link';
import { Button } from '@material-ui/core';
const drawerWidth = '20%';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    position: 'fixed'
  },
  avatarRoot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  appBar: {
    [theme.breakpoints.up('sm')]: {
      width: `100%`
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  // necessary for content to be below app bar
  //toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
    position: 'relative',
    alignItems: 'center',
    height: '100vh',
    marginTop: '0.5rem',
    boxShadow: `0 0 20px ${theme.palette.background.default}`
  },
  mobileDrawerPaper: {
    width: '50%',
    position: 'relative',
    alignItems: 'center',
    marginTop: '0.5rem',
    boxShadow: `0 0 20px ${theme.palette.background.default}`
  },
}));

export default function SideDrawer(props) {
  const { window } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(props.open);
  const userMeta = useSelector(state => state.logged);
  const [user, setUser] = React.useState({});
  const cancelTokenSource = axiosToken.CancelToken.source()
  const [render, setRender] = React.useState(false);

  useEffect(() => {
    axios.get('/user/statistics',
    {headers: {
      Authorization: 'Bearer ' + userMeta.token //the token is a variable which holds the token
    }},
    {
      cancelToken: cancelTokenSource.token
    }
    )
    .then(data => {
      setUser(data.data.info.data);
      console.log(data);
      setRender(true);
    })
    .catch(err => {
      console.log(err)
    })
    return () => {
      cancelTokenSource.cancel();
    }
  }, [userMeta])

  useEffect(() => {
    setMobileOpen(props.mobileOpen);
  }, [props.mobileOpen])

  const drawer = (
    <div>
      <div className={classes.toolbar} />
      <div className={classes.avatarRoot}>
        <Avatar name = {user.login}></Avatar>
        <Typography variant='h4' noWrap>{user.login}</Typography>
      </div>
      <Divider />
      <List>
          <ListItem dense={true}>
            <ListItemIcon><Timelapse></Timelapse></ListItemIcon>
            <ListItemText primary={'Z nami od: '} secondary={user.from ? user.from.replace(/[ZT]/g, ' ').slice(0,19) : ''}/>
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><PhonelinkRing></PhonelinkRing></ListItemIcon>
            <div>
              <ListItemText primary={'Link do konta spotify: '}/>
              <Button style={{width: '90%'}} target="_blank" href={user.spotifyDirectLink} variant="contained" color="secondary">click</Button>
            </div>
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><LibraryMusic/></ListItemIcon>
            <ListItemText primary={'Twoja ulubiona: '} secondary={ user.bestTrack ? user.bestTrack[0].name + '|' + user.bestTrack[0].author : ''} />
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><Archive/></ListItemIcon>
            <ListItemText primary={'Zgromadziliśmy: '} secondary={user.trackQuantity + ' Twoich utworów'} />
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><QueueMusic/></ListItemIcon>
            <ListItemText primary={'Na spotify masz: '} secondary={user.playlistQuantity + ' playlist'} />
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><Create/></ListItemIcon>
            <ListItemText primary={'Utworzyłeś tutaj: ' + props.recPlaylists + ' playlist'} />
          </ListItem>
      </List>
      <CustomStepper></CustomStepper>
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <React.Fragment>
      {render ? <React.Fragment><nav className={classes.root}>
              <Hidden smUp implementation="css">
              <Drawer
                  container={container}
                  variant="temporary"
                  anchor={theme.direction === 'rtl' ? 'right' : 'left'}
                  open={mobileOpen}
                  onClose={props.handleDrawerToggle}
                  classes={{
                      paper: classes.mobileDrawerPaper,
                  }}
                  ModalProps={{
                  keepMounted: true, // Better open performance on mobile.
                  }}
              >
                  {drawer}
              </Drawer>
              </Hidden>
              <Hidden xsDown implementation="css">
              <Drawer
                  classes={{
                      paper: classes.drawerPaper,
                  }}
                  variant="permanent"
                  open
              >
                  {drawer}
              </Drawer>
              </Hidden>
          </nav>
          <div style={{
                margin: '0',
                padding: '0',
                width: '20%',
                height: '100vh'
              }}></div> 
          </React.Fragment>
          : <div style={{
                margin: '0',
                padding: '0',
                width: '20%',
                height: '100vh'
              }}></div>}
    </React.Fragment>
  );
}
