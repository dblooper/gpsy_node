import React, {useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import DeleteIcon from '@material-ui/icons/Delete';
import { IconButton, Tooltip, Typography } from '@material-ui/core';
import Popper from '../horizontalList/TrackItem/popper/Popper';

const useStyles = makeStyles(theme => ({
  root: {
    margin: theme.spacing(1),
    marginRight: 0,
    marginLeft: 0
  }, 
  selectedPaper: {
    backgroundColor: theme.palette.success.main
  },
  selectedRoot: {
    width: '100%',
    height: '48px',
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: '0 2rem'
  },
  title: {
    margin: '0 5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }
}));

export default function CenteredTabs(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(1);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const[selected, setSelected] = React.useState(<Tabs
                                                value={value}
                                                onChange={handleChange}
                                                indicatorColor="secondary"
                                                textColor="secondary"
                                                centered
                                                >
                                                <Tab label="Item One" />
                                                <Tab label="Item Two" />
                                                <Tab label="Item Three" />
                                                </Tabs>);

  useEffect(() => {
    if(props.numSelected) {
      setSelected((<div className={classes.selectedRoot}>
                      <Popper/>
                      <Typography className={classes.title} 
                                  color="inherit" 
                                  variant="subtitle1" >{props.numSelected} zaznaczone
                      </Typography>
                    </div>)
      )
    } else {
      setSelected(<Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="secondary"
          centered
          >
          <Tab label="Item One" />
          <Tab label="Item Two" />
          <Tab label="Item Three" />
        </Tabs>)
    }
  }, [props.numSelected])

  return (
    <Paper elevation={0} className={ props.numSelected ? [classes.selectedPaper, classes.root].join(' ') : classes.root}>
      {selected}
    </Paper>
  );
}
