import axios from "axios";
import setAuthToken from "../utils/setAuthToken";
import jwt_decode from "jwt-decode";

import {
    GET_ERRORS,
    SET_CURRENT_USER,
    USER_LOADING,
    START_REQUEST,
    SET_LOGIN_METHOD,
    SEND_AUTH_REQUEST
} from "./types";

// Register User
export const registerUser = (userData, history) => dispatch => {
    axios
        .post("/api/users/register", userData)
        .then(res => history.push("/login")) // redirect to login on successful register
        .catch(err =>
            dispatch({
                type: GET_ERRORS,
                payload: err.response.data
            })
        );
};

export const checkLoginMethod = userEmail => dispatch => {
    axios
        .get("/api/users/loginMethod?email=" + userEmail)
        .then(res => {
            const { method } = res.data;
            console.log(method);
            if(method === 'privakey') {
                dispatch({
                    type: SEND_AUTH_REQUEST,
                    data: { 'email': userEmail }
                });
            }
            dispatch({
                type: SET_LOGIN_METHOD,
                payload: method
            });
        });
}

export const cancelRequest = () => dispatch => {
    dispatch({
        type: SET_LOGIN_METHOD,
        payload: ''
    });
}

// Login - get user token
export const loginUser = userData => dispatch => {
    axios
        .post("/api/users/login", userData)
        .then(res => {
            // Save to localStorage
            const { token } = res.data;
            localStorage.setItem("jwtToken", token);

            // Set token to auth header
            setAuthToken(token);

            // Decode token to get user data
            const decoded = jwt_decode(token);

            // Set current user
            dispatch(setCurrentUser(decoded));
        })
        .catch(err => 
            dispatch({
                type: GET_ERRORS,
                payload: err.response.data
            })
        );
};

// Set logged in user
export const setCurrentUser = decoded => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded
    };
};

// User loading
export const setUserLoading = () => {
    return {
        type: USER_LOADING
    };
};

// Log user out
export const logoutUser = () => dispatch => {
    // Remove token from local storage
    localStorage.removeItem("jwtToken");

    // Remove auth header for future requests
    setAuthToken(false);

    // Set current user to empty object {} which will set isAuthenticated to false
    dispatch(setCurrentUser({}));
};

export const sendNotification = () => dispatch => {
    // Get token from local storage
    let token = localStorage.getItem("jwtToken");

    // Figure out account id
    let payload = JSON.parse(atob(token.split('.')[1]));
    
    dispatch({
        type: START_REQUEST,
        data: { 'accountId': payload.id }
    });
}