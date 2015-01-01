/*
 * ScriptInjector-snippet
 * Copyright (c) 2015 Joris van de Donk
 * Snippet that can be used to inject JavaScript and CSS into a page.
 * Uses cdnjs.com's CDN and APIs.
 * Licensed under the MIT license.
 * Very WIP as of yet ;)
 */

(function() {
    var injectCount = 0;

    function reqListener(xhrdata) {
        var response = JSON.parse(xhrdata);
        var libs = response.results;
        var SI = {};

        var red = "background: #fcc";
        var green = "background: #cfc";
        var blue = "background: #ccf";
        var yellow = "background: #ffc";

        SI.libs = libs;

        SI.search = function(search_str) {
            search_str = search_str.toLowerCase();
            var results = SI.libs.filter(function(result) {
                return (result.name.toLowerCase().indexOf(search_str) > -1);
            });
            if (results.length > 0) {
                var table = results.reduce(function(memo, lib) {
                    memo[lib.name] = lib;
                    return memo;
                }, {});
                console.table(table, ["description"]);
            } else {
                console.log("%cNo libraries found for query '%c" + search_str + "%c'!", blue, green, blue);
            }
            return results;
        };

        SI.getURL = function(libname) {
            var results = SI.searchInHaystack(SI.libs, libname);
            if (results.length === 1) {
                return results[0].latest;
            } else if (results.length === 0) {
                console.log("%cNo libraries found named '%c" + search_str + "%c'!", blue, green, blue);
                return undefined;
            } else {
                console.log("%cMore than 1 library found for name '%c" + search_str + "%c'!", blue, green, blue);
                return undefined;
            }
        }

        SI.getAssets = function(libname, callback) {
            ezXHR("http://api.cdnjs.com/libraries?search=" + libname + "&fields=version,description,assets", function(xhrdata) {
                var libs = JSON.parse(xhrdata).results;
                libs = SI.searchInHaystack(libs, libname);
                callback(libs);
            });
        }

        SI.showAssets = function(libname) {
            SI.getAssets(libname, function(libs) {
                // TODO: length check on the libs and assets.
                console.log(libs);
                var tableToRender = libs[0].assets[0].files.map(function(file) {
                    return "http://cdnjs.cloudflare.com/ajax/libs/" + libname + "/" + libs[0].assets[0].version + "/" + file.name;
                })
                renderHTMLTable(tableToRender, function(row) {
                    return function() {
                        SI.injectURL(row);
                    }
                });
            })
        }

        SI.searchInHaystack = function(haystack, libname) {
            var search_str = libname.toLowerCase();
            var results = haystack.filter(function(result) {
                return (result.name.toLowerCase() === search_str);
            });
            return results;
        }

        SI.inject = function(libname, callback) {
            if (callback === undefined) {
                callback = function() {
                    console.log("%cScript '%c" + libname + "%c' loaded!", blue, yellow, blue);
                };
            }
            SI.injectURL(SI.getURL(libname), libname, callback);
        }

        SI.injectURL = function(url, scriptname, callback) {
            if (scriptname === undefined) {
                scriptname = "SCRIPT" + injectCount;
                injectCount = injectCount + 1;
            }
            if (url !== undefined) {
                url = fixURL(url);
                (function(d, s, id) {
                    var js, fjs = d.getElementsByTagName(s)[0];
                    if (d.getElementById(id)) {
                        return;
                    }
                    if (url.endsWith(".css")) {
                        js = d.createElement('link');
                        js.id = "INJECTED_" + id;
                        js.setAttribute('type', 'text/css');
                        js.setAttribute('rel', 'stylesheet');
                    } else {
                        // assume js
                        js = d.createElement('script');
                        js.id = "INJECTED_" + id;
                    }
                    js.onload = function() {
                        if (callback !== undefined) {
                            callback();
                        } else {
                            console.log("%cFile '%c" + url + "%c' loaded!", blue, yellow, blue);
                        }
                    };
                    if (url.endsWith(".css")) {
                        js.setAttribute("href", url);
                    } else {
                        // assume js
                        js.src = url;
                    }
                    fjs.appendChild(js);
                }(document, 'head', scriptname));
            }
        };

        window.$ScriptInjector = SI;
        console.log("%c$ScriptInjector initialized. Use %c$ScriptInjector%c.%csearch%c and %c$ScriptInjector%c.%cinject%c to search and inject scripts!", blue, red, blue, green, blue, red, blue, green, blue);

		$ScriptInjector.injectURL("http://cdnjs.cloudflare.com/ajax/libs/react/0.13.3/react.js", undefined, function(){
			var styles = {
				'core': {
					'width': '500px',
					'height': '315px',
					'maxWidth': '500px',
					'maxHeight': '315px',
					'position': 'fixed',
					'top': '0px',
					'left': '0px'
				},
				'table': {
					'width': '480px',
					'height': '300px',
					'tableLayout': 'fixed',
					'fontSize': '10px',
					'fontFamily': 'monospace',
					'borderCollapse': 'collapse'
				},
				'tr': {
					'borderBottom': '1px solid #333'
				},
				'tablecontainer': {
					'width': '500px',
					'height': '279px',
					'overflowX': 'hidden',
					'overflowY': 'scroll'
				},
				'statusline': {
					'width': '100%',
					'height': '15px',
					'position': 'absolute',
					'bottom': '0px',
					'left': '0px',
					'fontSize': '10px',
					'fontFamily': 'monospace'
				},
				'searchbox': {
					'width': '100%',
					'height': '21px'
				},
				'nopadding': {
					'padding': '0px',
					'margin': '0px'
				}
			};

			var Injacktor = React.createClass({
				getInitialState: function () {
					return {
						searchResults: [],
						libAssets: undefined,
						statusMessage: ''
					};
				},
				inputUpdated: function(x, y) {
					if (event.keyCode === 13) { // enter
						var searchResults = $ScriptInjector.search(React.findDOMNode(this.refs.searchbox).value);
						var processedSearchResults = searchResults;
						this.setState({'searchResults': processedSearchResults, 'libAssets': undefined});
						React.findDOMNode(this.refs.searchbox).value = "";
						return;
					}
				},
				setStatusMessage: function(msg) {
					var self = this;
					console.log(msg);
					self.setState({'statusMessage': msg});
					setTimeout(function(){ // todo: reset clears on new setStatusMessage call...
						self.setState({'statusMessage': ""});
					}, 3000);
				},
			    render: function() {
			    	var self = this;
					var tableContents;
					if (this.state.libAssets === undefined) {
				    	var tbody = this.state.searchResults.map(function(searchResult, index){
				    		var click = function() {
				    			self.setStatusMessage("Searching for " + searchResult.name);
								$ScriptInjector.getAssets(searchResult.name, function(dat){
									var libassets = dat[0];
									self.setState({'libAssets': libassets});
								});
				    		}
						  	return <tr style={styles.tr}><td><a href={searchResult.homepage} target="_blank">#</a>&nbsp;<span onClick={click}>{searchResult.name}</span></td><td onClick={click}>{searchResult.description}</td></tr>;
						});
						tableContents = <div><thead>
							<th>Name</th>
							<th>Description</th>
						</thead>
						<tbody>
							{tbody}
						</tbody></div>
					} else {
				    	var tbody = this.state.libAssets.assets.map(function(asset, index){
				    		var lis = asset.files.map(function(file){
				    			var clickedFile = function() {
				    				var injectionURL = "http://cdnjs.cloudflare.com/ajax/libs/" + self.state.libAssets.name + "/" + asset.version + "/" + file;
				    				$ScriptInjector.injectURL(injectionURL, undefined, function(){
				    					self.setStatusMessage("Script " + injectionURL + " injected!");
				    				})
				    			};
				    			return <li onClick={clickedFile}>{file}</li>;
				    		});
						  	return <tr style={styles.tr}><td>{asset.version}</td><td>
						  		<ul style={styles.nopadding}>
						  			{lis}
						  		</ul>
						  	</td></tr>;
						});
						tableContents = <div><thead>
							<th>Version of {this.state.libAssets.name}</th>
							<th>Files</th>
						</thead>
						<tbody>
							{tbody}
						</tbody></div>
					}
			        return <div className="injacktor_main" style={styles.core}>
			        	<input ref="searchbox" type="text" placeholder="Search for library name here.." onKeyDown={this.inputUpdated} style={styles.searchbox}></input>
			        	<div style={styles.tablecontainer}>
			        		<table style={styles.table}>
			        			{tableContents}
			        		</table>
			        		<div className="statusLine" style={styles.statusline}>{this.state.statusMessage}</div>
			        	</div>
			    	</div>;
			    }
			});

			var reactContainer = document.createElement("div");
			var injacktorContainer = document.createElement("div");
			injacktorContainer.appendChild(reactContainer);
			document.body.appendChild(injacktorContainer);
			React.render(<Injacktor/>, reactContainer);
		});

    }

    var fixURL = function(url) {
        if (document.URL.indexOf("https://" === 0)) {
            url = url.replace("http://", "https://");
        }
        return url;
    }

    var ezXHR = function(url, callback) {
        var nurl = fixURL(url);
        var request = new XMLHttpRequest();
        request.onload = function() {
            callback(this.responseText);
        };
        request.open("get", nurl, true);
        request.send();
    };

    ezXHR("http://api.cdnjs.com/libraries?search=&fields=version,description,homepage", reqListener);

})();
