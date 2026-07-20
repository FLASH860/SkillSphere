import { createSlice } from '@reduxjs/toolkit';

const stored = JSON.parse(localStorage.getItem('auth'));

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: stored || null },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('auth', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('auth');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
