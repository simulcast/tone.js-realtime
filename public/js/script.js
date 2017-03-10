var socket = io();

$(document).ready(function() {
	var sounds = []
	//pass in the audio context
	var context = new AudioContext();

	//on iOS, the context will be started on the first valid user action on the #playButton element
	StartAudioContext(context, "#container")
	StartAudioContext(Tone.context).then(function(){
	    console.log('up and running');
	})

	//tone.js transport and sound loading
	Tone.Transport.bpm.value = 127;
	Tone.Transport.start();

	var bmore = new Tone.Player({
		"url": "../sound/bmore.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(bmore);

	var beep = new Tone.Player({
		"url": "../sound/beep.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(beep); //put object at the end of the sounds array

	var boop = new Tone.Player({
		"url": "../sound/boop.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(boop); //put object at the end of the sounds array

	console.log(sounds);

	/* takes in clicks and emits the id of the box clicked */

	$(".box").each(function(index) {
	    $(this).on("click", function(){
	    	//takes the last number of box__ and sends it through socket.io
	        var id = $(this).attr('id').substring(3);
	        console.log(id); 
			socket.emit('playtoggle', id)
	    });
	});
	/* takes in signal to play and plays the corresponding sound file */
	socket.on('play', function(number){
		sounds[number].start("@1n");
		sounds[number].loop = true;
		$("#box" + number).css('opacity', '0.5');
	});

	/* takes in signal to stop and stops the corresponding sound file */
	socket.on('stop', function(number){
	  	sounds[number].stop("@1n");
	  	sounds[number].loop = false;
		$("#box" + number).css('opacity', '1.0');
	});

	/* beat counter for log file */
	var loop = new Tone.Loop(function(time){
	   console.log('beat #');
	}, "4n");

	//loop between the first and fourth measures of the Transport's timeline
	loop.start();
});