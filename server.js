require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path")

const users = {};

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
        io.sockets.emit("refresh users", users);
    })

    socket.on("callUser", (data) => {
        console.log("event: callUser, users in server: ", Object.entries(users));
        try {
            const call = {
                caller: data.from,
                receiver: data.userToCall,
                undercall: false,
                calling: true,
                completed: false,
                channelName: data.channelName,
                callerAudioStatus: data.callerAudioStatus
            }
            console.log("event: callUser; callInfo: ", Object.entries(call));
            io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from, callInfo: call, callerAudioStatus: data.callerAudioStatus });
        } catch (error) {
            console.error(error);
        }
    })

    socket.on("acceptCall", (data) => {
        console.log("event: acceptCall, users in server: ", Object.entries(users));
        try {
            const callInfo = data.callInfo;
            console.log("event: acceptCall; callInfo: ", callInfo);
            callInfo.undercall = true;
            callInfo.calling = false;
            callInfo.receiverAudioStatus = data.receiverAudioStatus
            console.log(`event: acceptCall; updated callInfo: `, callInfo);
            io.to(data.to).emit('callAccepted', {
                signal: data.signal,
                peerID: data.from,
                callInfo: callInfo,
                receiverAudioStatus: data.receiverAudioStatus
            });
        } catch (error) {
            console.error(error)
        }
    })

    socket.on("rejectCall", data => {
        console.log("event: rejectCall, callInfo: ", data.callInfo);
        io.to(data.callInfo.caller).emit("reject call", {
            callInfo: data.callInfo, from: data.callInfo.caller
        });
    })

    socket.on("update after successful connection", data => {
        console.log("event: update after successful connection, callInfo: ", data.callInfo);
        io.to(data.callInfo.receiver).emit("update callInfo", { callInfo: data.callInfo });
    })

    socket.on('turn on partner audio', data => {
        console.log(`${data.requestId} turns on ${data.partnerID}'s audio`);
        io.to(data.partnerID).emit("turnOnPartnerAudio", data);
    });

    socket.on('turn off partner audio', data => {
        console.log(`${data.requestId} turns off ${data.partnerID}'s audio`);
        io.to(data.partnerID).emit("turnOffPartnerAudio", data);
    });

    socket.on('turn on self audio', data => {
        console.log(`Broadcasting: ${data.userId} turns on audio`)
        socket.broadcast.emit("unmute user", { userId: socket.id });
    });

    socket.on('turn off self audio', data => {
        console.log(`Broadcasting: ${data.userId} turns off audio`)
        socket.broadcast.emit("mute user", { userId: socket.id });
    });
});

if (process.env.PROD) {
    app.use(express.static(path.join(__dirname, './client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './client/build/index.html'));
    });
}

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`server is running on port ${port}`));


