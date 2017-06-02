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

var HrirContainer = function ( audioCtx ) {

	this._audioCtx = audioCtx;

	/* Each data is Float32Array(200).
	 * You can access hrir at azimuth: -80, elevation: -40 of the left ear by
	 * hrirContainer.L[-80][-40]
	 */
	this.data = { L: {}, R: {} };

	this.mode = true;

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

	/* Perform Bilinear Interpolations for Left and Right Ears */
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
	var L00 = this.data.L[ a1 ][ e1 ];
	var L01 = this.data.L[ a1 ][ e2 ];
	var L10 = this.data.L[ a2 ][ e1 ];
	var L11 = this.data.L[ a2 ][ e2 ];
	var L00_weighted = scalarMult(L00, (1-az_norm)*(1-el_norm));
	var L01_weighted = scalarMult(L01, (1-az_norm)*el_norm);
	var L10_weighted = scalarMult(L10, az_norm*(1-el_norm));
	var L11_weighted = scalarMult(L11, az_norm*el_norm);
	var L_weighted = sumArrays(L00_weighted, sumArrays(L01_weighted,
		sumArrays(L10_weighted, L11_weighted)));
	var R00 = this.data.R[ a1 ][ e1 ];
	var R01 = this.data.R[ a1 ][ e2 ];
	var R10 = this.data.R[ a2 ][ e1 ];
	var R11 = this.data.R[ a2 ][ e2 ];
	var R00_weighted = scalarMult(R00, (1-az_norm)*(1-el_norm));
	var R01_weighted = scalarMult(R01, (1-az_norm)*el_norm);
	var R10_weighted = scalarMult(R10, az_norm*(1-el_norm));
	var R11_weighted = scalarMult(R11, az_norm*el_norm);
	var R_weighted = sumArrays(R00_weighted, sumArrays(R01_weighted,
		sumArrays(R10_weighted, R11_weighted)));

	if (this.mode == true) {
		/* Linear Interpolation */
		console.log("Linear interpolation selected");
		return { L: L_weighted, R: R_weighted };

	} else {
		/* Nearest Neighbor */
		console.log("Nearest neighbor noterpolation");
		return { L: this.data.L[ this.azimuths[a_idx] ][ this.elevations[e_idx] ],
		       R: this.data.R[ this.azimuths[a_idx] ][ this.elevations[e_idx] ] };
	}

};

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
