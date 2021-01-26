import React, {useEffect} from 'react'
import { makeStyles } from '@material-ui/core/styles';
import { GridList, GridListTile, Typography } from '@material-ui/core';
import CustomStepper from '../../../components/stepper/CustomStepper';
import PopularTable from '../table/PopularTable';
import Switcher from '../../../components/switcher/Switcher'
import HorizontalList from '../../../components/horizontalList/HorizontalList';
import Doughnut from '../../../components/chart/Doughnut';
import MainTable from '../table/MainTable';
import axios from '../../../axios';
import { useSelector } from 'react-redux';
import axiosToken from 'axios'
const cancelTokenSource = axiosToken.CancelToken.source()

const useStyles = makeStyles((theme) => ({
    //grid
    gridRoot: {
        marginTop: theme.spacing(1),
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        overflow: 'auto',
        backgroundColor: theme.palette.background.paper,
    },
    gridList: {
        width: '100%',
        maxHeight: '100%',
    },
    gridTile: {
        // border: '1px solid green',
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        // margin: theme.spacing(1),
        padding: theme.spacing(1) ,
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
    const userMeta = useSelector(state => state.logged);
    const [renderGpsyProposals, setRenderGpsyProposals] = React.useState(false);
    const [gpsyProposals, setGpsyProposals] = React.useState([]);
    const [renderSpotifyProposals, setRenderSpotifyProposals] = React.useState(false);
    const [spotifyProposals, setSpotifyProposals] = React.useState([]);
    const [genres, setGenres] = React.useState([]);

    useEffect(() => {
        axios.get('/gpsy/proposals?limit=20',
            {headers: {
                Authorization: 'Bearer ' + userMeta.token //the token is a variable which holds the token
            }},
            {
                cancelToken: cancelTokenSource.token
            }
            )
        .then(data => {
            let newRows = [];
            for(let el of data.data.info.data) {
                newRows.push({spotifyTrackId: el.trackId, name: el.name, author: el.author})
            }
            setGpsyProposals(newRows);
            setRenderGpsyProposals(true);
        })
        .catch(err => {
            console.log(err)
        })

        axios.get('/spotify/proposals?limit=20',
            {headers: {
                Authorization: 'Bearer ' + userMeta.token //the token is a variable which holds the token
            }},
            {
                cancelToken: cancelTokenSource.token
            }
            )
        .then(data => {
            let newRows = [];
            for(let el of data.data.info.data) {
                newRows.push({spotifyTrackId: el.trackId, name: el.name, author: el.author})
            }
            setSpotifyProposals(newRows);
            setRenderSpotifyProposals(true);
            })
        .catch(err => {
            console.log(err)
        })

        axios.get('/gpsy/user/genres',
            {headers: {
                Authorization: 'Bearer ' + userMeta.token //the token is a variable which holds the token
            }},
            {
                cancelToken: cancelTokenSource.token
            }
            )
        .then(data => {
            let newRows = [];
            for(let el of data.data.info.data.genres) {
                newRows.push({name: el.name, percent: el.popularityPercent})
            }
            setGenres(newRows);
            })
        .catch(err => {
            console.log(err)
        })
        
        return () => {
            cancelTokenSource.cancel();
        }
    }, [userMeta])

    return (
        <main className={classes.content}>
            <div className={classes.gridRoot}>
                <GridList cellHeight={80} className={classes.gridList} cols={3}>
                    <GridListTile cols={3} rows={2} className={classes.gridTile}> 
                        <Typography variant="h5" className={classes.typo}>Rekomendowane przez Gpsy</Typography>
                        <HorizontalList items={gpsyProposals}></HorizontalList>
                    </GridListTile>
                    <GridListTile cols={1} rows={8} className={classes.gridTile}>
                        <Typography variant="h5" className={classes.typo}>Moje gatunki</Typography>
                        <Doughnut data={genres}></Doughnut>
                    </GridListTile>
                    <GridListTile cols={2} rows={8} className={classes.gridTile}>
                        <MainTable></MainTable>
                    </GridListTile>
                    <GridListTile cols={3} rows={2} className={classes.gridTile}>
                        <Typography variant="h5" className={classes.typo}>Rekomendowane przez spotify</Typography>
                        <HorizontalList items={spotifyProposals}></HorizontalList>
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
