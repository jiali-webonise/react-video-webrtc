import React, { useEffect, useState, useRef } from 'react';
import PartnerVideoContainer from './components/PartnerVideoContainer';
import CallInfo from './components/CallInfo';
import CallInfoList from './components/CallInfoList';
import VideoConatiner from './components/VideoConatiner';

import './App.scss';
import io from "socket.io-client";
import Peer from "simple-peer";

let callingInfo;
let callingInfoList = [];
let localPeers = [];
console.log("REACT_APP_ENVIRONMENT: ", process.env.REACT_APP_ENVIRONMENT);
function App() {
  const BASE_URL = process.env.REACT_APP_ENVIRONMENT === 'PRODUCTION' ? process.env.REACT_APP_BASE_URL_PROD : process.env.REACT_APP_BASE_URL_DEV;

  const [underCall, setUnderCall] = useState(false);
  const [sendCall, setSendCall] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const showPartnerVideo = callAccepted || underCall;

  const [yourID, setYourID] = useState("");
  const [peers, setPeers] = useState([]);

  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();

  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();

  const [callInfo, setCallInfo] = useState();
  const [callInfoList, setCallInfoList] = useState([]);

  const [notification, setNotification] = useState("");

  const userVideo = useRef();
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
      setCallInfoList(prev => {
        return [...prev, data.callInfo]
      });
      callingInfo = data.callInfo;
      callingInfoList.push(data.callInfo);
    });

    socket.current.on("reject call", (data) => {
      showAlert(`Your call has been rejected by ${data.from}`);
      setCallInfo(data.callInfo);
      callingInfo = data.callInfo;
      callingInfoList.push(data.callInfo);
      setCallInfoList(prev => [...prev, data.callInfo]);
      setSendCall(false);
      console.log("reject call callingInfoList: ", callingInfoList);
      console.log("reject call localPeers: ", localPeers);
      //reset peers
      setPeers([]);
      // if (localPeers.length > 1) {
      //   const rejectedPeer = localPeers.filter(p => p.partnerID === data.from);
      //   console.log("rejected localPeers:", rejectedPeer);
      //   rejectedPeers.push(rejectedPeer.peer._id);
      //   console.log("rejected peers:", rejectedPeers)
      //   // setPeers(localPeers);
      // } else {
      //   setPeers([]);
      // }
    });

    // socket.current.on("beingCalled", (data) => {
    //   console.log("cannot call: ", data);
    //   alert(`Cannot call ${data.userToCall}, this user is under a call`);
    //   setSendCall(false);
    // })

    socket.current.on("update callInfo", (data) => {
      setCallInfo(data.callInfo);
      setCallInfoList(prev => {
        let newCallinfo = [];
        const existCallInfo = prev.find(info => (info.channelName === data.callInfo.channelName));
        if (existCallInfo) {
          newCallinfo = prev.filter(info => (info.channelName !== data.callInfo.channelName));
        }
        newCallinfo.push(data.callInfo);
        callingInfoList = newCallinfo;
        return newCallinfo;
      });

      callingInfo = data.callInfo;
    })

    //handle user leave
    socket.current.on("user left", (data) => {
      // alert(`${data.userLeft} disconnected`);
      showAlert(`${data.userLeft} disconnected`);
      const hasThisUser = data.userLeft === callingInfo?.caller || data.userLeft === callingInfo?.receiver;
      if (callingInfo?.calling && hasThisUser) {
        console.log("hasThisUser but didn't finish call");
        console.log("peers", peers);
        console.log("callingInfo: ", callingInfo);
        console.log("callingInfoList: ", JSON.stringify(callingInfoList));
        console.log("localPeers: ", JSON.stringify(localPeers));
        setSendCall(false);
        setReceivingCall(false);
      }
      const peerleft = localPeers.find(peer => (peer.partnerID === data.userLeft));
      if (peerleft) {
        peerleft.peer.destroy();
        //update local callingInfo to send to signaling server
        if (callingInfo?.caller === data.userLeft || callingInfo?.receiver === data.userLeft) {
          callingInfo.completed = true;
          callingInfo.undercall = false;
        }
        setCallInfo(callingInfo);
        let newCallingInfoList = [];
        const existCallInfo = callingInfoList.find(info => (info?.caller === data.userLeft || info?.receiver === data.userLeft));
        console.log(existCallInfo);
        if (!existCallInfo) {
          //Caller calls this user but the user has gone, and its peer object has been destroyed
          //redirect to clean up
          window.location.href = BASE_URL;
        }
        if (existCallInfo) {
          newCallingInfoList = callingInfoList.filter(info => (info?.channelName !== existCallInfo?.channelName));
          existCallInfo.completed = true;
          existCallInfo.undercall = false;
          newCallingInfoList.push(existCallInfo);
          callingInfoList = newCallingInfoList;
          setCallInfoList(callingInfoList);
          // console.log("user left callingInfoList: ", callingInfoList);
          // console.log("user left localPeers: ", localPeers);
          const restConnectedPeers = localPeers.filter(p => (p.partnerID !== data.userLeft && p.peer._connected));
          if (restConnectedPeers.length === 0) {
            socket.current.emit("updateUsers after disconnection", callingInfo);
            alert("All Peers left, streaming ends");
            window.location.href = BASE_URL;
          }
          setSendCall(false);
          setReceivingCall(false);
        }
      }
    })

    socket.current.on("refresh users", (users) => {
      setUsers(users);
    })
  }, []);

  const showAlert = (msg) => {
    setNotification(msg);

    // hide disconnection alert after 5 seconds
    setTimeout(() => {
      setNotification('');
    }, 5000)
  }

  function callPeer(id) {
    callingInfo = { receiver: id };
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
      console.log("peer destroy :", id);
      if (peers) {
        console.log("peer destroy peer:", peers);
      }
      peer.destroy();
    })

    peer.on("stream", stream => {
      // ref.current.srcObject = stream;
      console.log("stream app js", stream);
    })

    peer.on('connect', () => {
      console.log('connected')
    })

    peer.on('error', (err) => {
      console.error(`${JSON.stringify(err)} at callPeer`);
      console.log("peer at callPeer: ", peer);
    })

    socket.current.on("callAccepted", data => {
      setSendCall(false);
      setReceivingCall(false);
      setCallInfo(data.callInfo);
      setCallInfoList(prev => {
        let newCallinfo = [];
        const existCallInfo = prev.find(info => (info.channelName === data.callInfo.channelName));
        if (existCallInfo) {
          newCallinfo = prev.filter(info => (info.channelName !== data.callInfo.channelName));
        }
        newCallinfo.push(data.callInfo);
        callingInfoList = newCallinfo;
        return newCallinfo;
      })
      callingInfo = data.callInfo;
      // console.log("callingInfoList: ", callingInfoList);
      setCallAccepted(true);
      setUnderCall(true);
      peer.signal(data.signal);
      socket.current.emit("update after successful connection", {
        callInfo: data.callInfo
      })
    })
    setPeers(prev => [...prev, { peer: peer, partnerID: id }]);
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
      console.error(`${JSON.stringify(err)} at acceptCall`);
      console.log("peer at callPeer: ", peer);
    })

    peer.on('close', () => {
      console.log("peer destroy :", caller)
      peer.destroy();
    })

    setPeers(prev => [...prev, { peer: peer, partnerID: caller }]);
    setUnderCall(true);
    peer.signal(callerSignal);
    localPeers.push({ peer: peer, partnerID: caller });
  }

  function exitCall() {
    setUnderCall(false);
    setReceivingCall(false);
    setCallAccepted(false);
    alert("You just disconnected");
    window.location.href = BASE_URL;
  }

  function rejectCall() {
    if (!peers || peers.length === 0) {
      setUnderCall(false);
    }
    setReceivingCall(false);
    setCallAccepted(false);
    const updatedCallInfo = { ...callInfo, rejected: true };
    setCallInfo(updatedCallInfo);
    setCallInfoList(prev => [...prev, updatedCallInfo]);
    callingInfoList.push(updatedCallInfo);
    //emit reject socket
    socket.current.emit("rejectCall", {
      callInfo: updatedCallInfo
    });
    console.log('localPeers when reject', localPeers);
    console.log("peers: ", peers);
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
        <button type='button' className='btn btn-danger mx-3' onClick={rejectCall}>Reject</button>
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
      <h5 className="card-header h3 bg-light text-primary">Calling {callingInfo.receiver}...</h5>
      <div className="card-body">
        Waiting for response
      </div>
    </div>)
  }

  let callInfoComponent;
  if (callInfo) {
    callInfoComponent = (
      <CallInfo title={"Recent Call"} callInfo={callInfo} />
    )
  }

  let callInfoListComponent;
  if (callInfoList.length > 0) {
    callInfoListComponent = (
      <CallInfoList title="Call History" callInfoList={callInfoList} />
    )
  }

  let notificationAlert = (
    <div className="card text-dark bg-warning my-3">
      <div className="card-header">Notification</div>
      <div className="card-body">
        <h5 className="card-title">{notification}</h5>
      </div>
    </div>
  )

  return (<>
    <div className="container">
      {notification && notificationAlert}
    </div>
    <div className='container container-sm'>
      <div className="row">
        {/* User's media */}
        {stream && <VideoConatiner stream={stream} yourID={yourID} />}

        <div className="col col-md">
          <div className="card mt-3">
            {showPartnerVideo && peers.length > 0 && peers.map((peer, index) => {
              return (
                <PartnerVideoContainer key={index} peer={peer.peer} partnerID={peer.partnerID} />
              );
            })}
          </div>
        </div>
      </div>
      <div>
        {users && !receivingCall && !sendCall && !underCall && Object.keys(users).map(key => {
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
        {callInfoListComponent}
      </div>
    </div ></>
  );
}

export default App;
