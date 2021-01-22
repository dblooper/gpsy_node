import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import { Button, GridList, GridListTile, Typography } from '@material-ui/core';
import Hexagon from './Hexagon';
import classes2 from './Home.module.css'
import {useHistory} from 'react-router-dom'

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    
    content: {
        margin: 0,
        padding: '8rem',
        paddingLeft: '8rem',
        height: '100vh',
        width: 'calc(100%-2rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems:'flex-start',
        [theme.breakpoints.up('md')]: {
            padding: '1rem',
            paddingLeft: '4rem',
          },
        // alignIntems: 'center'
    },
    rightContent: {
        padding: '1rem',
    },
    upper: {
        height: '20vh',
        marginLeft: '15rem',
        maxWidth: '20%'
    },
    middle: {
        height: '20vh',
        marginLeft: '1rem',
        width: '10%',
        display: 'flex',
        flexDirection: 'row',
        alignItems:'center'
    },
    lower: {
        height: '20vh',
        marginLeft: '15rem'
    },
    hexagonInput: {
        width: "100%", 
        height: "100%", 
        display:"flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center"
        ,"&:hover, &:active": {
            textDecoration: 'underline'
        }
    }
}));

export default function Home(props) {
    const classes = useStyles();
    const history = useHistory();
    return (
        <div className={classes.root}>
            <main className={classes.content}>
                <div className={classes2.Top}>
                    <div className={classes.hexagonInput} onClick={() => history.push("/login")}>Login</div>
                </div>
                <div className={classes2.First}>
                    <div className={classes.hexagonInput}>
                        <Typography variant="h3">Welcome in GPSY</Typography>
                    </div>
                </div>
                <div className={classes2.Second} onClick={() => history.push("/register")}>
                <div className={classes.hexagonInput}>Rejestruj</div>
                </div>
                <div className={classes2.Bottom}>
                    <div className={classes.hexagonInput}>About</div>
                </div>
            </main>
            <div className={classes.rightContent}>
                <Typography>Hello world</Typography>
            </div>
        </div>
    )
}
