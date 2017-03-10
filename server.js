/* where i need to go from here:
- blinking before sound is played / stopped but hasn't yet executed?
- don't let user do anything til all sounds are loaded
- make mouse stuff look nicer
- theme recording things
*/

var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static('public')); 
var totalUsers = 0,
    stepID = 0,
    friendsGroup = [];

io.sockets.on('connection', function (socket) {
  // new id
  var thisID = getID();
  // step users++
  addUser();
  // new connection ALL
  io.sockets.emit('connected', { connections: totalUsers });
  // new connection friends
  socket.broadcast.emit('new friend', { friend: thisID  });
  // new connection self
  socket.emit('init',{ player:thisID, friends: friendsGroup });
  // disconnect friends
  socket.on('disconnect', function (){
      removeUser(thisID);
      socket.broadcast.emit('bye friend',{connections:totalUsers, friend: thisID});
  });
  // mouse move
  socket.on('move',function(data){
      socket.broadcast.emit('move', data);
  });
  //console.log(friendsGroup);
});

// Functions

function getID() {
    friendsGroup.push(++stepID);
    return stepID;
}

function addUser(){
    totalUsers++;
}

function removeUser(thisID){
    friendsGroup = removeFromArray(thisID,friendsGroup);
    totalUsers--;
}

// Helpers

function removeFromArray(string, array) {
  var i = 0;
  for(i in array){
    if(array[i] === string){
      array.splice(i,1);
    }
  }
  return array;
}

/* initializing togglestate array */

var numberOfSounds = 16;
var togglestate = [];
for (i = 0; i < numberOfSounds; i++) {
  togglestate.push(0);
}

io.on('connection', function(socket){
  /* on connection, tell user which sounds are already playing
  1) wait for initialization request, which comes after all buffers are loaded
  2) loop through togglestate array
  3) if a sound is flagged as playing (togglestate[i] == 1), emit the play flag
   */
  console.log('a user connected ' + socket.id);
  //wraps user ID in an object for transmission
  var user = {id: socket.id};
  socket.on('initialize', function() {
    console.log('initialize request from ' + socket.id);
    for (i = 0; i < togglestate.length; i++) {
      if (togglestate[i] == 1) {
        console.log('initialized loop ' + i + ' to play');
        // sending to individual socketid (private message)
        io.to(socket.id).emit('play', i);
      };
    };
  });

	/* takes in number of box when a box is clicked and routes it to play corresponding soundfile */
	socket.on('playtoggle', function(number) {
		if (togglestate[number] == 0) { //if it's not playing, play it & increment counter
	  	console.log('loop ' + number + ' set to PLAY');
	  	io.emit('play', number);
			togglestate[number]++;
		}
		else if (togglestate[number] == 1) { //if it is playing, stop it & reset counter
      console.log('loop ' + number + ' set to STOP');
			io.emit('stop', number);
			togglestate[number] = 0;
		};
	});

  socket.on('disconnect', function(){
  	//console.log('user disconnected');
    console.log('user disconnected ' + socket.id);
  });
});

app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});