import React from 'react'
import { Button, Checkbox, FormControlLabel, makeStyles, Paper, TextField, Typography } from '@material-ui/core'
import ProgressBar from '../login/ProgressBar'

const useStyles = makeStyles(theme => ({
    root: {
        margin: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle, rgba(255,220,0,1) 10%, rgba(87,121,9,1) 66%, rgba(46,46,46,1) 100%)'
    },
    paper: {
        margin: 0,
        padding: '2rem',
        width: '30%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '& > *': {
            margin: theme.spacing(1)
        }
    },
    inputText: {
        width: '60%'
    }, 
    header: {
        margin: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.secondary.dark
    }
}))

const Register = () => {
    const classes = useStyles();
    const [state, setState] = React.useState({
        remeber: true,
      });
    
      const handleChange = (event) => {
        setState({ ...state, [event.target.name]: event.target.checked });
      };
    return (
        <form className={classes.root}>
        <Paper elevation={3} className={classes.paper} > 
            <Typography variant="h3" className={classes.header}>Panel rejestracji nowego użytkownika</Typography>
            <TextField
                required
                id="outlined-login-input"
                placeholder="min. 6 znaków"
                label="Login"
                type="login"
                autoComplete="current-password"
                variant="outlined"
                className={classes.inputText}
            />
            <TextField
                required
                id="outlined-login-input"
                label="Email"
                type="email"
                autoComplete="current-password"
                variant="outlined"
                className={classes.inputText}
            />
            <TextField
                required
                id="outlined-password-input"
                placeholder="8 znaków, 1 liczba, wielka i mała litera"
                label="Hasło"
                type="password"
                autoComplete="current-password"
                variant="outlined"
                className={classes.inputText}
            />
            <TextField
                required
                id="outlined-password-input"
                label="Potwierdź hasło"
                type="password"
                autoComplete="current-password"
                variant="outlined"
                className={classes.inputText}
            />
            <Button color="primary" variant="outlined" style={{width: '80%'}}>Zarejestruj</Button>
            <ProgressBar ></ProgressBar>
        </Paper>
    </form>
    )
}

export default Register
