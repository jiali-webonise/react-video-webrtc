import React, { useEffect, useRef, useState } from 'react';

const PartnerVideoContainer = (props) => {
    const ref = useRef();
    const [show, setShow] = useState(true);
    const [audioTrack, setAudioTrack] = useState();
    const [showAudio, setShowAudio] = useState(false);

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
            const audio = stream.getTracks()?.find(track => track.kind === 'audio');
            if (props.partnerAudioUserId === props.partnerID) {
                audio.enabled = props.partnerAudioStatus;
                setAudioTrack(audio);
                setShowAudio(!props.partnerAudioStatus);
            }
            setAudioTrack(audio);
            setShowAudio(!audio.enabled);
        })

        props.peer.on("close", () => {
            setShow(false);
            ref.current = null;
            props.peer.destroy();
        });

        props.peer.on('error', (err) => {
            console.error(`${JSON.stringify(err)} at MediaContainer error`);
            console.log("error peer: ", props.peer);
        });

        if (props.partnerAudioUserId === props.partnerID && audioTrack) {
            const audio = audioTrack;
            audio.enabled = props.partnerAudioStatus;
            setAudioTrack(audio);
            setShowAudio(!props.partnerAudioStatus);
        }

    }, [props.peer, props.partnerAudioUserId, props.partnerAudioStatus]);

    const micHandler = () => {
        if (audioTrack?.enabled) {
            // disable mic
            const audio = audioTrack;
            audio.enabled = false;
            setAudioTrack(audio);
            props.onTurnOffAduioSocket(props.partnerID);
            //show enable mic icon
            setShowAudio(true);
        } else {
            // enable mic
            const audio = audioTrack;
            audioTrack.enabled = true;
            setAudioTrack(audio);

            props.onTurnOnAudioSocket(props.partnerID)
            //show disable mic icon
            setShowAudio(false);
        }
    }

    const micOnComponent = (<button type="button" className="btn btn btn-outline-dark mx-3" onClick={micHandler}><i className="bi bi-mic-fill" style={{ fontSize: 20 }}></i></button>);
    const micOffComponent = (<button type="button" className="btn btn btn-outline-danger mx-3" onClick={micHandler}><i className="bi bi-mic-mute-fill" style={{ fontSize: 20 }}></i></button>);

    const partnerVideoVideoComponent = (
        <>
            <video className='video-style' playsInline autoPlay ref={ref} controls />
            <div className="card-body">
                <h5 className="card-title h5">Partner ID: </h5>
                <p className="card-text">{props.partnerID}</p>
                <p className="card-text">Audio ID: {audioTrack?.id}</p>
            </div>
            <div className="card-footer d-flex justify-content-center">
                {!showAudio && audioTrack && micOnComponent}
                {showAudio && audioTrack && micOffComponent}
            </div>
        </>)

    return (<>
        {show && partnerVideoVideoComponent}</>
    );
}

export default PartnerVideoContainer;