/**
 * @file EE267 Virtual Reality
 * Homework 7
 * Spatial audio with Web Audio API
 *
 * Instructor: Gordon Wetzstein <gordon.wetzstein@stanford.edu>,
 * 			   Robert Konrad <rkkonrad@stanford.edu>,
 * 			   Hayato Ikoma <hikoma@stanford.edu>,
 * 			   Keenan Molner <kmolner@stanford.edu>
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
Stanford Junior University
 * @version 2017/03/28
 * This version uses Three.js (r84), stats.js (r17) and jQuery (3.2.1).
 *
 */

/* Variable to hold the listner's head rotation and position */
var listnerPosition = new THREE.Vector3();
var listnerQuaternion = new THREE.Quaternion();

/* Start communication with Teensy through WebSocket */
initWebSocket();

/* Make Web Audio API's AudioContext where we build a graph */
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();

/* Make a speker which has a source node */
var filename = 'assets/audio/drum.wav';
var speaker = new Speaker( audioCtx, filename );
speaker.setPosition( 0	, 0, - 10 );
// speaker.setPosition( 0, 0, - 10 );


/* Load the HRIR datasets to a container class*/
var hrirContainer = new HrirContainer( audioCtx );

/* Make our HRIR convolver node by using the loaded data */
var hrirConvolverNode = new HrirConvolver( audioCtx, hrirContainer );

/* Make a destination node, which corresponds to your speaker*/
var destNode = audioCtx.destination;

/* Construct a graph */
speaker.sourceNode.connect( hrirConvolverNode.input );
hrirConvolverNode.output.connect( destNode );



/***
 * Start updating the HRIR every 50 ms by using setInterval funtion after 200
 * ms. Since JavaScript is asynchronous, updateHRIR() function can be called
 * before all files are loaded and the data is stored to the hrirContainer.
 *
 * You may be able to use the new Javascript Promise class or an event listner
 * to catch the file loading completion, but we are simply achieving this by
 * waiting for 200 ms.
 */
setTimeout( function () {

	setInterval( updateHRIR, 50 );

}, 200 );

/* Start playing music after the updates of HRIR */
setTimeout( function () {

 	/* Start playing! */
	speaker.audioElement.play();

}, 300 );


/**
 * updateHRIR
 *
 * This function computes the elevation, the azimuth,
 * the distance from the listner position to all of
 * the speakers (sound sources) to update all of the
 * hrirConvolvers.
 *
 * The listner position is given by a global variable
 * listnerPosition and the speaker position is given
 * by the member variable of the Speaker class.
 */
function updateHRIR() {

	var pos = new THREE.Vector3().subVectors(
		speaker.position, listnerPosition );
	var invQ = listnerQuaternion.clone().inverse();
	pos.applyQuaternion( invQ );

	var d = pos.length();

	var az, el;

	/***
	 * Our current implementation does not give us high resolution of azimuth at
	 * azimuth 90 degree. There should be a better way to comptue it.
	 * However, even if it is implemented in a better way, the hrir look-up
	 * would give us the same hrir. It would be impoortant if we want to
	 * implement some interpolation method for HRIR.
	 */
	if ( d > 1e-9 ) {
		/* Hayato's Version */
		az = Math.asin( pos.x / d ) * THREE.Math.RAD2DEG;
		el = Math.atan2( pos.y, - pos.z ) * THREE.Math.RAD2DEG;
		/* Rehman/Shai's Version */
		//az = THREE.Math.RAD2DEG*Math.atan2(pos.x,-pos.z);
		//el = THREE.Math.RAD2DEG*Math.asin(pos.y/d);
		//console.log("D: "+d+" E: "+el+" A: "+az);

	} else {

		/* This is just for preventing zero division. No physical meaning. */
		az = 0;
		el = 0;

	}

	hrirConvolverNode.update( az, el, d );

}

/* Start WebSocket communication to get the rotational data from IMU */
function initWebSocket() {

	var socket = new WebSocket( "ws://localhost:8081" );

	socket.onopen = openSocket;

	socket.onmessage = updateRotation;

	function openSocket() {

		socket.send( "WebSocket is opened." );

	}

	function updateRotation( result ) {

		var data = result.data.replace( /"/g, "" ).split( " " );

		if ( data[ 0 ] == "QC" ) {

			if ( data.length === 5 ) {

				/* data: QC q[0] q[1] q[2] q[3] */
				listnerQuaternion.set(
				Number( data[ 2 ] ), Number( data[ 3 ] ), Number( data[ 4 ] ), Number( data[ 1 ] ) ).normalize();

			}

		} else {

			console.log( "Invarid data!" );

		}

	}

}


$( "html" ).keydown( function ( e ) {

	switch ( e.which ) {

		case 87: /* Key w */

			/* Move forward */
			listnerPosition.z -= 1;

			break;

		case 83: /* Key s */

			/* Move backward */
			listnerPosition.z += 1;

			break;

		case 68: /* Key d */

			/* Move right */
			listnerPosition.x += 1;

			break;

		case 65: /* Key a */

			/* Move left */
			listnerPosition.x -= 1;

			break;

	   case 75: /* Key k */

				/* Change linear interp to no interp*/
		if (hrirContainer.mode == false) {
		hrirContainer.mode = true;
	} else {
		hrirContainer.mode = false;
	}

		 break;

	}

} );
