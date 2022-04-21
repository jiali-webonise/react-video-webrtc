import React, { useEffect, useRef, useState } from 'react';

const MediaContainer = (props) => {
    const ref = useRef();
    const [show, setShow] = useState(true);
    const [stream, setStream] = useState();

    useEffect(() => {
        setStream(props.peer.stream);
        ref.current.srcObject = stream;

        props.peer.on("stream", stream => {
            console.log("stream mediacontainer", stream);
            setStream(stream);
            ref.current.srcObject = stream;
        })

        props.peer.on("close", () => {
            setShow(false);
            // console.log("MediaContainer peer closing....");
            ref.current = null;
            // console.log("Video ref set to null....")
            props.peer.destroy();
            // console.log("MediaContainer peer destroyed....");
        })

        props.peer.on("connect", () => {
            // console.log("MediaContainer peer connected....")
            ref.current = props.peer;
        })

        props.peer.on('error', (err) => {
            console.error(`${JSON.stringify(err)} at MediaContainer error`);
            console.log("peer: ", props.peer);
        })

    }, [props.peer]);

    const peerVideoComponent = (
        <>
            <video className='video-style' playsInline autoPlay ref={ref} />
            <div className="card-body">
                <h5 className="card-title h5">Partner partnerID: </h5>
                <p className="card-text">{props.partnerID}</p>
            </div>
            <div className="card-footer d-flex justify-content-center">
                <button type="button" className="btn btn btn-outline-dark mx-3"><i className="bi bi-mic-fill" style={{ fontSize: 25 }}></i></button>
                <button type="button" className="btn btn btn-outline-dark mx-3"><i className="bi bi-camera-video-fill" style={{ fontSize: 25 }}></i></button>
            </div>
        </>)

    return (<>
        {show && peerVideoComponent}</>
    );
}

export default MediaContainer;