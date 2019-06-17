# Milo App

Milo is a sample project that integrates [Privakey](https://www.privakey.com) into a MERN app. Its main goal is to provide code samples to make other developers' lives easier. It permits logging in to the site with Privakey or password, and allows a logged-in user to send a Privakey Request to themselves.

## Getting Started

For the sample to work properly, you'll need 2 things:

* Privakey CX Auth Service
* Privakey White-Labeled App

Both of these things are commercially licensed, so you'll have to contact sales@privakey.com to get a hold of them. More info on both can be found [in Privakey's docs](https://docs.privakey.com).

## Code Snippets

### Account Binding

Account Binding is when you send a user account to Privakey so it can keep track of them. The White-Labeled App calls this route automatically. In Milo, this is done via the /auth/privakeyBind route, located in the routes/privakey.js.

Here's the actual request code, which simply sends Privakey our user's account ID.

```javascript
// file: routes/privakey.js
axios.request({
    url: keys.privakeyUrl + 'account/bind',
    method: 'put',
    headers: { 
        'Authorization': 'Basic ' + keys.privakeyBasicAuth,
        'Content-Type': 'application/json'
    },
    data: {
        'accountId': req.body.accountId
    }
})
```

This code simply sends Privakey our user's account ID, so it can link it up in its system.

When the response comes back, we are expected to return some data to the White-Labeled App:

```javascript
// file: routes/privakey.js
.then((bindRes) => {
    User.findOneAndUpdate(
        { _id: req.body.accountId },
        { privakeyId: bindRes.data.privakeyId }
    );

    let response = {
        privakeyId: bindRes.data.privakeyId,
        token: bindRes.data.sessionToken.guid,
        tokenexpiry: bindRes.data.sessionToken.expiration
    };
    res.json(response);
})
```

### Send Privakey Request

The core functionality of Privakey is sending Requests. These Requests then show up in the White-Labeled App and the user can respond to them. In Milo, we send these requests via a web-socket connection so we can let the user know when they are acted upon.

```javascript
// file: helpers/websocket.js
socket.on('action', (action) => {
    if(action.type === 'server/sendRequest') {
        sendRequest(action.data.accountId, 'generic', socket,
            'Did you just send yourself a notification?', '10m');
    } else if (action.type === 'server/sendAuthRequest') {
        const email = action.data.email;
        User.findOne({ email }).then(user => {
            sendRequest(user._id, 'auth', socket,
                'Are you trying to log in to MILO?', '2m');
        });
    }
});
```

Notice that the above code calls sendRequest with a couple of parameters. This is just to prevent duplicated code. The function that actually performs the API call is here:

```javascript
axios.request({
    url: keys.privakeyUrl + "request/add",
    method: 'post',
    headers: {
        'Authorization': 'Basic ' + keys.privakeyBasicAuth,
        'Content-Type': 'application/json'
    },
    data: {
        'accountId': accountId,
        'callback': keys.serverUrl + '/auth/processRequest',
        'content': content,
        'duration': duration,
        "additionalInfo": "{'viewType': 'html', 'format': 'standard'}"
    }
})
```

Finally, when the call returns, it will contain the GUID for the request that was just generated. We need to hold onto this, because when the request is acted upon, we need to look up which socket to emit the action to.

```javascript
.then((requestRes) => {
    let activeRequest = new ActiveRequest({
        accoutId: accountId,
        requestGuid: requestRes.data.guid,
        socketId: socket.id,
        requestType: requestType
    });

    activeRequest.save(function(err, activeRequest) {
        if(err) {
            console.log(err);
        } else if (activeRequest) {
            console.log(activeRequest);
        }
    });

    socket.emit('action', {
        type: 'server/UPDATE_REQUEST',
        data: {
            requestStatus: 'SENT'
        }
    });
})
```

### Process Request

Acting upon requests is asynchronous. When the user finally does act upon a request, Privakey will let us know by calling our callback. Earlier, when we called `/request/add`, we passed it a callback. Specifically, `/auth/processRequest`. This means Privakey will call `/auth/processRequest` when the user acts on the request. When that happens, we want to update the user's page.

```javascript
// file: routes/privakey.js
ActiveRequest.findOne( {requestGuid: req.body.guid}, function(err, activeRequest) {
    if(err) {
        console.log(err);
    } else {
        let socket = io.sockets.connected[activeRequest.socketId];

        if (activeRequest.requestType === 'auth') {
            if(req.body.buttonSelected == 0) {
                User.findOne({ id: activeRequest.accountId }).then(user => {
                    const payload = {
                        id: user.id,
                        name: user.name
                    };

                    jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 },
                        (err, token) => { 
                            emit(socket, 'server/APPROVE_LOGIN', {
                                success: true,
                                token: "Bearer " + token
                            });
                        });
                });
            } else {
                emit(socket, 'server/REJECT_LOGIN', { });
            }
        } else {
            if(req.body.buttonSelected == 0) {
                emit(socket, 'server/UPDATE_REQUEST', { requestStatus: 'APPROVED' });
            } else {
                emit(socket, 'server/UPDATE_REQUEST', { requestStatus: 'REJECTED' });
            }
        }

        res.status(204).send();
    }
});
```

This code actually handles 2 different flows: A user logging in, and a user sending a sample request to themselves. Depending on the type of request, it forwards slightly different info to the client, which can update accordingly.

## Acknowledgements

* Huge thank-you to Rishi Prasad, whose [MERN tutorial](https://blog.bitsrc.io/build-a-login-auth-app-with-mern-stack-part-1-c405048e3669) was extremely helpful.
* [itaylor](https://github.com/itaylor) for the [redux-socket.io library](https://github.com/itaylor/redux-socket.io).