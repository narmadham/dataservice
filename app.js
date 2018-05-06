const http = require('http');
const URL = require('url');
const PORT = process.env.PORT || 5000;

//Handle request
const requestHandler = (request, response) => {
    const {
        method,
        url
    } = request;
     var getUrl = URL.parse(url, true);
    if (method === 'POST' && getUrl.path === '/') {
        let postdata = [];

        request.on('data', function(chunk) {
            postdata.push(chunk);
            // Avoid too much POST data                                                        
            if (postdata.length > 1e6)
                request.connection.destroy();
        });

        // received all data
        request.on('end', function() {
            postdata = Buffer.concat(postdata).toString();
            if (postdata) {

                try {
                    const requestData = JSON.parse(postdata);
                    // Check if payload is an array
                    if (requestData.hasOwnProperty("payload")) {
                        if (Array.isArray(requestData.payload)) {
                            response.writeHead(200, {
                                'Content-Type': 'application/json'
                            });
                            response.end(JSON.stringify({
                                response: getFilteredData(requestData.payload)
                            }));
                        } else {
                            throwError(response);
                        }
                    } else {
                        throwError(response);
                    }
                } catch (e) {
                    // handle error
                    throwError(response);
                }
            }
        });
    }
    else {
    	response.statusCode = 404;
    	response.end();
    }
}

const getFilteredData = (requestData) => {
    let results = [];
    requestData.map(function(element) {
        if (element.type === "htv" && element.workflow === "completed") {

            var concatAddress = getAddressString(element.address);
            results.push({
                concataddress: concatAddress,
                type: element.type,
                workflow: element.workflow
            });
        }
    });
    return results;
}

// Handle address concatanation
const getAddressString = (element) => {
    const filterKeys = ['buildingNumber', 'street', 'suburb', 'state', 'postcode'];
    var string = "";
    filterKeys.map(function(key, i) {
        if (element.hasOwnProperty(key)) {
            if (i + 1 < filterKeys.length)
                string = string + element[key] + " ";
            else
                string = string + element[key];
        }
    });
    return string;
}

// Handle error
const throwError = (response) => {
    response.statusCode = 400;
    response.end(JSON.stringify({
        error: 'Could not decode request: JSON parsing failed'
    }));
}

// create server
const server = http.createServer(requestHandler)

// run server
server.listen(PORT, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${PORT}`)
})
