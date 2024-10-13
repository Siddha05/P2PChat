import React from 'react';
import propTypes from 'prop-types';

function ChatControls({ text, onTextChanged, onSend, onConnect, isConnect, onDisconnect}) {
  return (
      <div style={{
          display: 'grid',
          gap: '6px',
          gridTemplateColumns: '300px auto auto auto',
          marginTop: '10px'
      }}>
          <input type='text' value={text} onChange={e => onTextChanged(e.target.value)} style={{gridColumn: '1', borderRadius: '5px'} }/>
          <button disabled={!text} onClick={onSend} style={{gridColumn: '2', width: '120px'} }>Send</button>
          <button disabled={isConnect} onClick={onConnect} style={{gridColumn: '3', width: '120px'} }>Connect</button>
          <button disabled={!isConnect} onClick={ onDisconnect} style={{ gridColumn: '4', width: '120px' }}>Disconnect</button>

      </div>
  );
}

ChatControls.propTypes = { onSend: propTypes.func, onConnect: propTypes.func, text: propTypes.string, onTextChanged: propTypes.func, isConnect: propTypes.bool, onDisconnect: propTypes.func}

export default ChatControls;