// loadjs@4.3.0 downloaded from https://ga.jspm.io/npm:loadjs@4.3.0/dist/loadjs.umd.js

var e={};(function(n,s){true;e=s()})(0,(function(){var devnull=function(){},e={},n={},s={};
/**
   * Subscribe to bundle load event.
   * @param {string[]} bundleIds - Bundle ids
   * @param {Function} callbackFn - The callback function
   */function subscribe(e,t){e=e.push?e:[e];var l,r,i,o,u=[],a=e.length,c=a;l=function(e,n){n.length&&u.push(e);c--;c||t(u)};while(a--){r=e[a];i=n[r];if(i)l(r,i);else{o=s[r]=s[r]||[];o.push(l)}}}
/**
   * Publish bundle load event.
   * @param {string} bundleId - Bundle id
   * @param {string[]} pathsNotFound - List of files not found
   */function publish(e,t){if(e){var l=s[e];n[e]=t;if(l)while(l.length){l[0](e,t);l.splice(0,1)}}}
/**
   * Execute callbacks.
   * @param {Object or Function} args - The callback args
   * @param {string[]} depsNotFound - List of dependencies not found
   */function executeCallbacks(e,n){e.call&&(e={success:e});n.length?(e.error||devnull)(n):(e.success||devnull)(e)}
/**
   * Load individual file.
   * @param {string} path - The file path
   * @param {Function} callbackFn - The callback function
   */function loadFile(e,n,s,t){var l,r,i,o=document,u=s.async,a=(s.numRetries||0)+1,c=s.before||devnull,f=e.replace(/[\?|#].*$/,""),d=e.replace(/^(css|img|module|nomodule)!/,"");t=t||0;if(/(^css!|\.css$)/.test(f)){i=o.createElement("link");i.rel="stylesheet";i.href=d;l="hideFocus"in i;if(l&&i.relList){l=0;i.rel="preload";i.as="style"}}else if(/(^img!|\.(png|gif|jpg|svg|webp)$)/.test(f)){i=o.createElement("img");i.src=d}else{i=o.createElement("script");i.src=d;i.async=u===void 0||u;r="noModule"in i;if(/^module!/.test(f)){if(!r)return n(e,"l");i.type="module"}else if(/^nomodule!/.test(f)&&r)return n(e,"l")}i.onload=i.onerror=i.onbeforeload=function(r){var o=r.type[0];if(l)try{i.sheet.cssText.length||(o="e")}catch(e){e.code!=18&&(o="e")}if(o=="e"){t+=1;if(t<a)return loadFile(e,n,s,t)}else if(i.rel=="preload"&&i.as=="style")return i.rel="stylesheet";n(e,o,r.defaultPrevented)};c(e,i)!==false&&o.head.appendChild(i)}
/**
   * Load multiple files.
   * @param {string[]} paths - The file paths
   * @param {Function} callbackFn - The callback function
   */function loadFiles(e,n,s){e=e.push?e:[e];var t,l,r=e.length,i=r,o=[];t=function(e,s,t){s=="e"&&o.push(e);if(s=="b"){if(!t)return;o.push(e)}r--;r||n(o)};for(l=0;l<i;l++)loadFile(e[l],t,s)}
/**
   * Initiate script load and register bundle.
   * @param {(string|string[])} paths - The file paths
   * @param {(string|Function|Object)} [arg1] - The (1) bundleId or (2) success
   *   callback or (3) object literal with success/error arguments, numRetries,
   *   etc.
   * @param {(Function|Object)} [arg2] - The (1) success callback or (2) object
   *   literal with success/error arguments, numRetries, etc.
   */function loadjs(n,s,t){var l,r;s&&s.trim&&(l=s);r=(l?t:s)||{};if(l){if(l in e)throw"LoadJS";e[l]=true}function loadFn(e,s){loadFiles(n,(function(n){executeCallbacks(r,n);e&&executeCallbacks({success:e,error:s},n);publish(l,n)}),r)}if(r.returnPromise)return new Promise(loadFn);loadFn()}
/**
   * Execute callbacks when dependencies have been satisfied.
   * @param {(string|string[])} deps - List of bundle ids
   * @param {Object} args - success/error arguments
   */loadjs.ready=function ready(e,n){subscribe(e,(function(e){executeCallbacks(n,e)}));return loadjs};
/**
   * Manually satisfy bundle dependencies.
   * @param {string} bundleId - The bundle id
   */loadjs.done=function done(e){publish(e,[])};loadjs.reset=function reset(){e={};n={};s={}};
/**
   * Determine if bundle has already been defined
   * @param String} bundleId - The bundle id
   */loadjs.isDefined=function isDefined(n){return n in e};return loadjs}));var n=e;export{n as default};

