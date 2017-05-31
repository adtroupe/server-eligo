# Eligo
*Don't let dietary restrictions, restrict your shopping*

## Table of contents
- [Team](#team)
- [App details](#app-details)
- [Contents](#contents)
- [Technology](#technology)

## Team
|Personnel|Role|Github name|Email (@uw.edu)
|-|-|-|-|
| Kaitlin L | developer + designer | @kailock | kailock
| Amie H | ux designer | @amieh2 | amieh2
| Alex T | developer | @adtroupe | adtroupe
| Vincent W | developer + pm | @wuv21 | wuv21

## App details
Eligo's server side is built using Javascript, Node.js and Express for many reasons - some of which include:
  1. JavaScript syntax is familiar to us for development and allowed us to start coding without having to learn any new languages.
  2. Javascript code could be shared between client and server sides.
  3. Node.js and Express run on top of the Google V8 javascript engine which is very fast.
  4. Asynchronous model allowed for parallel command execution

## Contents
Eligo's server side code is primarily contained within the server.js file. This file contains code for all GET/POST requests that the client uses to interact with the server.
	1. A GET request to receive API details from the UPC code scan, as well as custom dietary restriction conflicts based on an account.
	2. A POST request to login or create an account.
	3. A POST request to create custom users within the primary logged in account.
	4. POST request to delete both users and accounts.
	5. A POST request to receive an accounts past UPC code scans.
	6. A POST request to update an account's inputed grocery list.
	7. A POST request to receive dietary restriction ingredient suggestions from users. 

## Technology
Eligo's server-side code runs on Heroku, a service who prides itself on taking care of infrastructure so that developers can set up an account, deploy, and run. Heroku allowed us to quickly move our server-side code online and worry less about implementation of infrastructure.
Eligo's storage is through Firebase. Firebase was chosen because of our prior experience with the service and it ease of use when it came to user authentication and data storage. 