import React, { Component } from "react";
import { Link } from "react-router-dom";

class Navbar extends Component {
    render() {
        return (
            <div className="navbar-fixed">
                <nav className="z-depth-0">
                    <div className="nav-wrapper white">
                        <Link
                            to="/"
                            style={{
                                fontFamily: "monospace"
                            }}
                            className="col s5 brand-logo center orange-text"
                        >
                            <i className="material-icons">pets</i>
                            MILO
                        </Link>
                    </div>
                </nav>
            </div>
        )
    }
}

export default Navbar;