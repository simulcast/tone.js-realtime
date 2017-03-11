var socket = io();

$(document).ready(function() {
	$("#container").hide(); //hide container
	var sounds = []; // array of sounds
	
	//pass in the audio context
	var context = new AudioContext();

	//on iOS, the context will be started on the first valid user action the .box class
	StartAudioContext(Tone.context, '.box').then(function(){
	    console.log('up and running');
	})

    /* recorder js! */

    $("#record").clicktoggle(function() {
        console.dir(Tone.Master);
        rec = new Recorder(Tone.Master, {
            callback: function(e){
                console.log('this line hit');
                rec.clear();
                Recorder.forceDownload(e, "recording.wav");
            }
        });
        rec.record();
        $(this).html('download');
    }, function() {
        console.log('stop clicked');
        rec.stop();
        rec.exportWAV();
        $(this).html('record');
    });

	//tone.js transport and sound loading
	Tone.Transport.bpm.value = 127;
	Tone.Transport.start();

	var bmore = new Tone.Player({
		"url": "../sound/bmore.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(bmore);

	var corvette = new Tone.Player({
		"url": "../sound/corvette.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(corvette); //put object at the end of the sounds array

	var harps = new Tone.Player({
		"url": "../sound/harps.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(harps);

	var mac = new Tone.Player({
		"url": "../sound/mac.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(mac);

	var ny = new Tone.Player({
		"url": "../sound/ny.wav",
		"autostart": false,
		"loop": false
	}).toMaster();
	sounds.push(ny);

	/* called when all buffers have loaded
	sends a request to server for a list of which sound files to play at startup */
	Tone.Buffer.on('load', function(){
	    console.log('all buffers are loaded.');
	    socket.emit('initialize');
	    $("#container").show();
	    $("#loading").hide();
	});
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


/* homebrew clicktoggle */

$.fn.clicktoggle = function(a, b) {
    return this.each(function() {
        var clicked = false;
        $(this).click(function() {
            if (clicked) {
                clicked = false;
                return b.apply(this, arguments);
            }
            clicked = true;
            return a.apply(this, arguments);
        });
    });
};