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
        boxSizing: 'border-box',
        maxHeight: '100%',
        display: 'flex',
        position: 'relative',
        flexDirection: 'row',
        padding: theme.spacing(2),
    },
    fab: {
        boxSizing: 'border-box',
        padding: theme.spacing(1),
        minWidth: '250px',
        maxHeight: '105px',
      },
    bkgNumber: {
        margin: '0', 
        padding: '0', 
        top: '0', 
        fontSize: '5rem', 
        fontWeight: 'bold', 
        position: 'absolute', 
        opacity: '0.5',
        color: theme.palette.secondary.dark,
        zIndex: 0
    }
}))

const TrackItem = (props) => {
    const classes = useStyles();
    
    return (
        <div className={classes.fab}>
            <Paper elevation={10} className={classes.paper}>
                <Typography variant="h2" className={classes.bkgNumber}>{props.index}</Typography>
                <div style={{zIndex: '10', width: '80%', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <Typography variant="caption" style={{fontWeight: 'bold'}}>{props.name}</Typography>
                    <Typography variant="caption">{props.author}</Typography>
                </div>
                <Popper/>
            </Paper>
        </div>
    )
}

export default TrackItem
