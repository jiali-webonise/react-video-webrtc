import React, { useEffect, useRef } from 'react';

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, [props.peer]);

    return (
        <video className='video-style' playsInline autoPlay ref={ref} />
    );
}

export default Video;