import React, { useEffect, useRef, useState } from 'react';
const VideoConatiner = (props) => {
    const userVideo = useRef();
    const [showVideo, setShowVideo] = useState(false);
    const [showAudio, setShowAudio] = useState(false);

    useEffect(() => {
        if (props.stream) {
            if (userVideo.current) {
                userVideo.current.srcObject = props.stream;
            }
        }
        if (props.yourAudioStatus) {
            props.stream.getTracks().find(track => track.kind === 'audio').enabled = true;
            setShowAudio(false);
        } else {
            props.stream.getTracks().find(track => track.kind === 'audio').enabled = false;
            setShowAudio(true);
        }

        // if (props.yourVideoStatus) {
        //     props.stream.getTracks().find(track => track.kind === 'video').enabled = true;
        //     setShowVideo(false);
        // } else {
        //     props.stream.getTracks().find(track => track.kind === 'video').enabled = false;
        //     setShowVideo(false);
        // }
    }, [props.stream, props.yourAudioStatus, props.yourVideoStatus]);

    const micHandler = () => {
        const audioTrack = props.stream.getTracks().find(track => track.kind === 'audio');
        if (audioTrack.enabled) {
            // show camera
            audioTrack.enabled = false;
            setShowAudio(true);
        } else {
            audioTrack.enabled = true;
            // hide camera
            setShowAudio(false);
        }
    }

    const videoHandler = () => {
        console.log(props.stream.getTracks())
        const videoTrack = props.stream.getTracks().find(track => track.kind === 'video');
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