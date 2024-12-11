import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface AsteroidState {
    gameId: string,
    nonce: number,
    score: string,
}

const initialState: AsteroidState = {
    gameId: "",
    nonce: 0,
    score: "",
}

const asteroidSlice = createSlice({
    name: "asteroid",
    initialState,
    reducers: {
        setGameId: (state, action: PayloadAction<string>) => {
            state.gameId = action.payload;
        },
        setNonce: (state, action: PayloadAction<number>) => {
            state.nonce = action.payload;
        },
        setScore: (state, action: PayloadAction<string>) => {
            state.score = action.payload;
        },
    },
});

export default asteroidSlice.reducer;
export const { setGameId, setNonce, setScore } = asteroidSlice.actions;
export const asteroidReducer = asteroidSlice.reducer;



