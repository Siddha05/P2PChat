import { useRef, useState} from 'react';
import propTypes from 'prop-types';

function ChatControls({ text, onTextChanged, onSend, onConnect, isConnect, isConnecting, onDisconnect, onSendFile}) {
    //const [file, setFile] = useState(null);
    const file_input = useRef(null);

    //const handleOnFileSelect = (e) => {
    //    if (e.files[0]) {
    //        setFile(e.files[0]);
    //    }
    //    else {
    //        setFile(null);
    //    }
    //}

    return (
      <div style={{
          display: 'grid',
          gap: '6px',
          gridTemplateColumns: '300px auto auto auto',
          gridTemplateRows: 'auto, auto',
          marginTop: '10px'
      }}>
            <input type='text' value={text} onChange={e => onTextChanged(e.target.value)} style={{gridColumn: '1', borderRadius: '5px'} }/>
            <button disabled={(text && isConnect) ? false : true} onClick={onSend} style={{gridColumn: '2', width: '120px'} }>Send</button>
            <button disabled={isConnect && !isConnecting} onClick={onConnect} style={{gridColumn: '3', width: '120px'} }>Connect</button>
            <button disabled={!isConnect} onClick={ onDisconnect} style={{ gridColumn: '4', width: '120px' }}>Disconnect</button>
            <input ref={file_input}  style={{ gridColumn: "1", gridRow: '2', alignSelf: 'center' }} type='file'></input>
            <button disabled={!isConnect} onClick={e => onSendFile(file_input)} style={{ gridColumn: '2', gridRow: '2', width: '120px' }}>Send file</button>
      </div>
  );
}

ChatControls.propTypes = {
    onSend: propTypes.func,
    onConnect: propTypes.func,
    text: propTypes.string,
    onTextChanged: propTypes.func,
    isConnect: propTypes.bool,
    isConnecting: propTypes.bool,
    onDisconnect: propTypes.func,
    onSendFile: propTypes.func
}

export default ChatControls;