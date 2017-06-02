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


window.onload = function () {

	var AudioContext = window.AudioContext || window.webkitAudioContext;

	var audioCtx = new AudioContext();

	var audioElement = document.createElement( "audio" );
	document.body.appendChild( audioElement );
	audioElement.setAttribute( "loop", "loop" );
	audioElement.setAttribute( "controls", "" );
	audioElement.setAttribute( "src", dirname + filenames[ 0 ] );
	var sourceNode = audioCtx.createMediaElementSource( audioElement );

	var destNode = audioCtx.destination;

	var numChannels = 2;
	var splitterNode = audioCtx.createChannelSplitter( numChannels );
	var mergerNode = audioCtx.createChannelMerger( numChannels );

	var delayNodeL = audioCtx.createDelay();
	var delayNodeR = audioCtx.createDelay();

	var gainNodeL = audioCtx.createGain();
	var gainNodeR = audioCtx.createGain();

	sourceNode.connect( splitterNode );

	/* Left ear */
	splitterNode.connect( delayNodeL, 0 );
	delayNodeL.connect( gainNodeL );

	/* Right ear */
	splitterNode.connect( delayNodeR, 1 );
	delayNodeR.connect( gainNodeR );

	gainNodeL.connect( mergerNode, 0, 0 );
	gainNodeR.connect( mergerNode, 0, 1 );

	mergerNode.connect( destNode );

	audioElement.play();

	var gui = new dat.GUI();
	var audioController = new AudioController();
	var gainLController = gui.add( audioController, 'gainL', 0, 1 );
	var delayController = gui.add( audioController, 'delay', - 200, 200 );
	var musicSelector = gui.add( audioController, 'music', filenames );

	gainLController.onChange( function ( gainL ) {

		gainNodeL.gain.value = 2 * gainL;
		gainNodeR.gain.value = 2 * ( 1 - gainL );

	} );


	delayController.onChange( function ( delayL ) {

		if ( delayL >= 0 ) {

			delayNodeL.delayTime.value = delayL / 1000;
			delayNodeR.delayTime.value = 0;

		} else {

			delayNodeL.delayTime.value = 0;
			delayNodeR.delayTime.value = - delayL / 1000;

		}

	} );


	musicSelector.onChange( function ( filename ) {

		audioElement.setAttribute( "src", dirname + filename );
		audioElement.play();

	} );

};

var dirname = 'assets/audio/';

var filenames = [
	'bensound/epic.wav',
	'bensound/idea.wav',
	'bensound/popdance.wav',
	'bensound/psychedelic.wav',
	'drum.wav' ];


var AudioController = function () {

	/* Left gain - left ear: gain, right ear: 1 - gain */
	this.gainL = 0.5;

	/* Delay time of left speaker in millisecond  */
	this.delay = 0;

	this.music = filenames[ 0 ];

};
