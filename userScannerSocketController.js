var socket;
var Socket={						//the socket object
	setup: function (){
				logConsole("setup Called");
				//var host = "ws: //127.0.0.1: 8080/ws";
				var host = "wss://subredditscannerserver.herokuapp.com/";
				socket = new WebSocket(host);
				if (socket) {
					socket.onopen = function() {
						$(".notConnectedSpan").addClass("isConnectedSpan").removeClass("notConnectedSpan").text("connected");

					}
					socket.onmessage = function(msg) {
						var data = JSON.parse(msg.data);
						var value = data['value'];
						var key = data['key'];
						var eventType = data['event'];

						logConsole(data);
						//logConsole(key+" "+Event+" "+value);

						if(eventType=="pageEvent"){
							$("#OutputParagraph").html(data["value"]+"<br/>"+$("#OutputParagraph").html());
						}
						else if(eventType=="printTest"){
							console.log("->"+value);
						}
						else if(eventType=="errorMessage"){
							$(".outputHeader").text(data["value"]);
						}
						else if(eventType=="Local"){								//store incoming data in localStorage
							localStorage.setItem("Local", value);	//
						}
						else if(eventType=='startup'){
							//imgUrl=value;
						}
						else if(eventType=="changeOutputHeader"){
							$(".outputHeader").text("CheckingValidity");
						}
						else if(eventType=="changeOutputHeader2"){
							$(".outputHeader").text(data["text"]);
						}
						else if(eventType=="clearOutputField"){
							$("#OutputParagraph").text("");
							var typeStr="User";
							if(data["message"]=='p'){
								typeStr="Post";
							}
							else if(data["message"]=='s'){
								typeStr="Subreddit";
							}
							$(".outputHeader").text("Scanning Valid "+typeStr);
						}
						else if(eventType=="message"){
							$("#returnTextField").text(
								data['value']);
						}else if(eventType=="returnPostReport"){
							console.log("Post Report Recieved");
							var subredditHits=data["subredditHits"];
							var subredditHitsString="Custom Scan activity:  ";
							var hateSubredditHitsString="Hatesub activity:  ";
							var hateSubredditHits=data["hateSubHits"];
							$(".outputHeader").text("Post Report");
							for (var key in subredditHits) {
							  if (subredditHits.hasOwnProperty(key)) {
							    subredditHitsString=subredditHitsString+"<br/>"+ '<a href="https://reddit.com/r/' + key + '">' + key+"</a>: "+subredditHits[key]+"<br/>";
							  }
							}
							for (var key in hateSubredditHits) {
							  if (hateSubredditHits.hasOwnProperty(key)) {
							    hateSubredditHitsString=hateSubredditHitsString+"<br/>"+key+": "+hateSubredditHits[key]+"<br/>";
							  }
							}
							$("#OutputParagraph").html($("#OutputParagraph").html()+
								"<br/>Username:  " + '<a href="https://reddit.com/user/' + data["username"] + '">' + data["username"]+
								"</a><br/>Flagged Total:  "+data["flagLevel"]+
								"<br/>"+hateSubredditHitsString+
								"<br/>"+subredditHitsString+"<br/>"
							);
						}
						else if(eventType=="returnReport"){
							console.log("SubredditHits",data["subredditHits"]);
							var subredditHits=data["subredditHits"];
							var subredditHitsString="Custom SubReddit Hits: ";
							var hateSubredditHitsString="HateSub activity: ";
							var hateSubredditHits=data["hateSubHits"];
							$(".outputHeader").text("Output");
							for (var key in subredditHits) {
							  if (subredditHits.hasOwnProperty(key)) {
							    subredditHitsString=subredditHitsString+"->"+key+": "+subredditHits[key]+"<br/>";
							  }
							}
							for (var key in hateSubredditHits) {
							  if (hateSubredditHits.hasOwnProperty(key)) {
							    hateSubredditHitsString=hateSubredditHitsString+"<br/>"+key+": "+hateSubredditHits[key]+"<br/>";
							  }
							}
							$("#OutputParagraph").html($("#OutputParagraph").html()+
							"<br/>Username: "+data["username"]+
							"<br/>HateSubreddit Hits: "+data["flagLevel"]+
							"<br/>"+hateSubredditHitsString+
							"<br/>"+subredditHitsString+"<br/>"
						);
							if(data["doDefault"]===true){
								$("#OutputParagraph").html($("#OutputParagraph").html()+
								//"<br/>DefaultScan Submission Count: "+data["flaggedSubmissionCount"]+
								//"<br/>DefaultScan Comments Count: "+data["flaggedCommentsCount"]+
								"<br/>DeepScan Level: "+data["flagLevel"]
								);
							}
						}

					}
					socket.onclose = function() {
						logConsole("Socket Closed");//console.log("SocketClosed");
						$(".outputHeader").text("Output");
						$(".isConnectedSpan").addClass("notConnectedSpan").removeClass("isConnectedSpan").text("Not Connected");

						setTimeout(function(){
								Socket.setup();
						}, 300);
					}
				} else {
					logConsole("invalid socket");
				}
			},

			getValue: function(key){		//get value from server
				var msg={event: "valueRequest",key: key};
				sendMessage(msg);
			},

			sendMessage: function(msg) {//accepts a json strings
				waitForSocketConnection(socket, function() {
						socket.send(msg);
				});
		},
		sendJsonValue: function(val,doEscape){//val is a json object,
			if((typeof val.key)=="string" && doEscape==true){
				//val.key=RegExp.unescape(val.key);
			}
			this.sendMessage(JSON.stringify(val));
		},
		sendServerMessage: function(key,value,actionType){
			//if addExtended path ==true, add escaped(smartDashboard) to key
				if((typeof key)=="string"){
						//key=RegExp.unescape(key);
				}
			var val={
				"key": key,
				"value": value,
				"action": actionType
			}
			this.sendMessage(JSON.stringify(val));
		}
}

var showLogs=true;
function logConsole(message){
	if(showLogs==true){
	console.log(message);}
}
RegExp.escape = function(text) {
	if (!arguments.callee.sRE) {
		var specials = [
			'/', '.', '*', '+', '?', '|',
			'(', ')', '[', ']', '{', '}', '\\'
		];
		arguments.callee.sRE = new RegExp(
			'(\\' + specials.join('|\\') + ')', 'g'
		);
	}
	return text.replace(arguments.callee.sRE, '\\$1');
}
RegExp.unescape=function(text){
	return text.replace(/\\/g,"")
}
waitForSocketConnection=function(sock,callback){
	//Callback to make sure it waits for finished connection before it sends messages
	setTimeout(
				function(){
						if (sock.readyState === 1) {
								if(callback !== undefined){
										callback();
								}
								return;
						} else {
					waitForSocketConnection(sock,callback);
						}
				}, 5);
}


jQuery(function($) {
	if (!("WebSocket" in window)) {
		alert("Your browser does not support web sockets");
	} else {
		Socket.setup();
	}

});
