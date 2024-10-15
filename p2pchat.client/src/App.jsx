import { HubConnectionBuilder } from '@microsoft/signalr';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import ChatControls from './ChatControls.jsx';
import MessageList from './MessageList.jsx';
import ChatHeader from './ChatHeader';

function App() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [hub, setHub] = useState(null);
    const [peerConnection, setPeerConnection] = useState();
    const [user, setUser] = useState({ Name: 'Apollo' });
    const [isConnecting, setIsConnecting] = useState(false);
    const [dataChannel, setDataChannel] = useState();
    const fileBuffer = useRef([]);
    const received_size = useRef(0);
    const downloading_file = useRef(null);
    const header_size = useRef(0);

    const servers = {
        iceServers: [
            { url: 'stun:stun.l.google.com:19302' }
        ]
    };
    
    const send = () => {
        let msg = `${user.Name} --> ${text}`;
        setMessages([...messages, msg]);
        dataChannel.send(msg);
        setText("");
    }
    const sendFile = (fileinput) => {
        let file = fileinput.current.files[0];
        if (!file) return;
        //first create and send header with metadata
        const chunkSize = 16384;
        const int32Size = 4;
        let encode_str = new TextEncoder().encode(file.name);
        let header = new ArrayBuffer(encode_str.byteLength + int32Size);
        let view = new DataView(header);
        view.setInt32(0, file.size);
        for (var i = 0; i < encode_str.byteLength; i++) {
            view.setInt8(i +int32Size, encode_str[i]);
        }
        dataChannel.send(header);
        console.log(`Sending downloading_file: ${[file.name, file.size, file.type].join(' ')}`);
        setMessages(messages => [...messages, `Start downloading file ${file.name} (${file.size} B)`]);
        let reader = new FileReader();
        let offset = 0;
        reader.addEventListener('load', e => {
            dataChannel.send(e.target.result);
            offset += e.target.result.byteLength;
            if (offset < file.size) {
                readSlice(offset);
            }
        });
        const readSlice = o => {
            const slice = file.slice(offset, o + chunkSize);
            reader.readAsArrayBuffer(slice);
        };
        readSlice(0);
        setMessages(messages => [...messages, `Download compleated`]);
    };
    
    const trace = (name) => {
        console.log(`${name} hub`, hub);
        console.log(`${name} peer`, peerConnection);

    }
    
    const handleOnMessage = e => {
        if (typeof e.data === 'object') {
            if (received_size.current === 0) {
                //this is header with file description
                let view = new DataView(e.data);
                let size = view.getInt32(0);
                var decoder = new TextDecoder("utf-8");
                view = new DataView(e.data, 4);
                let filename = decoder.decode(view);
                console.log("Start downloading file ", `${filename} ${size} B`);
                received_size.current += e.data.byteLength;
                header_size.current = e.data.byteLength;
                downloading_file.current = { Name: filename, Size: size };
                setMessages(messages => [...messages, `Start downloading file ${downloading_file.current.Name} (${downloading_file.current.Size} B)`]);
            }
            else {
                
                received_size.current += e.data.byteLength;
                console.log("Download chunk", `Current ${e.data.byteLength} Total ${received_size.current}`);
                if (received_size.current >= downloading_file.current.Size) {
                    setMessages(messages => [...messages, `Download compleated`]);
                    //here handle fileBuffer
                    downloading_file.current = 0;
                    received_size.current = 0;
                    fileBuffer.current = [];
                }
                else {
                    fileBuffer.current.push(e.data);
                }
            }
            return;
        }
        setMessages(messages => [...messages, e.data]);
    }
    async function createHubConnection() {
        const connection = new HubConnectionBuilder().withUrl('https://localhost:7036/signal').withAutomaticReconnect().build();
        try {
            await connection.start();
            return connection;
        }
        catch (e) {
            logError(e);
            return null;
        }
    }
    
    const connect = async () => {
        setIsConnecting(isConnecting => !isConnecting);
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
                setIsConnected(true);
        };
        data.onclose = () => {
            setIsConnected(false);
        };
        peerConn.onicecandidate = event => {
            if (event.candidate) {
                connection.invoke("SendSignal", JSON.stringify(event.candidate));
            }
        };
        peerConn.ondatachannel = e => {
            let ch = e.channel;
            ch.onmessage = (e) => handleOnMessage(e);
            ch.onopen = () => {
                setIsConnected(true);
            };
            ch.onclose = () => {
                setIsConnected(false);
            };
            setDataChannel(ch);
        };
        data.onmessage = (e) => handleOnMessage(e);
        connection.on("on_user_add", async msg => {
            console.log("New user added", msg);
        });
        connection.on("on_signal", async signal => {
            if (isConnected) return;
            var obj = JSON.parse(signal);
            if (obj.sdp) {
                if (obj.type === "offer") {
                    await peerConn.setRemoteDescription(obj);
                    var answer = await peerConn.createAnswer();
                    await peerConn.setLocalDescription(answer);
                    connection.invoke("SendSignal", JSON.stringify(answer)).catch(e => logError(e));
                }
                else if (obj.type === "answer") {
                    await peerConn.setRemoteDescription(obj);
                }
            }
            else if (obj.candidate) {
                peerConn.addIceCandidate(obj).catch(e => logError(e));
            }
        });
       
        try {
            await connection.invoke("NewUser", JSON.stringify(user));
        } catch (e) {
                logError(e);
                setMessages([...messages, 'Connection to signal server failed']);
        }
        const offer = await peerConn.createOffer();
        await peerConn.setLocalDescription(offer);
        connection.invoke("SendSignal", JSON.stringify(offer)).catch(e => logError(e));
        setDataChannel(data);
        setPeerConnection(peerConn);
        setIsConnecting(isConnecting => !isConnecting);
    }
    const disconnect = () => {
        dataChannel.close();
        clearState();
        setIsConnected(false);
    }  
    const logError = (e) => console.log(e);

    const textChanged = (val) => {
        setText(val);
    }
    function clearState() {
        setPeerConnection(null);
        setDataChannel(null);
    }

    return (
        <div>
            <h2>P2P Chat</h2>
            <ChatHeader user={user} setUser={setUser} isConnected={ isConnected} />
            <MessageList key='mgs' messages={messages} />
            <ChatControls onSend={send} onConnect={connect} text={text} onTextChanged={textChanged} isConnect={isConnected} isConnecting={isConnecting}
                onDisconnect={disconnect} onSendFile={sendFile} />
        </div>
    );
    
}

export default App;