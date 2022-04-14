import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Video = styled.video`
  border: 1px solid blue;
  width: 50%;
  height: 50%;
`;

function App() {
  // const [left, setLeft] = useState(false);
  const [beingCalled, setBeingCalled] = useState(false);
  const [underCall, setUnderCall] = useState(false);
  const [yourID, setYourID] = useState("");
  const [peerID, setPeerID] = useState("");
  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();
  const peerRef = useRef();

  useEffect(() => {
    socket.current = io.connect("/");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    })

    socket.current.on("yourID", (id) => {
      setYourID(id);
    })
    socket.current.on("allUsers", (users) => {
      setUsers(users);
    })

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setPeerID(data.from);
      setCallerSignal(data.signal);
    });
    socket.current.on("beingCalled", () => {
      setBeingCalled(true);
    })
    console.log('before user left', peerID);
    console.log('before user left', caller);
    //handle user leave
    socket.current.on("user left", (data) => {
      alert(`${data.userLeft} disconnected`);
      console.log("user left: ", data.userLeft);
      console.log("peers: ", data.peers);
      if (data.peers.includes(data.userLeft)) {
        setBeingCalled(false);
        setReceivingCall(false);
        setCaller("");
        setCallAccepted(false);
        setUnderCall(false);
        const destroyPeer = new Peer(peerRef.current);
        destroyPeer.destroy();
        socket.current.emit("updateUsers");
        alert("Please refresh your page");
      }
    })

    socket.current.on("refresh users", (users) => {
      setUsers(users);
    })

    socket.current.on("peers under call", (data) => {
      console.log("peers under call", Object.entries(data.peers));
      console.log("users", Object.entries(users));
      // const userCanCall = users.map(el => !data.peers.has(el));
      // console.log("userCanCall: ", userCanCall);
      // setUsers(userCanCall);
    })
  }, []);

  function callPeer(id) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {

        iceServers: [
          {
            urls: "stun:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683"
          },
          {
            urls: "turn:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683"
          }
        ]
      },
      stream: stream,
    });

    peer.on("signal", data => {
      socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID })
    })

    peer.on("stream", stream => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current.on("callAccepted", data => {
      setPeerID(data.peerID);
      setCallAccepted(true);
      setUnderCall(true);
      peer.signal(data.signal);
    })

    peerRef.current = peer;
  }

  function acceptCall() {
    if (!beingCalled) {
      setCallAccepted(true);
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });
      setPeerID(caller);
      peer.on("signal", data => {
        socket.current.emit("acceptCall", { signal: data, to: caller, from: yourID })
      })

      peer.on("stream", stream => {
        partnerVideo.current.srcObject = stream;
      });

      peerRef.current = peer;
      setUnderCall(true);
      peer.signal(callerSignal);
    }

  }

  function exitCall() {
    setBeingCalled(false);
    setUnderCall(false);
    setReceivingCall(false);
    setCallAccepted(false);
    alert("You just disconnected");
    // window.location.href = 'https://simple-peer-webrtc.herokuapp.com/';
    window.location.href = 'http://localhost:3000/';
  }
  let UserVideo;
  if (stream) {
    UserVideo = (
      <Video playsInline muted ref={userVideo} autoPlay />
    );
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <Video playsInline ref={partnerVideo} autoPlay />
    );
  }

  let incomingCall;
  if (receivingCall && !beingCalled) {
    incomingCall = (
      <div>
        <h1>{caller} is calling you</h1>
        <button onClick={acceptCall}>Accept</button>
      </div>
    )
  }

  let underCallpeers;
  if (underCall) {
    const msg = `Connected successfully, You ID: ${yourID}`;
    underCallpeers = (<div>
      <h1>{msg}</h1>
      <button onClick={exitCall}>Exit</button>
    </div>)
  }
  return (
    <Container>
      <Row>
        {UserVideo}
        {PartnerVideo}
      </Row>
      <p>Your ID: {yourID}</p>
      {underCall && <p>Your peerID: {peerID}</p>}
      <Row>
        {users && !underCall && Object.keys(users).map(key => {
          if (key === yourID) {
            return null;
          }
          return (
            <button key={key} onClick={() => callPeer(key)}>Call {key}</button>
          );
        })}
      </Row>
      <Row>
        {receivingCall && !underCall && !beingCalled && incomingCall}
        {underCall && underCallpeers}
      </Row>
    </Container>
  );
}

export default App;
