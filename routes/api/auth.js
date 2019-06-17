let express = require("express");
let router = express.Router();
let bcrypt = require("bcryptjs");

let validateLoginInput = require("../../validation/login");
let User = require("../../models/User");

// @route POST api/auth/authenticate
// @desc Authenticate and return user
// @access Public
router.post("/authenticate", (req, res) => {
    // Form validation
    const { errors, isValid } = validateLoginInput(req.body);

    // Check validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    User.findOne({ email }).then(user => {
        // Check if user exists
        if(!user) {
            return res.status(404).json({ emailnotfound: "Email not found" });
        }

        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if(isMatch) {
                let authUser = {
                    acct: user._id
                };
                return res.send(authUser);
            } else {
                return res
                    .status(400)
                    .json({ passwordincorrect: "Password incorrect" });
            }
        });
    });
});

module.exports = router;