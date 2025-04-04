import React, { useEffect, useRef } from 'react';
import { startLocationTracking } from '../../services/location';

const DriverLocationTracker = ({ driverId }) => {
  const locationWatcher = useRef(null);

  useEffect(() => {
    const initLocationTracking = async () => {
      try {
        // If no driver ID, don't start tracking
        if (!driverId) return;

        // Stop any existing location tracking
        if (locationWatcher.current) {
          locationWatcher.current.remove();
        }

        // Start new location tracking
        locationWatcher.current = await startLocationTracking(driverId);
      } catch (error) {
        console.error('Location tracking error:', error);
      }
    };

    // Initialize location tracking
    initLocationTracking();

    // Cleanup function to stop tracking when component unmounts
    return () => {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
      }
    };
  }, [driverId]);

  // Render nothing, this is a background tracking component
  return null;
};

export default DriverLocationTracker;