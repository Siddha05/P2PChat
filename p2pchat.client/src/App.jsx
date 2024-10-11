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
    //const [peerConnection, setPeerConnection] = useState();
    const [userName, setUserName] = useState('Apollo');
    //const [otherUser, setOtherUser] = useState();
    //const [dataChannel, setDataChannel] = useState();

    var dataChannel;
    var peerConnection;
    var otherUser;

    const RTCconfig = {
        iceServers: [
            { url: 'stun:stun.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        //setMessages(["Connecting to server..."]);
        const connection = new HubConnectionBuilder().withUrl('https://localhost:7036/signal').withAutomaticReconnect().build();
        connection.start().then(result => {
            setHub(connection);
            console.log('Connection established');
            //connection.on("on_user_add", msg => {
            //    setOtherUser(msg);
            //    sendOffer();
            //    //peerConnection.createOffer().then(desc => {
            //    //    peerConnection.setLocalDescription(desc);
            //    //    console.log("Local description", desc);
            //    //    hub.invoke("SendSignal", desc, otherUser.ConnectionID);
            //    //    console.log("Ready to connect");
            //    //})
            //});
            //connection.on("on_signal", msg => {
            //    console.log("Got Signal", msg);
            //});
            //connection.on("on_ready", () => {
            //    console.log("Ready to connect");
            //    peerConnection.createOffer().then(desc => {
            //        peerConnection.setLocalDescription(desc);
            //        console.log("Local description", desc);
            //        hub.invoke("SendSignal", desc, otherUser.ConnectionID);
            //        console.log("Ready to connect");
            //    }

            //    );
            //    //const offer = await peerConnection.createOffer();
            //    //await peerConnection.setLocalDescription(offer);
            //    //console.log("Created offer", offer);
            //    //hub.invoke("SendSignal", offer, otherUser.ConnectionID);
            //});
        }).catch(e => console.log('Connection failed: ', e));
    }, []);
    
    function send(){
        //setMessages([...messages, text]);
        //setText("");
        
    }
    function connect(){
        hub.on("on_user_add", onAddUser);
        hub.on("on_signal", onGotSignal);
       
        let peerConn = new RTCPeerConnection(RTCconfig);
        let data = peerConn.createDataChannel("chat");
        peerConn.onicecandidate = event => {
            if (event.candidate) {
                console.log("Got candidate", event.candidate);
                hub.invoke("SendSignal", JSON.stringify(event.candidate), otherUser.ConnectionID);
            }
        }
        data.onopen = channelState;
        data.onclose = channelState;
        data.onmessage = msg => console.log(msg);
        dataChannel =data;
        peerConnection = peerConn;
        hub.invoke("NewUser", userName).then(() => setMessages([...messages, 'Connected to signal server'])).catch(e => ShowError(e));
        
    }
    function ShowError(e) {
        console.log(e);
    }
    function onAddUser(user) {
        console.log("New User", user);
        var u = JSON.parse(user);
        otherUser = u;
        sendOffer(u);
        
    }
    async function onGotSignal(signal) {
        
        var obj = JSON.parse(signal);
        if (obj.type) {
            if (obj.type === "offer") {
                var answer = await peerConnection.createAnswer();
                console.log("Create answer", answer);
                peerConnection.setLocalDescription(answer);
                hub.invoke("SendSignal", JSON.stringify(answer), user.ConnectionID);
            }
        }
    }

    const textChanged = (val) => {
        setText(val);
    }
    function channelState() {
        console.log("Channel state is", dataChannel.readyState);
    }
    async function sendOffer(user) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        hub.invoke("SendSignal", JSON.stringify(offer), user.ConnectionID);
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