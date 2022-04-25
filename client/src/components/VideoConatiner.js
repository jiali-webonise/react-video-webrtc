import React, { useEffect, useRef, useState } from 'react';
const VideoConatiner = (props) => {
    const userVideo = useRef();
    const [showVideo, setShowVideo] = useState(false);
    const [showAudio, setShowAudio] = useState(false);
    const audioTrack = props.stream?.getTracks()?.find(track => track.kind === 'audio');
    const videoTrack = props.stream.getTracks().find(track => track.kind === 'video');

    useEffect(() => {
        if (props.stream) {
            if (userVideo.current) {
                userVideo.current.srcObject = props.stream;
            }
        }

        audioTrack.enabled = props.yourAudioStatus;

        if (audioTrack.enabled) {
            setShowAudio(false);
        } else {
            setShowAudio(true);
        }

    }, [props.stream, props.yourAudioStatus]);//, props.yourVideoStatus

    const micHandler = () => {
        if (audioTrack.enabled) {
            // disable mic
            audioTrack.enabled = false;
            props.onTurnOffAduioSocket(props.yourID);
            //show enable mic icon
            setShowAudio(true);

        } else {
            // enable mic
            audioTrack.enabled = true;
            props.onTurnOnAudioSocket(props.yourID);
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

    return (
        <div className="col col-md">
            <div className="card mt-3">
                <video className='video-style' playsInline muted ref={userVideo} autoPlay />
                <div className="card-body">
                    <h5 className="card-title h5">Your ID: </h5>
                    <p className="card-text">{props.yourID}</p>
                    <p className="card-text">Audio ID: {audioTrack.id}</p>
                </div>
                <div className="card-footer d-flex justify-content-center">
                    {!showAudio && micOnComponent}
                    {showAudio && micOffComponent}
                    {!showVideo && videoOnComponent}
                    {showVideo && videoOffComponent}
                </div>
            </div>
        </div>
    )
}

export default VideoConatiner;