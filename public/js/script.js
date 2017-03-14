var socket = io();

$(document).ready(function() {
	/* mouse stuff */

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

	/* mouse happenings */

	// Player

    var Player = function(id) {
        this.id = id;
        this.x  = 0;
        this.y  = 0;
        this.name = '';
        this.init();
    };
    
    Player.prototype = function(){
        var init = function(){
            bind.call(this);
        },
        bind = function(){
            $(document).on( 'mousemove', {PlayerObj:this},(function(event) {
                var player = event.data.PlayerObj;
                player.x = ((event.pageX / $(window).width()) * 100).toFixed(2);
                player.y = ((event.pageY / $(window).height()) * 100).toFixed(2);
                socket.emit('move',{ friend: player.id, friendX: player.x, friendY: player.y});
            }));
        };
        return {
            init: init
        };
    }();

    // Friends

    var Friends  = function() {
        this.friends = {};
    };

    Friends.prototype = function(){
        var add = function(friend) {
                var label = doLabel.call(this,friend.id);
                this.friends[label] = friend;
            },
            remove = function(id){
                var label = doLabel.call(this,id);
                if ( this.friends[label] ) {
                    this.friends[label].remove();
                    delete(this.friends[label]);
                }
            },
            update = function(data) {
                var label = doLabel.call(this,data.friend);
                if ( this.friends[label] ) {
                    this.friends[label].update(data.friendX,data.friendY);
                }
            },
            doLabel = function(id){
                return 'friend-'+id;
            };
        return {
            add: add,
            remove: remove,
            update: update
        };
    }();

    // Friend

    var Friend = function(id) {
        this.id = id;
        this.x  = 0;
        this.y  = 0;
        this.dx = 0;
        this.dy = 0;
        this.idx = 'friend-'+id;
        this.name = '';
        this.element = false;
        this.init();
    };

    Friend.prototype = function(){
        var init = function() {
            if  ( check.call(this) === true ) {
                return false;
            }
        },
        create = function() {
            this.element = $('<div/>').attr('id',this.idx).addClass('friend').hide().appendTo('body').fadeIn();
        },
        remove = function() {
            if ( this.element ){
                this.element.fadeOut('200',function(){
                    $(this).remove();
                });
            }
        },
        check = function(){
            if ( $('#'+this.idx).length > 0 ) {
                return true;
            }
            create.call(this);
            return false;
        },
        update = function(x,y) {
            this.element.css({'left':x+'%','top':y+'%'});
        };
        return {
            init: init,
            remove: remove,
            update: update
        };
    }();

    // Functions

    var Meeting = function(socket) {
        this.player = false;
        this.friends = new Friends();
        this.init();
    };
    
    Meeting.prototype = function(){
        var init = function(){
                bind.call(this);
            },
            bind = function(){
                var self = this;

                // Initalize connected
                socket.on('connected', function (totalUsers) {
                    updateTotalConnections(totalUsers);
                });

                // Create player and friends
                socket.on('init', function (data) {
                    $.each(data.friends,function(index,item){
                        createFriend.call(self,item,data.player);
                    });
                    self.player = new Player(data.player);
                });

                // New friend
                socket.on('new friend', function (id) {
                    createFriend.call(self, id);
                });

                // Friend gonne
                socket.on('bye friend', function (data) {
                    updateTotalConnections(data.connections);
	                console.log(data.connections);
                    removeFriend.call(self,data.friend);
                });

                // Friend move
                socket.on('move', function (data) {
                    self.friends.update(data);
                });

            },
            createFriend = function(id,player){
                if ( player && player == id ) {
                    return;
                }
                var friend = new Friend(id);
                if (friend) {
                    this.friends.add(friend);
                }
            },
            removeFriend = function(id) {
                this.friends.remove(id);
            },
            updateTotalConnections = function(total){
                $('#connections').html(total);
            };
        return {
            init: init
        };
    }();

    var app = new Meeting(socket);
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