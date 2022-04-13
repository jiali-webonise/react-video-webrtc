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

io.on('connection', socket => {
    if (!users[socket.id]) {
        users[socket.id] = socket.id;
    }

    console.log("users in server: ", Object.entries(users));
    socket.emit("yourID", socket.id);
    io.sockets.emit("allUsers", users);
    socket.on('disconnect', (data) => {
        console.log('disconnect emit');
        socket.broadcast.emit("user left", { userLeft: socket.id });
        // io.to(data.to).emit('user left', { from: data.from });
        delete users[socket.id];
        calling = [];
        console.log("after disconnection,and users in server: ", Object.entries(users));
        //update users

        // io.sockets.emit("user left");
    })

    socket.on("updateUsers", () => {
        console.log("users in server: ", Object.entries(users));
        io.sockets.emit("refresh users", users);
    })

    socket.on("callUser", (data) => {
        console.log("callUser, users in server: ", Object.entries(users));
        calling.push(data.from, data.userToCall);
        io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from });
    })

    socket.on("acceptCall", (data) => {
        console.log("acceptCall, users in server: ", Object.entries(users));
        if (calling.includes(data.to)) {
            io.to(data.to).emit('beingCalled', { userUnderCall: data.to });
        }

        io.to(data.to).emit('callAccepted', { signal: data.signal, peerID: data.from });
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


