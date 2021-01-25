import React from 'react'
import PopularTable from './PopularTable';
import Switcher from '../../../components/switcher/Switcher.js'
import RecentTracksTable from './RecentTracksTable';
import { makeStyles, Typography } from '@material-ui/core';
import RaisingTracksTable from './RaisingTracksTable';

const useStyles = makeStyles((theme) => ({
  typo: {
      color: theme.palette.text.primary,
      marginLeft: theme.spacing(1)
  }
}));
const MainTable = () => {
    const [pageRender, setPageRender] = React.useState(1);
    const [selectedPopular, setSelectedPopular] = React.useState([]);
    const [selectedRecent, setSelectedRecent] = React.useState([]);
    const [selectedRaising, setSelectedRaising] = React.useState([]);
    const classes = useStyles();
    const tabChangeHandler = (value) => {
        if(pageRender !== Number.parseInt(value)) {
          setPageRender(value);
          console.log(value)
        }
      }
    

    return (
        <div style={{height: '92%'}}>
        <Typography variant="h5" className={classes.typo}>Moje statystyki</Typography>
        <Switcher 
          numSelected={pageRender === 1 ? selectedPopular.length : pageRender === 0 ? selectedRecent.length : selectedRaising.length} 
          pageRender={pageRender}
          onChangeClick={tabChangeHandler}
        />
        {pageRender === 1 ?  (<PopularTable
                                  selectedPopular={selectedPopular}
                                  setSelected={setSelectedPopular}
                              />) 
                              : pageRender === 0 ? (<RecentTracksTable
                                  selectedRecent={selectedRecent}
                                  setSelected={setSelectedRecent}
                                />) : (<RaisingTracksTable 
                                  selectedRaising={selectedRaising}
                                  setSelected={setSelectedRaising}
                                />)}
        </div>
    )
}

export default MainTable
