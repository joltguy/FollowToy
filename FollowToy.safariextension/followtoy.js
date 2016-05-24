// FollowToy

// An extension for Safari to let you quickly see who does (and doesn't) follow you back on Instagram.
// This extension is not affliated with or endorsed by Instagram in any way.
// No warranty is expressed or implied... use at your own risk!

var FollowToy = {
	version: "FollowToy 1.0",
	userId: "",
	followers: new Array(),
	following: new Array(),
	
	fetchFollowers: function () {
		// Guard
		if (this.userId == "") {
			return;
		}
		var apiCall = "https://www.instagram.com/query?q=ig_user%28" + this.userId + "%29+{%0A++followed_by.first%289999%29+{%0A++++count%2C%0A++++nodes+{%0A++++++id%2C%0A++++++username%0A++++}%0A++}%0A}%0A&ref=relationships%3A%3Afollow_list";
		var xmlhttp;
		
		xmlhttp = new XMLHttpRequest();
		xmlhttp.owner = this;
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var data = JSON.parse(xmlhttp.responseText);
				//println(xmlhttp.responseText);
				
				if (data.followed_by != undefined && data.followed_by.nodes.length > 0) {
					println("Followers: " + data.followed_by.nodes.length);
					for (i = 0; i<data.followed_by.nodes.length; i++) {
						var follower = data.followed_by.nodes[i];
						this.owner.followers.push(follower.username);
						// println(follower.username + " follows you!");
					}
					this.owner.fetchFollowing();
				} else {
					// println("Error: " + xmlhttp.responseText);
					this.owner.followers.push("--ERROR--");
				}
			}
		};
		xmlhttp.open("GET", apiCall, true);
		xmlhttp.send();
	},
	
	fetchFollowing: function () {
		// Guard
		if (this.userId == "") {
			return;
		} else if (this.followers.length < 1 || this.following.length > 0) {
			return;
		} else if (this.followers[0] == "--ERROR--") {
			return;
		}
		
		var apiCall = "https://www.instagram.com/query?q=ig_user%28" + this.userId + "%29+{%0A++follows.first%289999%29+{%0A++++count%2C%0A++++nodes+{%0A++++++id%2C%0A++++++is_verified%2C%0A++++++followed_by_viewer%2C%0A++++++requested_by_viewer%2C%0A++++++full_name%2C%0A++++++profile_pic_url%2C%0A++++++username%0A++++}%0A++}%0A}%0A&ref=relationships%3A%3Afollow_list";
		var xmlhttp;
		
		xmlhttp = new XMLHttpRequest();
		xmlhttp.owner = this;
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var data = JSON.parse(xmlhttp.responseText);
				//println(xmlhttp.responseText);
				
				if (data.follows != undefined && data.follows.nodes.length > 0) {
					println("Following: " + data.follows.nodes.length);
					for (i = 0; i<data.follows.nodes.length; i++) {
						var followedUser = data.follows.nodes[i];
						this.owner.following.push(followedUser);
						// println("following: " + followedUser.username);
					}
					
					// sort alphabetically by username
					this.owner.following.sort(function(a,b) { return a.username.charCodeAt(0) - b.username.charCodeAt(0)});
					
					// create the report element <div> and inject it into the page
					var report = this.owner.createReport();
					var articles = document.getElementsByTagName("article");
					articles[0].insertBefore(report, articles[0].lastChild);
					
					// add our menu item into the profile header
					var headers = document.getElementsByTagName("header");
					var showLink = document.createElement("a");
					showLink.setAttribute("href", "#")					
					showLink.setAttribute("onclick", "document.getElementById('followToyReport').setAttribute('style', 'display: block')");
					showLink.appendChild(document.createTextNode("👀 FollowToy"));
					var linkItem = document.createElement("li");
					linkItem.setAttribute("style", "line-height: 1.2em");
					linkItem.appendChild(showLink);
					headers[0].getElementsByTagName("ul")[0].appendChild(linkItem);
					
				} else {
					println("Error: " + xmlhttp.responseText);
				}
			}
		};
		xmlhttp.open("GET", apiCall, true);
		xmlhttp.send();
	},
	
	createReport: function() {
		var report = document.createElement("div");
		report.setAttribute("id", "followToyReport");
		report.setAttribute("style", "display: none");
		report.appendChild(this.createCloseButton());
				
		var userList = document.createElement("ul");
		for (i=0; i<this.following.length; i++) {
			var username = this.following[i].username;
			var fullname = this.following[i].full_name;
			var userlink = document.createElement("a");
			userlink.setAttribute("href", "https://www.instagram.com/"+username);
			userlink.setAttribute("target", "_blank");
			userlink.appendChild(document.createTextNode(username));
			var listItem = document.createElement("li");
			if (this.followers.indexOf(username) < 0) {
				listItem.appendChild(document.createTextNode("😭"));
				listItem.setAttribute("title", username + " does not follow you.");
				userlink.setAttribute("class","sadLink");
			} else {
				listItem.appendChild(document.createTextNode("🤗"));
				listItem.setAttribute("title", username + " follows you!");
				userlink.setAttribute("class", "happyLink");
			}
			listItem.appendChild(userlink);
			listItem.appendChild(document.createTextNode(" (" + fullname + ")"));
			userList.appendChild(listItem);
		}
		report.appendChild(userList);
		
		return report;
	},
	
	createCloseButton: function()
	{
		var closer = document.createElement("a");
		closer.setAttribute("class", "followToyButton");
		closer.setAttribute("onclick", "document.getElementById('followToyReport').setAttribute('style', 'display: none;');");
		closer.setAttribute("href", "#")
		closer.appendChild(document.createTextNode(" ❎ "));
		return closer;
	},
	
	detectUserProfile: function()
	{
		// I'm just checking for the existence of the "Edit Profile" button to confirm that
		// we are currently on the user's profile page. Not super-robust but it works.
		var detected = false;
		var links = document.getElementsByTagName("a");
		for (var i = 0; i<links.length; i++) {
			if (links[i].getAttribute("href").indexOf("/accounts/edit") == 0) {
				detected = true;
				break;
			}
		}
		
		return detected;
	},
	
	start: function() { this.fetchFollowers(); }
};

// Global helper function to parse out a cookie value
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

// Logging function
function println(message)
{
	console.log("[FollowToy] " + message);
}

// main() ---------------------------
document.onreadystatechange = function() {
	// Give the DOM some time to (hopefully) construct...
	setTimeout(function() {
		var followToy = Object.create(FollowToy);
		followToy.userId = getCookie("ds_user_id");
		
		println(followToy.version + " loaded.");
			
		if (followToy.userId == "") {
			println("Error: Not logged into Instagram.");
		} else {
			println("Instagram UID: " + followToy.userId);
			if (followToy.detectUserProfile()) {
				followToy.start();
			} else {
				println("Not running because this is not your profile page.");
			}
		}
	}, 1000);
}
