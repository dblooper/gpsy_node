import React, { useEffect } from 'react'
import { Button, Checkbox, FormControlLabel, FormHelperText, makeStyles, Paper, TextField, Typography } from '@material-ui/core'
import ProgressBar from '../login/ProgressBar'
import axios from '../axios';

const useStyles = makeStyles(theme => ({
    root: {
        margin: 0,
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle, rgba(255,220,0,1) 10%, rgba(87,121,9,1) 66%, rgba(46,46,46,1) 100%)'
    },
    paper: {
        margin: 0,
        padding: '2rem',
        width: '30vw',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '& > *': {
            margin: theme.spacing(1)
        },
        [theme.breakpoints.down('md')]: {
            width: '90%',
          },
    },
    inputText: {
        width: '70%',
        [theme.breakpoints.down('md')]: {
            width: '90%',
          },
    }, 
    header: {
        margin: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.secondary.dark
    },
    statusInfo: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '3vh',
        width: '100%'
    }
}))

const Register = () => {
    const classes = useStyles();
    const [registerForm, setForm]= React.useState({
        login: {value: '', valid: true, validText: 'Login powinien mieć minimum 6 znaków'},
        email: {value: '', valid: true, validText: 'Nieprawidłowy format adresu email'},
        password: {value: '', valid: true, validText: 'Hasło powinno posiadać 1 wielką, 1 małą literę, 1 cyfrę i minimum 8 znaków'},
        confirmPass: {value: '', valid: true, validText: 'Podane hasła nie są identyczne!'},
    });
    const [loading, setLoading] = React.useState(false);
    const [registerText, setRegisterText] = React.useState(`Wypełnij dane rejestracyjne`);

    const handleChange = (event) => {
        setForm({ ...registerForm, [event.target.name]: {...registerForm[event.target.name], value: event.target.value}});
    };

    const validateInput = (input) => {
        let regForm = {};
        Object.assign(regForm, input);
        let valid = true;
        
        for(let key of Object.keys(regForm)) {   
            switch(key) {
                case 'login': valid = /[0-9A-Za-z!@#$%^&*]{6,20}/.test(input.login.value);
                break;
                case 'email': valid = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(input.email.value);
                break;
                case 'password': valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[0-9A-Za-z!@#$%^&*]{8,20}$/.test(input.password.value);
                break;
                case 'confirmPass': valid = input.password.value === input.confirmPass.value;
            }
            regForm[key].valid = valid;
            if(!valid) {
                setRegisterText(regForm[key].validText);
                break;
            } 
        }     
        if(valid) {
            setRegisterText(`Sukces. Oczekuj na rejestrację`);
        }
        setForm(regForm);
        return valid;
    }

    const register = () => {
        if(validateInput(registerForm)) {
            setLoading(true);
            let authorities = {
                username: registerForm.login.value,
                password: registerForm.password.value,
                email: registerForm.email.value
            }
            axios.post('/register', authorities)
            .then((res) => {
                setLoading(false);
                let defaultMessage = 'Zarejestrowano pomyślnie.';
                switch(res.status) {
                    case 200: setRegisterText( res.data && res.data.info && res.data.info.errorCode === 1 && res.data.info.message[0].error ? res.data.info.message[0].error : defaultMessage);
                    break;
                    case 201: setRegisterText(res.data.info.data.token); 
                    break;
                    default: setRegisterText(defaultMessage); 
                }
                console.log(res);
            })
            .catch(err => {
                let defaultMessage = 'Something went wrong. Try to register later.';
                setLoading(false);
                switch(err.status) {
                    case 400: setRegisterText( err.data && err.data.info && err.data.info.message[0] ? err.data.info.message[0]: defaultMessage);
                    break;
                    default: setRegisterText(defaultMessage) 
                }
                console.log(err);
            })
        }
        
        // alert(JSON.stringify(registerForm));
    }

    return (
        <form className={classes.root}>
        <Paper elevation={3} className={classes.paper} > 
            <Typography variant="h3" className={classes.header}>Rejestracja</Typography>
            <TextField
                required
                error={!registerForm.login.valid}
                id="login"
                placeholder="min. 6 znaków"
                label="Login"
                type="login"
                autoComplete="current-password"
                variant="outlined"
                name='login'
                className={classes.inputText}
                value={registerForm.login.value}
                onChange={(event) => handleChange(event)}
            />
            <TextField
                required
                error={!registerForm.email.valid}
                id="email"
                label="Email"
                type="email"
                autoComplete="current-password"
                variant="outlined"
                name='email'
                className={classes.inputText}
                value={registerForm.email.value}
                onChange={(event) => handleChange(event)}
            />
            <TextField
                required
                error={!registerForm.password.valid}
                id="password"
                placeholder="8 znaków, 1 liczba, wielka i mała litera"
                label="Hasło"
                type="password"
                autoComplete="current-password"
                variant="outlined"
                name='password'
                className={classes.inputText}
                value={registerForm.password.value}
                onChange={(event) => handleChange(event)}
            />
            <TextField
                required
                error={!registerForm.confirmPass.valid}
                id="confirmPass"
                label="Potwierdź hasło"
                type="password"
                autoComplete="current-password"
                variant="outlined"
                name="confirmPass"
                className={classes.inputText}
                value={registerForm.confirmPass.value}
                onChange={(event) => handleChange(event)}
            />
            <div className={classes.statusInfo}>
                { loading ? <ProgressBar></ProgressBar> :  <FormHelperText>{registerText}</FormHelperText>}
            </div>
            <Button onClick={register} color="primary" variant="outlined" style={{width: '80%'}}>Zarejestruj</Button>
        </Paper>
    </form>
    )
}

export default Register
