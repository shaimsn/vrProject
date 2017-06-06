/**
 * @file Class for Hrir container
 *
 *
 * http://interface.cipic.ucdavis.edu/sound/hrtf.html
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * HrirConvolver
 *
 * @class HrirContainer
 * @classdesc Class for loading CIPIC HRTF
 * Since the CIPIC original dataset has 50 channels tohold all 50 elevations,
 * it is not loadable from the Web Audio API. Therefore, the provided hrir
 * dataset is pre-procssed to concatenate them to be 1 channel sound. This
 * class loads such files ,decompose to each elevation and hold them as data.
 *
 * @param  {AudioContext} audioCtx      Web Audio API's audio context
 */

 const NEAREST_NEIGHBOR = 0;
 const BILIN_INTERP = 1;
 const MIN_PHASE_INTERP = 2;
 const LIN_PHASE_INTERP = 3;

var HrirContainer = function ( audioCtx ) {

	this._audioCtx = audioCtx;

	/* Each data is Float32Array(200).
	 * You can access hrir at azimuth: -80, elevation: -40 of the left ear by
	 * hrirContainer.L[-80][-40]
	 */
	this.data = { L: {}, R: {} };



	this.mode = NEAREST_NEIGHBOR;

	this.flag = true;
	/* Sampling grid for azimuths */
	this.azimuths = [ - 80, - 65, - 55, - 45, - 40, - 35, - 30, - 25, - 20,
		- 15, - 10, - 5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 65, 80 ];

	this.dataLength = 200;

	this.sampleRate = 44100;

	if ( audioCtx.sampleRate != this.sampleRate ) {

		console.log( "Your browser's sampling rate is different from the CIPIC dataset." );

	}

	/* Sampling grid for elevations */
	this.elevations = [];
	var elevationStep = 5.625;
	var numElevations = 50;
	var minElevation = - 40;
	for ( var i = 0; i < numElevations; ++ i ) {

		this.elevations.push( i * elevationStep + minElevation );

	}

	/* Load the data to this.data */
	this._load();

	/*  */
	// for ( var az of this.azimuths ) {
	// 	for ( var el of this.elevations ) {
	// 		console.log("az: ", az, "el: ", el, "data: ", this.data.L[ az ]);
	// 		//console.log(this.data.R[ az ][ el ]);
	// 	}
	// }

};


HrirContainer.prototype._load = function () {

	var dirname = 'assets/hrir/';

	for ( var az of this.azimuths ) {

		var filenameL, filenameR;

		if ( az >= 0 ) {

			filenameL = az + 'azleft.wav';
			filenameR = az + 'azright.wav';

		} else {

			filenameL = 'neg' + Math.abs( az ) + 'azleft.wav';
			filenameR = 'neg' + Math.abs( az ) + 'azright.wav';

		}

		this.data.L[ az ] = this._decodeHRIR( dirname + filenameL );
		this.data.R[ az ] = this._decodeHRIR( dirname + filenameR );

	}
};


HrirContainer.prototype._decodeHRIR = function ( filepath ) {

	const request = new XMLHttpRequest();

	var audioCtx = this._audioCtx;

	var elevations = this.elevations;

	var hrirElevations = {};

	var dataLength = this.dataLength;

	request.responseType = 'arraybuffer';

	request.open( 'GET', filepath, true );

	request.onload = function () {

		var audioData = request.response;

		audioCtx.decodeAudioData( audioData, function ( buffer ) {


			if ( buffer.length != 10000 ) {

				console.error( "The data length is not valid!" );

			}

			/* Returns Float32Array */
			var data = buffer.getChannelData( 0 );

			for ( var i = 0; i < elevations.length; ++ i ) {

				var el = elevations[ i ];

				var begin = i * dataLength;

				var end = ( i + 1 ) * dataLength;

				hrirElevations[ el ] = data.subarray( begin, end );

			}

		}, function ( e ) {

			"Error with decoding audio data" + e.err;

		} );

	};

	request.send();

	return hrirElevations;

};



/**
 * evaluate
 * This function picks up the hrir dataset that is close to the input azimuth
 * and elevation. For better performance, this function should perform
 * interpolation. However, we perform simple look-up on the given dataset for
 * simplicity. Surprisingly, you can still have good experience of spatial
 * sound!
 *
 * @param  {Number} az azimuth to a sound source from a listenr
 * @param  {Number} el elevation to a sound source from a listner
 * @return {Object} hrir data (Float32Array(200)) for both ears
 */
HrirContainer.prototype.evaluate = function ( az, el ) {

	//Exporting hrirs to matlab by printing stuff to console
  var curr_hrir = [];

	//printing hrir bank given to us on the console
  // 	if (this.flag) {
	// 	this.flag = false;
	// 	for (var azi of this.azimuths) {
	// 		for (var ele of this.elevations) {
	// 			for (var i = 0; i < 200; i++) {
	// 				curr_hrir += this.data.L[azi][ele][i].toString() + ",";
	// 		}
	// 		console.log("data for azumuth = ", azi, ", and elevation = ", ele, curr_hrir);
	// 		curr_hrir = [];
	//
	// 		}
	// 	}
	// }

	/* Find Point On Grid Closest to Desired Point */
	var a_idx = binarySearch( this.azimuths, az );
	var e_idx = binarySearch( this.elevations, el );

	/* Find Four Corners of Grid Cell Containing Desired Point */
	if (this.azimuths[a_idx] < az) {
		a1 = this.azimuths[constrain(a_idx, 0, this.azimuths.length-1)];
		a2 = this.azimuths[constrain(a_idx+1, 0, this.azimuths.length-1)]
	}
	else {
		a1 = this.azimuths[constrain(a_idx-1, 0, this.azimuths.length-1)];
		a2 = this.azimuths[constrain(a_idx, 0, this.azimuths.length-1)];
	}
	if (this.elevations[e_idx] < el) {
		e1 = this.elevations[constrain(e_idx, 0, this.elevations.length-1)];
		e2 = this.elevations[constrain(e_idx+1, 0, this.elevations.length-1)];
	}
	else {
		e1 = this.elevations[constrain(e_idx-1, 0, this.elevations.length-1)];
		e2 = this.elevations[constrain(e_idx, 0, this.elevations.length-1)];
	}
	var L00 = zeroPad(this.data.L[ a1 ][ e1 ]);
	var L01 = zeroPad(this.data.L[ a1 ][ e2 ]);
	var L10 = zeroPad(this.data.L[ a2 ][ e1 ]);
	var L11 = zeroPad(this.data.L[ a2 ][ e2 ]);
	var R00 = zeroPad(this.data.R[ a1 ][ e1 ]);
	var R01 = zeroPad(this.data.R[ a1 ][ e2 ]);
	var R10 = zeroPad(this.data.R[ a2 ][ e1 ]);
	var R11 = zeroPad(this.data.R[ a2 ][ e2 ]);

	/* Perform Bilinear Interpolations for Left and Right Ears */
	var L_weighted = bilinearInterp( L00, L01, L10, L11, a1, e1, a2, e2, az, el );
	var R_weighted = bilinearInterp( R00, R01, R10, R11, a1, e1, a2, e2, az, el );

	/* Perform Interpolation Using Minimum Phase HRIRs */
	/*var L_w_FFT = L_weighted.slice(); // Copy
	var L_w_FFT = cfft(L_w_FFT);
	console.log(L00.length);*/

	switch (this.mode) {
		case NEAREST_NEIGHBOR:
				console.log("Nearest neighbor noterpolation");
				return { L: this.data.L[ this.azimuths[a_idx] ][ this.elevations[e_idx] ],
				R: this.data.R[ this.azimuths[a_idx] ][ this.elevations[e_idx] ] };
				break;

		case BILIN_INTERP:
				console.log("Bilinear interpolation selected");
				return { L: L_weighted, R: R_weighted };
				break;

		case MIN_PHASE_INTERP:
				console.log("Minimum phase interpolation selected");
				return { L: L_weighted, R: R_weighted };
				break;

		case LIN_PHASE_INTERP:
				console.log("Linear phase interpolation selected");
				return { L: L_weighted, R: R_weighted };
				break;
		}

};

/**
 * zeroPad
 * zero pad array to lowest power of 2
 *
 * @param  {Array} arrayin Array of Numbers
 * @return {Array} Zeropadded Array of Numbers
 */
function zeroPad( arrayin ) {
	var nextPowOf2 = Math.pow(2, Math.ceil(Math.log(arrayin.length)/Math.log(2)));
	var arrayout = new Float32Array(nextPowOf2);
	for (var i = 0; i < nextPowOf2; i++) {
		if (i < arrayin.length) {
			arrayout[i] = arrayin[i];
		}
		else {
			arrayout[i] = 0;
		}
	}
	return arrayout;
}

/**
 * bilinearInterp
 * bilinear interpolation amongst 4 HRIRs
 *
 * @param  {Arrays} Ha1e1, Ha1e2, Ha2e1, Ha2e2 -- Arrays for HRIR
 * @param  {Numbers} a1, e1, a2, e2 -- Locations for HRIRs
 * @param  {Numbers} az, el -- Location for Interpolation
 * @return {Array} Array after interpolating 4 HRIRs
 */
function bilinearInterp( Ha1e1, Ha1e2, Ha2e1, Ha2e2, a1, e1, a2, e2, az, el ) {
	if (a1 == a2) {
		az_norm = 0.5;
	}
	else {
		az_norm = (az-a1)/(a2-a1);
	}
	if (e1 == e2) {
		el_norm = 0.5;
	}
	else {
		el_norm = (el-e1)/(e2-e1);
	}

	var Ha1e1_weighted = scalarMult(Ha1e1, (1-az_norm)*(1-el_norm));
	var Ha1e2_weighted = scalarMult(Ha1e2, (1-az_norm)*el_norm);
	var Ha2e1_weighted = scalarMult(Ha2e1, az_norm*(1-el_norm));
	var Ha2e2_weighted = scalarMult(Ha2e2, az_norm*el_norm);

	var HRIR_weighted = sumArrays(Ha1e1_weighted, sumArrays(Ha1e2_weighted,
		sumArrays(Ha2e1_weighted, Ha2e2_weighted)));
	return HRIR_weighted
}

/**
 * sumArrays
 * sum all arrays inside array of arrays
 *
 * @param  {Array} array1 Array of Numbers
 * @param  {Array} array2 Array of Numbers
 * @return {Array} Element-wise addition of two arrays
 */
function sumArrays( array1, array2 ) {
	var newArray = array1.slice();
	for (var i = 0; i < newArray.length; i++) {
		newArray[i] = array1[i] + array2[i];
	}
	return newArray;
}

/**
 * scalarMult
 * multiply all elements of an array using a single scalar value
 *
 * @param  {Array} array Array of Numbers
 * @param  {Number} scalar Scalar Value to Multiply All Elements of Array
 * @return {Number} Array of Numbers Scaled by scalar
 */
function scalarMult( array, scalar ) {
	var newArray = array.slice();
	for (var i = 0; i < newArray.length; i++) {
		newArray[i] = newArray[i]*scalar;
	}
	return newArray;
}

/**
 * constrain
 * constrain input value to be no smaller than min but no larger than max
 *
 * @param  {Number} val Value to Be Constrained
 * @param  {Number} min Minimum Value of Constraint
 * @param  {Number} max Maximum Value of Constraint
 * @return {Number} The Value Constrained Between Min and Max.
 */
function constrain( val, min, max ) {
	if (val > max) {
		return max;
	}
	else if (val < min) {
		return min;
	}
	else {
		return val;
	}
}

/**
 * binarySearch
 * perform binary search over the input array to find the closest value to the
 * input value.
 *
 * @param  {Array} array The sampling grid of azimuths/elevations
 * @param  {Number} val  Azimuth/elevation we would like to find
 * @return {Number} The closest element of the input array to the input value.
 */
function binarySearch( array, val ) {

	/* TODO: Implement this function! */
	var low = 0;
	var high = array.length - 1;
	// If Values Outside Ranges of Arrays
	if (array[low] > val) {
		return low;
	}
	if (array[high] < val) {
		return high;
	}
	// Classic Binary Search
	while (high >= low) {
		var mid = Math.floor((high + low) / 2);
		//console.log("High: "+high+" Low: "+low+" Arr_mid: "+array[mid]);
		if (array[mid] < val) {
			low = mid+1;
		}
		if (array[mid] > val) {
			high = mid-1;
		}
		if (array[mid] == val) {
			return mid;
		}
	}
	// Decide Which Value is Closer if Exact Value Not Found
	if ( (val-array[high]) < (array[low]-val) ) {
		return high;
	}
	else {
		return low;
	}

	/* Linear Search
	var idx = 0;
	while (array[idx] < val && idx < array.length-1) {
		idx = idx + 1;
	}
	if ( (val-array[idx-1]) < (array[idx]-val) ) {
		return array[idx-1];
	}
	else {
		return array[idx];
	} */

}

/*
complex fast fourier transform and inverse from
http://rosettacode.org/wiki/Fast_Fourier_transform#C.2B.2B
*/
function icfft(amplitudes)
{
	var N = amplitudes.length;
	var iN = 1 / N;

	//conjugate if imaginary part is not 0
	for(var i = 0 ; i < N; ++i)
		if(amplitudes[i] instanceof Complex)
			amplitudes[i].im = -amplitudes[i].im;

	//apply fourier transform
	amplitudes = cfft(amplitudes)

	for(var i = 0 ; i < N; ++i)
	{
		//conjugate again
		amplitudes[i].im = -amplitudes[i].im;
		//scale
		amplitudes[i].re *= iN;
		amplitudes[i].im *= iN;
	}
	return amplitudes;
}

function cfft(amplitudes)
{
	var N = amplitudes.length;
	if( N <= 1 )
		return amplitudes;

	var hN = N / 2;
	var even = [];
	var odd = [];
	even.length = hN;
	odd.length = hN;
	for(var i = 0; i < hN; ++i)
	{
		even[i] = amplitudes[i*2];
		odd[i] = amplitudes[i*2+1];
	}
	even = cfft(even);
	odd = cfft(odd);

	var a = -2*Math.PI;
	for(var k = 0; k < hN; ++k)
	{
		if(!(even[k] instanceof Complex))
			even[k] = new Complex(even[k], 0);
		if(!(odd[k] instanceof Complex))
			odd[k] = new Complex(odd[k], 0);
		var p = k/N;
		var t = new Complex(0, a * p);
		t.cexp(t).mul(odd[k], t);
		amplitudes[k] = even[k].add(t, odd[k]);
		amplitudes[k + hN] = even[k].sub(t, even[k]);
	}
	return amplitudes;
}

/*
basic complex number arithmetic from
http://rosettacode.org/wiki/Fast_Fourier_transform#Scala
*/
function Complex(re, im)
{
	this.re = re;
	this.im = im || 0.0;
}
Complex.prototype.add = function(other, dst)
{
	dst.re = this.re + other.re;
	dst.im = this.im + other.im;
	return dst;
}
Complex.prototype.sub = function(other, dst)
{
	dst.re = this.re - other.re;
	dst.im = this.im - other.im;
	return dst;
}
Complex.prototype.mul = function(other, dst)
{
	//cache re in case dst === this
	var r = this.re * other.re - this.im * other.im;
	dst.im = this.re * other.im + this.im * other.re;
	dst.re = r;
	return dst;
}
Complex.prototype.cexp = function(dst)
{
	var er = Math.exp(this.re);
	dst.re = er * Math.cos(this.im);
	dst.im = er * Math.sin(this.im);
	return dst;
}
Complex.prototype.log = function()
{
	/*
	although 'It's just a matter of separating out the real and imaginary parts of jw.' is not a helpful quote
	the actual formula I found here and the rest was just fiddling / testing and comparing with correct results.
	http://cboard.cprogramming.com/c-programming/89116-how-implement-complex-exponential-functions-c.html#post637921
	*/
	if( !this.re )
		console.log(this.im.toString()+'j');
	else if( this.im < 0 )
		console.log(this.re.toString()+this.im.toString()+'j');
	else
		console.log(this.re.toString()+'+'+this.im.toString()+'j');
}
