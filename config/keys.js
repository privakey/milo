module.exports = {
    // URI for the Mongo database
    mongoURI: "mongodb+srv://mern-user:privakey1!@mernauth-epnpf.mongodb.net/test?retryWrites=true&w=majority",

    // Secret/Key used to sign user's JWT on login
    secretOrKey: "secret",

    // URL where this server resides, used for the Privakey post-request callback
    //serverUrl: "https://privakey-mern.herokuapp.com",
    serverUrl: "http://localhost:5000",

    // URL of the Privakey Auth Service
    //privakeyUrl: "http://3.91.76.241:8080/api/",
    privakeyUrl: "http://localhost:8080/api/",

    // Basic auth credentials for the Privakey Auth Service
    //privakeyBasicAuth: "Zjk1ZjczYmItZmEwNS00Y2MzLWE2N2MtZmNlYjU3MDNlNjNmOkR1RHAyS0h5bG0rWlkxT1lvbHYrek1RbUhxZ0Q2VVE1MkVNZ0VTQkw3SUk9"
    privakeyBasicAuth: "NjlmMWZiMTAtNzRlMy00MmU2LWI0NmEtYTE1ZTQ2NDVlZTg2OkdVYlZ6NE56UGpQQW9TVHNRMUxFN3hRVWF4YU1neVpRYWk0QmRqUjNDN3M9"
}