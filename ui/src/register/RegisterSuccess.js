import React, {Fragment} from 'react';
import {Button, makeStyles, Typography} from '@material-ui/core'
import {useHistory} from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
    root: {
        textAlign: 'center',
    },
    header: {
        marginBottom: theme.spacing(1)
    },
    text: {
        textAlign:'left'
    },
    footer: {
        marginTop: theme.spacing(1)
    },
    button: {
        margin: theme.spacing(1),
        width: '90%'
    },
    strong: {
        textTransform: 'uppercase'
    }
}))

const RegisterSuccess = (props) => {
    const classes = useStyles();
    const history = useHistory();
    return (
        <div className={classes.root}>
            <Typography className={classes.header} variant="h3">Rejestracja przebiegła pomyślnie!</Typography>
            <Typography className={classes.text} varinat="h6">Witaj na pokładzie <strong className={classes.strong}>{props.login}</strong> ! Aby móc korzystać z aplikacji musisz potwierdzić adres email. Powinieneś już mieć go w swojej skrzynce mailowej.</Typography>
            <Button className={classes.button} variant="outlined" onClick={() => (history.replace("/"))}>OK</Button>
            <Typography className={classes.footer} variant="h6">Nie zapomnij sprawdzić spamu!</Typography>
        </div>
    )
}

export default RegisterSuccess
