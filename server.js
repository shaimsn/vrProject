/**
 * @file Serial to WebSocket communication and HTTP server
 * This program achieve the serial communication between Arduino and browsers
 * through WebSocket connections. It allows multiple/non WebSocket connections.
 * Additionally, this program launch an HTTP server to serve static files in
 * the public directory.
 *
 * This code is based on the article written by Prof. Tom Igoe at
 * NYU Tische School of the Arts. The code example is copied and modified to
 * achieve the communication between Arduino and browsers with the permission
 * of Prof. Igoe.
 *
 * Reference:
 * https://itp.nyu.edu/physcomp/labs/labs-serial-communication/lab-serial-communication-with-node-js/
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
Stanford Junior University
 * @version 2017/03/28
 *
 */


/* Import serialport library */
const SerialPort = require( "serialport" );

/* Import WebSocketServer */
const WebSocketServer = require( "ws" ).Server;

/* Instanciate the WebSocket server with port 8081 */
const wss = new WebSocketServer( { port: 8081 } );

const express = require( "express" );


var app = express();


app.listen( 8080, function () {

	console.log( "EE267 app listening on port 8080!" );

} );

app.use( express.static( "public" ) );


/**
 * List of WebSocket connections
 * It is useful to use it as a contanair even if we assume 1 WebSocket connection
 * at most because we don't want to close the serial port even when we don't have
 * any WebSocket connections.
 */
var wssConnections = [];


/* Event listner of the WebSocketServer.*/
wss.on( "connection", function ( client ) {

	console.log( "The browser is connected to the serial port." );

	wssConnections.push( client );

	client.on( "close", function () {

		console.log( "The connection to the browser is closed." );

		var idx = wssConnections.indexOf( client );

		wssConnections.splice( idx, 1 );

	} );

} );


/**
 * Keyboard input to Arduino through stdin.
 * By setting it to be raw mode, the data is sent without hitting enter.
 */
var stdin = process.openStdin();

stdin.setRawMode( true );

stdin.setEncoding( "utf8" );

stdin.on( "data", function ( key ) {

	if ( key === '\u0003' ) {

		process.exit();

	}

} );



SerialPort.list( function ( err, ports ) {

	console.log( "Looking for Teensy..." );

	var connected = false;

	ports.forEach( function ( port ) {

		if ( port.manufacturer == "Teensyduino" ||
				port.manufacturer == "Microsoft" ) {

			console.log( "Teensy found!" );

			setupSerialPort( port.comName );

			connected = true;

		}

	} );

	if ( ! connected ) {

		console.log( "Teensy not found..." );

	}

} );



function setupSerialPort( portName ) {

	/* Instanciate SerialPort */
	const serialPort = new SerialPort( portName, {

		baudRate: 115200,

	/***
	 * The output of Arduino's println() ends with \r\n.
	 * https://www.arduino.cc/en/serial/println
	 */
		parser: SerialPort.parsers.readline( "\n" ),

	} );

	/* Set up event listeners on the serial port */
	serialPort.on( "open", function () {

		console.log( "The serial port to Teensy is opened." );

	} );

	serialPort.on( "close", function () {

		console.log( "The serial port to Teensy is closed." );

	} );

	serialPort.on( "error", function ( err ) {

		console.log( "Serial port error: " + err );

	} );

	/* For checking the data without any connection */
	serialPort.on( "data", function ( data ) {

		console.log( data );

		wssConnections.forEach( function ( socket ) {

			socket.send( JSON.stringify( data ) );

		} );

	} );


	stdin.on( "data", function ( key ) {

		if ( key === '\u0003' ) {

			process.exit();

		}

		serialPort.write( key );

	} );

}
