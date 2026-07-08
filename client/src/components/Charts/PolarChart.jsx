import React from 'react';
import { PolarArea } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const PolarChart = ({ labels, data, title }) => {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: [
        'rgba(99, 102, 241, 0.7)',
        'rgba(34, 197, 94, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(168, 85, 247, 0.7)',
      ],
      borderColor: 'var(--card-bg)',
      borderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--text-secondary)',
          padding: 12,
          usePointStyle: true,
          font: { size: 11 }
        }
      },
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
      r: {
        grid: { color: 'var(--border-color)' },
        ticks: {
          color: 'var(--text-secondary)',
          backdropColor: 'transparent',
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <div className="chart-wrapper chart-polar">
      <PolarArea data={chartData} options={options} />
    </div>
  );
};

export default PolarChart;
