import React, {useEffect} from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MailIcon from '@material-ui/icons/Mail';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Avatar from '../avatar/Avatar';
import { Archive, Create, LibraryMusic, PhonelinkRing, QueueMusic, Timelapse } from '@material-ui/icons';
import CustomStepper from '../stepper/CustomStepper';

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
    boxShadow: `0 0 5px 0 ${theme.palette.text.primary}`
  },
  mobileDrawerPaper: {
    width: '50%',
    position: 'relative',
    alignItems: 'center',
    marginTop: '0.5rem',
    boxShadow: `0 0 10px 0 ${theme.palette.text.primary}`
  },
}));

export default function SideDrawer(props) {
  const { window } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(props.open);

  useEffect(() => {
    setMobileOpen(props.mobileOpen);
  }, [props.mobileOpen])

  const drawer = (
    <div>
      <div className={classes.toolbar} />
      <div className={classes.avatarRoot}>
        <Avatar></Avatar>
        <Typography variant='h4' noWrap>{props.username}</Typography>
      </div>
      <Divider />
      <List>
          <ListItem dense={true}>
            <ListItemIcon><Timelapse></Timelapse></ListItemIcon>
            <ListItemText primary={'Z nami od: '} secondary={props.dateFrom}/>
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><PhonelinkRing></PhonelinkRing></ListItemIcon>
            <ListItemText primary={'Link do spotify: '} secondary={props.spotifyUrl}/>
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><LibraryMusic/></ListItemIcon>
            <ListItemText primary={'Twoja ulubiona: '} secondary={props.favouriteSong} />
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><Archive/></ListItemIcon>
            <ListItemText primary={'Zgromadziliśmy: ' + props.qtyOfTracks + ' Twoich utworów'} />
          </ListItem>
          <ListItem dense={true}>
            <ListItemIcon><QueueMusic/></ListItemIcon>
            <ListItemText primary={'Na spotify masz: ' + props.uPlaylists + ' playlist'} />
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
    <nav className={classes.root}>
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
  );
}
