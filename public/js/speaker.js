/**
 * @file Class for a sound source
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * Speaker
 *
 * @class Speaker
 * @classdesc
 * This class loads a audio file, holds it as a source node, and holds the 3D
 * position of the sound source.
 *
 * @param  {AudioContext} audioCtx      Web Audio API's audio context
 * @param  {String} filename	File path to an audio file
 */

var Speaker = function ( audioCtx, filename ) {

	this.audioElement = document.createElement( 'audio' );

	document.body.appendChild( this.audioElement );

	this.audioElement.setAttribute( 'controls', '' );

	this.audioElement.setAttribute( 'src', filename );

	this.audioElement.setAttribute( 'loop', 'loop' );

	this.sourceNode = audioCtx.createMediaElementSource( this.audioElement );

	this.position = new THREE.Vector3();

};

Speaker.prototype.setPosition = function ( x, y, z ) {

	this.position.set( x, y, z );

};
