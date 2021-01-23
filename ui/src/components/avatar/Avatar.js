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
    '&:hover': {
      cursor: 'pointer'
    }
  },
  purple: {
    color: theme.palette.getContrastText(deepOrange[200]),
    backgroundColor: deepOrange[200],
    width: '10rem',
    height: '10rem',
    boxShadow: `0 0 20px ${theme.palette.background.default}`
  },
}));

export default function LetterAvatar(props) {
  const classes = useStyles();
  const name = props.name ? props.name : '';
  let parsedName = name.split(' ');
  if(parsedName.length === 1) {
    parsedName = parsedName.join('').slice(0,2).toUpperCase();
  } else {
    parsedName = parsedName.map(el => el[0]).join('').toUpperCase();
  }
  return (
    <div className={classes.root}>
      <Avatar className={classes.purple}><Typography variant="h2" noWrap>
            {parsedName}
          </Typography></Avatar>
    </div>
  );
}