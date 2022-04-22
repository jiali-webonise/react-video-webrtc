import React, { useEffect, useRef, useState } from 'react';

const PartnerVideoContainer = (props) => {
    const ref = useRef();
    const [show, setShow] = useState(true);
    const [audioTrack, setAudioTrack] = useState();
    const [videoTrack, setVideoTrack] = useState();

    const [showVideo, setShowVideo] = useState(false);
    const [showAudio, setShowAudio] = useState(false);

    useEffect(() => {
        ref.current.srcObject = props.peer.stream;

        props.peer.on("stream", stream => {
            console.log("stream mediacontainer", stream);
            ref.current.srcObject = stream;
        })

        props.peer.on("close", () => {
            setShow(false);
            ref.current = null;
            props.peer.destroy();
        })

        // props.peer.on("connect", () => {
        //     // console.log("MediaContainer peer connected....")
        //     ref.current = props.peer;
        // });

        props.peer.on('track', (track, stream) => {
            console.log("on track", track);
            console.log("on track", track.kind);
            if (track.kind === 'audio') {
                setAudioTrack(track);
            }
            if (track.kind === 'video') {
                setVideoTrack(track);
            }
            if (track.kind === 'audio' && track.enabled) {
                setShowAudio(false);
            }
            if (track.kind === 'audio' && !track.enabled) {
                setShowAudio(true);
            }
            if (track.kind === 'video' && track.enabled) {
                setShowVideo(false);
            }
            if (track.kind === 'video' && !track.enabled) {
                setShowVideo(true);
            }
            // console.log("on track: stream", stream);
            ref.current.srcObject = stream;
            // ref.current.srcObject = e.streams[0];
        })

        props.peer.on('error', (err) => {
            console.error(`${JSON.stringify(err)} at MediaContainer error`);
            console.log("peer: ", props.peer);
        })

    }, [props.peer]);

    const micHandler = () => {
        if (audioTrack.enabled) {
            // show camera
            audioTrack.enabled = false;
            setShowAudio(true);
        } else {
            // hide camera
            audioTrack.enabled = true;
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