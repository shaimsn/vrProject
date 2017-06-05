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
var filenames = ['assets/audio/drum.wav',
								 'assets/audio/bensound/epic.wav',
								 'assets/audio/bensound/idea.wav'];
var speakers = [new Speaker( audioCtx, filenames[0] ),
								new Speaker( audioCtx, filenames[1] ),
								new Speaker( audioCtx, filenames[2] )];
speakers[0].setPosition( 5, 15, - 10 ); // Set the 3D position of speaker 0
speakers[1].setPosition( 0, 15, - 10 ); // Set the 3D position of speaker 1
speakers[2].setPosition( -5, 15, -0 ); // Set the 3D position of speaker 2

/* Load the HRIR datasets to a container class*/
var hrirContainer = new HrirContainer( audioCtx );

/* Make our HRIR convolver node by using the loaded data */
var hrirConvolverNodes = [new HrirConvolver( audioCtx, hrirContainer ),
													new HrirConvolver( audioCtx, hrirContainer ),
													new HrirConvolver( audioCtx, hrirContainer )];

/* Make a destination node, which corresponds to your speaker*/
var destNode = audioCtx.destination;

/* Construct a graph */
speakers[0].sourceNode.connect( hrirConvolverNodes[0].input );
speakers[1].sourceNode.connect( hrirConvolverNodes[1].input );
speakers[2].sourceNode.connect( hrirConvolverNodes[2].input );
hrirConvolverNodes[0].output.connect( destNode );
hrirConvolverNodes[1].output.connect( destNode );
hrirConvolverNodes[2].output.connect( destNode );



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

 	/* Start playing! -- Kind of Annoying When Three Different Sounds */
	speakers[0].audioElement.play();
	speakers[1].audioElement.play();
	speakers[2].audioElement.play();

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

	/* TODO: Implement this function! */

	/* First Find the Listener to Speaker Displacement Vector */
	var listnerToSpeakers = [new THREE.Vector3().subVectors(speakers[0].position, listnerPosition),
													 new THREE.Vector3().subVectors(speakers[1].position, listnerPosition),
													 new THREE.Vector3().subVectors(speakers[2].position, listnerPosition)];

	/* Rotate Speaker Displacement Vector By Quaternion */
	listnerQuaternion.inverse(); // Invert The Quaternion to Undo Rotation
	listnerToSpeakers[0].applyQuaternion(listnerQuaternion);
	listnerToSpeakers[1].applyQuaternion(listnerQuaternion);
	listnerToSpeakers[2].applyQuaternion(listnerQuaternion);

	/* Calculate Distance, Elevation, and Azimuth */
	var numSpeakers = 3; // Number of Speakers
	for (var i = 0; i < numSpeakers; i++) {
		var d = listnerToSpeakers[i].length();

		//var el = (180.0/Math.PI)*Math.asin(listnerToSpeakers[i].y/d);
		//var az = (180.0/Math.PI)*Math.atan2(listnerToSpeakers[i].x,-listnerToSpeakers[i].z);

		if ( d > 1e-9 ) {
			/* Rehman and Shai Implementation */
			var el = (180.0/Math.PI)*Math.asin(listnerToSpeakers[i].y/d);
			var az = (180.0/Math.PI)*Math.atan2(listnerToSpeakers[i].x,-listnerToSpeakers[i].z);
			/* Hayato's Implementation -- Gives the Same Values as Rehman/Shai Implementation */
			//var az = Math.asin( listnerToSpeakers[i].x / d ) * THREE.Math.RAD2DEG;
			//var el = Math.atan2( listnerToSpeakers[i].y, - listnerToSpeakers[i].z ) * THREE.Math.RAD2DEG;
		} else {
			/* This is just for preventing zero division. No physical meaning. */
			var az = 0;
			var el = 0;
		}

		if (i == 1) {
			//console.log("D1: "+d+" E1: "+el1+" A1: "+az1);
			//console.log("D2: "+d+" E2: "+el+" A2: "+az);
		}
		hrirConvolverNodes[i].update( az, el, d );
	}

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

	}

} );
