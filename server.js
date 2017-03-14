/* where i need to go from here:
- blinking before sound is played / stopped but hasn't yet executed?
- remove download button on mobile
- make mouse stuff look nicer: colors
*/

var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static('public'));

/* initializing mice array */

var mice = [];

/* initializing togglestate array */

var numberOfSounds = 16;
var togglestate = [];
for (i = 0; i < numberOfSounds; i++) {
  togglestate.push(0);
}

io.on('connection', function(socket){
  //wraps user ID in an object for transmission
  var userID = socket.id;

  /* MOUSE
  on connection, send command to clients to create established elements in their windows
  add user's mouse to array and assign it id and color
  broadcast new mouse to everybody but the user
  
  on move event, take mouse position and send it back out attached to an id
  */
  io.to(socket.id).emit('initialize_mice', mice);
  mice.push({id: socket.id, color: getRandomColor()});
  socket.broadcast.emit('add_mouse', mice, userID);

  socket.on('mouse_moving', function(position) {
    //console.log(position);
    io.emit('animate_cursor', position, userID);
  })
  //console.log(mice);

  /* SOUNDS
  on connection, tell user which sounds are already playing
  1) wait for initialization request, which comes after all buffers are loaded
  2) loop through togglestate array
  3) if a sound is flagged as playing (togglestate[i] == 1), emit the play flag
   */
  console.log('a user connected ' + socket.id);

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
  	
    console.log('user disconnected ' + socket.id);
    /* remove mouse from array so it wont be initialized anymore */
    for (i = 0; i < mice.length; i++) {
      if(mice[i].id == userID){
        console.log('mouse removed');
        mice.splice(i, 1);
        break;
      };
    };
    /* send a disconnect signal to remove it from users windows */
    io.emit('disconnect_mouse', userID);
  });
});

app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});

/* functions and helpers */

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}