import { HubConnectionBuilder } from '@microsoft/signalr';
import { useEffect, useState } from 'react';
import './App.css';
import ChatControls from './ChatControls.jsx';
import MessageList from './MessageList.jsx';

function App() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [isConnected, setIsConnected] = useState(false);
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
        
    }, [hub]);
    useEffect(() => {
        //setMessages([...messages]);
    }, [messages]);
    
    const send = () => {
        let msg = `${user.Name}: ${text}`;
        setMessages([...messages, msg]);
        dataChannel.send(msg);
        setText("");
        //trace('Send');
        
    }
    
    const trace = (name) => {
        console.log(`${name} hub`, hub);
        console.log(`${name} peer`, peerConnection);

    }
    function handleChannelState(channel) {
        setMessages(messages => [...messages, `Channel state: ${channel.readyState}`]);
        if (channel.readyState === 'open') {
            setIsConnected(true);
        }
        else {
            setIsConnected(false);
            clearState();
        }
    }
    async function createHubConnection() {
        const connection = new HubConnectionBuilder().withUrl('https://localhost:7036/signal').withAutomaticReconnect().build();
        try {
            await connection.start();
            return connection;
        }
        catch (e) {
            showError(e);
            return null;
        }
    }
    
    const connect = async () => {
        let connection;
        if (!hub) {
            connection = await createHubConnection();
            setHub(connection);
        }
        else {
            connection = hub;
        }
        if (!connection) {
            setMessages([...messages, 'No connection to signal server']);
            return;
        }
        connection.on("on_connected", msg => setUser({ ...user, ConnectionID: msg }));
        let peerConn = new RTCPeerConnection(servers);
        let data = await peerConn.createDataChannel("chat");
        data.onopen = () => {
            setMessages(messages => [...messages, `Channel state: open`]);
                setIsConnected(true);
        };
        data.onclose = () => {
            setMessages(messages => [...messages, `Channel state: close`]);
            setIsConnected(false);
        };
        peerConn.onicecandidate = event => {
            if (event.candidate) {
                setMessages(messages => [...messages, 'Send ICE candidate']);
                connection.invoke("SendSignal", JSON.stringify(event.candidate));
            }
        };
        peerConn.ondatachannel = e => {
            let ch = e.channel;
            ch.onmessage = (e) => setMessages(messages => [...messages, e.data]);
            ch.onopen = () => {
                setMessages(messages => [...messages, `Channel state: open`]);
                setIsConnected(true);
            };
            ch.onclose = () => {
                setMessages(messages => [...messages, `Channel state: close`]);
                setIsConnected(false);
            };
            setDataChannel(ch);
        };
        data.onmessage = (e) => setMessages(messages => [...messages, e.data]);
        connection.on("on_user_add", async msg => {
            const offer = await peerConn.createOffer();
            await peerConn.setLocalDescription(offer);
            setMessages(messages => [...messages, 'Send SDP offer']);
            connection.invoke("SendSignal", JSON.stringify(offer)).catch(e => showError(e));
        });
        connection.on("on_signal", async signal => {
            var obj = JSON.parse(signal);
            if (obj.sdp) {
                if (obj.type === "offer") {
                    await peerConn.setRemoteDescription(obj);
                    var answer = await peerConn.createAnswer();
                    await peerConn.setLocalDescription(answer);
                    setMessages(messages => [...messages, 'Send SDP answer']);
                    connection.invoke("SendSignal", JSON.stringify(answer)).catch(e => showError(e));
                }
                else if (obj.type === "answer") {
                    peerConn.setRemoteDescription(obj);
                }
            }
            else if (obj.candidate) {
                peerConn.addIceCandidate(obj).catch(e => showError(e));
            }
        });
        try {
            await connection.invoke("NewUser", JSON.stringify(user));
            setMessages([...messages, 'Connection to signal server established']);
        } catch (e) {
            showError(e);
            setMessages([...messages, 'Connection to signal server failed']);
        }
        setDataChannel(data);
        setPeerConnection(peerConn);
    }
    const disconnect = () => {
        dataChannel.close();
        clearState();
        setIsConnected(false);
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
        let msg = localStorage.getItem("messages");
        localStorage.setItem('msg', msg + '\n' + e.data);
        setMessages([...messages, e.data]);
    }
    function clearState() {
        setPeerConnection(null);
        setDataChannel(null);
    }
    async function sendOffer(){
        //trace('sendOffer');
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
            <ChatControls onSend={send} onConnect={connect} text={text} onTextChanged={textChanged} isConnect={isConnected} onDisconnect={ disconnect} />
        </div>
    );
    
}

export default App;