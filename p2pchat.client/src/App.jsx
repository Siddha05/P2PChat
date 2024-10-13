import { useEffect, useState } from 'react';
import './App.css';
import MessageList from './MessageList.jsx';
import ChatControls from './ChatControls.jsx';
import { HubConnectionBuilder } from '@microsoft/signalr';

function App() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [isConnect, setisConnect] = useState(false);
    const [hub, setHub] = useState(null);
    const [peerConnection, setPeerConnection] = useState();
    const [user, setUser] = useState({ Name: 'Apollo' });
    const [reload, setReload] = useState(0);
    const [dataChannel, setDataChannel] = useState();

    const servers = {
        iceServers: [
            { url: 'stun:stun.l.google.com:19302' }
        ]
    };
    useEffect(() => {
        let peerConn = new RTCPeerConnection(servers);
        let data = peerConn.createDataChannel("chat");
        setDataChannel(data);
        setPeerConnection(peerConn);
    }, [reload]);
    useEffect(() => {
        const connection = new HubConnectionBuilder().withUrl('https://localhost:7036/signal').withAutomaticReconnect().build();
        connection.start().then(result => {
            setHub(connection);
            console.log('Connection established');
        }).catch(e => console.log('Connection failed: ', e));
    }, [reload]);
    
    const send = () => {
        let msg = `${user.Name}: ${text}`;
        setMessages([...messages, msg]);
        dataChannel.send(msg);
        setText("");
        
    }
    const handleChannelState = () => {
        setMessages([...messages, `Channel state: ${dataChannel.readyState}`]);
        if (dataChannel.readyState === 'open') {
            setisConnect(true);
        }
        else {
            setisConnect(false);
            clearState();
        }
    }
    const onAddUser = (user) => {
        setMessages([...messages, `New user connected ${user}`]);
        sendOffer();
    }
    const connect = () => {
        configureHub();
        configurePeer();
        hub.invoke("NewUser", JSON.stringify(user)).then(() => setMessages([...messages, 'Connected to signal server'])).catch(e => showError(e));
        
    }
    function configurePeer() {
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                hub.invoke("SendSignal", JSON.stringify(event.candidate));
            }
        }
        dataChannel.onopen = handleChannelState;
        dataChannel.onclose = handleChannelState;
        peerConnection.ondatachannel = e => {
            let ch = e.channel;
            ch.onmessage = handleOnMessage;
            ch.onopen = handleChannelState;
            ch.onclose = handleChannelState;
            setDataChannel(ch);
        };
        dataChannel.onmessage = (e) => {
            setMessages([...messages, e.data]);
        }
        
    }
    function configureHub() {
        hub.on("on_connected", msg => setUser({ ...user, ConnectionID: msg }));
        hub.on("on_user_add", onAddUser);
        hub.on("on_signal", onGotSignal);
    }
    function receiveCallback(e) {
        let ch = e.channel;
        ch.onmessage = handleOnMessage;
        ch.onopen = handleChannelState;
        ch.onclose = handleChannelState;
        setDataChannel(ch);
    }
    const showError = (e) => console.log(e);

    async function onGotSignal(signal) {
        
        var obj = JSON.parse(signal);
        if (obj.sdp) {
            if (obj.type === "offer") {
                await peerConnection.setRemoteDescription(obj);
                var answer = await peerConnection.createAnswer();
                console.log("Create answer", answer);
                await peerConnection.setLocalDescription(answer);
                hub.invoke("SendSignal", JSON.stringify(answer)).catch(e => showError(e));
            }
            else if (obj.type === "answer") {
                peerConnection.setRemoteDescription(obj);
            }

        }
        else if (obj.candidate) {
            peerConnection.addIceCandidate(obj).catch(e => showError(e));
        }
    }

    const textChanged = (val) => {
        setText(val);
    }
    
    const handleOnMessage = (e) => {
        setMessages([...messages, e.data]);
    }
    function clearState() {
        setReload(reload + 1);
    }
    const sendOffer = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        hub.invoke("SendSignal", JSON.stringify(offer)).catch(e => showError(e));
    }
    
    return (
        <div>
            <h2>P2P Chat</h2>
            <div style={{display: 'flex', margin: '0.5rem', fontSize: '20px'}}>
                <label htmlFor="name">You name:</label>
                <input type="input" value={user.Name} id="name" onChange={e => setUser({...user, Name: e.target.value})} style={{marginLeft: '10px'}} />
            </div>
            <MessageList key='mgs' messages={messages} />
            <ChatControls onSend={send} onConnect={connect} text={text} onTextChanged={textChanged} isConnect={ isConnect} />
        </div>
    );
    
}

export default App;