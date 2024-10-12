import React from 'react';
import propTypes from 'prop-types';

function MessageList({ messages }) {
    const list = messages.map((m, i) => (<li key={i}>{m}</li>));
    return (
        <div style={{ maxHeight: '300px', borderRadius: '5px', textAlign: 'left', fontSize: '14px', height: '300px', backgroundColor: '#fafafa', overflow: 'auto' }}>
            <ul style={{listStyleType: 'none'}}>
          {list}
        </ul>
      </div>
     
  );
}

MessageList.propTypes = { messages: propTypes.array };

export default MessageList;