import React, { useEffect, useRef, useState } from 'react';

const PartnerVideoContainer = (props) => {
    const ref = useRef();
    const [show, setShow] = useState(true);
    // const [audioTrack, setAudioTrack] = useState();
    const [videoTrack, setVideoTrack] = useState();
    let audioTrack = props.peer.streams[0]?.getTracks()?.find(track => track.kind === 'audio');
    const [showVideo, setShowVideo] = useState(false);
    const [showAudio, setShowAudio] = useState(false);

    useEffect(() => {
        ref.current.srcObject = props.peer.streams[0];

        // props.peer.on("stream", stream => {
        //     ref.current.srcObject = stream;
        // })

        props.peer.on("close", () => {
            setShow(false);
            ref.current = null;
            props.peer.destroy();
        })

        // props.peer.on("connect", () => {
        //     // console.log("MediaContainer peer connected....")
        //     ref.current = props.peer;
        // });

        // props.peer.on('track', (track, stream) => {
        //     if (track.kind === 'audio') {
        //         track.enabled = props.partnerAudioStatus;
        //         setShowAudio(!props.partnerAudioStatus);
        //         setAudioTrack(track);
        //     }

        //     // if (track.kind === 'video') {
        //     //     setVideoTrack(track);
        //     // }
        //     // if (track.kind === 'video' && track.enabled) {
        //     //     setShowVideo(false);
        //     // }
        //     // if (track.kind === 'video' && !track.enabled) {
        //     //     setShowVideo(true);
        //     // }

        //     ref.current.srcObject = stream;
        // })

        props.peer.on('error', (err) => {
            console.error(`${JSON.stringify(err)} at MediaContainer error`);
            console.log("error peer: ", props.peer);
        })

        if (props.partnerAudioStatus.userId === props.partnerID) {
            // let track = props.peer.streams[0].getTracks().find(track => track.kind === 'audio')
            audioTrack.enabled = props.partnerAudioStatus.status;
            // setAudioTrack(track);
            setShowAudio(!props.partnerAudioStatus.status);
        } else {
            // let track = props.peer.streams[0].getTracks().find(track => track.kind === 'audio')
            // setAudioTrack(track);
            audioTrack.enabled = true;
            setShowAudio(true);
        }

    }, [props.peer, props.partnerAudioStatus]);

    const micHandler = () => {
        if (audioTrack.enabled) {
            // disable mic
            audioTrack.enabled = false;
            props.onTurnOffAduioSocket(props.partnerID);
            //show enable mic icon
            setShowAudio(true);
        } else {
            // enable mic
            audioTrack.enabled = true;
            props.onTurnOnAudioSocket(props.partnerID)
            //show disable mic icon
            setShowAudio(false);
        }
    }

    const videoHandler = () => {
        if (videoTrack.enabled) {
            // show camera
            videoTrack.enabled = false;
            setShowVideo(true);
        } else {
            videoTrack.enabled = true;
            // hide camera
            setShowVideo(false);
        }
    }

    const micOnComponent = (<button type="button" className="btn btn btn-outline-dark mx-3" onClick={micHandler}><i className="bi bi-mic-fill" style={{ fontSize: 20 }}></i></button>);
    const micOffComponent = (<button type="button" className="btn btn btn-outline-danger mx-3" onClick={micHandler}><i className="bi bi-mic-mute-fill" style={{ fontSize: 20 }}></i></button>);
    const videoOnComponent = (<button type="button" className="btn btn btn-outline-dark mx-3" onClick={videoHandler}><i className="bi bi-camera-video-fill" style={{ fontSize: 20 }}></i></button>);
    const videoOffComponent = (<button type="button" className="btn btn btn-outline-danger mx-3" onClick={videoHandler}><i className="bi bi-camera-video-off-fill" style={{ fontSize: 20 }}></i></button>);

    const partnerVideoVideoComponent = (
        <>
            <video className='video-style' playsInline autoPlay ref={ref} />
            <div className="card-body">
                <h5 className="card-title h5">Partner ID: </h5>
                <p className="card-text">{props.partnerID}</p>
                <p className="card-text">Audio ID: {audioTrack?.id}</p>
            </div>
            <div className="card-footer d-flex justify-content-center">
                {!showAudio && micOnComponent}
                {showAudio && micOffComponent}
                {!showVideo && videoOnComponent}
                {showVideo && videoOffComponent}
            </div>
        </>)

    return (<>
        {show && partnerVideoVideoComponent}</>
    );
}

export default PartnerVideoContainer;