// socketService.js
let ioInstance = null;
const onlineUsers = {};

const setIo = (io) => {
  ioInstance = io;
};

const getIo = () => ioInstance;

export { setIo, getIo, onlineUsers };
