import React, { useEffect, useRef, useState } from 'react';

const Video = (props) => {
    const ref = useRef();
    const [show, setShow] = useState(true);

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })

        props.peer.on("close", () => {
            setShow(false);
            console.log("closing....");
            ref.current = null;
            console.log("Video ref set to null....")
            props.peer.destroy();
        })

        props.peer.on("connect", () => {
            console.log("connected....")
            ref.current = props.peer;
        })

        props.peer.on('error', (err) => {
            console.error(`${JSON.stringify(err)} at video error, show peer: ${props.peer}`);
        })
        // console.log(props.peer)
    }, [props.peer]);

    return (<>
        {show && < video className='video-style' playsInline autoPlay ref={ref} />}</>
    );
}

export default Video;