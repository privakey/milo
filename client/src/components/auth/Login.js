import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { checkLoginMethod, loginUser, cancelRequest } from "../../actions/authActions";
import classnames from "classnames";

class Login extends Component {
    constructor() {
        super();
        this.state = {
            email: "",
            password: "",
            errors: {}
        };
    }

    componentDidMount() {
        // If logged in and user navigates to Login page, should redirect to Dashboard
        if(this.props.auth.isAuthenticated) {
            this.props.history.push("/dashboard");
        }
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.auth.isAuthenticated) {
            this.props.history.push("/dashboard"); // push user to dashboard when they login
        }

        if(nextProps.errors) {
            this.setState({
                errors: nextProps.errors
            });
        }
    }

    onChange = e => {
        this.setState({ [e.target.id]: e.target.value });
    };

    onClickNext = e => {
        e.preventDefault();

        this.props.checkLoginMethod(this.state.email);
    }

    onClickBack = e => {
        e.preventDefault();
        this.props.cancelRequest();
        this.props.history.push("/");
    }

    onSubmit = e => {
        e.preventDefault();

        const userData = {
            email: this.state.email,
            password: this.state.password
        };

        // Since we handle the redirect within our component, we don't need to pass
        // in this.props.history as a parameter
        this.props.loginUser(userData);
    };

    render() {
        const { errors } = this.state;
        const { loginMethod, requestState } = this.props.auth;

        return (
            <div className="container">
                <div style={{ marginTop: "4rem" }} className="row">
                    <div className="col s8 offset-s2">
                        <Link className="btn-flat waves-effect" onClick={ this.onClickBack }>
                            <i className="material-icons left">keyboard_backspace</i> Back to home
                        </Link>
                        { (loginMethod === '') &&
                            <div>
                                <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                                    <h4>
                                        <b>Login</b> below
                                    </h4>
                                    <p className="grey-text text-darken-1">
                                        Don't have an account? <Link to="/register">Register</Link>
                                    </p>
                                </div>
                                <form noValidate onSubmit={this.onClickNext}>
                                    <div className="input-field col s12">
                                        <input
                                            onChange={this.onChange}
                                            value={this.state.email}
                                            error={errors.email}
                                            id="email"
                                            type="email"
                                            className={classnames("", {
                                                invalid: errors.email || errors.emailnotfound
                                            })}
                                        />
                                        <label htmlFor="email">Email</label>
                                        <span className="red-text">
                                            {errors.email}
                                            {errors.emailnotfound}
                                        </span>
                                    </div>
                                    <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                                        <button
                                            style={{
                                                width: "150px",
                                                borderRadius: "3px",
                                                letterSpacing: "1.5px",
                                                marginTop: "1rem"
                                            }}
                                            type="submit"
                                            className="btn btn-large waves-effect waves-light hoverable orange accent-3 right"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </form>
                            </div>
                        }
                        { (loginMethod === 'password') &&
                            <form noValidate onSubmit={this.onSubmit}>
                                <div className="input-field col s12">
                                    <input
                                        onChange={this.onChange}
                                        value={this.state.password}
                                        error={errors.password}
                                        id="password"
                                        type="password"
                                        className={classnames("", {
                                            invalid: errors.password || errors.passwordincorrect
                                        })}
                                    />
                                    <label htmlFor="password">Password</label>
                                    <span className="red-text">
                                        {errors.password}
                                        {errors.passwordincorrect}
                                    </span>
                                </div>
                                <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                                    <button
                                        style={{
                                            width: "150px",
                                            borderRadius: "3px",
                                            letterSpacing: "1.5px",
                                            marginTop: "1rem"
                                        }}
                                        type="submit"
                                        className="btn btn-large waves-effect waves-light hoverable orange accent-3"
                                    >
                                        Login
                                    </button>
                                </div>
                            </form>
                        }
                        { (loginMethod === 'privakey' && (requestState === 'INITIATED' || requestState === 'SENT')) &&
                            <div className="col s12 center">
                                <h4>
                                    <b>A notification</b> has been sent to your mobile device.
                                    <p className="grey-text text-darken-1">Approve it to finish logging in.</p>
                                </h4>
                                <i style={{fontSize: "48px"}} className="material-icons">lock</i>
                            </div>
                        }
                    </div>
                </div>
            </div>
            );
        }
    }

Login.propTypes = {
    checkLoginMethod: PropTypes.func.isRequired,
    loginUser: PropTypes.func.isRequired,
    cancelRequest: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    auth: state.auth,
    errors: state.errors
});

export default connect(
    mapStateToProps,
    { checkLoginMethod, loginUser, cancelRequest }
) (Login);