import React, { useEffect, useState, useRef } from 'react';
import Video from './components/Video';
import './App.scss';
import io from "socket.io-client";
import Peer from "simple-peer";

let callingInfo;
let localPeers = [];

function App() {
  const [underCall, setUnderCall] = useState(false);
  const [finishCall, setFinishCall] = useState(false);
  const [sendCall, setSendCall] = useState(false);

  const [yourID, setYourID] = useState("");
  const [peers, setPeers] = useState([]);

  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");

  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const [callInfo, setCallInfo] = useState();
  const showPartnerVideo = callAccepted || underCall;

  const userVideo = useRef();
  // const peersRef = useRef([]);
  const socket = useRef();
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

    socket.current.on("deprecated user", (data) => {
      alert(`Cannot call ${data.userToCall}, this user is deprecated`);
      setSendCall(false);
    })

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
      setCallInfo(data.callInfo);
      callingInfo = data.callInfo;
    });

    // socket.current.on("beingCalled", (data) => {
    //   console.log("cannot call: ", data);
    //   alert(`Cannot call ${data.userToCall}, this user is under a call`);
    //   setSendCall(false);
    // })

    socket.current.on("update callInfo", (data) => {
      setCallInfo(data.callInfo);
      callingInfo = data.callInfo;
    })

    //handle user leave
    socket.current.on("user left", (data) => {
      alert(`${data.userLeft} disconnected`);
      console.log("localPeers: ", localPeers);
      const peerleft = localPeers.find(peer => {
        return peer.partnerID === data.userLeft
      })
      console.log("found peer: ", peerleft);
      if (peerleft) {
        peerleft.peer.destroy();
        //update local callingInfo to send to signaling server
        callingInfo.completed = true;
        callingInfo.undercall = false;
        setCallInfo(callingInfo);
        console.log("setPeers localPeers: ", localPeers);
      }
      const a = localPeers.filter(p => {
        if (p.partnerID !== data.userLeft && p.peer._connected) {
          return p;
        }
      });
      console.log(a.length)
      if (a.length === 0) {
        setReceivingCall(false);
        setCaller("");
        setCallAccepted(false);
        setFinishCall(true);
        setUnderCall(false);
        setPeers([]);
        socket.current.emit("updateUsers after disconnection", callingInfo);
        // alert("Please refresh your page");
      }
    })

    socket.current.on("refresh users", (users) => {
      setUsers(users);
    })
  }, []);

  function callPeer(id) {
    setSendCall(true);
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
      socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID, channelName: peer.channelName })
    })

    peer.on('close', () => {
      console.log("peer destroy :", id)
      peer.destroy();
    })

    peer.on('error', (err) => {
      console.error(`${JSON.stringify(err)} at callPeer, show peer: ${JSON.stringify(peer)}`);
    })

    // peer.on("stream", stream => {

    // });

    socket.current.on("callAccepted", data => {
      setSendCall(false);
      setReceivingCall(false);
      setCallInfo(data.callInfo);
      callingInfo = data.callInfo;
      setCallAccepted(true);
      setUnderCall(true);
      peer.signal(data.signal);
      socket.current.emit("update after successful connection", {
        callInfo: data.callInfo
      })
    })
    //add peer to peers
    setPeers(prev => [...prev, { peer: peer, partnerID: id, completed: false }]);
    localPeers.push({ peer: peer, partnerID: id });
  }

  function acceptCall() {
    setSendCall(false);
    setCallAccepted(true);
    setReceivingCall(false);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", data => {
      socket.current.emit("acceptCall", { signal: data, to: caller, from: yourID, callInfo: callInfo })
    })

    peer.on('error', (err) => {
      console.error(`${JSON.stringify(err)} at acceptCall, show peer: ${JSON.stringify(peer)}`);
    })

    // peer.on("stream", stream => {

    // });

    peer.on('close', () => {
      console.log("peer destroy :", caller)
      peer.destroy();
    })

    setPeers(prev => [...prev, { peer: peer, partnerID: caller, completed: false }]);
    setUnderCall(true);
    peer.signal(callerSignal);
    localPeers.push({ peer: peer, partnerID: caller });
  }

  function exitCall() {
    setUnderCall(false);
    setReceivingCall(false);
    setCallAccepted(false);
    alert("You just disconnected");
    // window.location.href = 'https://simple-peer-webrtc.herokuapp.com/';
    window.location.href = 'http://localhost:3000/';
  }

  function leaveRoom() {
    window.location.href = 'http://localhost:3000/';
    // window.location.href = 'https://simple-peer-webrtc.herokuapp.com/';
  }

  let UserVideo;
  if (stream) {
    UserVideo = (
      <video className='video-style' playsInline muted ref={userVideo} autoPlay />
    );
  }

  let incomingCall;
  if (receivingCall) {
    incomingCall = (<div className="card mt-3 mb-3">
      <h5 className="card-header h3 bg-light text-primary">Incoming Call...</h5>
      <div className="card-body">
        {caller} is calling you
        <button type='button' className='btn btn-info mx-3' onClick={acceptCall}>Accept</button>
      </div>
    </div>
    )
  }

  let underCallpeers;
  if (underCall) {
    underCallpeers = (<div className="card border-success my-2">
      <div className="card-header bg-success h3 text-white">
        Status
      </div>
      <div className="card-body disply-6">
        Connected!
        <button type='button' className='btn btn-info mx-1 my-1' onClick={exitCall}>Exit</button>
      </div>
    </div>)
  }

  let callingMessage;
  if (sendCall && !callAccepted) {
    callingMessage = (<div className="card mt-3 mb-3">
      <h5 className="card-header h3 bg-light text-primary">Calling...</h5>
      <div className="card-body">
        Waiting for response
      </div>
    </div>)
  }

  let callInfoComponent;
  if (!finishCall && callInfo) {
    callInfoComponent = (
      <div className="card border-primary my-2">
        <div className="card-header h3 bg-light text-primary">
          Call Information
        </div>
        <div className="card-body">
          {Object.entries(callInfo).map(el => <p className="card-text" key={el[0]}>{el[0]}: {String(el[1])} </p>)}
        </div>
      </div>)
  }

  return (
    <div className='container container-sm'>
      <div className="row">
        <div className="col col-md">
          <div className="card mt-3">
            {UserVideo}
            <div className="card-body">
              <h5 className="card-title h5">Your ID: </h5>
              <p className="card-text">{yourID}</p>
            </div>
          </div>
        </div>
        <div className="col col-md">
          <div className="card mt-3">
            {showPartnerVideo && peers.length > 0 && peers.map((peer, index) => {
              return (
                <>
                  <Video key={index} peer={peer.peer} completed={peer.completed} />
                  {/* {console.log(peers)} */}
                  <div className="card-body">
                    <h5 className="card-title h5">Partner partnerID: </h5>
                    <p className="card-text">{peer.partnerID}</p>
                  </div>
                </>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        {users && !finishCall && !underCall && Object.keys(users).map(key => {
          if (key === yourID) {
            return null;
          }

          return (
            <button type='button' className="btn btn-primary mt-3 me-3" key={key} onClick={() => callPeer(key)}>Call {key}</button>
          );
        })}
      </div>
      <div>
        {receivingCall && incomingCall}
        {callingMessage}
        {underCall && underCallpeers}
        {callInfoComponent}
        {finishCall && <button type='button' className="btn btn-info mt-3" onClick={leaveRoom}>Leave this room to start new call</button>}
      </div>
    </div >
  );
}

export default App;
