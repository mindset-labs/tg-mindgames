interface DeviceOrientationEvent {
  beta: number | null;
  gamma: number | null;
  static requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface DeviceMotionEvent {
  accelerationIncludingGravity: {
    x: number | null;
    y: number | null;
    z: number | null;
  } | null;
}

interface TelegramWebApp {
  isVersionAtLeast: (version: string) => boolean;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  disableVerticalSwipes(): () => void;
  expand: () => void;
  requestGyroscope: () => Promise<boolean>;
  onEvent: (eventType: string, callback: (event: any) => void) => void;
  offEvent: (eventType: string) => void;
  requestFullscreen: () => void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
  DeviceOrientationEvent: {
    new(): DeviceOrientationEvent;
    prototype: DeviceOrientationEvent;
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  DeviceMotionEvent: {
    new(): DeviceMotionEvent;
    prototype: DeviceMotionEvent;
  };
}
