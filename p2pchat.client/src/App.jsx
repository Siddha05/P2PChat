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
    const [userName, setUserName] = useState('Apollo');

    const RTCconfig = {
        iceServers: [
            { url: 'stun:stun.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        setMessages(["Connecting to server..."]);
        const connection = new HubConnectionBuilder().withUrl('https://localhost:7036/signal').withAutomaticReconnect().build();
        connection.start().then(result => {
            setHub(connection);
            console.log('Connection established');
            connection.on("on_user_add", msg => {
                console.log("New user added", msg);
            });
            connection.on("on_signal", msg => {
                console.log("Got Signal", msg);
            });
            connection.on("on_ready", msg => {
                console.log("Ready to connect");
            });
        })
            .catch(e => console.log('Connection failed: ', e));
    }, []);

    const send = () => {
        setMessages([...messages, text]);
        setText("");
    }
    const connect = () => {
        hub.invoke("NewUser", userName);
        let peerConn = new RTCPeerConnection(RTCconfig);
        peerConn.onicecandidate = event => {
            if (event.candidate) {
                hub.invoke("SendSignal", event.candidate);
            }
        }
        setPeerConnection(peerConn);
    }

    const textChanged = (val) => {
        setText(val);
    }

    const createOffer = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        hub.invoke("S")
    }
   
    return (
        <div>
            <h1>P2P Chat</h1>
            <div style={{display: 'flex', margin: '0.5rem', fontSize: '20px'}}>
                <label htmlFor="name">You name:</label>
                <input type="input" value= {userName} id="name" onChange={e => setUserName(e.target.value)} style={{marginLeft: '10px'}} />
            </div>
            <MessageList messages={messages} />
            <ChatControls onSend={send} onConnect={connect} text={text} onTextChanged={textChanged} isConnect={ isConnect} />
        </div>
    );
    
}

export default App;