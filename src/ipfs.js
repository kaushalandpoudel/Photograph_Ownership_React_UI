import IPFS from 'ipfs';
const options = {
    EXPERIMENTAL: {
      pubsub: true
    },
    repo: 'ipfs-' + Math.random(),
    config: {
      Addresses: {
        Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
      }
    }
};

const ipfs = new IPFS();

export default ipfs;