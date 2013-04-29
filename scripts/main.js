
/* ---------------------------------------------------------------------------
 * Globals
 * --------------------------------------------------------------------------- */

var peer = new Peer({key: 'uhnhfslw1tikke29', debug: true});
var conn, gameLoop, totalsteps = 0, speed = 0;
var boundry = { 
	x: 19, 
	y: 19 
};
var template = { 
	player: '<div data-id="{id}" data-color="{color}" data-steps="{steps}" class="snake"></div>',
	apple: '<div class="apple"></div>',
};
var player = {
	personal: {
	  id: 0,
	  x: 0,
	  y: 12,
	  direction: 1,
	  len: 1,
	  color: 0
	}, 
	remote: {
	  id: 0,
	  x: 0,
	  y: 12,
	  direction: 1,
	  len: 1,
	  color: 0
	}
};
var apples = [
	{x:4, y:9},
	{x:9, y:3},
	{x:8, y:8},
	{x:15, y:11},
	{x:11, y:7},
	{x:7, y:18},
	{x:0, y:1},
	{x:12, y:12}
];
var currentApple = 0;


/* ---------------------------------------------------------------------------
 * Functions
 * --------------------------------------------------------------------------- */

// Show this peer's ID.
peer.on('open', function(id){

	$('#pid').text(id);
	player.personal.id = id;
	$('#gameId').attr('href', $('#gameId').attr('href') + id);

});

// Main
peer.on('connection', function (connection) {
	connection.on('data', function (data) {

	    // init
	    if (data.rid) {
	      init(player.remote.id = data.rid);
	    } else { 
	      update(data);
	    }

	})
})

// Update Remote Controls
function update (direction) { 
	player.remote.direction = direction;
}

// Update & Send Personal Controls
$(document).on('keydown', function (event) {

	switch (event.which) {
	  case(87):
	    if(player.personal.direction != 3)
	      conn.send(player.personal.direction = 1);
	    break;
	  case(68):
	    if(player.personal.direction != 4)
	      conn.send(player.personal.direction = 2);
	    break;
	  case(83):
	    if(player.personal.direction != 1)
	      conn.send(player.personal.direction = 3);
	    break;
	  case(65):
	    if(player.personal.direction != 2)
	      conn.send(player.personal.direction = 4);
	    break;
	}

});

// Initialize Game
function init (rid) {

	// set player start
	if (rid) {
	  conn = peer.connect(rid);
	  player.personal.x = 5; 
	  player.personal.color = 1;
	  player.remote.x = 12; 
	  player.remote.color = 2;
	} else {
	  player.personal.x = 12; 
	  player.personal.color = 2;
	  player.remote.x = 5; 
	  player.remote.color = 1;
	}

	// append apples
	grid( apples[++currentApple] ).innerHTML = template.apple.supplant();

	// initiate step function
	location.hash = 'main';
	(function animloop() {
	  	gameLoop = requestAnimationFrame(animloop);
	  	if (speed++ > 12)
			step();
	})();

}

// Step Game
function step () {   

	var collision = new Array()
	speed = 0;

	// adjust position
	for(var snake in player) {   

	  switch(player[snake].direction) {

	    case(1): 
	      player[snake].y--;
	      break;
	    case(2): 
	      player[snake].x++;
	      break;
	    case(3):
	      player[snake].y++;
	      break; 
	    case(4):
	      player[snake].x--;
	      break;

	  }

	}

	// append collisions
	for (snake in player) {

	  var space = grid( player[snake] );

	  if (player[snake].x > boundry.x || player[snake].y > boundry.y || player[snake].x < 0 || player[snake].y < 0)
	    collision.push({type: 'wall', player: snake});      

	  else if ( $(space).children('.snake') )
	    collision.push({type: 'snake', player: snake});

	  else if ( $(space).children('.apple') )
	    collision.push({type: 'apple', player: snake});

	}

	if (collision.length) { 

	  for (var i=0; i<collision.length; i++) {

	  	// apple collision
	    if (collision[i].type === 'apple') { 

	      // remove old apple	      
	      $('.apple').remove();
	      grid( apples[currentApple++] ).innerHTML = template.apple.supplant();


	      // stretch the feasting snake
	      player[collision[i].player].len++;
	      player[collision[i].player].steps++;
	      grid( player[collision[i].player] ).innerHTML = template.player.supplant(player[collision[i].player]);

	      for (var snake in player) {

	      	// treat hungry snakes like regular movers & shakers
	        if (player[snake] !== player[collision[i].player]) {

	          $('[data-id="'+player[snake].id+'"][data-steps="'+(totalsteps - player[snake].len)+'"]').remove();
	          player[snake].steps++;
	          grid( player[snake] ).innerHTML = template.player.supplant(player[snake]);

	        }

	      }

	    } else {

	    	// wall & snake collision
	    	dialog('You Lose');
	     	resetEnvironment();

	    }

	  } 

	} else {

	  // regular movement
	  for (var snake in player ) {

	    $('[data-id="'+player[snake].id+'"][data-steps="'+(totalsteps - player[snake].len)+'"]').remove();
	    player[snake].steps++;
	    grid( player[snake] ).innerHTML = template.player.supplant(player[snake]);  


	  }

	}   

	totalsteps++     

}

// On Ready
$(document).ready(function () {

	location.hash = 'main';

	// connect 
	$('#connect').on('click', connect);


	// reset
	$('#dialog .reset').on('click', connect);

	//quit
	$('#dialog .quit').on('click', 
		function() { 
			resetEnvironment();
			location.hash = 'main';
			conn.close(); 
		});

});

// Connect to Peer
function connect () {

	// remote id
	var rid = ( player.remote.id ) ? ( player.remote.id ) : $('#rid').val();

	if (rid) {

	  // connect to peer
	  conn = peer.connect(rid);

	  // on open
	  conn.on('open', function () {

	    location.hash = 'main';
	    conn.send({rid: player.personal.id});
	    player.remote.id = rid;
	    init(0);

	  }); 

	  // on close
	  conn.on('close', function() {
	  	dialog('Your friend has quit the game')
	  });

	}

}


// Reset Enviroment
function resetEnvironment() {

	cancelAnimationFrame(gameLoop);
	totalsteps = 0;
	currentApple = 0;

	$('.snake').remove();
	$('.apple').remove();

	player.personal.y = 12;
	player.personal.direction = 1;
	player.personal.len = 2;
	player.personal.steps = 0;

	player.remote.y = 12;
	player.remote.direction = 1;
	player.remote.len = 2;
	player.remote.steps = 0 ;         

}

// Dialog Box
function dialog(text) {
	$('#dialog article').html(text);
	location.hash = 'dialog';
}

// Grid Selection
function grid(values) {
	return $( $('tr')[values.y] ).children('td')[values.x];
}

// Clean Up
window.onunload = window.onbeforeunload = function (e) {
	if (!!peer && !peer.destroyed) {
	  peer.destroy();
	}
};


/* ---------------------------------------------------------------------------
 * Third Party
 * --------------------------------------------------------------------------- */

// Paul Irish Fill
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// coffeescriptcookbook.com seeded random number generation
var Rand = (function() {

function Rand(seed) {
  this.seed = seed;
  this.multiplier = 1664525;
  this.modulo = 4294967296;
  this.offset = 1013904223;
  if (!((this.seed != null) && (0 <= seed && seed < this.modulo))) {
    this.seed = (new Date().valueOf() * new Date().getMilliseconds()) % this.modulo;
  }
}

Rand.prototype.seed = function(seed) {
  return this.seed = seed;
};

Rand.prototype.randn = function() {
  return this.seed = (this.multiplier * this.seed + this.offset) % this.modulo;
};

Rand.prototype.randf = function() {
  return this.randn() / this.modulo;
};

Rand.prototype.rand = function(n) {
  return Math.floor(this.randf() * n);
};

Rand.prototype.rand2 = function(min, max) {
  return min + this.rand(max - min);
};

return Rand;

})();


// Crockford's Supplant 
String.prototype.supplant = function (o) {
	return this.replace(/{([^{}]*)}/g,
		function (a, b) {
		  var r = o[b];
		  return typeof r === 'string' || typeof r === 'number' ? r : a;
	});
};