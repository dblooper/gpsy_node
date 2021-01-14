import { Button, Fab, Paper, Popover, Tooltip, Typography } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add';
import React from 'react'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Popper from './popper/Popper';

const useStyles = makeStyles(theme => ({
    typography: {
        padding: theme.spacing(2),
      },
    paper: {
        minWidth: '180px',
        display: 'flex',
        flexDirection: 'row',
        margin: theme.spacing(1),
        padding: theme.spacing(2)
    },
    fab: {
        margin: theme.spacing(2),
      },
      absolute: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(3),
      },
}))

const TrackItem = (props) => {
    const classes = useStyles();
    
    return (
        <Paper elevation={1} className={classes.paper}>
            <div style={{width: '80%'}}>
                <Typography variant="subtitle1">{props.name}</Typography>
                <Typography variant="subtitle2">{props.author}</Typography>
            </div>
            <Popper/>
        </Paper>
    )
}

export default TrackItem
