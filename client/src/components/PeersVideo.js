import React from 'react';
import PartnerVideoContainer from './PartnerVideoContainer';

const PeersVideo = ({ partnerAudioUserId, partnerAudioStatus, showPartnerVideo, peers, onTurnOffAduioSocket, onTurnOnAudioSocket }) => {

    return (<>{
        showPartnerVideo && partnerAudioUserId !== '' && peers.length > 0
        && peers.map((peer, index) => {
            return (
                <PartnerVideoContainer
                    key={index}
                    peer={peer.peer}
                    partnerID={peer.partnerID}
                    partnerAudioUserId={partnerAudioUserId}
                    partnerAudioStatus={partnerAudioStatus}
                    onTurnOffAduioSocket={onTurnOffAduioSocket}
                    onTurnOnAudioSocket={onTurnOnAudioSocket}
                />
            );
        })
    }</>);
}

export default PeersVideo;