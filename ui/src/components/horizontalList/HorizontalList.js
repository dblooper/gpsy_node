import React from 'react'
import TrackItem from './TrackItem/TrackItem'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    main: {
        padding: '0.1rem',
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        overflow: 'auto'
    },
}))
const HorizontalList = (props) => {
    const classes = useStyles();

    let components = props.items.map((el, ind) => (
        <TrackItem
            key={ind}
            name={el.name}
            author={el.author}
            index={ind + 1}
        />
    ))

    return (
        <div className={classes.main}>
            {components}
        </div>
    )
}

export default HorizontalList
