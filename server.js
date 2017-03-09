/* where i need to go from here:
- have server store state of program, so that when you log on everything gets called up correctly (opacity states etc) / starts on beat
- blinking before sound is played / stopped but hasn't yet executed?
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

var togglestate = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,];

io.on('connection', function(socket){
	/* takes in number and sends it to appropriate soundfile */
	socket.on('playtoggle', function(number) {
		if (togglestate[number] == 0) {
	  	console.log('play ' + number);
	  	io.emit('play', number);
			togglestate[number]++;
		}
		else if (togglestate[number] == 1) {
			console.log('stop '  + number);
			io.emit('stop', number);
			togglestate[number] = 0;
		};
	});

  socket.on('disconnect', function(){
	console.log('user disconnected');
  });
});

app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});