import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ labels, data, colors, showLegend = true }) => {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors || ['#22c55e', '#ef4444', '#f59e0b'],
      borderColor: 'var(--card-bg)',
      borderWidth: 3,
      hoverOffset: 8,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          color: 'var(--text-secondary)',
          padding: 16,
          usePointStyle: true,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'var(--card-bg)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed}`
        }
      }
    }
  };

  return (
    <div className="chart-wrapper chart-doughnut">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default DoughnutChart;
