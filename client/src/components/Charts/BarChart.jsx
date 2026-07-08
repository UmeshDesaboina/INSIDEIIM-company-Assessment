import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ labels, data, title, color }) => {
  const chartData = {
    labels,
    datasets: [{
      label: title,
      data,
      backgroundColor: color || 'rgba(99, 102, 241, 0.7)',
      borderColor: color || 'rgba(99, 102, 241, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--card-bg)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-secondary)' }
      },
      y: {
        grid: { color: 'var(--border-color)' },
        ticks: {
          color: 'var(--text-secondary)',
          callback: (v) => '$' + (v / 1e9).toFixed(1) + 'B'
        }
      }
    }
  };

  return (
    <div className="chart-wrapper">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
