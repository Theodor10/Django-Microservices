import './App.css';

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import User from "./pages/User";
import Admin from "./pages/Admin";
import store, { persistor } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";

export default function App() {
  return (
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <Router>
            <div>
              <Routes>
                <Route exact path="/login" element={<Login/>}/>
                <Route exact path="/user" element={<User/>} />
                <Route exact path="/admin" element={<Admin/>} />
            </Routes>
            </div>
          </Router>
        </PersistGate>
      </Provider>
  );
}
