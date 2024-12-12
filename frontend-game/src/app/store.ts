import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';

import { walletReducer } from '../features/walletSlice';
import { asteroidReducer } from '../features/asteroidSlice';

export const store = configureStore({
    reducer: {
        wallet: walletReducer,
        asteroid: asteroidReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;
