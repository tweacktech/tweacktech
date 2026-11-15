import Pusher from 'pusher-js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const KEY = process.env.REACT_APP_PUSHER_KEY;
const CLUSTER = process.env.REACT_APP_PUSHER_CLUSTER || 'eu';
const TOKEN_KEY = 'tweacktech-token';

let client = null;

/**
 * Lazily creates a single Pusher connection for the tab.
 * Private channels are authorised through /api/pusher/auth with the current
 * JWT read from storage, so refreshed tokens work without recreating the socket.
 */
export const getPusher = () => {
  if (!KEY) return null;
  if (client) {
    if (client.connection.state === 'disconnected') client.connect();
    return client;
  }

  client = new Pusher(KEY, {
    cluster: CLUSTER,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    channelAuthorization: {
      transport: 'ajax',
      endpoint: `${API_URL}/pusher/auth`,
      headersProvider: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    },
  });

  return client;
};

export const disconnectPusher = () => {
  if (client) client.disconnect();
};

export const pusherEnabled = Boolean(KEY);
