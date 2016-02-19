/*
    node crawl.js -target __TARGETDOMAIN__
    -target *required
    -depth
    -timeout
    -rd = restrict domain

    --silent

    ** to add **
    -code = only report those of this code (404, 500, etc)
    -port = different port
    -protocol = https http
    -path = start at subpath
    -additional domains

    --redirect
    --image dimensions
*/

/* DEFAULTS */
var options = {
    silent: false,
    depth : 3,
    timeout_ms: 10000,
    full_url: null,
    restrict_domain:true
};
/* END DEFAULTS */



/* GET ARGUMENTS */
if(process.argv.indexOf("-target") != -1){
    options['full_url']  = process.argv[process.argv.indexOf("-target") + 1];
    if(options['full_url'].indexOf("http") == -1){
        options['full_url'] = "http://" + options['full_url'];
    }
}

if(process.argv.indexOf("-depth") != -1){
    options['depth'] = process.argv[process.argv.indexOf("-depth") + 1];
}

if(process.argv.indexOf("-timeout") != -1){
    options['timeout_ms']  = parseInt(process.argv[process.argv.indexOf("-timeout") + 1]);
}

if(process.argv.indexOf("--silent") != -1){
    options['silent']  = true;
}

if(process.argv.indexOf("-rd") != -1){
    options['restrict_domain']  = parseInt(process.argv[process.argv.indexOf("-rd") + 1]);
}
/* END GET ARGUMENTS */



/* SET OPTIONS */
var stripped_url = options['full_url'].replace(/\W/g, ''),
	fs = require('fs'),
	csvWriter = require('csv-write-stream'),
	Crawler = require("simplecrawler"),	
	crawler = Crawler.crawl(options['full_url']);

	crawler.filterByDomain = options['restrict_domain'],
    crawler.timeout = options['timeout_ms'],
	crawler.maxDepth = options['depth'];
/* END SET OPTIONS */



var writer_all = csvWriter({ headers: ["url", "response_code", "status", "response_message","request_latency", "total_request_time", "content_type","referrer"]});
	writer_all.pipe(fs.createWriteStream(stripped_url+'.csv'));

// REDIRECTED
crawler.on("fetchredirect",function(queueItem){		
	writer_all.write([queueItem.url, '200', queueItem.status,'redirected', queueItem.stateData.requestLatency, queueItem.stateData.requestTime, queueItem.stateData.contentType,queueItem.referrer])
    print_line("Completed fetching redirect:", queueItem.url);
});

// SUCCESS
crawler.on("fetchcomplete",function(queueItem){		
	writer_all.write([queueItem.url, '200', queueItem.status,'', queueItem.stateData.requestLatency, queueItem.stateData.requestTime, queueItem.stateData.contentType,queueItem.referrer])
    print_line("Completed fetching resource:", queueItem.url);
});

// 404s
crawler.on("fetch404", function(queueItem, response){
	writer_all.write([queueItem.url, response.statusCode,  queueItem.status,response.statusMessage, queueItem.stateData.requestLatency, queueItem.stateData.requestTime, queueItem.stateData.contentType,queueItem.referrer])
    print_line("404:", queueItem.url);
});

// ERRORS
crawler.on("fetcherror", function(queueItem, response){
	writer_all.write([queueItem.url, response.statusCode,  queueItem.status,response.statusMessage, queueItem.stateData.requestLatency, queueItem.stateData.requestTime, queueItem.stateData.contentType,queueItem.referrer])
    print_line("Error:", queueItem.url);
});

// END
crawler.on("complete", function(){	
	writer_all.end();
    print_line("Done");
});

// FUNCTIONS
function print_line(prefix, line){
    var pefix = typeof prefix !== 'undefined' ? prefix : '';
    var line = typeof line !== 'undefined' ? line : '';
    if(!options['silent']){
        console.log(prefix + line);
    }
}