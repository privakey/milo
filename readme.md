# Milo App

Milo is a sample project that integrates [PrivakeyCX](https://www.privakey.com) into a MERN app. The purpose of this project is to provide code samples and usage examples of PrivakeyCX. The project covers logging in to the example site with Privakey or password, and allows an authenticated user to send a Privakey challenge request to themselves.

## Before You Begin

For the sample to work properly, you'll need 2 things:

* Privakey CX Auth Service
* Privakey White-Labeled App

Please contact sales@privakey.com to obtain these packages. Instruction on their usage, as well as more information about them, can be found [in Privakey's documentation](https://docs.privakey.com).

## Code Snippets

### Account Binding

The PrivakeyCX Auth Service maps a user's account to a specific set of cryptographic keys on the user's device, and to this end, an account must be bound in the Auth Service. This is accomplished by calling the Auth Service's bind route, sending a unique identifier for the user's account. This account ID is used by an integrating service (in this example, Milo) to reference the account and interact with it. Milo achieves this via the /auth/privakeyBind route, located in routes/privakey. The White-Labeled app will automatically call into this route during user registration.js.

The code below demonstrates the bind process, which simply sends the Auth Service our user's account ID.

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

The Auth Service processes this request, binds the account to that account ID, and generates both an internal ID (the Privakey ID) and a session token. When the response is returned, we must forward the Privakey ID, the session token's GUID, and the session token's expiration time to the White-Labeled App. The White-Labeled App then generates the cryptographic material and completes the bind process, binding the key material to the account automatically.

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

### Send Privakey Challenge Request

The core functionality of PrivakeyCX is sending rich challenge requests to users. These sent requests appear in the White-Labeled App, allowing the user to respond to them in a secure fashion. In Milo, these requests are sent via a WebSocket connection to inform the user when a challenge request is received by the Auth Service. 

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

Notice that in the above code, sendRequest is called with different parameters based on the type of challenge request to eliminate duplicate code. The function which performs the API call itself is as follows:

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
        "additionalInfo": "{'viewType': 'html', 'format': 'standard'}",
        "showNotification": true
    }
})
```

Take note of the callback parameter, which is explained below. Finally, when the call returns from the Auth Service, it will contain the GUID for the request that was just generated. This GUID is stored along with the socket's id so that when a challenge request is acted upon, the action will be emitted to the correct socket.

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

Because of the inherently asynchronous nature of a user responding to a challenge request, the Auth Service utilizes a URI callback. The Auth Service will POST the challenge request and user response to the location of the callback, eliminating the need for polling the request's status. The callback's URI is sent as a parameter when the request is created, and can be seen above when we called `/request/add`, and is valued `/auth/processRequest`. The Auth Service will POST the results of the challenge request to `/auth/processRequest` when the user acts on the request. The page on the site will then update demonstrating the result of the request:

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

The above code handles two different flows: A user logging in (request type "auth"), and a user sending a sample request to themselves. Depending on the type of request, it forwards slightly different information to the page, which can update accordingly. It is important to note, that while Milo itself makes a distinction between challenge request types, no such distinction exists in the Auth Service, with every request handled the same.

## Acknowledgements

* Huge thank-you to Rishi Prasad, whose [MERN tutorial](https://blog.bitsrc.io/build-a-login-auth-app-with-mern-stack-part-1-c405048e3669) was extremely helpful.
* [itaylor](https://github.com/itaylor) for the [redux-socket.io library](https://github.com/itaylor/redux-socket.io).