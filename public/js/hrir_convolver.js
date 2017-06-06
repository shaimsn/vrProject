/**
 * @file Class for Hrir convolution
 * This class can be used as if it is like a Web Audio API's AudioNode.
 *
 * This implementation is insprided by Tomasz Woźniak's HRTF panner.
 * https://github.com/tmwoz/hrtf-panner-js
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * HrirConvolver
 *
 * @class HrirConvolver
 * @classdesc Class for Hrir convolution.
 * This class has an input and output gain node which can be an interface to
 * the convolver. The convolution with HRIR is performed over audio signal
 * whose frequency is higher than the crossover frequency. Lower-frequency
 * signals are not convolved with HRIR as they typically becomes
 * omnidirectional sound. In addition, this class uses two convovlers for
 * smoothly switch between different HRIRs.
 *
 * @param  {AudioContext} audioCtx      Web Audio API's audio context
 * @param  {HrirContainer} hrirContainer A container class holding HRIR dataset
 */
var HrirConvolver = function ( audioCtx, hrirContainer ) {

	this.input = audioCtx.createGain();
	this.input.gain.value = 10;

	this.output = audioCtx.createGain();

	this._audioCtx = audioCtx;

	this._hrirContainer = hrirContainer;

	this.crossoverFreq = 200;

	this._lowPassNode = audioCtx.createBiquadFilter();
	this._lowPassNode.type = 'lowpass';
	this._lowPassNode.frequency.value = this.crossoverFreq;

	this._highPassNode = audioCtx.createBiquadFilter();
	this._highPassNode.type = 'highpass';
	this._highPassNode.frequency.value = this.crossoverFreq;

	this._newConvolver = new this.ConvolverWithGain( audioCtx );
	this._currentConvolver = new this.ConvolverWithGain( audioCtx );

	this.input.connect( this._highPassNode );
	this.input.connect( this._lowPassNode );

	this._highPassNode.connect( this._newConvolver.convolverNode );
	this._highPassNode.connect( this._currentConvolver.convolverNode );

	this._newConvolver.gainNode.connect( this.output );
	this._currentConvolver.gainNode.connect( this.output );
	this._lowPassNode.connect( this.output );

};


HrirConvolver.prototype.ConvolverWithGain = function ( audioCtx ) {

	this.convolverNode = audioCtx.createConvolver();
	this.gainNode = audioCtx.createGain();
	this.convolverNode.normalize = false;
	this.convolverNode.connect( this.gainNode );

};



/**
 * update function
 * This function updates the convolver to use the HRIR to which the given
 * azimuth, elevation and distance correspond. To achieve this switching,
 * the old convolver linearly fades out and the new convolver linearly fades in.
 * In addition, the gain of the output is scaled based on the distance to a
 * sound source.
 *
 * @memberof HrirConvolver
 * @param  {Number} az azimuth to a sound source from a listenr
 * @param  {Number} el elevation to a sound source from a listner
 * @param  {Number} d  distance to a sound source from a listner
 */
HrirConvolver.prototype.update = function ( az, el, d ) {

	var transitionTime = 25 / 1000;

	var hrirBuffer = this._audioCtx.createBuffer(
		2, this._hrirContainer.dataLength, this._audioCtx.sampleRate );

	var hrir = this._hrirContainer.evaluate( az, el );

	hrirBuffer.copyToChannel( hrir.L, 0 );
	hrirBuffer.copyToChannel( hrir.R, 1 );

	this._newConvolver.convolverNode.buffer = hrirBuffer;

	this._newConvolver.gainNode.gain.setValueAtTime(
		0, this._audioCtx.currentTime );

	this._newConvolver.gainNode.gain.linearRampToValueAtTime(
		1, this._audioCtx.currentTime + transitionTime );

	this._currentConvolver.gainNode.gain.setValueAtTime(
		1, this._audioCtx.currentTime );

	this._currentConvolver.gainNode.gain.linearRampToValueAtTime(
		0, this._audioCtx.currentTime + transitionTime );
		
	this.output.gain.value = 1 / ( 1 + d*d );

	var newConvolver = this._newConvolver;
	this._newConvolver = this._currentConvolver;
	this._currentConvolver = newConvolver;

};
