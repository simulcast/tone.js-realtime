var socket = io();

$(document).ready(function() {
	$("#container").hide(); //hide container on load so it can show when buffered
	$("#startprompt").hide();
	/* hide recorder div on mobile */
	if (isMobile.any == true) {
		$("#record").hide();
	};

	/* start prompt for mobile */
	$("#startprompt").click(function() {
		$("#startprompt").hide();
		$("#container").show();
	});

	//pass in the audio context
	var context = new AudioContext();

	//on iOS, the context will be started on the first valid user action the .box class
	StartAudioContext(Tone.context, '#startprompt').then(function(){
	    //console.log('up and running');
	})

    /* recorder js! */

    $("#record").clicktoggle(function() {
        console.dir(Tone.Master);
        rec = new Recorder(Tone.Master, {
            callback: function(e){
                console.log('this line hit');
                rec.clear();
                Recorder.forceDownload(e, "gridbud_recording.wav");
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

	/* multiplayer with sounds loaded in as array of paths to files
	accessible by sounds.command(number);
	*/
	var sounds = [];
	var frozen = [];
	var files = new Tone.Buffers([
		"../../sound/bmore.mp3",
		"../sound/corvette.mp3",
		"../sound/harps.mp3",
		"../sound/mac.mp3",
		"../sound/ny.mp3",
		"../sound/lips.mp3",
		"../sound/losecontrol.mp3",
		"../sound/fergie.mp3",
		"../sound/hwwambo.mp3",
		"../sound/chance.mp3",
		"../sound/pool.mp3",
		"../sound/kendrick.mp3",
		"../sound/milkshake.mp3",
		"../sound/snoop.mp3",
		"../../sound/kkb.mp3",
		"../sound/hella.mp3"
	], function() { // fill sounds[] array with players after all buffers are loaded
		console.log('all buffers loaded');
		for (i = 0; i < 16; i++) {
				sounds[i] = new Tone.Player({
					"url" : files.get(i),
					"loop" : true
				}).toMaster();
				//sounds[i].buffer = files.get("bmore");
				//console.log(sounds[i]);
				frozen[i] = false;
			};
	});

	/* start tranposrt helper so that it only occurs once */

	var startTransport = function(){
		startTransport = function(){}; // kill it as soon as it was called
		//tone.js transport
		Tone.Transport.bpm.value = 127;
		Tone.Transport.start();
		console.log('transport started');
		socket.emit('initialize');
	};

	/* called on regular interval from server, but only starts the transport once
	this syncronizes all the windows to roughly the same downbeat for smoother collaboration
	starts transport */
	
	socket.on('beat', function() {
		//sconsole.log(buffers.loaded);
		if (files.loaded == true) {
			startTransport(); // start the transport only when the buffers have loaded
		}
	});

	/* received after sending init request to server
	if the transport has already started, show/hide the right windows on downbeat
	on mobile, ask user to click for start */

	socket.on('show_board', function() {
		if (Tone.Transport.state == 'started' && isMobile.any == true) { //hide loading, show prompt on mobile
			console.log('tranposrt has already started, showing board on user prompt');
			$("#loading").hide();
			$("#startprompt").show();
		}
		else if (Tone.Transport.state == 'started' && isMobile.any == false) {
			console.log('tranposrt has already started, showing board on downbeat');
			Tone.Draw.schedule(function() { //hide loading, show board on desktop
				$("#loading").hide();
				$("#container").show();
			}, "@1n");
		}
		else if (Tone.Transport.state == 'stopped') {
			console.log('tranposrt has not started yet, cannot show board');
		}
	});

	/* takes in clicks and emits the id of the box clicked */
	$(".box").each(function(index) {
	    $(this).on("click", function(){
	    	//takes the last number of box__ and sends it through socket.io
	        var id = $(this).attr('id').substring(3);
	        //console.log(sounds[id].state);
	        if (sounds[id].state == "started") { // if it's playing, send a stop command
	        	console.log(id + ' clicked, telling server to stop it');
	        	socket.emit('stop', id);
	        	//return;
	        }
	        else if (sounds[id].state == "stopped") {// if it's stopped, send a play command
	        	console.log(id + ' clicked, telling server to play it');
	        	socket.emit('play', id);
	        	//return;
	        }
			//socket.emit('playtoggle', id)
			//console.log(sounds.buffers.get(id)._buffer.state);
	    });
	});

	/* takes in signal to play and plays the corresponding sound file */
	socket.on('play', function(number){
        if (frozen[number] == true) {
        	console.log(number + "is frozen");
        	return; 
        }
    	else if (sounds[number].state == "stopped") { // if it's stopped, do the following...
    		console.log(number + " is stopped, pinged by server to play on downbeat");
			$("#box" + number).removeClass("stopped");
			$("#box" + number).addClass("about-to-play"); // change color to "about-to-play"
    		frozen[number] = true;
			Tone.Draw.schedule(function(){
				$("#box" + number).removeClass("about-to-play");
				$("#box" + number).addClass("playing");  // change color to "playing"
				frozen[number] = false;
				console.log(number + " playing");
			}, "@1n");
			sounds[number].start("@1n"); // play it on beat
    	}
	});

	/* takes in signal to stop and stops the corresponding sound file */
	socket.on('stop', function(number){
		/* if it's playing, stop it on downbeat */
		if (sounds[number].state = "playing") {
			console.log(number + " is playing, pinged by stop to play on downbeat");
			$("#box" + number).removeClass("playing");
			$("#box" + number).addClass("stopped"); // change color to "about-to-stop"
			sounds[number].stop(); // stop it on beat
		};
	});

	/* mouse happenings, only do on desktop */
	if (isMobile.any == false) {
		var colorID = randomColor({
		   luminosity: 'light'
	});
	socket.emit('mouse_connected', colorID, isMobile.any);

		$('body').on('mousemove', function() {
			var position = {
				x: ((event.pageX / $(window).width()) * 100).toFixed(2),
				y: ((event.pageY / $(window).height()) * 100).toFixed(2)
			}
			//console.log(position.x);
			socket.emit('mouse_moving', position);
		});
	};

	socket.on('initialize_mice', function(mice){
		for (i = 0; i < mice.length; i++) {
			console.log(mice[i].id);
			var id = mice[i].id;
			var color = mice[i].color;
			$('body').append('<div class="cursor" id="'+id+'"></div>');
			$('#'+id).css('backgroundColor', color);
		}
	});

	socket.on('add_mouse', function(mice, id){
			for (i = 0; i < mice.length; i++) {
				//console.log(mice[i].id);
				if (mice[i].id == id) {
					var id = mice[i].id;
					var color = mice[i].color;
					$('body').append('<div class="cursor" id="'+id+'"></div>');
					$('#'+id).css('backgroundColor', color);
				}
			}
	})    	
	socket.on('disconnect_mouse', function(id){
		//console.log('disconnect at ' + id);
		$('#'+id).remove();
	});

	socket.on('animate_cursor', function(position, id){
		//console.log('animating id ' + id + 'at ' + position);
		$('#'+id).css('top', position.y+'%');
		$('#'+id).css('left', position.x+'%');
	});
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