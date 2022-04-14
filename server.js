require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path")

const users = {};
let calling = [];
const calls = new Map();

io.on('connection', socket => {
    if (!users[socket.id]) {
        users[socket.id] = socket.id;
    }

    console.log("users in server: ", Object.entries(users));
    console.log("calling:", calling);
    socket.emit("yourID", socket.id);
    io.sockets.emit("allUsers", users);

    socket.on('disconnect', () => {
        console.log('disconnect emit');
        //if this user is disconnecting from a call, set status to completed
        socket.broadcast.emit("user left", { userLeft: socket.id, peers: calling });
        delete users[socket.id];
        // console.log("after disconnection,and users in server: ", Object.entries(users));
    })

    //update users
    socket.on("updateUsers", () => {
        calling = [];//clean up calling
        console.log("users in server: ", Object.entries(users));
        io.sockets.emit("refresh users", users);
    })

    socket.on("callUser", (data) => {
        console.log("callUser, users in server: ", Object.entries(users));
        //check if user is in calling? if it is undercall? or completed a call?
        const userInCalling = calls.has(data.userToCall);
        const undercall = calls?.get(data.userToCall)?.undercall;
        const completed = calls?.get(data.userToCall)?.completed;
        //cannot call this user when the user is undercall or have completed a call
        if ((userInCalling && undercall) || (userInCalling && completed)) {
            return io.to(data.from).emit('unable call', { userUnderCall: data.userToCall })
        }
        //can call this user: this user is not under call or haven't completed a call
        const call = {
            caller: data.from,
            receiver: data.userToCall,
            undercall: false,
            calling: true,
            completed: false
        }
        console.log(Object.entries(call));
        // calling.push(data.from, data.userToCall);
        io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from, callInfo: call });
    })

    socket.on("acceptCall", (data) => {
        console.log("acceptCall, users in server: ", Object.entries(users));
        // if (calling.includes(data.to)) {
        //check if this caller is undercall or have completed a call
        try {
            const callInfo = data.callInfo;
            console.log("Call info when acceptCall: ", Object.entries(callInfo));
            if (callInfo.undercall) {
                return io.to(data.to).emit('beingCalled', { userToCall: data.to });
            }

            if (callInfo.completed) {
                throw new Error(`deprecated user: ${data.to}`)
            }
            //change undercall to true and change calling to false
            callInfo.undercall = true;
            callInfo.calling = false;
            console.log(`updated callInfo`, Object.entries(callInfo));
            //store connected peers
            calling.push(callInfo.caller, callInfo.receiver);
            calls.set(callInfo.caller, callInfo);
            console.log(`calls`, Object.entries(calls));
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


