import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LineChart = ({ labels, data, title, color }) => {
  const chartData = {
    labels,
    datasets: [{
      label: title,
      data,
      fill: true,
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, (color || '#6366f1') + '40');
        gradient.addColorStop(1, (color || '#6366f1') + '00');
        return gradient;
      },
      borderColor: color || '#6366f1',
      borderWidth: 2,
      pointBackgroundColor: color || '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 3,
      tension: 0.4,
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
        ticks: { color: 'var(--text-secondary)', maxTicksLimit: 6 }
      },
      y: {
        grid: { color: 'var(--border-color)' },
        ticks: {
          color: 'var(--text-secondary)',
          callback: (v) => '$' + (v >= 1e12 ? (v / 1e12).toFixed(1) + 'T' : v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v.toFixed(2))
        }
      }
    }
  };

  return (
    <div className="chart-wrapper">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
