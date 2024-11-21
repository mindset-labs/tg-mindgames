import { useState, useEffect, useCallback } from 'react';

interface GyroscopeData {
  x: number;
  y: number;
  isSupported: boolean;
  calibrate: () => void;
}

export function useGyroscope(): GyroscopeData {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0, isSupported: false, calibrate: () => {} });
  const [calibration, setCalibration] = useState({ x: 0, y: 0 });

  const calibrate = useCallback(() => {
    setCalibration(current => ({
      x: current.x + data.x,
      y: current.y + data.y
    }));
  }, [data.x, data.y]);

  useEffect(() => {
    // Try Telegram WebApp first
    const isTelegram = window.Telegram?.WebApp !== undefined;
    if (isTelegram) {
      const webApp = window.Telegram.WebApp;
      if (webApp.isVersionAtLeast('6.1')) {
        // Disable vertical swipes and expand the view
       
        webApp.requestGyroscope().then((isAvailable) => {
          if (isAvailable) {
            setData(prev => ({ ...prev, isSupported: true, calibrate }));
            webApp.onEvent('gyroscopeChanged', (event) => {
              setData(current => ({
                isSupported: true,
                calibrate,
                x: Math.min(Math.max((event.x / 90) - calibration.x, -1), 1),
                y: Math.min(Math.max((event.y / 90) - calibration.y, -1), 1)
              }));
            });
          }
        });
        return () => webApp.offEvent('gyroscopeChanged');
      }
    }

    // Rest of the code remains the same...
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.beta !== null && event.gamma !== null) {
          setData(current => ({
            isSupported: true,
            calibrate,
            x: Math.min(Math.max((event.gamma / 45) - calibration.x, -1), 1),
            y: Math.min(Math.max((event.beta / 45) - calibration.y, -1), 1)
          }));
        }
      };

      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
              setData(prev => ({ ...prev, isSupported: true, calibrate }));
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
        setData(prev => ({ ...prev, isSupported: true, calibrate }));
      }

      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }

    if ('DeviceMotionEvent' in window) {
      const handleMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          const { x, y } = event.accelerationIncludingGravity;
          if (x !== null && y !== null) {
            setData(current => ({
              isSupported: true,
              calibrate,
              x: Math.min(Math.max(((x / 10) * -1) - calibration.x, -1), 1),
              y: Math.min(Math.max((y / 10) - calibration.y, -1), 1)
            }));
          }
        }
      };

      window.addEventListener('devicemotion', handleMotion);
      setData(prev => ({ ...prev, isSupported: true, calibrate }));

      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, [calibrate, calibration.x, calibration.y]);

  return data;
}
