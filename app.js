const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const Docker = require('dockerode');
const docker = new Docker({socketPath: '/var/run/docker.sock'});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('User Connected');
  const intervalId = setInterval(async () => {
    let stats = await getAllContainerStats();
    socket.emit('update', JSON.stringify(stats));
  }, 2000); // Update every 2 seconds

  socket.on('disconnect', () => {
    console.log('User Disconnected');
    clearInterval(intervalId);
  });
});

async function getAllContainerStats() {
  let containers = await docker.listContainers();
  return Promise.all(containers.map(container => {
    let dockerContainer = docker.getContainer(container.Id);
    return new Promise((resolve, reject) => {
      dockerContainer.stats({stream: false}, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }));
}

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
