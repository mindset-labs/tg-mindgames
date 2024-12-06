import { PayloadAction, createSlice } from '@reduxjs/toolkit';



interface WalletState {
    fiatBalance: number,
    xionAddress: string,
    receiver: string,
    selectedToken: string,
}

const initialState: WalletState = {
    fiatBalance: 0,
    xionAddress: "",
    receiver: "",
    selectedToken: "",
}

export const walletSlice = createSlice({
    name: "wallet",
    initialState,
    reducers: {},
})

export const walletReducer = walletSlice.reducer;
export default walletSlice.reducer;
