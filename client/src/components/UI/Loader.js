import React from 'react';

export const Loader = () => (
  <div className="loader-container">
    <div className="loader">
      <div className="loader-circle"></div>
      <div className="loader-circle"></div>
      <div className="loader-circle"></div>
    </div>
  </div>
);

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = '8px', count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="skeleton"
        style={{ width, height, borderRadius, marginBottom: count > 1 ? '12px' : '0' }}
      />
    ))}
  </>
);

export const CardSkeleton = () => (
  <div className="card-skeleton">
    <Skeleton height="24px" width="60%" />
    <Skeleton height="40px" width="40%" />
    <Skeleton height="16px" width="80%" />
  </div>
);

export const ReportSkeleton = () => (
  <div className="report-skeleton">
    <div className="skeleton-header">
      <Skeleton width="80px" height="80px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton height="32px" width="50%" />
        <Skeleton height="16px" width="30%" />
      </div>
    </div>
    <Skeleton height="16px" count={6} />
    <div className="skeleton-grid">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <Skeleton height="200px" borderRadius="12px" />
  </div>
);
