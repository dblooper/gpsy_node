import React from 'react'
import { Button, CircularProgress, Fab, FormControl, FormHelperText, InputLabel, makeStyles, NativeSelect, Paper, Popover, Tooltip, Typography } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add';
import { green } from '@material-ui/core/colors';
import CheckIcon from '@material-ui/icons/Check';
import SaveIcon from '@material-ui/icons/Save';
import clsx from 'clsx';

const useStyles = makeStyles(theme => ({
    fab: {
        margin: theme.spacing(1),
    },
    loading: {
        margin: theme.spacing(1),
        minWidth: 220,
        minHeight: 80,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'left',
    },

    wrapper: {
        margin: theme.spacing(1)
    },
    popUpPaper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 220,
      },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },

      buttonSuccess: {
        backgroundColor: green[500],
        '&:hover': {
          backgroundColor: green[700],
        },
      },
      fabProgress: {
        color: green[500],
        position: 'absolute',
        top: theme.spacing(1),
        left: theme.spacing(1),
        zIndex: 1,
        overflow: 'hidden'
      },
      buttonProgress: {
        color: green[500],
        position: 'absolute',
        top: '0',
        left: '0',
        marginTop: 0,
        marginLeft: 0,
      },
}))

const Popper = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;
    const classes = useStyles();
    const [state, setState] = React.useState({
      age: '',
      name: 'hai',
    });


    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const timer = React.useRef();
  
    const buttonClassname = clsx({
      [classes.buttonSuccess]: success,
    });
  
    React.useEffect(() => {
      return () => {
        clearTimeout(timer.current);
      };
    }, []);
  
    const handleButtonClick = () => {
      if (!loading) {
        setSuccess(false);
        setLoading(true);
        timer.current = window.setTimeout(() => {
          setSuccess(true);
          setLoading(false);
        }, 2000);
      }
    };
  
    const handleChange = (event) => {
        const name = event.target.name;
        setState({
          ...state,
          [name]: event.target.value,
        });
    };
  
  
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };
  
    const [content, setContent] = React.useState();
   
    return (
        <div>
            <Tooltip title="Add" 
                    aria-label="add"
                    onClick={handleClick}
                    style={{margin: '0', padding: '0'}}
                    >
                <Fab color="primary" className={classes.fab}>
                <AddIcon />
            </Fab>
            </Tooltip>
            <Popover
                    id={id}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
            >
                {((loading && !success) || (!loading && success)) ? 
                        (<div className={classes.loading}>
                                <div className={classes.wrapper}>
                                    <Fab
                                        aria-label="save"
                                        color="primary"
                                        className={buttonClassname}
                                        onClick={handleButtonClick}
                                    >
                                        {success ? <CheckIcon /> : <SaveIcon />}
                                    </Fab>
                                    {loading && <CircularProgress size={72} className={classes.fabProgress} />}
                                </div>
                            <Typography variant="subtitle1" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>{ success ? 'Zapisano pomyślnie' : 'Zapisuję...'}</Typography>
                        </div>) 
                    : (<div className={classes.popUpPaper}>
                        <FormControl className={classes.formControl}>
                            <InputLabel htmlFor="age-native-helper">Playlista</InputLabel>
                            <NativeSelect
                            value={state.age}
                            onChange={handleChange}
                            inputProps={{
                                name: 'age',
                                id: 'age-native-helper',
                            }}
                            >
                            <option aria-label="None" value="" />
                            <option value={10}>Ten</option>
                            <option value={20}>Twenty</option>
                            <option value={30}>Thirty</option>
                            </NativeSelect>
                            <FormHelperText>Wybierz Playlistę do której dodać utwór</FormHelperText>
                        </FormControl>
                        <Button variant="outlined" color="primary" onClick={handleButtonClick} >Dodaj</Button>
                    </div>)}
            </Popover>
            
        </div>
    )
}

export default Popper
