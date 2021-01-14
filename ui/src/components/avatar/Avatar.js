import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import { deepOrange, deepPurple } from '@material-ui/core/colors';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  purple: {
    color: theme.palette.getContrastText(deepOrange[200]),
    backgroundColor: deepOrange[200],
    width: '10rem',
    height: '10rem',
    boxShadow: '0 0 10px 0 #ccc'
  },
}));

export default function LetterAvatar(props) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Avatar className={classes.purple}><Typography variant="h2" noWrap>
            OP
          </Typography></Avatar>
    </div>
  );
}