import { Button, Checkbox, FormControlLabel, makeStyles, Paper, TextField, Typography } from '@material-ui/core'
import React from 'react'
import ProgressBar from './ProgressBar'
import {useHistory} from 'react-router-dom';
import axios from '../axios'
import {useDispatch} from 'react-redux';
import {setUser} from "../actions"

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
    },
    passwordField: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
    }
}))

const Login = () => {
    const classes = useStyles();
    const [loginForm, setLoginForm] = React.useState({
        username: {value: '', valid: true, rejectMessage: 'Uzupełnij login'},
        password: {value: '', valid: true, rejectMessage: 'Uzupełnij hasło'},
    });
    const [rejected, setRejected] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [formMessage, setFormMessage] = React.useState('');; 
    const [state, setState] = React.useState({
        remeber: true,
      });
    const history = useHistory();
    const dispatch = useDispatch();
    const handleChange = (event) => {
        setLoginForm({...loginForm, [event.target.name]: {...loginForm[event.target.name], value: event.target.value}})
      };

    const validateForm = (formData) => {
        const copyForm = {...formData}
        if(!formData.username.value.length) {
            setRejected(true);
            setFormMessage(copyForm.username.rejectMessage);
            copyForm.username.valid = false;
            return false;
        } else {
            copyForm.username.valid = true;
        }
        if(!formData.password.value.length) {
            setRejected(true);
            copyForm.password.valid = false;
            setFormMessage(copyForm.password.rejectMessage);
            return false;
        } else {
            copyForm.password.valid = true;
        }
        setRejected(false);
        setLoginForm(copyForm);
        return true;
    }

    const summitLoggin = () => {
        if(!validateForm(loginForm)) {
            return;
        } else {
            setLoading(true);
        }

        const authorities = {
            username: loginForm.username.value,
            password: loginForm.password.value
        }

        axios.post("/login", authorities)
            .then((data) => {
                if(data.data.info.errorCode && data.data.info.errorCode === 1) {
                    setRejected(true);
                    setFormMessage('Nieprawidłowy login lub hasło!')
                } else {
                    console.log(data);
                    dispatch(setUser({
                        username: data.data.info.data.username,
                        spotifyId: data.data.info.data.spotifyId,
                        token: data.data.info.data.token,

                    }))
                    history.push("/dashboard")
                }
                setLoading(false);
            })
            .catch(err => {
                setRejected(true);
                setFormMessage('Kurza twarz! Coś poszło nie tak po naszej stronie. Spróbuj ponownie później')
                console.log(err);
                setLoading(false);
            })

    }
    return (      
        <form className={classes.root}>
            <Paper elevation={20} className={classes.paper} > 
                <Typography variant="h3" className={classes.header}>gpsy</Typography>
                <TextField
                    error={!loginForm.username.valid}
                    id="username"
                    name="username"
                    label="Login"
                    type="login"
                    autoComplete="current-password"
                    variant="outlined"
                    className={classes.inputText}
                    onChange = {(event) =>  handleChange(event)}
                />
                <TextField
                    error={!loginForm.password.valid}
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    variant="outlined"
                    className={[classes.inputText, classes.passwordField].join(' ')}
                    onChange = {(event) =>  handleChange(event)}
                    onKeyPress= {(e) => {
                        if (e.key === 'Enter') {
                            summitLoggin();
                        }
                    }}

                />
                <div style={{maxHeight: "40px", height: '30px', textAlign: 'center'}}>
                    {rejected ? <Typography 
                                    variant="p">{formMessage}
                                </Typography> : (<Typography 
                                                    variant="p">Zapomniałeś hasła?<Button color="primary">Odzyskaj</Button>
                                                </Typography>)}
                </div>
                <FormControlLabel 
                    control={<Checkbox checked={state.remeber} onChange={handleChange} name="remeber" />}
                    label="Zapamiętaj mnie"
                />
                <Button 
                    focus
                    color="primary" 
                    variant="outlined" 
                    style={{width: '80%'}} 
                    onClick={summitLoggin}
                    onKeyPress= {(e) => {
                        if (e.key === 'Enter') {
                          summitLoggin();
                        }
                    }}
                >Login</Button>
                <Typography variant="p">Nie masz jeszcze konta? <Button color="primary" onClick={() => history.replace("/register")}>Zarejestruj</Button></Typography>
                <div style={{height: "20px", width: '90%'}}>
                    {loading ? <ProgressBar className={classes.progress}></ProgressBar> : null}
                </div>
            </Paper>
        </form>
    )
}

export default Login
