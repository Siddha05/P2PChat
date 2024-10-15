import React from 'react';
import propTypes from 'prop-types';

function ChatHeader({ user, setUser, isConnected}) {
  return (
      <div style={{ display: 'grid', margin: '0.5rem', fontSize: '20px', gridTemplateColumns: "auto auto 1fr", gap: '6px', justifyItems: 'start' }}>
          <label style={{gridColumn: '1' ,justifySelf: 'start'}} htmlFor="name">You name:</label>
          <input type="input" style={{gridColumn: '2', justifyItems: 'start'}} value={user.Name} id="name" onChange={e => setUser({ ...user, Name: e.target.value })} />
          <span style={{justifySelf: 'end', gridColumn: '3', color: isConnected ? "greenyellow" : "red"} } >{isConnected ? "connected" : "disconnected"}</span>
      </div>
  );
}

ChatHeader.propTypes = { setUser: propTypes.func, isConnected: propTypes.bool, user: propTypes.object }

export default ChatHeader;