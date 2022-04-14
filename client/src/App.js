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

let callingInfo;

function App() {
  const [beingCalled, setBeingCalled] = useState(false);
  const [underCall, setUnderCall] = useState(false);
  const [userUnderCall, setUserUnderCall] = useState("");
  const [yourID, setYourID] = useState("");
  const [peerID, setPeerID] = useState("");
  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const [callInfo, setCallInfo] = useState();

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
      setCallInfo(data.callInfo);
      callingInfo = data.callInfo;
    });

    socket.current.on("beingCalled", (userToCall) => {
      setBeingCalled(true);
      setUserUnderCall(userToCall);
    })

    socket.current.on("update callInfo", (data) => {
      setCallInfo(data.callInfo);
      callingInfo = data.callInfo;
    })

    //handle user leave
    socket.current.on("user left", (data) => {
      alert(`${data.userLeft} disconnected`);
      if (callingInfo?.caller === data.userLeft || callingInfo?.receiver === data.userLeft) {
        //update local callingInfo to send to signaling server
        callingInfo.completed = true;
        callingInfo.undercall = false;
        setCallInfo(callingInfo);
        console.log("update local  callingInfo: ", callingInfo);//
        setBeingCalled(false);
        setReceivingCall(false);
        setCaller("");
        setCallAccepted(false);
        setUnderCall(false);
        const destroyPeer = new Peer(peerRef.current);
        destroyPeer.destroy();
        socket.current.emit("updateUsers after disconnection", callingInfo);
        alert("Please refresh your page");
      }
    })

    socket.current.on("refresh users", (users) => {
      setUsers(users);
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
      setCallInfo(data.callInfo);
      callingInfo = data.callInfo;
      setPeerID(data.peerID);
      setCallAccepted(true);
      setUnderCall(true);
      peer.signal(data.signal);
      socket.current.emit("update after successful connection", {
        callInfo: data.callInfo
      })
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
        socket.current.emit("acceptCall", { signal: data, to: caller, from: yourID, callInfo: callInfo })
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
    const msg = `Connected!`;
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
        {!underCall && beingCalled && <p>{userUnderCall} is in a call, please call later</p>}
        {receivingCall && !underCall && !beingCalled && incomingCall}
        {underCall && underCallpeers}
        <ul>
          {callInfo && Object.entries(callInfo).map(el => <li key={el[0]}>{el[0]}: {String(el[1])}</li>)}
        </ul>

      </Row>
    </Container>
  );
}

export default App;
