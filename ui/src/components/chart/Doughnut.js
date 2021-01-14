import { makeStyles } from '@material-ui/core'
import Chart from 'chart.js'
import React, {useEffect} from 'react'

const useStyles = makeStyles(theme => ({
    root: {
        marginTop: theme.spacing(1)
    }
}))

const Doughnut = () => {
    const classes = useStyles();
    useEffect(() => {
        let context = document.getElementById('doughnut').getContext('2d');
        const musicCategoryChart = new Chart(context, {
            type: 'doughnut',
            data: {
                datasets: [{
                    label: '# of Votes',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.4)',
                        'rgba(54, 162, 235, 0.4)',
                        'rgba(255, 206, 86, 0.4)',
                        'rgba(75, 192, 192, 0.4)',
                        'rgba(153, 102, 255, 0.4)',
                        'rgba(255, 159, 64, 0.4)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1,
                    hoverBorderColor: 'black',
                    hoverBorderWidth: 2
                }],
                 labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Pop'],
            },
            options: {
               cutoutPercentage: 60,
               responsive: true,
               aspectRatio: 1
            },
        });
    }, [])

    
    return (
        <div className={classes.root}>
            <canvas id="doughnut"></canvas>
        </div>
    )
}

export default Doughnut
