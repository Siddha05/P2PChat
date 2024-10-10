import React from 'react';
import propTypes from 'prop-types';

function ChatControls({ text, onTextChanged, onSend, onConnect}) {
  return (
      <div style={{
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: '300px auto auto',
          marginTop: '10px'
      }}>
          <input type='text' value={text} onChange={e => onTextChanged(e.target.value)} style={{gridColumn: '1', borderRadius: '5px'} }/>
          <button disabled={!text} onClick={onSend} style={{gridColumn: '2', width: '100px'} }>Send</button>
          <button onClick={onConnect} style={{gridColumn: '3', width: '100px'} }>Connect</button>

      </div>
  );
}

ChatControls.propTypes = { onSend: propTypes.func, onConnect: propTypes.func, text: propTypes.string, onTextChanged: propTypes.func}

export default ChatControls;