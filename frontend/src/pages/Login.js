import React, { useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router";
import sha256 from 'crypto-js/sha256'
import authSlice from "../store/slices/auth";

export default function Login() {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const history = useNavigate();

    const handleLogin = (username: string, password: string) => {
        axios
            .post(`http://localhost:8001/auth/login/`, { username:username, password:sha256(password).toString() })
            .then((res) => {
                dispatch(
                    authSlice.actions.setAuthTokens({
                        token: res.data.access,
                        refreshToken: res.data.refresh,
                    })
                );
                let user = res.data.user;
                dispatch(authSlice.actions.setAccount(user));
                setLoading(false);
                if (user.role === "admin")
                    history("/admin");
                else if (user.role === "user")
                    history("/user");
                else
                    history("/login");
            })
            .catch((err) => {
                console.log(JSON.stringify(err.response));
                setMessage(JSON.stringify(err.response));
                setLoading(false);
            });
    };

    const formik = useFormik({
        initialValues: {
            username: "N/A",
            password: "N/A",
        },
        onSubmit: (values) => {
            setLoading(true);
            handleLogin(values.username, values.password);
        },
        validationSchema: Yup.object({
            username: Yup.string().trim().required("Username is required."),
            password: Yup.string().trim().required("Password is required."),
        }),
    });

    return (
        <div className="h-screen flex bg-gray-bg1">
            <div className="w-full max-w-md m-auto bg-white rounded-lg border border-primaryBorder shadow-default py-10 px-16">
                <h1 className="text-2xl font-medium text-primary mt-4 mb-12 text-center">
                    Insert your data
                </h1>
                <form onSubmit={formik.handleSubmit}>
                    <div className="space-y-4 text-center">
                        <input
                            className="border-b border-gray-300 w-full px-2 h-8 rounded focus:border-blue-500"
                            id="username"
                            type="text"
                            placeholder="username"
                            name="username"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.errors.username ? <div>{formik.errors.username} </div> : null}
                        <input
                            className="border-b border-gray-300 w-full px-2 h-8 rounded focus:border-blue-500"
                            id="password"
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.errors.password ? (
                            <div>{formik.errors.password} </div>
                        ) : null}
                    </div>
                    <div className="text-danger text-center my-2" hidden={false}>
                        {message}
                    </div>

                    <div className="flex justify-center items-center mt-6 text-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
