import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserResponse } from "../../utils/types";

type State = {
    token: string | null;
    refreshToken: string | null;
    account: UserResponse | null;
};

const initialState: State = { token: null, refreshToken: null, account: null };

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthTokens(
            state: State,
            action: PayloadAction<{ token: string; refreshToken: string }>
        ) {
            state.refreshToken = action.payload.refreshToken;
            state.token = action.payload.token;
        },
        setAccount(state: State, action: PayloadAction<UserResponse>) {
            state.account = action.payload;
        },
        setLogout(state: State) {
            state.account = null;
            state.refreshToken = null;
            state.token = null;
        },
    },
});

export default authSlice;