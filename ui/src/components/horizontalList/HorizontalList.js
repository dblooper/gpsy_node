import React from 'react'
import TrackItem from './TrackItem/TrackItem'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    main: {
        margin: theme.spacing(1)
    },
    horizontal: {
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto'
    }
}))
const HorizontalList = (props) => {
    const classes = useStyles();

    let components = props.items.map((el, ind) => (
        <TrackItem
            key={ind}
            name={el.name}
            author={el.author}
        />
    ))

    return (
        <div className={classes.main}>
            <div className={classes.horizontal} >
                {components}
            </div>
        </div>
    )
}

export default HorizontalList
