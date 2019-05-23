/*
* Primary file for the API
*
*/


//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');

var fs = require('fs');
var handlers = require('./lib/handlers')

var helpers = require('./lib/helpers')

// var _data = require('./lib/data')

//TESTING
// @TODO delete this

// _data.create('test','newFile',{'foo':'bar'},function(err){
//     console.log('this was the error',err);
// })

// _data.read('test','newFile',function(err,data){
//     console.log('this was the error',err, 'and this was the data ',data);
// })

// _data.update('test','newFile',{'fizz':'buzz'},function(err){
//     console.log('this was the error',err);
// })

// _data.delete('test','newFile',function(err){
//     console.log('this was the error',err)
// })

//Instantiate the HTTP server
var httpServer = http.createServer((req,res)=>{
    unifiedServer(req,res)
});

//Start the serverm

httpServer.listen(config.httpPort,()=>{
    console.log(`The Server is listening on port ${config.httpPort}`)
});

//Instantiate the HTTPS server

var httpsServerOptions = {
    'key'   : fs.readFileSync('./https/key.pem'),
    'cert'  : fs.readFileSync('./https/cert.pe')
}

var httpsServer = https.createServer(httpsServerOptions,(req,res)=>{
    unifiedServer(req,res)
});

//start the https server
httpsServer.listen(config.httpsPort,()=>{
    console.log(`The Server is listening on port ${config.httpsPort}`)
});



//All the server logic for both the http and https server

var unifiedServer = function(req,res){
    //Get The Url and parse it 
    var parsedUrl = url.parse(req.url,true);

    //Get the path
    var path = parsedUrl.pathname  
    var trimmedPath = path.replace(/^\/+|\/+$/g,'')

    //Get the query string as an object
    var queryStringObject = parsedUrl.query;

    //Get the HTTP Method
    var method = req.method.toLowerCase();

    //Get the Headers as an object
    var headers = req.headers;

    //Get the payload,if theres any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data',(data)=>{
        buffer += decoder.write(data)
    });

    req.on('end',()=>{
        buffer += decoder.end();
        

        //Choose the handler this request should go to.If one is not found use the notfound Handler
        var chosenHandler = typeof router[trimmedPath] !== 'undefined' ? router[trimmedPath] : handlers.notFound

        //Construct the data object to send to the handler
        var data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        // route the request to the handler specified in the router
        chosenHandler(data,(statusCode,payload)=>{
            //Use the status code called back by the handler, or default to 200
            statusCode = typeof statusCode == 'number' ? statusCode : 200
            //Use the payload called back by the handler or default to an empty object
            payload = typeof payload == 'object' ? payload : {};

            //Convert the payload to a string 
            var payloadString = JSON.stringify(payload)

            //return the response
            res.setHeader('Content-type','application/json')   

            res.writeHead(statusCode);
            res.end(payloadString);

            //Log the request path
            console.log(`returning this response`,statusCode,payloadString)
        });
    });
}

//define a request router
var router = {
    'ping':handlers.ping,
    'users':handlers.users
}