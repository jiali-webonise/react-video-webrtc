require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path")

const users = {};
const calls = [];

io.on('connection', socket => {
    if (!users[socket.id]) {
        users[socket.id] = socket.id;
    }

    socket.emit("yourID", socket.id);
    io.sockets.emit("allUsers", users);

    socket.on('disconnect', () => {
        console.log('event: disconnect emit');
        socket.broadcast.emit("user left", { userLeft: socket.id });
        delete users[socket.id];
    })

    //update users after disconnection and store information of completed calls
    socket.on("updateUsers after disconnection", (callingInfo) => {
        console.log("event: updateUsers after disconnection; users in server: ", Object.entries(users));
        calls.push(callingInfo);
        console.log("event: updateUsers; completed calls: ", calls);
        io.sockets.emit("refresh users", users);
    })

    socket.on("callUser", (data) => {
        console.log("event: callUser, users in server: ", Object.entries(users));
        //To-do
        //check if user is undercall? or completed a call?
        //cannot call this user when the user is undercall or have completed a call
        // if (callInfo shows this user is undercall/completed a call) {
        //     return io.to(data.from).emit('unable call', { userUnderCall: data.userToCall })
        // }
        //can call this user: this user is not under call or haven't completed a call
        const call = {
            caller: data.from,
            receiver: data.userToCall,
            undercall: false,
            calling: true,
            completed: false
        }
        console.log("event: callUser; callInfo: ", Object.entries(call));
        io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from, callInfo: call });
    })

    socket.on("update after successful connection", data => {
        console.log("event: update after successful connection, callInfo: ", data.callInfo);
        io.to(data.callInfo.receiver).emit("update callInfo", { callInfo: data.callInfo });
    })

    socket.on("acceptCall", (data) => {
        console.log("event: acceptCall, users in server: ", Object.entries(users));
        //fix this
        //check if this caller is undercall or have completed a call
        try {
            const callInfo = data.callInfo;
            console.log("event: acceptCall; callInfo: ", callInfo);
            //To-do
            //check if this data.to is deprecated
            // if (callInfo.undercall) {
            //     return io.to(data.to).emit('beingCalled', { userToCall: data.to });
            // }

            // if (callInfo.completed) {
            //     throw new Error(`deprecated user: ${data.to}`)
            // }

            //change undercall to true and change calling to false
            callInfo.undercall = true;
            callInfo.calling = false;
            console.log(`event: acceptCall; updated callInfo: `, callInfo);
            io.to(data.to).emit('callAccepted', { signal: data.signal, peerID: data.from, callInfo: callInfo });
        } catch (error) {
            console.error(error)
        }
    })
});

if (process.env.PROD) {
    app.use(express.static(path.join(__dirname, './client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './client/build/index.html'));
    });
}

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`server is running on port ${port}`));


