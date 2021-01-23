import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import { GridList, GridListTile, Typography } from '@material-ui/core';
import CustomStepper from '../../../components/stepper/CustomStepper';
import PopularTable from '../PopularTable';
import Switcher from '../../../components/switcher/Switcher'
import HorizontalList from '../../../components/horizontalList/HorizontalList';
import Doughnut from '../../../components/chart/Doughnut';

const useStyles = makeStyles((theme) => ({
    //grid
    gridRoot: {
        marginTop: theme.spacing(1),
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
    },
    gridList: {
        width: '100%',
        maxHeight: '100%',
    },
    gridTile: {
        //border: '1px solid green',
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        //padding: theme.spacing(1) ,
        overflow: 'auto'
    },
    content: {
        flexGrow: 1,
        maxHeight: '80vh',
        width: '80%'
    },
    typo: {
        color: theme.palette.text.primary,
        marginLeft: theme.spacing(1)
    }
}));

export default function Grid(props) {
    const classes = useStyles();
    const recentlyPlayed =[
        {
            name: 'sohfiasadsadsadd sdfsdfasshfgiph', 
            author: "sohfiasadsaad fssaadsdasshfgiph", 
            recentlyPlayed: new Date().toISOString(),
            popularity: 67 
        },
        {
            name: 'sohfiasadsajjdasadd sdfsdfasshfgiph', 
            author: "sohfiasadsaad fssaadsdasshfgiph", 
            recentlyPlayed: new Date().toISOString(),
            popularity: 67 
        },
        {
            name: 'sohfiasadsadfsadd sdfsdfasshfgiph', 
            author: "sohfiasadsaad fssaadsdasshfgiph", 
            recentlyPlayed: new Date().toISOString(),
            popularity: 67 
        },
        {
            name: 'sohfiasadsfsadsadd sdfsdfasshfgiph', 
            author: "sohfiasadsaad fssaadsdasshfgiph", 
            recentlyPlayed: new Date().toISOString(),
            popularity: 67 
        },
        {
            name: 'sohfiasadsadsadd sdfsuudfasshfgiph', 
            author: "sohfiasadsaad fssaadsdasshfgiph", 
            recentlyPlayed: new Date().toISOString(),
            popularity: 67 
        },
      ];

    return (
        <main className={classes.content}>
            <div className={classes.gridRoot}>
                <GridList cellHeight={80} className={classes.gridList} cols={3}>
                    <GridListTile cols={3} rows={2} className={classes.gridTile}> 
                        <Typography variant="h5" className={classes.typo}>Rekomendowane przez Gpsy</Typography>
                        <HorizontalList items={[1,2,3,4,5,6]}></HorizontalList>
                    </GridListTile>
                    <GridListTile cols={1} rows={7} className={classes.gridTile}>
                        <Typography variant="h5" className={classes.typo}>Moje gatunki</Typography>
                        <Doughnut></Doughnut>
                    </GridListTile>
                    <GridListTile cols={2} rows={8} className={classes.gridTile}>
                        <Typography variant="h5" className={classes.typo}>Moje statystyki</Typography>
                        <PopularTable rows={recentlyPlayed}></PopularTable>
                    </GridListTile>
                    <GridListTile cols={3} rows={2} className={classes.gridTile}>
                        <Typography variant="h5" className={classes.typo}>Spotify recommendation</Typography>
                        <HorizontalList items={[1,2,3,4,5,6]}></HorizontalList>
                    </GridListTile>
                    <GridListTile cols={1} className={classes.gridTile}> <p>Hello world</p>
                    </GridListTile>
                    <GridListTile cols={1} className={classes.gridTile}> <p>Hello world</p>
                    </GridListTile>
                </GridList>
            </div>
        </main>
    )
}
