import { Button, Checkbox, FormControlLabel, makeStyles, Paper, TextField, Typography } from '@material-ui/core'
import React from 'react'
import ProgressBar from './ProgressBar'

const useStyles = makeStyles(theme => ({
    root: {
        margin: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle, rgba(255,245,157,1) 30%, rgba(102, 187, 106,1) 70%, rgba(46,46,46,1) 100%)'
    },
    paper: {
        margin: 0,
        padding: '2rem',
        width: '30%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    inputText: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
    }, 
    header: {
        margin: theme.spacing(1),
        color: theme.palette.secondary.dark
    }
}))

const Login = () => {
    const classes = useStyles();
    const [state, setState] = React.useState({
        remeber: true,
      });
    
      const handleChange = (event) => {
        setState({ ...state, [event.target.name]: event.target.checked });
      };
    return (
        <form className={classes.root}>
            <Paper elevation={20} className={classes.paper} > 
                <Typography variant="h3" className={classes.header}>gpsy</Typography>
                <TextField
                    id="outlined-login-input"
                    label="Login"
                    type="login"
                    autoComplete="current-password"
                    variant="outlined"
                    className={classes.inputText}
                />
                <TextField
                    id="outlined-password-input"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    variant="outlined"
                    className={classes.inputText}
                    style={{marginBottom: '0'}}
                />
                <Typography variant="p">Zapomniałeś hasła?<Button color="primary">Odzyskaj</Button></Typography>
                <FormControlLabel 
                    control={<Checkbox checked={state.remeber} onChange={handleChange} name="remeber" />}
                    label="Zapamiętaj mnie"
                />
                <Button color="primary" variant="outlined" style={{width: '80%'}}>Login</Button>
                <Typography variant="p">Nie masz jeszcze konta? <Button color="primary">Zarejestruj</Button></Typography>
                <ProgressBar className={classes.progress}></ProgressBar>
            </Paper>
        </form>
    )
}

export default Login
