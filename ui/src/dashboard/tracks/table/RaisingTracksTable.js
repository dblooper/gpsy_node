import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';
import { useSelector } from 'react-redux';
import axiosToken from 'axios'
import axios from '../../../axios'

function createData(name, author, lastPlayed, popularity) {
  return { name,author, lastPlayed, popularity };
}

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'name', numeric: false, disablePadding: true, label: 'Nazwa' },
  { id: 'author', numeric: false, disablePadding: false, label: 'Autor' },
  { id: 'lastPlayed', numeric: false, disablePadding: false, label: 'Data i czas' },
  { id: 'popularity', numeric: false, disablePadding: false, label: 'Odtworzono ogółem' },
];

function EnhancedTableHead(props) {
  const { classes, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort,  } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  let headerCells = headCells;
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all desserts' }}
          />
        </TableCell>
        {headerCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'none'}
            sortDirection={orderBy === headCell.id ? order : false}
            
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              
            >
              <p style={{width: headCell.id === 'popularity' ? '5rem' : '6rem', overflowX: 'wrap', wordWrap: 'break-word'}}>{headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}</p>
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
    flex: '1 1 100%',
  },
}));

const EnhancedTableToolbar = (props) => {
  const classes = useToolbarStyles();
  const { numSelected } = props;

  return (
    <Toolbar
      className={clsx(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      {numSelected > 0 ? (
        <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
          {numSelected} zaznaczone
        </Typography>
      ) : (
        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
          Ostatnio Odtwarzane
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton aria-label="delete">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        null
      )}
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

const useStyles = makeStyles((theme) => ({
  paper: {
    width: 'auto',
    height: '90%',
    display: 'block',
    textAlign: 'center',
    margin: theme.spacing(1)
  },
  table: {
    minWidth: 550,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
}));

export default function RaisingTracksTable(props) {
  const classes = useStyles();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('calories');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(8);
  const userMeta = useSelector(state => state.logged);
  const cancelTokenSource = axiosToken.CancelToken.source()
  const [render, setRender] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  
  React.useEffect(() => {
    axios.get('/gpsy/raising?limit=20',
    {headers: {
      Authorization: 'Bearer ' + userMeta.token //the token is a variable which holds the token
    }},
    {
      cancelToken: cancelTokenSource.token
    }
    )
    .then(data => {
      let newRows = [];
      for(let el of data.data.info.data.raisingTracks) {
        newRows.push(createData(el.name, el.author, el.recentlyPlayed.replace(/[ZT]/g, ' ').slice(0,19) ,el.popularity))   
      }
      setRows(newRows);
      setRender(true);
      console.log(rows);
    })
    .catch(err => {
      console.log(err)
    })
    return () => {
      cancelTokenSource.cancel();
    }
  }, [userMeta])

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.name);
      props.setSelected(newSelecteds);
      return;
    }
    props.setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = props.selectedRaising.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(props.selectedRaising, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(props.selectedRaising.slice(1));
    } else if (selectedIndex === props.selectedRaising.length - 1) {
      newSelected = newSelected.concat(props.selectedRaising.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        props.selectedRaising.slice(0, selectedIndex),
        props.selectedRaising.slice(selectedIndex + 1),
      );
    }

    props.setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name) => props.selectedRaising.indexOf(name) !== -1;

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

  const trackTable = (        
      <TableContainer style={{overflow: 'auto', height: '80%'}}>
      {render ? <Table
        className={classes.table}
        aria-labelledby="tableTitle"
        size='small'
        aria-label="enhanced table"
        stickyHeader
        style={{tableLayout: 'auto'}}
      >
        <EnhancedTableHead
          classes={classes}
          numSelected={props.selectedRaising.length}
          order={order}
          orderBy={orderBy}
          onSelectAllClick={handleSelectAllClick}
          onRequestSort={handleRequestSort}
          rowCount={rows.length}
        />
        <TableBody>
          {stableSort(rows, getComparator(order, orderBy))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => {
              const isItemSelected = isSelected(row.name);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  onClick={(event) => handleClick(event, row.name)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.name}
                  selected={isItemSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                  </TableCell>
                  <TableCell component="th" id={labelId} scope="row" padding="none">
                    <p style={{width: '12rem', overflowX: 'wrap', wordWrap: 'break-word'}}>{row.name}</p>
                  </TableCell>
                  <TableCell padding="none" align="left"><p style={{width: '10rem', overflowX: 'wrap', wordWrap: 'break-word'}}>{row.author}</p></TableCell>
                  <TableCell padding="none" align="left"><p style={{width: '9rem', overflowX: 'wrap', wordWrap: 'break-word'}}>{row.lastPlayed}</p></TableCell>
                  <TableCell padding="none" align="left"><p style={{width: '2rem', overflowX: 'wrap', wordWrap: 'break-word'}}>{row.popularity}</p></TableCell>
                </TableRow>
              );
            })}
          {emptyRows > 0 && (
            <TableRow >
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
      </Table> : null}
    </TableContainer>)

  return (
      <Paper elevation={8} className={classes.paper}>
        {trackTable}
        <TablePagination
          rowsPerPageOptions={[5, 6,7,8,9, 10,15,20]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Paper>
  );
}
