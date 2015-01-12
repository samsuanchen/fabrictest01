(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\ksana2015\\fabrictest01\\index.js":[function(require,module,exports){
var runtime=require("ksana2015-webruntime");
runtime.boot("fabrictest01",function(){
	var Main=React.createElement(require("./src/main.jsx"));
	ksana.mainComponent=React.render(Main,document.getElementById("main"));
});
},{"./src/main.jsx":"C:\\ksana2015\\fabrictest01\\src\\main.jsx","ksana2015-webruntime":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js"}],"C:\\ksana2015\\fabrictest01\\src\\main.jsx":[function(require,module,exports){
var kse=require("ksana-search");
var maincomponent = React.createClass({displayName: "maincomponent",
  getInitialState:function() {
  	return {result:[]};
  },
  componentDidMount:function() {
  	kse.search("sample","資生",{range:{start:0}},function(err,data){
  		this.setState({result:data.excerpt});
  	},this);
  },
  render: function() {
    return React.createElement("div", null, "Hello ", this.state.result);
  }
});
module.exports=maincomponent;
},{"ksana-search":"C:\\ksana2015\\node_modules\\ksana-search\\index.js"}],"C:\\ksana2015\\node_modules\\ksana-analyzer\\configs.js":[function(require,module,exports){
var tokenizers=require('./tokenizers');
var normalizeTbl=null;
var setNormalizeTable=function(tbl,obj) {
	if (!obj) {
		obj={};
		for (var i=0;i<tbl.length;i++) {
			var arr=tbl[i].split("=");
			obj[arr[0]]=arr[1];
		}
	}
	normalizeTbl=obj;
	return obj;
}
var normalize1=function(token) {
	if (!token) return "";
	token=token.replace(/[ \n\.,，。！．「」：；、]/g,'').trim();
	if (!normalizeTbl) return token;
	if (token.length==1) {
		return normalizeTbl[token] || token;
	} else {
		for (var i=0;i<token.length;i++) {
			token[i]=normalizeTbl[token[i]] || token[i];
		}
		return token;
	}
}
var isSkip1=function(token) {
	var t=token.trim();
	return (t=="" || t=="　" || t=="※" || t=="\n");
}
var normalize_tibetan=function(token) {
	return token.replace(/[།་ ]/g,'').trim();
}

var isSkip_tibetan=function(token) {
	var t=token.trim();
	return (t=="" || t=="　" ||  t=="\n");	
}
var simple1={
	func:{
		tokenize:tokenizers.simple
		,setNormalizeTable:setNormalizeTable
		,normalize: normalize1
		,isSkip:	isSkip1
	}
	
}
var tibetan1={
	func:{
		tokenize:tokenizers.tibetan
		,setNormalizeTable:setNormalizeTable
		,normalize:normalize_tibetan
		,isSkip:isSkip_tibetan
	}
}
module.exports={"simple1":simple1,"tibetan1":tibetan1}
},{"./tokenizers":"C:\\ksana2015\\node_modules\\ksana-analyzer\\tokenizers.js"}],"C:\\ksana2015\\node_modules\\ksana-analyzer\\index.js":[function(require,module,exports){
/* 
  custom func for building and searching ydb

  keep all version
  
  getAPI(version); //return hash of functions , if ver is omit , return lastest
	
  postings2Tree      // if version is not supply, get lastest
  tokenize(text,api) // convert a string into tokens(depends on other api)
  normalizeToken     // stemming and etc
  isSpaceChar        // not a searchable token
  isSkipChar         // 0 vpos

  for client and server side
  
*/
var configs=require("./configs");
var config_simple="simple1";
var optimize=function(json,config) {
	config=config||config_simple;
	return json;
}

var getAPI=function(config) {
	config=config||config_simple;
	var func=configs[config].func;
	func.optimize=optimize;
	if (config=="simple1") {
		//add common custom function here
	} else if (config=="tibetan1") {

	} else throw "config "+config +"not supported";

	return func;
}

module.exports={getAPI:getAPI};
},{"./configs":"C:\\ksana2015\\node_modules\\ksana-analyzer\\configs.js"}],"C:\\ksana2015\\node_modules\\ksana-analyzer\\tokenizers.js":[function(require,module,exports){
var tibetan =function(s) {
	//continuous tsheg grouped into same token
	//shad and space grouped into same token
	var offset=0;
	var tokens=[],offsets=[];
	s=s.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
	var arr=s.split('\n');

	for (var i=0;i<arr.length;i++) {
		var last=0;
		var str=arr[i];
		str.replace(/[།་ ]+/g,function(m,m1){
			tokens.push(str.substring(last,m1)+m);
			offsets.push(offset+last);
			last=m1+m.length;
		});
		if (last<str.length) {
			tokens.push(str.substring(last));
			offsets.push(last);
		}
		if (i===arr.length-1) break;
		tokens.push('\n');
		offsets.push(offset+last);
		offset+=str.length+1;
	}

	return {tokens:tokens,offsets:offsets};
};
var isSpace=function(c) {
	return (c==" ") ;//|| (c==",") || (c==".");
}
var isCJK =function(c) {return ((c>=0x3000 && c<=0x9FFF) 
|| (c>=0xD800 && c<0xDC00) || (c>=0xFF00) ) ;}
var simple1=function(s) {
	var offset=0;
	var tokens=[],offsets=[];
	s=s.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
	arr=s.split('\n');

	var pushtoken=function(t,off) {
		var i=0;
		if (t.charCodeAt(0)>255) {
			while (i<t.length) {
				var c=t.charCodeAt(i);
				offsets.push(off+i);
				tokens.push(t[i]);
				if (c>=0xD800 && c<=0xDFFF) {
					tokens[tokens.length-1]+=t[i]; //extension B,C,D
				}
				i++;
			}
		} else {
			tokens.push(t);
			offsets.push(off);	
		}
	}
	for (var i=0;i<arr.length;i++) {
		var last=0,sp="";
		str=arr[i];
		str.replace(/[_0-9A-Za-z]+/g,function(m,m1){
			while (isSpace(sp=str[last]) && last<str.length) {
				tokens[tokens.length-1]+=sp;
				last++;
			}
			pushtoken(str.substring(last,m1)+m , offset+last);
			offsets.push(offset+last);
			last=m1+m.length;
		});

		if (last<str.length) {
			while (isSpace(sp=str[last]) && last<str.length) {
				tokens[tokens.length-1]+=sp;
				last++;
			}
			pushtoken(str.substring(last), offset+last);
			
		}		
		offsets.push(offset+last);
		offset+=str.length+1;
		if (i===arr.length-1) break;
		tokens.push('\n');
	}

	return {tokens:tokens,offsets:offsets};

};

var simple=function(s) {
	var token='';
	var tokens=[], offsets=[] ;
	var i=0; 
	var lastspace=false;
	var addtoken=function() {
		if (!token) return;
		tokens.push(token);
		offsets.push(i);
		token='';
	}
	while (i<s.length) {
		var c=s.charAt(i);
		var code=s.charCodeAt(i);
		if (isCJK(code)) {
			addtoken();
			token=c;
			if (code>=0xD800 && code<0xDC00) { //high sorragate
				token+=s.charAt(i+1);i++;
			}
			addtoken();
		} else {
			if (c=='&' || c=='<' || c=='?' || c=="," || c=="."
			|| c=='|' || c=='~' || c=='`' || c==';' 
			|| c=='>' || c==':' 
			|| c=='=' || c=='@'  || c=="-" 
			|| c==']' || c=='}'  || c==")" 
			//|| c=='{' || c=='}'|| c=='[' || c==']' || c=='(' || c==')'
			|| code==0xf0b || code==0xf0d // tibetan space
			|| (code>=0x2000 && code<=0x206f)) {
				addtoken();
				if (c=='&' || c=='<'){ // || c=='{'|| c=='('|| c=='[') {
					var endchar='>';
					if (c=='&') endchar=';'
					//else if (c=='{') endchar='}';
					//else if (c=='[') endchar=']';
					//else if (c=='(') endchar=')';

					while (i<s.length && s.charAt(i)!=endchar) {
						token+=s.charAt(i);
						i++;
					}
					token+=endchar;
					addtoken();
				} else {
					token=c;
					addtoken();
				}
				token='';
			} else {
				if (c==" ") {
					token+=c;
					lastspace=true;
				} else {
					if (lastspace) addtoken();
					lastspace=false;
					token+=c;
				}
			}
		}
		i++;
	}
	addtoken();
	return {tokens:tokens,offsets:offsets};
}
module.exports={simple:simple,tibetan:tibetan};
},{}],"C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js":[function(require,module,exports){
var indexOfSorted = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    array[mid] < obj ? low = mid + 1 : high = mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};
var indexOfSorted_str = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    (array[mid].localeCompare(obj)<0) ? low = mid + 1 : high = mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};


var bsearch=function(array,value,near) {
	var func=indexOfSorted;
	if (typeof array[0]=="string") func=indexOfSorted_str;
	return func(array,value,near);
}
var bsearchNear=function(array,value) {
	return bsearch(array,value,true);
}

module.exports=bsearch;//{bsearchNear:bsearchNear,bsearch:bsearch};
},{}],"C:\\ksana2015\\node_modules\\ksana-database\\index.js":[function(require,module,exports){
var KDE=require("./kde");
//currently only support node.js fs, ksanagap native fs, html5 file system
//use socket.io to read kdb from remote server in future
module.exports=KDE;
},{"./kde":"C:\\ksana2015\\node_modules\\ksana-database\\kde.js"}],"C:\\ksana2015\\node_modules\\ksana-database\\kde.js":[function(require,module,exports){
/* Ksana Database Engine

   2015/1/2 , 
   move to ksana-database
   simplified by removing document support and socket.io support


*/
var pool={},localPool={};
var apppath="";
var bsearch=require("./bsearch");
var Kdb=require('ksana-jsonrom');
var kdbs=[]; //available kdb , id and absolute path
var strsep="\uffff";
var kdblisted=false;
/*
var _getSync=function(paths,opts) {
	var out=[];
	for (var i in paths) {
		out.push(this.getSync(paths[i],opts));	
	}
	return out;
}
*/
var _gets=function(paths,opts,cb) { //get many data with one call

	if (!paths) return ;
	if (typeof paths=='string') {
		paths=[paths];
	}
	var engine=this, output=[];

	var makecb=function(path){
		return function(data){
				if (!(data && typeof data =='object' && data.__empty)) output.push(data);
				engine.get(path,opts,taskqueue.shift());
		};
	};

	var taskqueue=[];
	for (var i=0;i<paths.length;i++) {
		if (typeof paths[i]=="null") { //this is only a place holder for key data already in client cache
			output.push(null);
		} else {
			taskqueue.push(makecb(paths[i]));
		}
	};

	taskqueue.push(function(data){
		output.push(data);
		cb.apply(engine.context||engine,[output,paths]); //return to caller
	});

	taskqueue.shift()({__empty:true}); //run the task
}

var getFileRange=function(i) {
	var engine=this;

	var filesegcount=engine.get(["filesegcount"]);
	if (filesegcount) {
		if (i==0) {
			return {start:0,end:filesegcount[0]-1};
		} else {
			return {start:filesegcount[i-1],end:filesegcount[i]-1};
		}
	}
	//old buggy code
	var filenames=engine.get(["filenames"]);
	var fileoffsets=engine.get(["fileoffsets"]);
	var segoffsets=engine.get(["segoffsets"]);
	var segnames=engine.get(["segnames"]);
	var filestart=fileoffsets[i], fileend=fileoffsets[i+1]-1;

	var start=bsearch(segoffsets,filestart,true);
	//if (segOffsets[start]==fileStart) start--;
	
	//work around for jiangkangyur
	while (segNames[start+1]=="_") start++;

  //if (i==0) start=0; //work around for first file
	var end=bsearch(segoffsets,fileend,true);
	return {start:start,end:end};
}

var getfileseg=function(absoluteseg) {
	var fileoffsets=this.get(["fileoffsets"]);
	var segoffsets=this.get(["segoffsets"]);
	var segoffset=segOffsets[absoluteseg];
	var file=bsearch(fileOffsets,segoffset,true)-1;

	var fileStart=fileoffsets[file];
	var start=bsearch(segoffsets,fileStart,true);	

	var seg=absoluteseg-start-1;
	return {file:file,seg:seg};
}
//return array of object of nfile nseg given segname
var findSeg=function(segname) {
	var segnames=this.get("segnames");
	var out=[];
	for (var i=0;i<segnames.length;i++) {
		if (segnames[i]==segname) {
			var fileseg=getfileseg.apply(this,[i]);
			out.push({file:fileseg.file,seg:fileseg.seg,absseg:i});
		}
	}
	return out;
}
var getFileSegOffsets=function(i) {
	var segoffsets=this.get("segoffsets");
	var range=getFileRange.apply(this,[i]);
	return segoffsets.slice(range.start,range.end+1);
}

var getFileSegNames=function(i) {
	var range=getFileRange.apply(this,[i]);
	var segnames=this.get("segnames");
	return segnames.slice(range.start,range.end+1);
}
var localengine_get=function(path,opts,cb) {
	var engine=this;
	if (typeof opts=="function") {
		cb=opts;
		opts={recursive:false};
	}
	if (!path) {
		if (cb) cb(null);
		return null;
	}

	if (typeof cb!="function") {
		return engine.kdb.get(path,opts);
	}

	if (typeof path=="string") {
		return engine.kdb.get([path],opts,cb);
	} else if (typeof path[0] =="string") {
		return engine.kdb.get(path,opts,cb);
	} else if (typeof path[0] =="object") {
		return _gets.apply(engine,[path,opts,cb]);
	} else {
		engine.kdb.get([],opts,function(data){
			cb(data[0]);//return top level keys
		});
	}
};	

var getPreloadField=function(user) {
	var preload=[["meta"],["filenames"],["fileoffsets"],["segnames"],["segoffsets"],["filesegcount"]];
	//["tokens"],["postingslen"] kse will load it
	if (user && user.length) { //user supply preload
		for (var i=0;i<user.length;i++) {
			if (preload.indexOf(user[i])==-1) {
				preload.push(user[i]);
			}
		}
	}
	return preload;
}
var createLocalEngine=function(kdb,opts,cb,context) {
	var engine={kdb:kdb, queryCache:{}, postingCache:{}, cache:{}};

	if (typeof context=="object") engine.context=context;
	engine.get=localengine_get;

	engine.segOffset=segOffset;
	engine.fileOffset=fileOffset;
	engine.getFileSegNames=getFileSegNames;
	engine.getFileSegOffsets=getFileSegOffsets;
	engine.getFileRange=getFileRange;
	engine.findSeg=findSeg;
	//only local engine allow getSync
	//if (kdb.fs.getSync) engine.getSync=engine.kdb.getSync;
	
	//speedy native functions
	if (kdb.fs.mergePostings) {
		engine.mergePostings=kdb.fs.mergePostings.bind(kdb.fs);
	}
	
	var setPreload=function(res) {
		engine.dbname=res[0].name;
		//engine.customfunc=customfunc.getAPI(res[0].config);
		engine.ready=true;
	}

	var preload=getPreloadField(opts.preload);
	var opts={recursive:true};
	//if (typeof cb=="function") {
		_gets.apply(engine,[ preload, opts,function(res){
			setPreload(res);
			cb.apply(engine.context,[engine]);
		}]);
	//} else {
	//	setPreload(_getSync.apply(engine,[preload,opts]));
	//}
	return engine;
}

var segOffset=function(segname) {
	var engine=this;
	if (arguments.length>1) throw "argument : segname ";

	var segNames=engine.get("segnames");
	var segOffsets=engine.get("segoffsets");

	var i=segNames.indexOf(segname);
	return (i>-1)?segOffsets[i]:0;
}
var fileOffset=function(fn) {
	var engine=this;
	var filenames=engine.get("filenames");
	var offsets=engine.get("fileoffsets");
	var i=filenames.indexOf(fn);
	if (i==-1) return null;
	return {start: offsets[i], end:offsets[i+1]};
}

var folderOffset=function(folder) {
	var engine=this;
	var start=0,end=0;
	var filenames=engine.get("filenames");
	var offsets=engine.get("fileoffsets");
	for (var i=0;i<filenames.length;i++) {
		if (filenames[i].substring(0,folder.length)==folder) {
			if (!start) start=offsets[i];
			end=offsets[i];
		} else if (start) break;
	}
	return {start:start,end:end};
}

 //TODO delete directly from kdb instance
 //kdb.free();
var closeLocal=function(kdbid) {
	var engine=localPool[kdbid];
	if (engine) {
		engine.kdb.free();
		delete localPool[kdbid];
	}
}
var close=function(kdbid) {
	var engine=pool[kdbid];
	if (engine) {
		engine.kdb.free();
		delete pool[kdbid];
	}
}

var getLocalTries=function(kdbfn) {
	if (!kdblisted) {
		kdbs=require("./listkdb")();
		kdblisted=true;
	}

	var kdbid=kdbfn.replace('.kdb','');
	var tries= ["./"+kdbid+".kdb"
	           ,"../"+kdbid+".kdb"
	];

	for (var i=0;i<kdbs.length;i++) {
		if (kdbs[i][0]==kdbid) {
			tries.push(kdbs[i][1]);
		}
	}
	return tries;
}
var openLocalKsanagap=function(kdbid,opts,cb,context) {
	var kdbfn=kdbid;
	var tries=getLocalTries(kdbfn);

	for (var i=0;i<tries.length;i++) {
		if (fs.existsSync(tries[i])) {
			//console.log("kdb path: "+nodeRequire('path').resolve(tries[i]));
			var kdb=new Kdb.open(tries[i],function(err,kdb){
				if (err) {
					cb.apply(context,[err]);
				} else {
					createLocalEngine(kdb,opts,function(engine){
						localPool[kdbid]=engine;
						cb.apply(context||engine.context,[0,engine]);
					},context);
				}
			});
			return null;
		}
	}
	if (cb) cb.apply(context,[kdbid+" not found"]);
	return null;

}
var openLocalNode=function(kdbid,opts,cb,context) {
	var fs=require('fs');
	var tries=getLocalTries(kdbid);

	for (var i=0;i<tries.length;i++) {
		if (fs.existsSync(tries[i])) {

			new Kdb.open(tries[i],function(err,kdb){
				if (err) {
					cb.apply(context||engine.content,[err]);
				} else {
					createLocalEngine(kdb,opts,function(engine){
							localPool[kdbid]=engine;
							cb.apply(context||engine.context,[0,engine]);
					},context);
				}
			});
			return null;
		}
	}
	if (cb) cb.apply(context,[kdbid+" not found"]);
	return null;
}

var openLocalHtml5=function(kdbid,opts,cb,context) {	
	var engine=localPool[kdbid];
	var kdbfn=kdbid;
	if (kdbfn.indexOf(".kdb")==-1) kdbfn+=".kdb";
	new Kdb.open(kdbfn,function(err,handle){
		if (err) {
			cb.apply(context,[err]);
		} else {
			createLocalEngine(handle,opts,function(engine){
				localPool[kdbid]=engine;
				cb.apply(context||engine.context,[0,engine]);
			},context);
		}
	});
}
//omit cb for syncronize open
var openLocal=function(kdbid,opts,cb,context)  {
	if (typeof opts=="function") { //no opts
		if (typeof cb=="object") context=cb;
		cb=opts;
		opts={};
	}

	var engine=localPool[kdbid];
	if (engine) {
		if (cb) cb.apply(context||engine.context,[0,engine]);
		return engine;
	}

	var platform=require("./platform").getPlatform();
	if (platform=="node-webkit" || platform=="node") {
		openLocalNode(kdbid,opts,cb,context);
	} else if (platform=="html5" || platform=="chrome"){
		openLocalHtml5(kdbid,opts,cb,context);		
	} else {
		openLocalKsanagap(kdbid,opts,cb,context);	
	}
}
var setPath=function(path) {
	apppath=path;
	console.log("set path",path)
}

var enumKdb=function(cb,context){
	return kdbs.map(function(k){return k[0]});
}

module.exports={open:openLocal,setPath:setPath, close:closeLocal, enumKdb:enumKdb};
},{"./bsearch":"C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js","./listkdb":"C:\\ksana2015\\node_modules\\ksana-database\\listkdb.js","./platform":"C:\\ksana2015\\node_modules\\ksana-database\\platform.js","fs":false,"ksana-jsonrom":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js"}],"C:\\ksana2015\\node_modules\\ksana-database\\listkdb.js":[function(require,module,exports){
/* return array of dbid and absolute path*/
var listkdb_html5=function() {
	throw "not implement yet";
	require("ksana-jsonrom").html5fs.readdir(function(kdbs){
			cb.apply(this,[kdbs]);
	},context||this);		

}

var listkdb_node=function(){
	var fs=require("fs");
	var path=require("path")
	var parent=path.resolve(process.cwd(),"..");
	var files=fs.readdirSync(parent);
	var output=[];
	files.map(function(f){
		var subdir=parent+path.sep+f;
		var stat=fs.statSync(subdir );
		if (stat.isDirectory()) {
			var subfiles=fs.readdirSync(subdir);
			for (var i=0;i<subfiles.length;i++) {
				var file=subfiles[i];
				var idx=file.indexOf(".kdb");
				if (idx>-1&&idx==file.length-4) {
					output.push([ file.substr(0,file.length-4), subdir+path.sep+file]);
				}
			}
		}
	})
	return output;
}
var fileNameOnly=function(fn) {
	var at=fn.lastIndexOf("/");
	if (at>-1) return fn.substr(at+1);
	return fn;
}
var listkdb_ksanagap=function() {
	var output=[];
	var apps=JSON.parse(kfs.listApps());
	for (var i=0;i<apps.length;i++) {
		var app=apps[i];
		if (app.files) for (var j=0;j<app.files.length;j++) {
			var file=app.files[j];
			if (file.substr(file.length-4)==".kdb") {
				output.push([app.dbid,fileNameOnly(file)]);
			}
		}
	};
	return output;
}
var listkdb=function() {
	var platform=require("./platform").getPlatform();
	var files=[];
	if (platform=="node" || platform=="node-webkit") {
		files=listkdb_node();
	} else if (typeof kfs!="undefined") {
		files=listkdb_ksanagap();
	} else {
		throw "not implement yet";
	}
	return files;
}
module.exports=listkdb;
},{"./platform":"C:\\ksana2015\\node_modules\\ksana-database\\platform.js","fs":false,"ksana-jsonrom":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js","path":false}],"C:\\ksana2015\\node_modules\\ksana-database\\platform.js":[function(require,module,exports){
var getPlatform=function() {
	if (typeof ksanagap=="undefined") {
		platform="node";
	} else {
		platform=ksanagap.platform;
	}
	return platform;
}
module.exports={getPlatform:getPlatform};
},{}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\html5read.js":[function(require,module,exports){

/* emulate filesystem on html5 browser */
/* emulate filesystem on html5 browser */
var read=function(handle,buffer,offset,length,position,cb) {//buffer and offset is not used
	var xhr = new XMLHttpRequest();
	xhr.open('GET', handle.url , true);
	var range=[position,length+position-1];
	xhr.setRequestHeader('Range', 'bytes='+range[0]+'-'+range[1]);
	xhr.responseType = 'arraybuffer';
	xhr.send();
	xhr.onload = function(e) {
		var that=this;
		setTimeout(function(){
			cb(0,that.response.byteLength,that.response);
		},0);
	}; 
}
var close=function(handle) {}
var fstatSync=function(handle) {
	throw "not implement yet";
}
var fstat=function(handle,cb) {
	throw "not implement yet";
}
var _open=function(fn_url,cb) {
		var handle={};
		if (fn_url.indexOf("filesystem:")==0){
			handle.url=fn_url;
			handle.fn=fn_url.substr( fn_url.lastIndexOf("/")+1);
		} else {
			handle.fn=fn_url;
			var url=API.files.filter(function(f){ return (f[0]==fn_url)});
			if (url.length) handle.url=url[0][1];
			else cb(null);
		}
		cb(handle);
}
var open=function(fn_url,cb) {
		if (!API.initialized) {init(1024*1024,function(){
			_open.apply(this,[fn_url,cb]);
		},this)} else _open.apply(this,[fn_url,cb]);
}
var load=function(filename,mode,cb) {
	open(filename,mode,cb,true);
}
function errorHandler(e) {
	console.error('Error: ' +e.name+ " "+e.message);
}
var readdir=function(cb,context) {
	 var dirReader = API.fs.root.createReader();
	 var out=[],that=this;
		dirReader.readEntries(function(entries) {
			if (entries.length) {
				for (var i = 0, entry; entry = entries[i]; ++i) {
					if (entry.isFile) {
						out.push([entry.name,entry.toURL ? entry.toURL() : entry.toURI()]);
					}
				}
			}
			API.files=out;
			if (cb) cb.apply(context,[out]);
		}, function(){
			if (cb) cb.apply(context,[null]);
		});
}
var initfs=function(grantedBytes,cb,context) {
	webkitRequestFileSystem(PERSISTENT, grantedBytes,  function(fs) {
		API.fs=fs;
		API.quota=grantedBytes;
		readdir(function(){
			API.initialized=true;
			cb.apply(context,[grantedBytes,fs]);
		},context);
	}, errorHandler);
}
var init=function(quota,cb,context) {
	navigator.webkitPersistentStorage.requestQuota(quota, 
			function(grantedBytes) {
				initfs(grantedBytes,cb,context);
		}, errorHandler 
	);
}
var API={
	read:read
	,readdir:readdir
	,open:open
	,close:close
	,fstatSync:fstatSync
	,fstat:fstat
}
module.exports=API;
},{}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js":[function(require,module,exports){
module.exports={
	open:require("./kdb")
	,create:require("./kdbw")
}

},{"./kdb":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdb.js","./kdbw":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbw.js"}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdb.js":[function(require,module,exports){
/*
	KDB version 3.0 GPL
	yapcheahshen@gmail.com
	2013/12/28
	asyncronize version of yadb

  remove dependency of Q, thanks to
  http://stackoverflow.com/questions/4234619/how-to-avoid-long-nesting-of-asynchronous-functions-in-node-js

  2015/1/2
  moved to ksanaforge/ksana-jsonrom
  add err in callback for node.js compliant
*/
var Kfs=null;

if (typeof ksanagap=="undefined") {
	Kfs=require('./kdbfs');			
} else {
	if (ksanagap.platform=="ios") {
		Kfs=require("./kdbfs_ios");
	} else if (ksanagap.platform=="node-webkit") {
		Kfs=require("./kdbfs");
	} else if (ksanagap.platform=="chrome") {
		Kfs=require("./kdbfs");
	} else {
		Kfs=require("./kdbfs_android");
	}
		
}


var DT={
	uint8:'1', //unsigned 1 byte integer
	int32:'4', // signed 4 bytes integer
	utf8:'8',  
	ucs2:'2',
	bool:'^', 
	blob:'&',
	utf8arr:'*', //shift of 8
	ucs2arr:'@', //shift of 2
	uint8arr:'!', //shift of 1
	int32arr:'$', //shift of 4
	vint:'`',
	pint:'~',	

	array:'\u001b',
	object:'\u001a' 
	//ydb start with object signature,
	//type a ydb in command prompt shows nothing
}
var verbose=0, readLog=function(){};
var _readLog=function(readtype,bytes) {
	console.log(readtype,bytes,"bytes");
}
if (verbose) readLog=_readLog;
var strsep="\uffff";
var Create=function(path,opts,cb) {
	/* loadxxx functions move file pointer */
	// load variable length int
	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}

	
	var loadVInt =function(opts,blocksize,count,cb) {
		//if (count==0) return [];
		var that=this;

		this.fs.readBuf_packedint(opts.cur,blocksize,count,true,function(o){
			//console.log("vint");
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	var loadVInt1=function(opts,cb) {
		var that=this;
		loadVInt.apply(this,[opts,6,1,function(data){
			//console.log("vint1");
			cb.apply(that,[data[0]]);
		}])
	}
	//for postings
	var loadPInt =function(opts,blocksize,count,cb) {
		var that=this;
		this.fs.readBuf_packedint(opts.cur,blocksize,count,false,function(o){
			//console.log("pint");
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	// item can be any type (variable length)
	// maximum size of array is 1TB 2^40
	// structure:
	// signature,5 bytes offset, payload, itemlengths
	var getArrayLength=function(opts,cb) {
		var that=this;
		var dataoffset=0;

		this.fs.readUI8(opts.cur,function(len){
			var lengthoffset=len*4294967296;
			opts.cur++;
			that.fs.readUI32(opts.cur,function(len){
				opts.cur+=4;
				dataoffset=opts.cur; //keep this
				lengthoffset+=len;
				opts.cur+=lengthoffset;

				loadVInt1.apply(that,[opts,function(count){
					loadVInt.apply(that,[opts,count*6,count,function(sz){						
						cb({count:count,sz:sz,offset:dataoffset});
					}]);
				}]);
				
			});
		});
	}

	var loadArray = function(opts,blocksize,cb) {
		var that=this;
		getArrayLength.apply(this,[opts,function(L){
				var o=[];
				var endcur=opts.cur;
				opts.cur=L.offset;

				if (opts.lazy) { 
						var offset=L.offset;
						L.sz.map(function(sz){
							o[o.length]=strsep+offset.toString(16)
								   +strsep+sz.toString(16);
							offset+=sz;
						})
				} else {
					var taskqueue=[];
					for (var i=0;i<L.count;i++) {
						taskqueue.push(
							(function(sz){
								return (
									function(data){
										if (typeof data=='object' && data.__empty) {
											 //not pushing the first call
										}	else o.push(data);
										opts.blocksize=sz;
										load.apply(that,[opts, taskqueue.shift()]);
									}
								);
							})(L.sz[i])
						);
					}
					//last call to child load
					taskqueue.push(function(data){
						o.push(data);
						opts.cur=endcur;
						cb.apply(that,[o]);
					});
				}

				if (opts.lazy) cb.apply(that,[o]);
				else {
					taskqueue.shift()({__empty:true});
				}
			}
		])
	}		
	// item can be any type (variable length)
	// support lazy load
	// structure:
	// signature,5 bytes offset, payload, itemlengths, 
	//                    stringarray_signature, keys
	var loadObject = function(opts,blocksize,cb) {
		var that=this;
		var start=opts.cur;
		getArrayLength.apply(this,[opts,function(L) {
			opts.blocksize=blocksize-opts.cur+start;
			load.apply(that,[opts,function(keys){ //load the keys
				if (opts.keys) { //caller ask for keys
					keys.map(function(k) { opts.keys.push(k)});
				}

				var o={};
				var endcur=opts.cur;
				opts.cur=L.offset;
				if (opts.lazy) { 
					var offset=L.offset;
					for (var i=0;i<L.sz.length;i++) {
						//prefix with a \0, impossible for normal string
						o[keys[i]]=strsep+offset.toString(16)
							   +strsep+L.sz[i].toString(16);
						offset+=L.sz[i];
					}
				} else {
					var taskqueue=[];
					for (var i=0;i<L.count;i++) {
						taskqueue.push(
							(function(sz,key){
								return (
									function(data){
										if (typeof data=='object' && data.__empty) {
											//not saving the first call;
										} else {
											o[key]=data; 
										}
										opts.blocksize=sz;
										if (verbose) readLog("key",key);
										load.apply(that,[opts, taskqueue.shift()]);
									}
								);
							})(L.sz[i],keys[i-1])

						);
					}
					//last call to child load
					taskqueue.push(function(data){
						o[keys[keys.length-1]]=data;
						opts.cur=endcur;
						cb.apply(that,[o]);
					});
				}
				if (opts.lazy) cb.apply(that,[o]);
				else {
					taskqueue.shift()({__empty:true});
				}
			}]);
		}]);
	}

	//item is same known type
	var loadStringArray=function(opts,blocksize,encoding,cb) {
		var that=this;
		this.fs.readStringArray(opts.cur,blocksize,encoding,function(o){
			opts.cur+=blocksize;
			cb.apply(that,[o]);
		});
	}
	var loadIntegerArray=function(opts,blocksize,unitsize,cb) {
		var that=this;
		loadVInt1.apply(this,[opts,function(count){
			var o=that.fs.readFixedArray(opts.cur,count,unitsize,function(o){
				opts.cur+=count*unitsize;
				cb.apply(that,[o]);
			});
		}]);
	}
	var loadBlob=function(blocksize,cb) {
		var o=this.fs.readBuf(this.cur,blocksize);
		this.cur+=blocksize;
		return o;
	}	
	var loadbysignature=function(opts,signature,cb) {
		  var blocksize=opts.blocksize||this.fs.size; 
			opts.cur+=this.fs.signature_size;
			var datasize=blocksize-this.fs.signature_size;
			//basic types
			if (signature===DT.int32) {
				opts.cur+=4;
				this.fs.readI32(opts.cur-4,cb);
			} else if (signature===DT.uint8) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,cb);
			} else if (signature===DT.utf8) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'utf8',cb);
			} else if (signature===DT.ucs2) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'ucs2',cb);	
			} else if (signature===DT.bool) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,function(data){cb(!!data)});
			} else if (signature===DT.blob) {
				loadBlob(datasize,cb);
			}
			//variable length integers
			else if (signature===DT.vint) {
				loadVInt.apply(this,[opts,datasize,datasize,cb]);
			}
			else if (signature===DT.pint) {
				loadPInt.apply(this,[opts,datasize,datasize,cb]);
			}
			//simple array
			else if (signature===DT.utf8arr) {
				loadStringArray.apply(this,[opts,datasize,'utf8',cb]);
			}
			else if (signature===DT.ucs2arr) {
				loadStringArray.apply(this,[opts,datasize,'ucs2',cb]);
			}
			else if (signature===DT.uint8arr) {
				loadIntegerArray.apply(this,[opts,datasize,1,cb]);
			}
			else if (signature===DT.int32arr) {
				loadIntegerArray.apply(this,[opts,datasize,4,cb]);
			}
			//nested structure
			else if (signature===DT.array) {
				loadArray.apply(this,[opts,datasize,cb]);
			}
			else if (signature===DT.object) {
				loadObject.apply(this,[opts,datasize,cb]);
			}
			else {
				console.error('unsupported type',signature,opts)
				cb.apply(this,[null]);//make sure it return
				//throw 'unsupported type '+signature;
			}
	}

	var load=function(opts,cb) {
		opts=opts||{}; // this will served as context for entire load procedure
		opts.cur=opts.cur||0;
		var that=this;
		this.fs.readSignature(opts.cur, function(signature){
			loadbysignature.apply(that,[opts,signature,cb])
		});
		return this;
	}
	var CACHE=null;
	var KEY={};
	var ADDRESS={};
	var reset=function(cb) {
		if (!CACHE) {
			load.apply(this,[{cur:0,lazy:true},function(data){
				CACHE=data;
				cb.call(this);
			}]);	
		} else {
			cb.call(this);
		}
	}

	var exists=function(path,cb) {
		if (path.length==0) return true;
		var key=path.pop();
		var that=this;
		get.apply(this,[path,false,function(data){
			if (!path.join(strsep)) return (!!KEY[key]);
			var keys=KEY[path.join(strsep)];
			path.push(key);//put it back
			if (keys) cb.apply(that,[keys.indexOf(key)>-1]);
			else cb.apply(that,[false]);
		}]);
	}

	var getSync=function(path) {
		if (!CACHE) return undefined;	
		var o=CACHE;
		for (var i=0;i<path.length;i++) {
			var r=o[path[i]];
			if (typeof r=="undefined") return null;
			o=r;
		}
		return o;
	}
	var get=function(path,opts,cb) {
		if (typeof path=='undefined') path=[];
		if (typeof path=="string") path=[path];
		//opts.recursive=!!opts.recursive;
		if (typeof opts=="function") {
			cb=opts;node
			opts={};
		}
		var that=this;
		if (typeof cb!='function') return getSync(path);

		reset.apply(this,[function(){
			var o=CACHE;
			if (path.length==0) {
				if (opts.address) {
					cb([0,that.fs.size]);
				} else {
					cb(Object.keys(CACHE));	
				}
				return;
			} 
			
			var pathnow="",taskqueue=[],newopts={},r=null;
			var lastkey="";

			for (var i=0;i<path.length;i++) {
				var task=(function(key,k){

					return (function(data){
						if (!(typeof data=='object' && data.__empty)) {
							if (typeof o[lastkey]=='string' && o[lastkey][0]==strsep) o[lastkey]={};
							o[lastkey]=data; 
							o=o[lastkey];
							r=data[key];
							KEY[pathnow]=opts.keys;								
						} else {
							data=o[key];
							r=data;
						}

						if (typeof r==="undefined") {
							taskqueue=null;
							cb.apply(that,[r]); //return empty value
						} else {							
							if (parseInt(k)) pathnow+=strsep;
							pathnow+=key;
							if (typeof r=='string' && r[0]==strsep) { //offset of data to be loaded
								var p=r.substring(1).split(strsep).map(function(item){return parseInt(item,16)});
								var cur=p[0],sz=p[1];
								newopts.lazy=!opts.recursive || (k<path.length-1) ;
								newopts.blocksize=sz;newopts.cur=cur,newopts.keys=[];
								lastkey=key; //load is sync in android
								if (opts.address && taskqueue.length==1) {
									ADDRESS[pathnow]=[cur,sz];
									taskqueue.shift()(null,ADDRESS[pathnow]);
								} else {
									load.apply(that,[newopts, taskqueue.shift()]);
								}
							} else {
								if (opts.address && taskqueue.length==1) {
									taskqueue.shift()(null,ADDRESS[pathnow]);
								} else {
									taskqueue.shift().apply(that,[r]);
								}
							}
						}
					})
				})
				(path[i],i);
				
				taskqueue.push(task);
			}

			if (taskqueue.length==0) {
				cb.apply(that,[o]);
			} else {
				//last call to child load
				taskqueue.push(function(data,cursz){
					if (opts.address) {
						cb.apply(that,[cursz]);
					} else{
						var key=path[path.length-1];
						o[key]=data; KEY[pathnow]=opts.keys;
						cb.apply(that,[data]);
					}
				});
				taskqueue.shift()({__empty:true});			
			}

		}]); //reset
	}
	// get all keys in given path
	var getkeys=function(path,cb) {
		if (!path) path=[]
		var that=this;
		get.apply(this,[path,false,function(){
			if (path && path.length) {
				cb.apply(that,[KEY[path.join(strsep)]]);
			} else {
				cb.apply(that,[Object.keys(CACHE)]); 
				//top level, normally it is very small
			}
		}]);
	}

	var setupapi=function() {
		this.load=load;
//		this.cur=0;
		this.cache=function() {return CACHE};
		this.key=function() {return KEY};
		this.free=function() {
			CACHE=null;
			KEY=null;
			this.fs.free();
		}
		this.setCache=function(c) {CACHE=c};
		this.keys=getkeys;
		this.get=get;   // get a field, load if needed
		this.exists=exists;
		this.DT=DT;
		
		//install the sync version for node
		//if (typeof process!="undefined") require("./kdb_sync")(this);
		//if (cb) setTimeout(cb.bind(this),0);
		var that=this;
		var err=0;
		if (cb) {
			setTimeout(function(){
				cb(err,that);	
			},0);
		}
	}
	var that=this;
	var kfs=new Kfs(path,opts,function(err){
		if (err) {
			setTimeout(function(){
				cb(err,0);
			},0);
			return null;
		} else {
			that.size=this.size;
			setupapi.call(that);			
		}
	});
	this.fs=kfs;
	return this;
}

Create.datatypes=DT;

if (module) module.exports=Create;
//return Create;

},{"./kdbfs":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs.js","./kdbfs_android":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_android.js","./kdbfs_ios":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_ios.js"}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs.js":[function(require,module,exports){
/* node.js and html5 file system abstraction layer*/
try {
	var fs=require("fs");
	var Buffer=require("buffer").Buffer;
} catch (e) {
	var fs=require('./html5read');
	var Buffer=function(){ return ""};
	var html5fs=true; 	
}
var signature_size=1;
var verbose=0, readLog=function(){};
var _readLog=function(readtype,bytes) {
	console.log(readtype,bytes,"bytes");
}
if (verbose) readLog=_readLog;

var unpack_int = function (ar, count , reset) {
   count=count||ar.length;
  var r = [], i = 0, v = 0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;	  
	} while (ar[++i] & 0x80);
	r.push(v); if (reset) v=0;
	count--;
  } while (i<ar.length && count);
  return {data:r, adv:i };
}
var Open=function(path,opts,cb) {
	opts=opts||{};

	var readSignature=function(pos,cb) {
		var buf=new Buffer(signature_size);
		var that=this;
		fs.read(this.handle,buf,0,signature_size,pos,function(err,len,buffer){
			if (html5fs) var signature=String.fromCharCode((new Uint8Array(buffer))[0])
			else var signature=buffer.toString('utf8',0,signature_size);
			cb.apply(that,[signature]);
		});
	}

	//this is quite slow
	//wait for StringView +ArrayBuffer to solve the problem
	//https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/ylgiNY_ZSV0
	//if the string is always ucs2
	//can use Uint16 to read it.
	//http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
	var decodeutf8 = function (utftext) {
		var string = "";
		var i = 0;
		var c=0,c1 = 0, c2 = 0 , c3=0;
		for (var i=0;i<utftext.length;i++) {
			if (utftext.charCodeAt(i)>127) break;
		}
		if (i>=utftext.length) return utftext;

		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
			if (c < 128) {
				string += utftext[i];
				i++;
			} else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}

	var readString= function(pos,blocksize,encoding,cb) {
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		var that=this;
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			readLog("string",len);
			if (html5fs) {
				if (encoding=='utf8') {
					var str=decodeutf8(String.fromCharCode.apply(null, new Uint8Array(buffer)))
				} else { //ucs2 is 3 times faster
					var str=String.fromCharCode.apply(null, new Uint16Array(buffer))	
				}
				
				cb.apply(that,[str]);
			} 
			else cb.apply(that,[buffer.toString(encoding)]);	
		});
	}

	//work around for chrome fromCharCode cannot accept huge array
	//https://code.google.com/p/chromium/issues/detail?id=56588
	var buf2stringarr=function(buf,enc) {
		if (enc=="utf8") 	var arr=new Uint8Array(buf);
		else var arr=new Uint16Array(buf);
		var i=0,codes=[],out=[],s="";
		while (i<arr.length) {
			if (arr[i]) {
				codes[codes.length]=arr[i];
			} else {
				s=String.fromCharCode.apply(null,codes);
				if (enc=="utf8") out[out.length]=decodeutf8(s);
				else out[out.length]=s;
				codes=[];				
			}
			i++;
		}
		
		s=String.fromCharCode.apply(null,codes);
		if (enc=="utf8") out[out.length]=decodeutf8(s);
		else out[out.length]=s;

		return out;
	}
	var readStringArray = function(pos,blocksize,encoding,cb) {
		var that=this,out=null;
		if (blocksize==0) return [];
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			if (html5fs) {
				readLog("stringArray",buffer.byteLength);

				if (encoding=='utf8') {
					out=buf2stringarr(buffer,"utf8");
				} else { //ucs2 is 3 times faster
					out=buf2stringarr(buffer,"ucs2");
				}
			} else {
				readLog("stringArray",buffer.length);
				out=buffer.toString(encoding).split('\0');
			} 	
			cb.apply(that,[out]);
		});
	}
	var readUI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			readLog("ui32",len);
			if (html5fs){
				//v=(new Uint32Array(buffer))[0];
				var v=new DataView(buffer).getUint32(0, false)
				cb(v);
			}
			else cb.apply(that,[buffer.readInt32BE(0)]);	
		});		
	}

	var readI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			readLog("i32",len);
			if (html5fs){
				var v=new DataView(buffer).getInt32(0, false)
				cb(v);
			}
			else  	cb.apply(that,[buffer.readInt32BE(0)]);	
		});
	}
	var readUI8=function(pos,cb) {
		var buffer=new Buffer(1);
		var that=this;

		fs.read(this.handle,buffer,0,1,pos,function(err,len,buffer){
			readLog("ui8",len);
			if (html5fs)cb( (new Uint8Array(buffer))[0]) ;
			else  			cb.apply(that,[buffer.readUInt8(0)]);	
			
		});
	}
	var readBuf=function(pos,blocksize,cb) {
		var that=this;
		var buf=new Buffer(blocksize);
		fs.read(this.handle,buf,0,blocksize,pos,function(err,len,buffer){
			readLog("buf",len);
			var buff=new Uint8Array(buffer)
			cb.apply(that,[buff]);
		});
	}
	var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
		var that=this;
		readBuf.apply(this,[pos,blocksize,function(buffer){
			cb.apply(that,[unpack_int(buffer,count,reset)]);	
		}]);
		
	}
	var readFixedArray_html5fs=function(pos,count,unitsize,cb) {
		var func=null;
		if (unitsize===1) {
			func='getUint8';//Uint8Array;
		} else if (unitsize===2) {
			func='getUint16';//Uint16Array;
		} else if (unitsize===4) {
			func='getUint32';//Uint32Array;
		} else throw 'unsupported integer size';

		fs.read(this.handle,null,0,unitsize*count,pos,function(err,len,buffer){
			readLog("fix array",len);
			var out=[];
			if (unitsize==1) {
				out=new Uint8Array(buffer);
			} else {
				for (var i = 0; i < len / unitsize; i++) { //endian problem
				//	out.push( func(buffer,i*unitsize));
					out.push( v=new DataView(buffer)[func](i,false) );
				}
			}

			cb.apply(that,[out]);
		});
	}
	// signature, itemcount, payload
	var readFixedArray = function(pos ,count, unitsize,cb) {
		var func=null;
		var that=this;
		
		if (unitsize* count>this.size && this.size)  {
			console.log("array size exceed file size",this.size)
			return;
		}
		
		if (html5fs) return readFixedArray_html5fs.apply(this,[pos,count,unitsize,cb]);

		var items=new Buffer( unitsize* count);
		if (unitsize===1) {
			func=items.readUInt8;
		} else if (unitsize===2) {
			func=items.readUInt16BE;
		} else if (unitsize===4) {
			func=items.readUInt32BE;
		} else throw 'unsupported integer size';
		//console.log('itemcount',itemcount,'buffer',buffer);

		fs.read(this.handle,items,0,unitsize*count,pos,function(err,len,buffer){
			readLog("fix array",len);
			var out=[];
			for (var i = 0; i < items.length / unitsize; i++) {
				out.push( func.apply(items,[i*unitsize]));
			}
			cb.apply(that,[out]);
		});
	}

	var free=function() {
		//console.log('closing ',handle);
		fs.closeSync(this.handle);
	}
	var setupapi=function() {
		var that=this;
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.free=free;
		if (html5fs) {
			var fn=path;
			if (path.indexOf("filesystem:")==0) fn=path.substr(path.lastIndexOf("/"));
			fs.fs.root.getFile(fn,{},function(entry){
			  entry.getMetadata(function(metadata) { 
				that.size=metadata.size;
				if (cb) setTimeout(cb.bind(that),0);
				});
			});
		} else {
			var stat=fs.fstatSync(this.handle);
			this.stat=stat;
			this.size=stat.size;		
			if (cb)	setTimeout(cb.bind(this,0),0);	
		}
	}

	var that=this;
	if (html5fs) {
		fs.open(path,function(h){
			if (!h) {
				if (cb)	setTimeout(cb.bind(null,"file not found:"+path),0);	
			} else {
				that.handle=h;
				that.html5fs=true;
				setupapi.call(that);
				that.opened=true;				
			}
		})
	} else {
		if (fs.existsSync(path)){
			this.handle=fs.openSync(path,'r');//,function(err,handle){
			this.opened=true;
			setupapi.call(this);
		} else {
			if (cb)	setTimeout(cb.bind(null,"file not found:"+path),0);	
			return null;
		}
	}
	return this;
}
module.exports=Open;
},{"./html5read":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\html5read.js","buffer":false,"fs":false}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_android.js":[function(require,module,exports){
/*
  JAVA can only return Number and String
	array and buffer return in string format
	need JSON.parse
*/
var verbose=0;

var readSignature=function(pos,cb) {
	if (verbose) console.debug("read signature");
	var signature=kfs.readUTF8String(this.handle,pos,1);
	if (verbose) console.debug(signature,signature.charCodeAt(0));
	cb.apply(this,[signature]);
}
var readI32=function(pos,cb) {
	if (verbose) console.debug("read i32 at "+pos);
	var i32=kfs.readInt32(this.handle,pos);
	if (verbose) console.debug(i32);
	cb.apply(this,[i32]);	
}
var readUI32=function(pos,cb) {
	if (verbose) console.debug("read ui32 at "+pos);
	var ui32=kfs.readUInt32(this.handle,pos);
	if (verbose) console.debug(ui32);
	cb.apply(this,[ui32]);
}
var readUI8=function(pos,cb) {
	if (verbose) console.debug("read ui8 at "+pos); 
	var ui8=kfs.readUInt8(this.handle,pos);
	if (verbose) console.debug(ui8);
	cb.apply(this,[ui8]);
}
var readBuf=function(pos,blocksize,cb) {
	if (verbose) console.debug("read buffer at "+pos+ " blocksize "+blocksize);
	var buf=kfs.readBuf(this.handle,pos,blocksize);
	var buff=JSON.parse(buf);
	if (verbose) console.debug("buffer length"+buff.length);
	cb.apply(this,[buff]);	
}
var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
	if (verbose) console.debug("read packed int at "+pos+" blocksize "+blocksize+" count "+count);
	var buf=kfs.readBuf_packedint(this.handle,pos,blocksize,count,reset);
	var adv=parseInt(buf);
	var buff=JSON.parse(buf.substr(buf.indexOf("[")));
	if (verbose) console.debug("packedInt length "+buff.length+" first item="+buff[0]);
	cb.apply(this,[{data:buff,adv:adv}]);	
}


var readString= function(pos,blocksize,encoding,cb) {
	if (verbose) console.debug("readstring at "+pos+" blocksize " +blocksize+" enc:"+encoding);
	if (encoding=="ucs2") {
		var str=kfs.readULE16String(this.handle,pos,blocksize);
	} else {
		var str=kfs.readUTF8String(this.handle,pos,blocksize);	
	}	 
	if (verbose) console.debug(str);
	cb.apply(this,[str]);	
}

var readFixedArray = function(pos ,count, unitsize,cb) {
	if (verbose) console.debug("read fixed array at "+pos+" count "+count+" unitsize "+unitsize); 
	var buf=kfs.readFixedArray(this.handle,pos,count,unitsize);
	var buff=JSON.parse(buf);
	if (verbose) console.debug("array length"+buff.length);
	cb.apply(this,[buff]);	
}
var readStringArray = function(pos,blocksize,encoding,cb) {
	if (verbose) console.log("read String array at "+pos+" blocksize "+blocksize +" enc "+encoding); 
	encoding = encoding||"utf8";
	var buf=kfs.readStringArray(this.handle,pos,blocksize,encoding);
	//var buff=JSON.parse(buf);
	if (verbose) console.debug("read string array");
	var buff=buf.split("\uffff"); //cannot return string with 0
	if (verbose) console.debug("array length"+buff.length);
	cb.apply(this,[buff]);	
}
var mergePostings=function(positions,cb) {
	var buf=kfs.mergePostings(this.handle,JSON.stringify(positions));
	if (!buf || buf.length==0) return [];
	else return JSON.parse(buf);
}

var free=function() {
	//console.log('closing ',handle);
	kfs.close(this.handle);
}
var Open=function(path,opts,cb) {
	opts=opts||{};
	var signature_size=1;
	var setupapi=function() { 
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.mergePostings=mergePostings;
		this.free=free;
		this.size=kfs.getFileSize(this.handle);
		if (verbose) console.log("filesize  "+this.size);
		if (cb)	cb.call(this);
	}

	this.handle=kfs.open(path);
	this.opened=true;
	setupapi.call(this);
	return this;
}

module.exports=Open;
},{}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_ios.js":[function(require,module,exports){
/*
  JSContext can return all Javascript types.
*/
var verbose=1;

var readSignature=function(pos,cb) {
	if (verbose)  ksanagap.log("read signature at "+pos);
	var signature=kfs.readUTF8String(this.handle,pos,1);
	if (verbose)  ksanagap.log(signature+" "+signature.charCodeAt(0));
	cb.apply(this,[signature]);
}
var readI32=function(pos,cb) {
	if (verbose)  ksanagap.log("read i32 at "+pos);
	var i32=kfs.readInt32(this.handle,pos);
	if (verbose)  ksanagap.log(i32);
	cb.apply(this,[i32]);	
}
var readUI32=function(pos,cb) {
	if (verbose)  ksanagap.log("read ui32 at "+pos);
	var ui32=kfs.readUInt32(this.handle,pos);
	if (verbose)  ksanagap.log(ui32);
	cb.apply(this,[ui32]);
}
var readUI8=function(pos,cb) {
	if (verbose)  ksanagap.log("read ui8 at "+pos); 
	var ui8=kfs.readUInt8(this.handle,pos);
	if (verbose)  ksanagap.log(ui8);
	cb.apply(this,[ui8]);
}
var readBuf=function(pos,blocksize,cb) {
	if (verbose)  ksanagap.log("read buffer at "+pos);
	var buf=kfs.readBuf(this.handle,pos,blocksize);
	if (verbose)  ksanagap.log("buffer length"+buf.length);
	cb.apply(this,[buf]);	
}
var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
	if (verbose)  ksanagap.log("read packed int fast, blocksize "+blocksize+" at "+pos);var t=new Date();
	var buf=kfs.readBuf_packedint(this.handle,pos,blocksize,count,reset);
	if (verbose)  ksanagap.log("return from packedint, time" + (new Date()-t));
	if (typeof buf.data=="string") {
		buf.data=eval("["+buf.data.substr(0,buf.data.length-1)+"]");
	}
	if (verbose)  ksanagap.log("unpacked length"+buf.data.length+" time" + (new Date()-t) );
	cb.apply(this,[buf]);
}


var readString= function(pos,blocksize,encoding,cb) {

	if (verbose)  ksanagap.log("readstring at "+pos+" blocksize "+blocksize+" "+encoding);var t=new Date();
	if (encoding=="ucs2") {
		var str=kfs.readULE16String(this.handle,pos,blocksize);
	} else {
		var str=kfs.readUTF8String(this.handle,pos,blocksize);	
	}
	if (verbose)  ksanagap.log(str+" time"+(new Date()-t));
	cb.apply(this,[str]);	
}

var readFixedArray = function(pos ,count, unitsize,cb) {
	if (verbose)  ksanagap.log("read fixed array at "+pos); var t=new Date();
	var buf=kfs.readFixedArray(this.handle,pos,count,unitsize);
	if (verbose)  ksanagap.log("array length "+buf.length+" time"+(new Date()-t));
	cb.apply(this,[buf]);	
}
var readStringArray = function(pos,blocksize,encoding,cb) {
	//if (verbose)  ksanagap.log("read String array "+blocksize +" "+encoding); 
	encoding = encoding||"utf8";
	if (verbose)  ksanagap.log("read string array at "+pos);var t=new Date();
	var buf=kfs.readStringArray(this.handle,pos,blocksize,encoding);
	if (typeof buf=="string") buf=buf.split("\0");
	//var buff=JSON.parse(buf);
	//var buff=buf.split("\uffff"); //cannot return string with 0
	if (verbose)  ksanagap.log("string array length"+buf.length+" time"+(new Date()-t));
	cb.apply(this,[buf]);
}

var mergePostings=function(positions) {
	var buf=kfs.mergePostings(this.handle,positions);
	if (typeof buf=="string") {
		buf=eval("["+buf.substr(0,buf.length-1)+"]");
	}
	return buf;
}
var free=function() {
	////if (verbose)  ksanagap.log('closing ',handle);
	kfs.close(this.handle);
}
var Open=function(path,opts,cb) {
	opts=opts||{};
	var signature_size=1;
	var setupapi=function() { 
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.mergePostings=mergePostings;
		this.free=free;
		this.size=kfs.getFileSize(this.handle);
		if (verbose)  ksanagap.log("filesize  "+this.size);
		if (cb)	cb.call(this);
	}

	this.handle=kfs.open(path);
	this.opened=true;
	setupapi.call(this);
	return this;
}

module.exports=Open;
},{}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbw.js":[function(require,module,exports){
/*
  convert any json into a binary buffer
  the buffer can be saved with a single line of fs.writeFile
*/

var DT={
	uint8:'1', //unsigned 1 byte integer
	int32:'4', // signed 4 bytes integer
	utf8:'8',  
	ucs2:'2',
	bool:'^', 
	blob:'&',
	utf8arr:'*', //shift of 8
	ucs2arr:'@', //shift of 2
	uint8arr:'!', //shift of 1
	int32arr:'$', //shift of 4
	vint:'`',
	pint:'~',	

	array:'\u001b',
	object:'\u001a' 
	//ydb start with object signature,
	//type a ydb in command prompt shows nothing
}
var key_writing="";//for debugging
var pack_int = function (ar, savedelta) { // pack ar into
  if (!ar || ar.length === 0) return []; // empty array
  var r = [],
  i = 0,
  j = 0,
  delta = 0,
  prev = 0;
  
  do {
	delta = ar[i];
	if (savedelta) {
		delta -= prev;
	}
	if (delta < 0) {
	  console.trace('negative',prev,ar[i])
	  throw 'negetive';
	  break;
	}
	
	r[j++] = delta & 0x7f;
	delta >>= 7;
	while (delta > 0) {
	  r[j++] = (delta & 0x7f) | 0x80;
	  delta >>= 7;
	}
	prev = ar[i];
	i++;
  } while (i < ar.length);
  return r;
}
var Kfs=function(path,opts) {
	
	var handle=null;
	opts=opts||{};
	opts.size=opts.size||65536*2048; 
	console.log('kdb estimate size:',opts.size);
	var dbuf=new Buffer(opts.size);
	var cur=0;//dbuf cursor
	
	var writeSignature=function(value,pos) {
		dbuf.write(value,pos,value.length,'utf8');
		if (pos+value.length>cur) cur=pos+value.length;
		return value.length;
	}
	var writeOffset=function(value,pos) {
		dbuf.writeUInt8(Math.floor(value / (65536*65536)),pos);
		dbuf.writeUInt32BE( value & 0xFFFFFFFF,pos+1);
		if (pos+5>cur) cur=pos+5;
		return 5;
	}
	var writeString= function(value,pos,encoding) {
		encoding=encoding||'ucs2';
		if (value=="") throw "cannot write null string";
		if (encoding==='utf8')dbuf.write(DT.utf8,pos,1,'utf8');
		else if (encoding==='ucs2')dbuf.write(DT.ucs2,pos,1,'utf8');
		else throw 'unsupported encoding '+encoding;
			
		var len=Buffer.byteLength(value, encoding);
		dbuf.write(value,pos+1,len,encoding);
		
		if (pos+len+1>cur) cur=pos+len+1;
		return len+1; // signature
	}
	var writeStringArray = function(value,pos,encoding) {
		encoding=encoding||'ucs2';
		if (encoding==='utf8') dbuf.write(DT.utf8arr,pos,1,'utf8');
		else if (encoding==='ucs2')dbuf.write(DT.ucs2arr,pos,1,'utf8');
		else throw 'unsupported encoding '+encoding;
		
		var v=value.join('\0');
		var len=Buffer.byteLength(v, encoding);
		if (0===len) {
			throw "empty string array " + key_writing;
		}
		dbuf.write(v,pos+1,len,encoding);
		if (pos+len+1>cur) cur=pos+len+1;
		return len+1;
	}
	var writeI32=function(value,pos) {
		dbuf.write(DT.int32,pos,1,'utf8');
		dbuf.writeInt32BE(value,pos+1);
		if (pos+5>cur) cur=pos+5;
		return 5;
	}
	var writeUI8=function(value,pos) {
		dbuf.write(DT.uint8,pos,1,'utf8');
		dbuf.writeUInt8(value,pos+1);
		if (pos+2>cur) cur=pos+2;
		return 2;
	}
	var writeBool=function(value,pos) {
		dbuf.write(DT.bool,pos,1,'utf8');
		dbuf.writeUInt8(Number(value),pos+1);
		if (pos+2>cur) cur=pos+2;
		return 2;
	}		
	var writeBlob=function(value,pos) {
		dbuf.write(DT.blob,pos,1,'utf8');
		value.copy(dbuf, pos+1);
		var written=value.length+1;
		if (pos+written>cur) cur=pos+written;
		return written;
	}		
	/* no signature */
	var writeFixedArray = function(value,pos,unitsize) {
		//console.log('v.len',value.length,items.length,unitsize);
		if (unitsize===1) var func=dbuf.writeUInt8;
		else if (unitsize===4)var func=dbuf.writeInt32BE;
		else throw 'unsupported integer size';
		if (!value.length) {
			throw "empty fixed array "+key_writing;
		}
		for (var i = 0; i < value.length ; i++) {
			func.apply(dbuf,[value[i],i*unitsize+pos])
		}
		var len=unitsize*value.length;
		if (pos+len>cur) cur=pos+len;
		return len;
	}

	this.writeI32=writeI32;
	this.writeBool=writeBool;
	this.writeBlob=writeBlob;
	this.writeUI8=writeUI8;
	this.writeString=writeString;
	this.writeSignature=writeSignature;
	this.writeOffset=writeOffset; //5 bytes offset
	this.writeStringArray=writeStringArray;
	this.writeFixedArray=writeFixedArray;
	Object.defineProperty(this, "buf", {get : function(){ return dbuf; }});
	
	return this;
}

var Create=function(path,opts) {
	opts=opts||{};
	var kfs=new Kfs(path,opts);
	var cur=0;

	var handle={};
	
	//no signature
	var writeVInt =function(arr) {
		var o=pack_int(arr,false);
		kfs.writeFixedArray(o,cur,1);
		cur+=o.length;
	}
	var writeVInt1=function(value) {
		writeVInt([value]);
	}
	//for postings
	var writePInt =function(arr) {
		var o=pack_int(arr,true);
		kfs.writeFixedArray(o,cur,1);
		cur+=o.length;
	}
	
	var saveVInt = function(arr,key) {
		var start=cur;
		key_writing=key;
		cur+=kfs.writeSignature(DT.vint,cur);
		writeVInt(arr);
		var written = cur-start;
		pushitem(key,written);
		return written;		
	}
	var savePInt = function(arr,key) {
		var start=cur;
		key_writing=key;
		cur+=kfs.writeSignature(DT.pint,cur);
		writePInt(arr);
		var written = cur-start;
		pushitem(key,written);
		return written;	
	}

	
	var saveUI8 = function(value,key) {
		var written=kfs.writeUI8(value,cur);
		cur+=written;
		pushitem(key,written);
		return written;
	}
	var saveBool=function(value,key) {
		var written=kfs.writeBool(value,cur);
		cur+=written;
		pushitem(key,written);
		return written;
	}
	var saveI32 = function(value,key) {
		var written=kfs.writeI32(value,cur);
		cur+=written;
		pushitem(key,written);
		return written;
	}	
	var saveString = function(value,key,encoding) {
		encoding=encoding||stringencoding;
		key_writing=key;
		var written=kfs.writeString(value,cur,encoding);
		cur+=written;
		pushitem(key,written);
		return written;
	}
	var saveStringArray = function(arr,key,encoding) {
		encoding=encoding||stringencoding;
		key_writing=key;
		try {
			var written=kfs.writeStringArray(arr,cur,encoding);
		} catch(e) {
			throw e;
		}
		cur+=written;
		pushitem(key,written);
		return written;
	}
	
	var saveBlob = function(value,key) {
		key_writing=key;
		var written=kfs.writeBlob(value,cur);
		cur+=written;
		pushitem(key,written);
		return written;
	}

	var folders=[];
	var pushitem=function(key,written) {
		var folder=folders[folders.length-1];	
		if (!folder) return ;
		folder.itemslength.push(written);
		if (key) {
			if (!folder.keys) throw 'cannot have key in array';
			folder.keys.push(key);
		}
	}	
	var open = function(opt) {
		var start=cur;
		var key=opt.key || null;
		var type=opt.type||DT.array;
		cur+=kfs.writeSignature(type,cur);
		cur+=kfs.writeOffset(0x0,cur); // pre-alloc space for offset
		var folder={
			type:type, key:key,
			start:start,datastart:cur,
			itemslength:[] };
		if (type===DT.object) folder.keys=[];
		folders.push(folder);
	}
	var openObject = function(key) {
		open({type:DT.object,key:key});
	}
	var openArray = function(key) {
		open({type:DT.array,key:key});
	}
	var saveInts=function(arr,key,func) {
		func.apply(handle,[arr,key]);
	}
	var close = function(opt) {
		if (!folders.length) throw 'empty stack';
		var folder=folders.pop();
		//jump to lengths and keys
		kfs.writeOffset( cur-folder.datastart, folder.datastart-5);
		var itemcount=folder.itemslength.length;
		//save lengths
		writeVInt1(itemcount);
		writeVInt(folder.itemslength);
		
		if (folder.type===DT.object) {
			//use utf8 for keys
			cur+=kfs.writeStringArray(folder.keys,cur,'utf8');
		}
		written=cur-folder.start;
		pushitem(folder.key,written);
		return written;
	}
	
	
	var stringencoding='ucs2';
	var stringEncoding=function(newencoding) {
		if (newencoding) stringencoding=newencoding;
		else return stringencoding;
	}
	
	var allnumber_fast=function(arr) {
		if (arr.length<5) return allnumber(arr);
		if (typeof arr[0]=='number'
		    && Math.round(arr[0])==arr[0] && arr[0]>=0)
			return true;
		return false;
	}
	var allstring_fast=function(arr) {
		if (arr.length<5) return allstring(arr);
		if (typeof arr[0]=='string') return true;
		return false;
	}	
	var allnumber=function(arr) {
		for (var i=0;i<arr.length;i++) {
			if (typeof arr[i]!=='number') return false;
		}
		return true;
	}
	var allstring=function(arr) {
		for (var i=0;i<arr.length;i++) {
			if (typeof arr[i]!=='string') return false;
		}
		return true;
	}
	var getEncoding=function(key,encs) {
		var enc=encs[key];
		if (!enc) return null;
		if (enc=='delta' || enc=='posting') {
			return savePInt;
		} else if (enc=="variable") {
			return saveVInt;
		}
		return null;
	}
	var save=function(J,key,opts) {
		opts=opts||{};
		
		if (typeof J=="null" || typeof J=="undefined") {
			throw 'cannot save null value of ['+key+'] folders'+JSON.stringify(folders);
			return;
		}
		var type=J.constructor.name;
		if (type==='Object') {
			openObject(key);
			for (var i in J) {
				save(J[i],i,opts);
				if (opts.autodelete) delete J[i];
			}
			close();
		} else if (type==='Array') {
			if (allnumber_fast(J)) {
				if (J.sorted) { //number array is sorted
					saveInts(J,key,savePInt);	//posting delta format
				} else {
					saveInts(J,key,saveVInt);	
				}
			} else if (allstring_fast(J)) {
				saveStringArray(J,key);
			} else {
				openArray(key);
				for (var i=0;i<J.length;i++) {
					save(J[i],null,opts);
					if (opts.autodelete) delete J[i];
				}
				close();
			}
		} else if (type==='String') {
			saveString(J,key);
		} else if (type==='Number') {
			if (J>=0&&J<256) saveUI8(J,key);
			else saveI32(J,key);
		} else if (type==='Boolean') {
			saveBool(J,key);
		} else if (type==='Buffer') {
			saveBlob(J,key);
		} else {
			throw 'unsupported type '+type;
		}
	}
	
	var free=function() {
		while (folders.length) close();
		kfs.free();
	}
	var currentsize=function() {
		return cur;
	}

	Object.defineProperty(handle, "size", {get : function(){ return cur; }});

	var writeFile=function(fn,opts,cb) {
		if (typeof fs=="undefined") {
			var fs=opts.fs||require('fs');	
		}
		var totalbyte=handle.currentsize();
		var written=0,batch=0;
		
		if (typeof cb=="undefined" || typeof opts=="function") {
			cb=opts;
		}
		opts=opts||{};
		batchsize=opts.batchsize||1024*1024*16; //16 MB

		if (fs.existsSync(fn)) fs.unlinkSync(fn);

		var writeCb=function(total,written,cb,next) {
			return function(err) {
				if (err) throw "write error"+err;
				cb(total,written);
				batch++;
				next();
			}
		}

		var next=function() {
			if (batch<batches) {
				var bufstart=batchsize*batch;
				var bufend=bufstart+batchsize;
				if (bufend>totalbyte) bufend=totalbyte;
				var sliced=kfs.buf.slice(bufstart,bufend);
				written+=sliced.length;
				fs.appendFile(fn,sliced,writeCb(totalbyte,written, cb,next));
			}
		}
		var batches=1+Math.floor(handle.size/batchsize);
		next();
	}
	handle.free=free;
	handle.saveI32=saveI32;
	handle.saveUI8=saveUI8;
	handle.saveBool=saveBool;
	handle.saveString=saveString;
	handle.saveVInt=saveVInt;
	handle.savePInt=savePInt;
	handle.saveInts=saveInts;
	handle.saveBlob=saveBlob;
	handle.save=save;
	handle.openArray=openArray;
	handle.openObject=openObject;
	handle.stringEncoding=stringEncoding;
	//this.integerEncoding=integerEncoding;
	handle.close=close;
	handle.writeFile=writeFile;
	handle.currentsize=currentsize;
	return handle;
}

module.exports=Create;
},{"fs":false}],"C:\\ksana2015\\node_modules\\ksana-search\\boolsearch.js":[function(require,module,exports){
/*
  TODO
  and not

*/

// http://jsfiddle.net/neoswf/aXzWw/
var plist=require('./plist');
function intersect(I, J) {
  var i = j = 0;
  var result = [];

  while( i < I.length && j < J.length ){
     if      (I[i] < J[j]) i++; 
     else if (I[i] > J[j]) j++; 
     else {
       result[result.length]=l[i];
       i++;j++;
     }
  }
  return result;
}

/* return all items in I but not in J */
function subtract(I, J) {
  var i = j = 0;
  var result = [];

  while( i < I.length && j < J.length ){
    if (I[i]==J[j]) {
      i++;j++;
    } else if (I[i]<J[j]) {
      while (I[i]<J[j]) result[result.length]= I[i++];
    } else {
      while(J[j]<I[i]) j++;
    }
  }

  if (j==J.length) {
    while (i<I.length) result[result.length]=I[i++];
  }

  return result;
}

var union=function(a,b) {
	if (!a || !a.length) return b;
	if (!b || !b.length) return a;
    var result = [];
    var ai = 0;
    var bi = 0;
    while (true) {
        if ( ai < a.length && bi < b.length) {
            if (a[ai] < b[bi]) {
                result[result.length]=a[ai];
                ai++;
            } else if (a[ai] > b[bi]) {
                result[result.length]=b[bi];
                bi++;
            } else {
                result[result.length]=a[ai];
                result[result.length]=b[bi];
                ai++;
                bi++;
            }
        } else if (ai < a.length) {
            result.push.apply(result, a.slice(ai, a.length));
            break;
        } else if (bi < b.length) {
            result.push.apply(result, b.slice(bi, b.length));
            break;
        } else {
            break;
        }
    }
    return result;
}
var OPERATION={'include':intersect, 'union':union, 'exclude':subtract};

var boolSearch=function(opts) {
  opts=opts||{};
  ops=opts.op||this.opts.op;
  this.docs=[];
	if (!this.phrases.length) return;
	var r=this.phrases[0].docs;
  /* ignore operator of first phrase */
	for (var i=1;i<this.phrases.length;i++) {
		var op= ops[i] || 'union';
		r=OPERATION[op](r,this.phrases[i].docs);
	}
	this.docs=plist.unique(r);
	return this;
}
module.exports={search:boolSearch}
},{"./plist":"C:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"C:\\ksana2015\\node_modules\\ksana-search\\bsearch.js":[function(require,module,exports){
arguments[4]["C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js"][0].apply(exports,arguments)
},{}],"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js":[function(require,module,exports){
var plist=require("./plist");

var getPhraseWidths=function (Q,phraseid,vposs) {
	var res=[];
	for (var i in vposs) {
		res.push(getPhraseWidth(Q,phraseid,vposs[i]));
	}
	return res;
}
var getPhraseWidth=function (Q,phraseid,vpos) {
	var P=Q.phrases[phraseid];
	var width=0,varwidth=false;
	if (P.width) return P.width; // no wildcard
	if (P.termid.length<2) return P.termlength[0];
	var lasttermposting=Q.terms[P.termid[P.termid.length-1]].posting;

	for (var i in P.termid) {
		var T=Q.terms[P.termid[i]];
		if (T.op=='wildcard') {
			width+=T.width;
			if (T.wildcard=='*') varwidth=true;
		} else {
			width+=P.termlength[i];
		}
	}
	if (varwidth) { //width might be smaller due to * wildcard
		var at=plist.indexOfSorted(lasttermposting,vpos);
		var endpos=lasttermposting[at];
		if (endpos-vpos<width) width=endpos-vpos+1;
	}

	return width;
}
/* return [vpos, phraseid, phrasewidth, optional_tagname] by slot range*/
var hitInRange=function(Q,startvpos,endvpos) {
	var res=[];
	if (!Q || !Q.rawresult || !Q.rawresult.length) return res;
	for (var i=0;i<Q.phrases.length;i++) {
		var P=Q.phrases[i];
		if (!P.posting) continue;
		var s=plist.indexOfSorted(P.posting,startvpos);
		var e=plist.indexOfSorted(P.posting,endvpos);
		var r=P.posting.slice(s,e+1);
		var width=getPhraseWidths(Q,i,r);

		res=res.concat(r.map(function(vpos,idx){ return [vpos,width[idx],i] }));
	}
	// order by vpos, if vpos is the same, larger width come first.
	// so the output will be
	// <tag1><tag2>one</tag2>two</tag1>
	//TODO, might cause overlap if same vpos and same width
	//need to check tag name
	res.sort(function(a,b){return a[0]==b[0]? b[1]-a[1] :a[0]-b[0]});

	return res;
}

var tagsInRange=function(Q,renderTags,startvpos,endvpos) {
	var res=[];
	if (typeof renderTags=="string") renderTags=[renderTags];

	renderTags.map(function(tag){
		var starts=Q.engine.get(["fields",tag+"_start"]);
		var ends=Q.engine.get(["fields",tag+"_end"]);
		if (!starts) return;

		var s=plist.indexOfSorted(starts,startvpos);
		var e=s;
		while (e<starts.length && starts[e]<endvpos) e++;
		var opentags=starts.slice(s,e);

		s=plist.indexOfSorted(ends,startvpos);
		e=s;
		while (e<ends.length && ends[e]<endvpos) e++;
		var closetags=ends.slice(s,e);

		opentags.map(function(start,idx) {
			res.push([start,closetags[idx]-start,tag]);
		})
	});
	// order by vpos, if vpos is the same, larger width come first.
	res.sort(function(a,b){return a[0]==b[0]? b[1]-a[1] :a[0]-b[0]});

	return res;
}

/*
given a vpos range start, file, convert to filestart, fileend
   filestart : starting file
   start   : vpos start
   showfile: how many files to display
   showpage: how many pages to display

output:
   array of fileid with hits
*/
var getFileWithHits=function(engine,Q,range) {
	var fileOffsets=engine.get("fileoffsets");
	var out=[],filecount=100;
	var start=0 , end=Q.byFile.length;
	Q.excerptOverflow=false;
	if (range.start) {
		var first=range.start ;
		var last=range.end;
		if (!last) last=Number.MAX_SAFE_INTEGER;
		for (var i=0;i<fileOffsets.length;i++) {
			//if (fileOffsets[i]>first) break;
			if (fileOffsets[i]>last) {
				end=i;
				break;
			}
			if (fileOffsets[i]<first) start=i;
		}		
	} else {
		start=range.filestart || 0;
		if (range.maxfile) {
			filecount=range.maxfile;
		} else if (range.showseg) {
			throw "not implement yet"
		}
	}

	var fileWithHits=[],totalhit=0;
	range.maxhit=range.maxhit||1000;

	for (var i=start;i<end;i++) {
		if(Q.byFile[i].length>0) {
			totalhit+=Q.byFile[i].length;
			fileWithHits.push(i);
			range.nextFileStart=i;
			if (fileWithHits.length>=filecount) {
				Q.excerptOverflow=true;
				break;
			}
			if (totalhit>range.maxhit) {
				Q.excerptOverflow=true;
				break;
			}
		}
	}
	if (i>=end) { //no more file
		Q.excerptStop=true;
	}
	return fileWithHits;
}
var resultlist=function(engine,Q,opts,cb) {
	var output=[];
	if (!Q.rawresult || !Q.rawresult.length) {
		cb(output);
		return;
	}

	if (opts.range) {
		if (opts.range.maxhit && !opts.range.maxfile) {
			opts.range.maxfile=opts.range.maxhit;
			opts.range.maxseg=opts.range.maxhit;
		}
		if (!opts.range.maxseg) opts.range.maxseg=100;
		if (!opts.range.end) {
			opts.range.end=Number.MAX_SAFE_INTEGER;
		}
	}
	var fileWithHits=getFileWithHits(engine,Q,opts.range);
	if (!fileWithHits.length) {
		cb(output);
		return;
	}

	var output=[],files=[];//temporary holder for segnames
	for (var i=0;i<fileWithHits.length;i++) {
		var nfile=fileWithHits[i];
		var segoffsets=engine.getFileSegOffsets(nfile);
		var segnames=engine.getFileSegNames(nfile);
		files[nfile]={segoffsets:segoffsets};
		var segwithhit=plist.groupbyposting2(Q.byFile[ nfile ],  segoffsets);
		//if (segoffsets[0]==1)
		//segwithhit.shift(); //the first item is not used (0~Q.byFile[0] )

		for (var j=0; j<segwithhit.length;j++) {
			if (!segwithhit[j].length) continue;
			//var offsets=segwithhit[j].map(function(p){return p- fileOffsets[i]});
			if (segoffsets[j]>opts.range.end) break;
			output.push(  {file: nfile, seg:j,  segname:segnames[j]});
			if (output.length>opts.range.maxseg) break;
		}
	}

	var segpaths=output.map(function(p){
		return ["filecontents",p.file,p.seg];
	});
	//prepare the text
	engine.get(segpaths,function(segs){
		var seq=0;
		if (segs) for (var i=0;i<segs.length;i++) {
			var startvpos=files[output[i].file].segoffsets[output[i].seg-1] ||0;
			var endvpos=files[output[i].file].segoffsets[output[i].seg];
			var hl={};

			if (opts.range && opts.range.start  ) {
				if ( startvpos<opts.range.start) startvpos=opts.range.start;
			//	if (endvpos>opts.range.end) endvpos=opts.range.end;
			}
			
			if (opts.nohighlight) {
				hl.text=segs[i];
				hl.hits=hitInRange(Q,startvpos,endvpos);
			} else {
				var o={nocrlf:true,nospan:true,
					text:segs[i],startvpos:startvpos, endvpos: endvpos, 
					Q:Q,fulltext:opts.fulltext};
				hl=highlight(Q,o);
			}
			if (hl.text) {
				output[i].text=hl.text;
				output[i].hits=hl.hits;
				output[i].seq=seq;
				seq+=hl.hits.length;

				output[i].start=startvpos;				
			} else {
				output[i]=null; //remove item vpos less than opts.range.start
			}
		} 
		output=output.filter(function(o){return o!=null});
		cb(output);
	});
}
var injectTag=function(Q,opts){
	var hits=opts.hits;
	var tags=opts.tags;
	if (!tags) tags=[];
	var hitclass=opts.hitclass||'hl';
	var output='',O=[],j=0,k=0;
	var surround=opts.surround||5;

	var tokens=Q.tokenize(opts.text).tokens;
	var vpos=opts.vpos;
	var i=0,previnrange=!!opts.fulltext ,inrange=!!opts.fulltext;
	var hitstart=0,hitend=0,tagstart=0,tagend=0,tagclass="";
	while (i<tokens.length) {
		var skip=Q.isSkip(tokens[i]);
		var hashit=false;
		inrange=opts.fulltext || (j<hits.length && vpos+surround>=hits[j][0] ||
				(j>0 && j<=hits.length &&  hits[j-1][0]+surround*2>=vpos));	

		if (previnrange!=inrange) {
			output+=opts.abridge||"...";
		}
		previnrange=inrange;
		var token=tokens[i];
		if (opts.nocrlf && token=="\n") token="";

		if (inrange && i<tokens.length) {
			if (skip) {
				output+=token;
			} else {
				var classes="";	

				//check hit
				if (j<hits.length && vpos==hits[j][0]) {
					var nphrase=hits[j][2] % 10, width=hits[j][1];
					hitstart=hits[j][0];
					hitend=hitstart+width;
					j++;
				}

				//check tag
				if (k<tags.length && vpos==tags[k][0]) {
					var width=tags[k][1];
					tagstart=tags[k][0];
					tagend=tagstart+width;
					tagclass=tags[k][2];
					k++;
				}

				if (vpos>=hitstart && vpos<hitend) classes=hitclass+" "+hitclass+nphrase;
				if (vpos>=tagstart && vpos<tagend) classes+=" "+tagclass;

				if (classes || !opts.nospan) {
					output+='<span vpos="'+vpos+'"';
					if (classes) classes=' class="'+classes+'"';
					output+=classes+'>';
					output+=token+'</span>';
				} else {
					output+=token;
				}
			}
		}
		if (!skip) vpos++;
		i++; 
	}

	O.push(output);
	output="";

	return O.join("");
}
var highlight=function(Q,opts) {
	if (!opts.text) return {text:"",hits:[]};
	var opt={text:opts.text,
		hits:null,abridge:opts.abridge,vpos:opts.startvpos,
		fulltext:opts.fulltext,renderTags:opts.renderTags,nospan:opts.nospan,nocrlf:opts.nocrlf,
	};

	opt.hits=hitInRange(opts.Q,opts.startvpos,opts.endvpos);
	return {text:injectTag(Q,opt),hits:opt.hits};
}

var getSeg=function(engine,fileid,segid,cb) {
	var fileOffsets=engine.get("fileoffsets");
	var segpaths=["filecontents",fileid,segid];
	var segnames=engine.getFileSegNames(fileid);

	engine.get(segpaths,function(text){
		cb.apply(engine.context,[{text:text,file:fileid,seg:segid,segname:segnames[segid]}]);
	});
}

var getSegSync=function(engine,fileid,segid) {
	var fileOffsets=engine.get("fileoffsets");
	var segpaths=["filecontents",fileid,segid];
	var segnames=engine.getFileSegNames(fileid);

	var text=engine.get(segpaths);
	return {text:text,file:fileid,seg:segid,segname:segnames[segid]};
}

var getRange=function(engine,start,end,cb) {
	var fileoffsets=engine.get("fileoffsets");
	//var pagepaths=["fileContents",];
	//find first page and last page
	//create get paths

}

var getFile=function(engine,fileid,cb) {
	var filename=engine.get("filenames")[fileid];
	var segnames=engine.getFileSegNames(fileid);
	var filestart=engine.get("fileoffsets")[fileid];
	var offsets=engine.getFileSegOffsets(fileid);
	var pc=0;
	engine.get(["fileContents",fileid],true,function(data){
		var text=data.map(function(t,idx) {
			if (idx==0) return ""; 
			var pb='<pb n="'+segnames[idx]+'"></pb>';
			return pb+t;
		});
		cb({texts:data,text:text.join(""),segnames:segnames,filestart:filestart,offsets:offsets,file:fileid,filename:filename}); //force different token
	});
}

var highlightRange=function(Q,startvpos,endvpos,opts,cb){
	//not implement yet
}

var highlightFile=function(Q,fileid,opts,cb) {
	if (typeof opts=="function") {
		cb=opts;
	}

	if (!Q || !Q.engine) return cb(null);

	var segoffsets=Q.engine.getFileSegOffsets(fileid);
	var output=[];	
	//console.log(startvpos,endvpos)
	Q.engine.get(["fileContents",fileid],true,function(data){
		if (!data) {
			console.error("wrong file id",fileid);
		} else {
			for (var i=0;i<data.length-1;i++ ){
				var startvpos=segoffsets[i];
				var endvpos=segoffsets[i+1];
				var segnames=Q.engine.getFileSegNames(fileid);
				var seg=getSegSync(Q.engine, fileid,i+1);
					var opt={text:seg.text,hits:null,tag:'hl',vpos:startvpos,
					fulltext:true,nospan:opts.nospan,nocrlf:opts.nocrlf};
				var segname=segnames[i+1];
				opt.hits=hitInRange(Q,startvpos,endvpos);
				var pb='<pb n="'+segname+'"></pb>';
				var withtag=injectTag(Q,opt);
				output.push(pb+withtag);
			}			
		}

		cb.apply(Q.engine.context,[{text:output.join(""),file:fileid}]);
	})
}
var highlightSeg=function(Q,fileid,segid,opts,cb) {
	if (typeof opts=="function") {
		cb=opts;
	}

	if (!Q || !Q.engine) return cb(null);
	var segoffsets=Q.engine.getFileSegOffsets(fileid);
	var startvpos=segoffsets[segid-1];
	var endvpos=segoffsets[segid];
	var segnames=Q.engine.getFileSegNames(fileid);

	this.getSeg(Q.engine,fileid,segid,function(res){
		var opt={text:res.text,hits:null,vpos:startvpos,fulltext:true,
			nospan:opts.nospan,nocrlf:opts.nocrlf};
		opt.hits=hitInRange(Q,startvpos,endvpos);
		if (opts.renderTags) {
			opt.tags=tagsInRange(Q,opts.renderTags,startvpos,endvpos);
		}

		var segname=segnames[segid];
		cb.apply(Q.engine.context,[{text:injectTag(Q,opt),seg:segid,file:fileid,hits:opt.hits,segname:segname}]);
	});
}
module.exports={resultlist:resultlist, 
	hitInRange:hitInRange, 
	highlightSeg:highlightSeg,
	getSeg:getSeg,
	highlightFile:highlightFile,
	getFile:getFile
	//highlightRange:highlightRange,
  //getRange:getRange,
};
},{"./plist":"C:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"C:\\ksana2015\\node_modules\\ksana-search\\index.js":[function(require,module,exports){
/*
  Ksana Search Engine.

  need a KDE instance to be functional
  
*/
var bsearch=require("./bsearch");
var dosearch=require("./search");

var prepareEngineForSearch=function(engine,cb){
	if (engine.analyzer) {
		cb();
		return;
	}
	var analyzer=require("ksana-analyzer");
	var config=engine.get("meta").config;
	engine.analyzer=analyzer.getAPI(config);
	engine.get([["tokens"],["postingslength"]],function(){
		cb();
	});
}

var _search=function(engine,q,opts,cb,context) {
	if (typeof engine=="string") {//browser only
		var kde=require("ksana-database");
		if (typeof opts=="function") { //user didn't supply options
			if (typeof cb=="object")context=cb;
			cb=opts;
			opts={};
		}
		opts.q=q;
		opts.dbid=engine;
		kde.open(opts.dbid,function(err,db){
			if (err) {
				cb(err);
				return;
			}
			console.log("opened",opts.dbid)
			prepareEngineForSearch(db,function(){
				return dosearch(db,q,opts,cb);	
			});
		},context);
	} else {
		prepareEngineForSearch(engine,function(){
			return dosearch(engine,q,opts,cb);	
		});
	}
}

var _highlightSeg=function(engine,fileid,segid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightSeg(Q,fileid,segid,opts,cb);
	});	
}
var _highlightRange=function(engine,start,end,opts,cb){

	if (opts.q) {
		_search(engine,opts.q,opts,function(Q){
			api.excerpt.highlightRange(Q,start,end,opts,cb);
		});
	} else {
		prepareEngineForSearch(engine,function(){
			api.excerpt.getRange(engine,start,end,cb);
		});
	}
}
var _highlightFile=function(engine,fileid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightFile(Q,fileid,opts,cb);
	});
	/*
	} else {
		api.excerpt.getFile(engine,fileid,function(data) {
			cb.apply(engine.context,[data]);
		});
	}
	*/
}

var vpos2fileseg=function(engine,vpos) {
    var segoffsets=engine.get("segoffsets");
    var fileoffsets=engine.get(["fileoffsets"]);
    var segnames=engine.get("segnames");
    var fileid=bsearch(fileoffsets,vpos+1,true);
    fileid--;
    var segid=bsearch(segoffsets,vpos+1,true);
	var range=engine.getFileRange(fileid);
	segid-=range.start;
    return {file:fileid,seg:segid};
}
var api={
	search:_search
//	,concordance:require("./concordance")
//	,regex:require("./regex")
	,highlightSeg:_highlightSeg
	,highlightFile:_highlightFile
//	,highlightRange:_highlightRange
	,excerpt:require("./excerpt")
	,vpos2fileseg:vpos2fileseg
}
module.exports=api;
},{"./bsearch":"C:\\ksana2015\\node_modules\\ksana-search\\bsearch.js","./excerpt":"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js","./search":"C:\\ksana2015\\node_modules\\ksana-search\\search.js","ksana-analyzer":"C:\\ksana2015\\node_modules\\ksana-analyzer\\index.js","ksana-database":"C:\\ksana2015\\node_modules\\ksana-database\\index.js"}],"C:\\ksana2015\\node_modules\\ksana-search\\plist.js":[function(require,module,exports){

var unpack = function (ar) { // unpack variable length integer list
  var r = [],
  i = 0,
  v = 0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;
	} while (ar[++i] & 0x80);
	r[r.length]=v;
  } while (i < ar.length);
  return r;
}

/*
   arr:  [1,1,1,1,1,1,1,1,1]
   levels: [0,1,1,2,2,0,1,2]
   output: [5,1,3,1,1,3,1,1]
*/

var groupsum=function(arr,levels) {
  if (arr.length!=levels.length+1) return null;
  var stack=[];
  var output=new Array(levels.length);
  for (var i=0;i<levels.length;i++) output[i]=0;
  for (var i=1;i<arr.length;i++) { //first one out of toc scope, ignored
    if (stack.length>levels[i-1]) {
      while (stack.length>levels[i-1]) stack.pop();
    }
    stack.push(i-1);
    for (var j=0;j<stack.length;j++) {
      output[stack[j]]+=arr[i];
    }
  }
  return output;
}
/* arr= 1 , 2 , 3 ,4 ,5,6,7 //token posting
  posting= 3 , 5  //tag posting
  out = 3 , 2, 2
*/
var countbyposting = function (arr, posting) {
  if (!posting.length) return [arr.length];
  var out=[];
  for (var i=0;i<posting.length;i++) out[i]=0;
  out[posting.length]=0;
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<posting.length) {
    if (arr[i]<=posting[p]) {
      while (p<posting.length && i<arr.length && arr[i]<=posting[p]) {
        out[p]++;
        i++;
      }      
    } 
    p++;
  }
  out[posting.length] = arr.length-i; //remaining
  return out;
}

var groupbyposting=function(arr,gposting) { //relative vpos
  if (!gposting.length) return [arr.length];
  var out=[];
  for (var i=0;i<=gposting.length;i++) out[i]=[];
  
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<gposting.length) {
    if (arr[i]<gposting[p]) {
      while (p<gposting.length && i<arr.length && arr[i]<gposting[p]) {
        var start=0;
        if (p>0) start=gposting[p-1];
        out[p].push(arr[i++]-start);  // relative
      }      
    } 
    p++;
  }
  //remaining
  while(i<arr.length) out[out.length-1].push(arr[i++]-gposting[gposting.length-1]);
  return out;
}
var groupbyposting2=function(arr,gposting) { //absolute vpos
  if (!arr || !arr.length) return [];
  if (!gposting.length) return [arr.length];
  var out=[];
  for (var i=0;i<=gposting.length;i++) out[i]=[];
  
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<gposting.length) {
    if (arr[i]<gposting[p]) {
      while (p<gposting.length && i<arr.length && arr[i]<gposting[p]) {
        var start=0;
        if (p>0) start=gposting[p-1]; //absolute
        out[p].push(arr[i++]);
      }      
    } 
    p++;
  }
  //remaining
  while(i<arr.length) out[out.length-1].push(arr[i++]-gposting[gposting.length-1]);
  return out;
}
var groupbyblock2 = function(ar, ntoken,slotshift,opts) {
  if (!ar.length) return [{},{}];
  
  slotshift = slotshift || 16;
  var g = Math.pow(2,slotshift);
  var i = 0;
  var r = {}, ntokens={};
  var groupcount=0;
  do {
    var group = Math.floor(ar[i] / g) ;
    if (!r[group]) {
      r[group] = [];
      ntokens[group]=[];
      groupcount++;
    }
    r[group].push(ar[i] % g);
    ntokens[group].push(ntoken[i]);
    i++;
  } while (i < ar.length);
  if (opts) opts.groupcount=groupcount;
  return [r,ntokens];
}
var groupbyslot = function (ar, slotshift, opts) {
  if (!ar.length)
	return {};
  
  slotshift = slotshift || 16;
  var g = Math.pow(2,slotshift);
  var i = 0;
  var r = {};
  var groupcount=0;
  do {
	var group = Math.floor(ar[i] / g) ;
	if (!r[group]) {
	  r[group] = [];
	  groupcount++;
	}
	r[group].push(ar[i] % g);
	i++;
  } while (i < ar.length);
  if (opts) opts.groupcount=groupcount;
  return r;
}
/*
var identity = function (value) {
  return value;
};
var sortedIndex = function (array, obj, iterator) { //taken from underscore
  iterator || (iterator = identity);
  var low = 0,
  high = array.length;
  while (low < high) {
	var mid = (low + high) >> 1;
	iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
  }
  return low;
};*/

var indexOfSorted = function (array, obj) { 
  var low = 0,
  high = array.length-1;
  while (low < high) {
    var mid = (low + high) >> 1;
    array[mid] < obj ? low = mid + 1 : high = mid;
  }
  return low;
};
var plhead=function(pl, pltag, opts) {
  opts=opts||{};
  opts.max=opts.max||1;
  var out=[];
  if (pltag.length<pl.length) {
    for (var i=0;i<pltag.length;i++) {
       k = indexOfSorted(pl, pltag[i]);
       if (k>-1 && k<pl.length) {
        if (pl[k]==pltag[i]) {
          out[out.length]=pltag[i];
          if (out.length>=opts.max) break;
        }
      }
    }
  } else {
    for (var i=0;i<pl.length;i++) {
       k = indexOfSorted(pltag, pl[i]);
       if (k>-1 && k<pltag.length) {
        if (pltag[k]==pl[i]) {
          out[out.length]=pltag[k];
          if (out.length>=opts.max) break;
        }
      }
    }
  }
  return out;
}
/*
 pl2 occur after pl1, 
 pl2>=pl1+mindis
 pl2<=pl1+maxdis
*/
var plfollow2 = function (pl1, pl2, mindis, maxdis) {
  var r = [],i=0;
  var swap = 0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + mindis);
    var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
    if (t > -1) {
      r[r.length]=pl1[i];
      i++;
    } else {
      if (k>=pl2.length) break;
      var k2=indexOfSorted (pl1,pl2[k]-maxdis);
      if (k2>i) {
        var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
        if (t>-1) r[r.length]=pl1[k2];
        i=k2;
      } else break;
    }
  }
  return r;
}

var plnotfollow2 = function (pl1, pl2, mindis, maxdis) {
  var r = [],i=0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + mindis);
    var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
    if (t > -1) {
      i++;
    } else {
      if (k>=pl2.length) {
        r=r.concat(pl1.slice(i));
        break;
      } else {
        var k2=indexOfSorted (pl1,pl2[k]-maxdis);
        if (k2>i) {
          r=r.concat(pl1.slice(i,k2));
          i=k2;
        } else break;
      }
    }
  }
  return r;
}
/* this is incorrect */
var plfollow = function (pl1, pl2, distance) {
  var r = [],i=0;

  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) {
      r.push(pl1[i]);
      i++;
    } else {
      if (k>=pl2.length) break;
      var k2=indexOfSorted (pl1,pl2[k]-distance);
      if (k2>i) {
        t = (pl2[k] === (pl1[k2] + distance)) ? k : -1;
        if (t>-1) {
           r.push(pl1[k2]);
           k2++;
        }
        i=k2;
      } else break;
    }
  }
  return r;
}
var plnotfollow = function (pl1, pl2, distance) {
  var r = [];
  var r = [],i=0;
  var swap = 0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) { 
      i++;
    } else {
      if (k>=pl2.length) {
        r=r.concat(pl1.slice(i));
        break;
      } else {
        var k2=indexOfSorted (pl1,pl2[k]-distance);
        if (k2>i) {
          r=r.concat(pl1.slice(i,k2));
          i=k2;
        } else break;
      }
    }
  }
  return r;
}
var pland = function (pl1, pl2, distance) {
  var r = [];
  var swap = 0;
  
  if (pl1.length > pl2.length) { //swap for faster compare
    var t = pl2;
    pl2 = pl1;
    pl1 = t;
    swap = distance;
    distance = -distance;
  }
  for (var i = 0; i < pl1.length; i++) {
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) {
      r.push(pl1[i] - swap);
    }
  }
  return r;
}
var combine=function (postings) {
  var out=[];
  for (var i in postings) {
    out=out.concat(postings[i]);
  }
  out.sort(function(a,b){return a-b});
  return out;
}

var unique = function(ar){
   if (!ar || !ar.length) return [];
   var u = {}, a = [];
   for(var i = 0, l = ar.length; i < l; ++i){
    if(u.hasOwnProperty(ar[i])) continue;
    a.push(ar[i]);
    u[ar[i]] = 1;
   }
   return a;
}



var plphrase = function (postings,ops) {
  var r = [];
  for (var i=0;i<postings.length;i++) {
  	if (!postings[i])  return [];
  	if (0 === i) {
  	  r = postings[0];
  	} else {
      if (ops[i]=='andnot') {
        r = plnotfollow(r, postings[i], i);  
      }else {
        r = pland(r, postings[i], i);  
      }
  	}
  }
  
  return r;
}
//return an array of group having any of pl item
var matchPosting=function(pl,gupl,start,end) {
  start=start||0;
  end=end||-1;
  if (end==-1) end=Math.pow(2, 53); // max integer value

  var count=0, i = j= 0,  result = [] ,v=0;
  var docs=[], freq=[];
  if (!pl) return {docs:[],freq:[]};
  while( i < pl.length && j < gupl.length ){
     if (pl[i] < gupl[j] ){ 
       count++;
       v=pl[i];
       i++; 
     } else {
       if (count) {
        if (v>=start && v<end) {
          docs.push(j);
          freq.push(count);          
        }
       }
       j++;
       count=0;
     }
  }
  if (count && j<gupl.length && v>=start && v<end) {
    docs.push(j);
    freq.push(count);
    count=0;
  }
  else {
    while (j==gupl.length && i<pl.length && pl[i] >= gupl[gupl.length-1]) {
      i++;
      count++;
    }
    if (v>=start && v<end) {
      docs.push(j);
      freq.push(count);      
    }
  } 
  return {docs:docs,freq:freq};
}

var trim=function(arr,start,end) {
  var s=indexOfSorted(arr,start);
  var e=indexOfSorted(arr,end);
  return arr.slice(s,e+1);
}
var plist={};
plist.unpack=unpack;
plist.plphrase=plphrase;
plist.plhead=plhead;
plist.plfollow2=plfollow2;
plist.plnotfollow2=plnotfollow2;
plist.plfollow=plfollow;
plist.plnotfollow=plnotfollow;
plist.unique=unique;
plist.indexOfSorted=indexOfSorted;
plist.matchPosting=matchPosting;
plist.trim=trim;

plist.groupbyslot=groupbyslot;
plist.groupbyblock2=groupbyblock2;
plist.countbyposting=countbyposting;
plist.groupbyposting=groupbyposting;
plist.groupbyposting2=groupbyposting2;
plist.groupsum=groupsum;
plist.combine=combine;
module.exports=plist;
},{}],"C:\\ksana2015\\node_modules\\ksana-search\\search.js":[function(require,module,exports){
/*
var dosearch2=function(engine,opts,cb,context) {
	opts
		nfile,npage  //return a highlighted page
		nfile,[pages] //return highlighted pages 
		nfile        //return entire highlighted file
		abs_npage
		[abs_pages]  //return set of highlighted pages (may cross file)

		filename, pagename
		filename,[pagenames]

		excerpt      //
	    sortBy       //default natural, sortby by vsm ranking

	//return err,array_of_string ,Q  (Q contains low level search result)
}

*/
/* TODO sorted tokens */
var plist=require("./plist");
var boolsearch=require("./boolsearch");
var excerpt=require("./excerpt");
var parseTerm = function(engine,raw,opts) {
	if (!raw) return;
	var res={raw:raw,variants:[],term:'',op:''};
	var term=raw, op=0;
	var firstchar=term[0];
	var termregex="";
	if (firstchar=='-') {
		term=term.substring(1);
		firstchar=term[0];
		res.exclude=true; //exclude
	}
	term=term.trim();
	var lastchar=term[term.length-1];
	term=engine.analyzer.normalize(term);
	
	if (term.indexOf("%")>-1) {
		var termregex="^"+term.replace(/%+/g,".+")+"$";
		if (firstchar=="%") 	termregex=".+"+termregex.substr(1);
		if (lastchar=="%") 	termregex=termregex.substr(0,termregex.length-1)+".+";
	}

	if (termregex) {
		res.variants=expandTerm(engine,termregex);
	}

	res.key=term;
	return res;
}
var expandTerm=function(engine,regex) {
	var r=new RegExp(regex);
	var tokens=engine.get("tokens");
	var postingsLength=engine.get("postingslength");
	if (!postingsLength) postingsLength=[];
	var out=[];
	for (var i=0;i<tokens.length;i++) {
		var m=tokens[i].match(r);
		if (m) {
			out.push([m[0],postingsLength[i]||1]);
		}
	}
	out.sort(function(a,b){return b[1]-a[1]});
	return out;
}
var isWildcard=function(raw) {
	return !!raw.match(/[\*\?]/);
}

var isOrTerm=function(term) {
	term=term.trim();
	return (term[term.length-1]===',');
}
var orterm=function(engine,term,key) {
		var t={text:key};
		if (engine.analyzer.simplifiedToken) {
			t.simplified=engine.analyzer.simplifiedToken(key);
		}
		term.variants.push(t);
}
var orTerms=function(engine,tokens,now) {
	var raw=tokens[now];
	var term=parseTerm(engine,raw);
	if (!term) return;
	orterm(engine,term,term.key);
	while (isOrTerm(raw))  {
		raw=tokens[++now];
		var term2=parseTerm(engine,raw);
		orterm(engine,term,term2.key);
		for (var i in term2.variants){
			term.variants[i]=term2.variants[i];
		}
		term.key+=','+term2.key;
	}
	return term;
}

var getOperator=function(raw) {
	var op='';
	if (raw[0]=='+') op='include';
	if (raw[0]=='-') op='exclude';
	return op;
}
var parsePhrase=function(q) {
	var match=q.match(/(".+?"|'.+?'|\S+)/g)
	match=match.map(function(str){
		var n=str.length, h=str.charAt(0), t=str.charAt(n-1)
		if (h===t&&(h==='"'|h==="'")) str=str.substr(1,n-2)
		return str;
	})
	return match;
}
var tibetanNumber={
	"\u0f20":"0","\u0f21":"1","\u0f22":"2",	"\u0f23":"3",	"\u0f24":"4",
	"\u0f25":"5","\u0f26":"6","\u0f27":"7","\u0f28":"8","\u0f29":"9"
}
var parseNumber=function(raw) {
	var n=parseInt(raw,10);
	if (isNaN(n)){
		var converted=[];
		for (var i=0;i<raw.length;i++) {
			var nn=tibetanNumber[raw[i]];
			if (typeof nn !="undefined") converted[i]=nn;
			else break;
		}
		return parseInt(converted,10);
	} else {
		return n;
	}
}
var parseWildcard=function(raw) {
	var n=parseNumber(raw) || 1;
	var qcount=raw.split('?').length-1;
	var scount=raw.split('*').length-1;
	var type='';
	if (qcount) type='?';
	else if (scount) type='*';
	return {wildcard:type, width: n , op:'wildcard'};
}

var newPhrase=function() {
	return {termid:[],posting:[],raw:'',termlength:[]};
} 
var parseQuery=function(q,sep) {
	if (sep && q.indexOf(sep)>-1) {
		var match=q.split(sep);
	} else {
		var match=q.match(/(".+?"|'.+?'|\S+)/g)
		match=match.map(function(str){
			var n=str.length, h=str.charAt(0), t=str.charAt(n-1)
			if (h===t&&(h==='"'|h==="'")) str=str.substr(1,n-2)
			return str
		})
		//console.log(input,'==>',match)		
	}
	return match;
}
var loadPhrase=function(phrase) {
	/* remove leading and ending wildcard */
	var Q=this;
	var cache=Q.engine.postingCache;
	if (cache[phrase.key]) {
		phrase.posting=cache[phrase.key];
		return Q;
	}
	if (phrase.termid.length==1) {
		if (!Q.terms.length){
			phrase.posting=[];
		} else {
			cache[phrase.key]=phrase.posting=Q.terms[phrase.termid[0]].posting;	
		}
		return Q;
	}

	var i=0, r=[],dis=0;
	while(i<phrase.termid.length) {
	  var T=Q.terms[phrase.termid[i]];
		if (0 === i) {
			r = T.posting;
		} else {
		    if (T.op=='wildcard') {
		    	T=Q.terms[phrase.termid[i++]];
		    	var width=T.width;
		    	var wildcard=T.wildcard;
		    	T=Q.terms[phrase.termid[i]];
		    	var mindis=dis;
		    	if (wildcard=='?') mindis=dis+width;
		    	if (T.exclude) r = plist.plnotfollow2(r, T.posting, mindis, dis+width);
		    	else r = plist.plfollow2(r, T.posting, mindis, dis+width);		    	
		    	dis+=(width-1);
		    }else {
		    	if (T.posting) {
		    		if (T.exclude) r = plist.plnotfollow(r, T.posting, dis);
		    		else r = plist.plfollow(r, T.posting, dis);
		    	}
		    }
		}
		dis += phrase.termlength[i];
		i++;
		if (!r) return Q;
  }
  phrase.posting=r;
  cache[phrase.key]=r;
  return Q;
}
var trimSpace=function(engine,query) {
	if (!query) return "";
	var i=0;
	var isSkip=engine.analyzer.isSkip;
	while (isSkip(query[i]) && i<query.length) i++;
	return query.substring(i);
}
var getSegWithHit=function(fileid,offsets) {
	var Q=this,engine=Q.engine;
	var segWithHit=plist.groupbyposting2(Q.byFile[fileid ], offsets);
	if (segWithHit.length) segWithHit.shift(); //the first item is not used (0~Q.byFile[0] )
	var out=[];
	segWithHit.map(function(p,idx){if (p.length) out.push(idx)});
	return out;
}
var segWithHit=function(fileid) {
	var Q=this,engine=Q.engine;
	var offsets=engine.getFileSegOffsets(fileid);
	return getSegWithHit.apply(this,[fileid,offsets]);
}
var isSimplePhrase=function(phrase) {
	var m=phrase.match(/[\?%^]/);
	return !m;
}

// 發菩提心   ==> 發菩  提心       2 2   
// 菩提心     ==> 菩提  提心       1 2
// 劫劫       ==> 劫    劫         1 1   // invalid
// 因緣所生道  ==> 因緣  所生   道   2 2 1
var splitPhrase=function(engine,simplephrase,bigram) {
	var bigram=bigram||engine.get("meta").bigram||[];
	var tokens=engine.analyzer.tokenize(simplephrase).tokens;
	var loadtokens=[],lengths=[],j=0,lastbigrampos=-1;
	while (j+1<tokens.length) {
		var token=engine.analyzer.normalize(tokens[j]);
		var nexttoken=engine.analyzer.normalize(tokens[j+1]);
		var bi=token+nexttoken;
		var i=plist.indexOfSorted(bigram,bi);
		if (bigram[i]==bi) {
			loadtokens.push(bi);
			if (j+3<tokens.length) {
				lastbigrampos=j;
				j++;
			} else {
				if (j+2==tokens.length){ 
					if (lastbigrampos+1==j ) {
						lengths[lengths.length-1]--;
					}
					lastbigrampos=j;
					j++;
				}else {
					lastbigrampos=j;	
				}
			}
			lengths.push(2);
		} else {
			if (!bigram || lastbigrampos==-1 || lastbigrampos+1!=j) {
				loadtokens.push(token);
				lengths.push(1);				
			}
		}
		j++;
	}

	while (j<tokens.length) {
		var token=engine.analyzer.normalize(tokens[j]);
		loadtokens.push(token);
		lengths.push(1);
		j++;
	}

	return {tokens:loadtokens, lengths: lengths , tokenlength: tokens.length};
}
/* host has fast native function */
var fastPhrase=function(engine,phrase) {
	var phrase_term=newPhrase();
	//var tokens=engine.analyzer.tokenize(phrase).tokens;
	var splitted=splitPhrase(engine,phrase);

	var paths=postingPathFromTokens(engine,splitted.tokens);
//create wildcard

	phrase_term.width=splitted.tokenlength; //for excerpt.js to getPhraseWidth

	engine.get(paths,{address:true},function(postingAddress){ //this is sync
		phrase_term.key=phrase;
		var postingAddressWithWildcard=[];
		for (var i=0;i<postingAddress.length;i++) {
			postingAddressWithWildcard.push(postingAddress[i]);
			if (splitted.lengths[i]>1) {
				postingAddressWithWildcard.push([splitted.lengths[i],0]); //wildcard has blocksize==0 
			}
		}
		engine.postingCache[phrase]=engine.mergePostings(postingAddressWithWildcard);
	});
	return phrase_term;
	// put posting into cache[phrase.key]
}
var slowPhrase=function(engine,terms,phrase) {
	var j=0,tokens=engine.analyzer.tokenize(phrase).tokens;
	var phrase_term=newPhrase();
	var termid=0;
	while (j<tokens.length) {
		var raw=tokens[j], termlength=1;
		if (isWildcard(raw)) {
			if (phrase_term.termid.length==0)  { //skip leading wild card
				j++
				continue;
			}
			terms.push(parseWildcard(raw));
			termid=terms.length-1;
			phrase_term.termid.push(termid);
			phrase_term.termlength.push(termlength);
		} else if (isOrTerm(raw)){
			var term=orTerms.apply(this,[tokens,j]);
			if (term) {
				terms.push(term);
				termid=terms.length-1;
				j+=term.key.split(',').length-1;					
			}
			j++;
			phrase_term.termid.push(termid);
			phrase_term.termlength.push(termlength);
		} else {
			var phrase="";
			while (j<tokens.length) {
				if (!(isWildcard(tokens[j]) || isOrTerm(tokens[j]))) {
					phrase+=tokens[j];
					j++;
				} else break;
			}

			var splitted=splitPhrase(engine,phrase);
			for (var i=0;i<splitted.tokens.length;i++) {

				var term=parseTerm(engine,splitted.tokens[i]);
				var termidx=terms.map(function(a){return a.key}).indexOf(term.key);
				if (termidx==-1) {
					terms.push(term);
					termid=terms.length-1;
				} else {
					termid=termidx;
				}				
				phrase_term.termid.push(termid);
				phrase_term.termlength.push(splitted.lengths[i]);
			}
		}
		j++;
	}
	phrase_term.key=phrase;
	//remove ending wildcard
	var P=phrase_term , T=null;
	do {
		T=terms[P.termid[P.termid.length-1]];
		if (!T) break;
		if (T.wildcard) P.termid.pop(); else break;
	} while(T);		
	return phrase_term;
}
var newQuery =function(engine,query,opts) {
	//if (!query) return;
	opts=opts||{};
	query=trimSpace(engine,query);

	var phrases=query,phrases=[];
	if (typeof query=='string' && query) {
		phrases=parseQuery(query,opts.phrase_sep || "");
	}
	
	var phrase_terms=[], terms=[],variants=[],operators=[];
	var pc=0;//phrase count
	for  (var i=0;i<phrases.length;i++) {
		var op=getOperator(phrases[pc]);
		if (op) phrases[pc]=phrases[pc].substring(1);

		/* auto add + for natural order ?*/
		//if (!opts.rank && op!='exclude' &&i) op='include';
		operators.push(op);

		if (isSimplePhrase(phrases[pc]) && engine.mergePostings ) {
			var phrase_term=fastPhrase(engine,phrases[pc]);
		} else {
			var phrase_term=slowPhrase(engine,terms,phrases[pc]);
		}
		phrase_terms.push(phrase_term);

		if (!engine.mergePostings && phrase_terms[pc].termid.length==0) {
			phrase_terms.pop();
		} else pc++;
	}
	opts.op=operators;

	var Q={dbname:engine.dbname,engine:engine,opts:opts,query:query,
		phrases:phrase_terms,terms:terms
	};
	Q.tokenize=function() {return engine.analyzer.tokenize.apply(engine,arguments);}
	Q.isSkip=function() {return engine.analyzer.isSkip.apply(engine,arguments);}
	Q.normalize=function() {return engine.analyzer.normalize.apply(engine,arguments);}
	Q.segWithHit=segWithHit;

	//Q.getRange=function() {return that.getRange.apply(that,arguments)};
	//API.queryid='Q'+(Math.floor(Math.random()*10000000)).toString(16);
	return Q;
}
var postingPathFromTokens=function(engine,tokens) {
	var alltokens=engine.get("tokens");

	var tokenIds=tokens.map(function(t){ return 1+alltokens.indexOf(t)});
	var postingid=[];
	for (var i=0;i<tokenIds.length;i++) {
		postingid.push( tokenIds[i]); // tokenId==0 , empty token
	}
	return postingid.map(function(t){return ["postings",t]});
}
var loadPostings=function(engine,tokens,cb) {
	var toloadtokens=tokens.filter(function(t){
		return !engine.postingCache[t.key]; //already in cache
	});
	if (toloadtokens.length==0) {
		cb();
		return;
	}
	var postingPaths=postingPathFromTokens(engine,tokens.map(function(t){return t.key}));
	engine.get(postingPaths,function(postings){
		postings.map(function(p,i) { tokens[i].posting=p });
		if (cb) cb();
	});
}
var groupBy=function(Q,posting) {
	phrases.forEach(function(P){
		var key=P.key;
		var docfreq=docfreqcache[key];
		if (!docfreq) docfreq=docfreqcache[key]={};
		if (!docfreq[that.groupunit]) {
			docfreq[that.groupunit]={doclist:null,freq:null};
		}		
		if (P.posting) {
			var res=matchPosting(engine,P.posting);
			P.freq=res.freq;
			P.docs=res.docs;
		} else {
			P.docs=[];
			P.freq=[];
		}
		docfreq[that.groupunit]={doclist:P.docs,freq:P.freq};
	});
	return this;
}
var groupByFolder=function(engine,filehits) {
	var files=engine.get("filenames");
	var prevfolder="",hits=0,out=[];
	for (var i=0;i<filehits.length;i++) {
		var fn=files[i];
		var folder=fn.substring(0,fn.indexOf('/'));
		if (prevfolder && prevfolder!=folder) {
			out.push(hits);
			hits=0;
		}
		hits+=filehits[i].length;
		prevfolder=folder;
	}
	out.push(hits);
	return out;
}
var phrase_intersect=function(engine,Q) {
	var intersected=null;
	var fileoffsets=Q.engine.get("fileoffsets");
	var empty=[],emptycount=0,hashit=0;
	for (var i=0;i<Q.phrases.length;i++) {
		var byfile=plist.groupbyposting2(Q.phrases[i].posting,fileoffsets);
		if (byfile.length) byfile.shift();
		if (byfile.length) byfile.pop();
		byfile.pop();
		if (intersected==null) {
			intersected=byfile;
		} else {
			for (var j=0;j<byfile.length;j++) {
				if (!(byfile[j].length && intersected[j].length)) {
					intersected[j]=empty; //reuse empty array
					emptycount++;
				} else hashit++;
			}
		}
	}

	Q.byFile=intersected;
	Q.byFolder=groupByFolder(engine,Q.byFile);
	var out=[];
	//calculate new rawposting
	for (var i=0;i<Q.byFile.length;i++) {
		if (Q.byFile[i].length) out=out.concat(Q.byFile[i]);
	}
	Q.rawresult=out;
	countFolderFile(Q);
}
var countFolderFile=function(Q) {
	Q.fileWithHitCount=0;
	Q.byFile.map(function(f){if (f.length) Q.fileWithHitCount++});
			
	Q.folderWithHitCount=0;
	Q.byFolder.map(function(f){if (f) Q.folderWithHitCount++});
}

var main=function(engine,q,opts,cb){
	var starttime=new Date();
	var meta=engine.get("meta");
	if (meta.normalize && engine.analyzer.setNormalizeTable) {
		meta.normalizeObj=engine.analyzer.setNormalizeTable(meta.normalize,meta.normalizeObj);
	}
	if (typeof opts=="function") cb=opts;
	opts=opts||{};
	var Q=engine.queryCache[q];
	if (!Q) Q=newQuery(engine,q,opts); 
	if (!Q) {
		engine.searchtime=new Date()-starttime;
		engine.totaltime=engine.searchtime;
		if (engine.context) cb.apply(engine.context,["empty result",{rawresult:[]}]);
		else cb("empty result",{rawresult:[]});
		return;
	};
	engine.queryCache[q]=Q;
	if (Q.phrases.length) {
		loadPostings(engine,Q.terms,function(){
			if (!Q.phrases[0].posting) {
				engine.searchtime=new Date()-starttime;
				engine.totaltime=engine.searchtime

				cb.apply(engine.context,["no such posting",{rawresult:[]}]);
				return;			
			}
			
			if (!Q.phrases[0].posting.length) { //
				Q.phrases.forEach(loadPhrase.bind(Q));
			}
			if (Q.phrases.length==1) {
				Q.rawresult=Q.phrases[0].posting;
			} else {
				phrase_intersect(engine,Q);
			}
			var fileoffsets=Q.engine.get("fileoffsets");
			//console.log("search opts "+JSON.stringify(opts));

			if (!Q.byFile && Q.rawresult && !opts.nogroup) {
				Q.byFile=plist.groupbyposting2(Q.rawresult, fileoffsets);
				Q.byFile.shift();Q.byFile.pop();
				Q.byFolder=groupByFolder(engine,Q.byFile);

				countFolderFile(Q);
			}

			if (opts.range) {
				engine.searchtime=new Date()-starttime;
				excerpt.resultlist(engine,Q,opts,function(data) { 
					//console.log("excerpt ok");
					Q.excerpt=data;
					engine.totaltime=new Date()-starttime;
					cb.apply(engine.context,[0,Q]);
				});
			} else {
				engine.searchtime=new Date()-starttime;
				engine.totaltime=new Date()-starttime;
				cb.apply(engine.context,[0,Q]);
			}
		});
	} else { //empty search
		engine.searchtime=new Date()-starttime;
		engine.totaltime=new Date()-starttime;
		cb.apply(engine.context,[0,Q]);
	};
}

main.splitPhrase=splitPhrase; //just for debug
module.exports=main;
},{"./boolsearch":"C:\\ksana2015\\node_modules\\ksana-search\\boolsearch.js","./excerpt":"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js","./plist":"C:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\checkbrowser.js":[function(require,module,exports){
/** @jsx React.DOM */
/*
convert to pure js
save -g reactify
*/
var E=React.createElement;

var hasksanagap=(typeof ksanagap!="undefined");
if (hasksanagap && (typeof console=="undefined" || typeof console.log=="undefined")) {
		window.console={log:ksanagap.log,error:ksanagap.error,debug:ksanagap.debug,warn:ksanagap.warn};
		console.log("install console output funciton");
}

var checkfs=function() {
	return (navigator && navigator.webkitPersistentStorage) || hasksanagap;
}
var featurechecks={
	"fs":checkfs
}
var checkbrowser = React.createClass({
	getInitialState:function() {

		var missingFeatures=this.getMissingFeatures();
		return {ready:false, missing:missingFeatures};
	},
	getMissingFeatures:function() {
		var feature=this.props.feature.split(",");
		var status=[];
		feature.map(function(f){
			var checker=featurechecks[f];
			if (checker) checker=checker();
			status.push([f,checker]);
		});
		return status.filter(function(f){return !f[1]});
	},
	downloadbrowser:function() {
		window.location="https://www.google.com/chrome/"
	},
	renderMissing:function() {
		var showMissing=function(m) {
			return E("div", null, m);
		}
		return (
		 E("div", {ref: "dialog1", className: "modal fade", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-hidden": "true"}, "×"), 
		          E("h4", {className: "modal-title"}, "Browser Check")
		        ), 
		        E("div", {className: "modal-body"}, 
		          E("p", null, "Sorry but the following feature is missing"), 
		          this.state.missing.map(showMissing)
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.downloadbrowser, type: "button", className: "btn btn-primary"}, "Download Google Chrome")
		        )
		      )
		    )
		  )
		 );
	},
	renderReady:function() {
		return E("span", null, "browser ok")
	},
	render:function(){
		return  (this.state.missing.length)?this.renderMissing():this.renderReady();
	},
	componentDidMount:function() {
		if (!this.state.missing.length) {
			this.props.onReady();
		} else {
			$(this.refs.dialog1.getDOMNode()).modal('show');
		}
	}
});

module.exports=checkbrowser;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js":[function(require,module,exports){

var userCancel=false;
var files=[];
var totalDownloadByte=0;
var targetPath="";
var tempPath="";
var nfile=0;
var baseurl="";
var result="";
var downloading=false;
var startDownload=function(dbid,_baseurl,_files) { //return download id
	var fs     = require("fs");
	var path   = require("path");

	
	files=_files.split("\uffff");
	if (downloading) return false; //only one session
	userCancel=false;
	totalDownloadByte=0;
	nextFile();
	downloading=true;
	baseurl=_baseurl;
	if (baseurl[baseurl.length-1]!='/')baseurl+='/';
	targetPath=ksanagap.rootPath+dbid+'/';
	tempPath=ksanagap.rootPath+".tmp/";
	result="";
	return true;
}

var nextFile=function() {
	setTimeout(function(){
		if (nfile==files.length) {
			nfile++;
			endDownload();
		} else {
			downloadFile(nfile++);	
		}
	},100);
}

var downloadFile=function(nfile) {
	var url=baseurl+files[nfile];
	var tmpfilename=tempPath+files[nfile];
	var mkdirp = require("./mkdirp");
	var fs     = require("fs");
	var http   = require("http");

	mkdirp.sync(path.dirname(tmpfilename));
	var writeStream = fs.createWriteStream(tmpfilename);
	var datalength=0;
	var request = http.get(url, function(response) {
		response.on('data',function(chunk){
			writeStream.write(chunk);
			totalDownloadByte+=chunk.length;
			if (userCancel) {
				writeStream.end();
				setTimeout(function(){nextFile();},100);
			}
		});
		response.on("end",function() {
			writeStream.end();
			setTimeout(function(){nextFile();},100);
		});
	});
}

var cancelDownload=function() {
	userCancel=true;
	endDownload();
}
var verify=function() {
	return true;
}
var endDownload=function() {
	nfile=files.length+1;//stop
	result="cancelled";
	downloading=false;
	if (userCancel) return;
	var fs     = require("fs");
	var mkdirp = require("./mkdirp");

	for (var i=0;i<files.length;i++) {
		var targetfilename=targetPath+files[i];
		var tmpfilename   =tempPath+files[i];
		mkdirp.sync(path.dirname(targetfilename));
		fs.renameSync(tmpfilename,targetfilename);
	}
	if (verify()) {
		result="success";
	} else {
		result="error";
	}
}

var downloadedByte=function() {
	return totalDownloadByte;
}
var doneDownload=function() {
	if (nfile>files.length) return result;
	else return "";
}
var downloadingFile=function() {
	return nfile-1;
}

var downloader={startDownload:startDownload, downloadedByte:downloadedByte,
	downloadingFile:downloadingFile, cancelDownload:cancelDownload,doneDownload:doneDownload};
module.exports=downloader;
},{"./mkdirp":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js","fs":false,"http":false,"path":false}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js":[function(require,module,exports){
/** @jsx React.DOM */

/* todo , optional kdb */

var HtmlFS=require("./htmlfs");
var html5fs=require("./html5fs");
var CheckBrowser=require("./checkbrowser");
var E=React.createElement;
  

var FileList = React.createClass({
	getInitialState:function() {
		return {downloading:false,progress:0};
	},
	updatable:function(f) {
        var classes="btn btn-warning";
        if (this.state.downloading) classes+=" disabled";
		if (f.hasUpdate) return   E("button", {className: classes, 
			"data-filename": f.filename, "data-url": f.url, 
	            onClick: this.download
	       }, "Update")
		else return null;
	},
	showLocal:function(f) {
        var classes="btn btn-danger";
        if (this.state.downloading) classes+=" disabled";
	  return E("tr", null, E("td", null, f.filename), 
	      E("td", null), 
	      E("td", {className: "pull-right"}, 
	      this.updatable(f), E("button", {className: classes, 
	               onClick: this.deleteFile, "data-filename": f.filename}, "Delete")
	        
	      )
	  )
	},  
	showRemote:function(f) { 
	  var classes="btn btn-warning";
	  if (this.state.downloading) classes+=" disabled";
	  return (E("tr", {"data-id": f.filename}, E("td", null, 
	      f.filename), 
	      E("td", null, f.desc), 
	      E("td", null, 
	      E("span", {"data-filename": f.filename, "data-url": f.url, 
	            className: classes, 
	            onClick: this.download}, "Download")
	      )
	  ));
	},
	showFile:function(f) {
	//	return <span data-id={f.filename}>{f.url}</span>
		return (f.ready)?this.showLocal(f):this.showRemote(f);
	},
	reloadDir:function() {
		this.props.action("reload");
	},
	download:function(e) {
		var url=e.target.dataset["url"];
		var filename=e.target.dataset["filename"];
		this.setState({downloading:true,progress:0,url:url});
		this.userbreak=false;
		html5fs.download(url,filename,function(){
			this.reloadDir();
			this.setState({downloading:false,progress:1});
			},function(progress,total){
				if (progress==0) {
					this.setState({message:"total "+total})
			 	}
			 	this.setState({progress:progress});
			 	//if user press abort return true
			 	return this.userbreak;
			}
		,this);
	},
	deleteFile:function( e) {
		var filename=e.target.attributes["data-filename"].value;
		this.props.action("delete",filename);
	},
	allFilesReady:function(e) {
		return this.props.files.every(function(f){ return f.ready});
	},
	dismiss:function() {
		$(this.refs.dialog1.getDOMNode()).modal('hide');
		this.props.action("dismiss");
	},
	abortdownload:function() {
		this.userbreak=true;
	},
	showProgress:function() {
	     if (this.state.downloading) {
	      var progress=Math.round(this.state.progress*100);
	      return (
	      	E("div", null, 
	      	"Downloading from ", this.state.url, 
	      E("div", {key: "progress", className: "progress col-md-8"}, 
	          E("div", {className: "progress-bar", role: "progressbar", 
	              "aria-valuenow": progress, "aria-valuemin": "0", 
	              "aria-valuemax": "100", style: {width: progress+"%"}}, 
	            progress, "%"
	          )
	        ), 
	        E("button", {onClick: this.abortdownload, 
	        	className: "btn btn-danger col-md-4"}, "Abort")
	        )
	        );
	      } else {
	      		if ( this.allFilesReady() ) {
	      			return E("button", {onClick: this.dismiss, className: "btn btn-success"}, "Ok")
	      		} else return null;
	      		
	      }
	},
	showUsage:function() {
		var percent=this.props.remainPercent;
           return (E("div", null, E("span", {className: "pull-left"}, "Usage:"), E("div", {className: "progress"}, 
		  E("div", {className: "progress-bar progress-bar-success progress-bar-striped", role: "progressbar", style: {width: percent+"%"}}, 
		    	percent+"%"
		  )
		)));
	},
	render:function() {
	  	return (
		E("div", {ref: "dialog1", className: "modal fade", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "File Installer")
		        ), 
		        E("div", {className: "modal-body"}, 
		        	E("table", {className: "table"}, 
		        	E("tbody", null, 
		          	this.props.files.map(this.showFile)
		          	)
		          )
		        ), 
		        E("div", {className: "modal-footer"}, 
		        	this.showUsage(), 
		           this.showProgress()
		        )
		      )
		    )
		  )
		);
	},	
	componentDidMount:function() {
		$(this.refs.dialog1.getDOMNode()).modal('show');
	}
});
/*TODO kdb check version*/
var Filemanager = React.createClass({
	getInitialState:function() {
		var quota=this.getQuota();
		return {browserReady:false,noupdate:true,	requestQuota:quota,remain:0};
	},
	getQuota:function() {
		var q=this.props.quota||"128M";
		var unit=q[q.length-1];
		var times=1;
		if (unit=="M") times=1024*1024;
		else if (unit="K") times=1024;
		return parseInt(q) * times;
	},
	missingKdb:function() {
		if (ksanagap.platform!="chrome") return [];
		var missing=this.props.needed.filter(function(kdb){
			for (var i in html5fs.files) {
				if (html5fs.files[i][0]==kdb.filename) return false;
			}
			return true;
		},this);
		return missing;
	},
	getRemoteUrl:function(fn) {
		var f=this.props.needed.filter(function(f){return f.filename==fn});
		if (f.length ) return f[0].url;
	},
	genFileList:function(existing,missing){
		var out=[];
		for (var i in existing) {
			var url=this.getRemoteUrl(existing[i][0]);
			out.push({filename:existing[i][0], url :url, ready:true });
		}
		for (var i in missing) {
			out.push(missing[i]);
		}
		return out;
	},
	reload:function() {
		html5fs.readdir(function(files){
  			this.setState({files:this.genFileList(files,this.missingKdb())});
  		},this);
	 },
	deleteFile:function(fn) {
	  html5fs.rm(fn,function(){
	  	this.reload();
	  },this);
	},
	onQuoteOk:function(quota,usage) {
		if (ksanagap.platform!="chrome") {
			//console.log("onquoteok");
			this.setState({noupdate:true,missing:[],files:[],autoclose:true
				,quota:quota,remain:quota-usage,usage:usage});
			return;
		}
		//console.log("quote ok");
		var files=this.genFileList(html5fs.files,this.missingKdb());
		var that=this;
		that.checkIfUpdate(files,function(hasupdate) {
			var missing=this.missingKdb();
			var autoclose=this.props.autoclose;
			if (missing.length) autoclose=false;
			that.setState({autoclose:autoclose,
				quota:quota,usage:usage,files:files,
				missing:missing,
				noupdate:!hasupdate,
				remain:quota-usage});
		});
	},  
	onBrowserOk:function() {
	  this.totalDownloadSize();
	}, 
	dismiss:function() {
		this.props.onReady(this.state.usage,this.state.quota);
		setTimeout(function(){
			var modalin=$(".modal.in");
			if (modalin.modal) modalin.modal('hide');
		},500);
	}, 
	totalDownloadSize:function() {
		var files=this.missingKdb();
		var taskqueue=[],totalsize=0;
		for (var i=0;i<files.length;i++) {
			taskqueue.push(
				(function(idx){
					return (function(data){
						if (!(typeof data=='object' && data.__empty)) totalsize+=data;
						html5fs.getDownloadSize(files[idx].url,taskqueue.shift());
					});
				})(i)
			);
		}
		var that=this;
		taskqueue.push(function(data){	
			totalsize+=data;
			setTimeout(function(){that.setState({requireSpace:totalsize,browserReady:true})},0);
		});
		taskqueue.shift()({__empty:true});
	},
	checkIfUpdate:function(files,cb) {
		var taskqueue=[];
		for (var i=0;i<files.length;i++) {
			taskqueue.push(
				(function(idx){
					return (function(data){
						if (!(typeof data=='object' && data.__empty)) files[idx-1].hasUpdate=data;
						html5fs.checkUpdate(files[idx].url,files[idx].filename,taskqueue.shift());
					});
				})(i)
			);
		}
		var that=this;
		taskqueue.push(function(data){	
			files[files.length-1].hasUpdate=data;
			var hasupdate=files.some(function(f){return f.hasUpdate});
			if (cb) cb.apply(that,[hasupdate]);
		});
		taskqueue.shift()({__empty:true});
	},
	render:function(){
    		if (!this.state.browserReady) {   
      			return E(CheckBrowser, {feature: "fs", onReady: this.onBrowserOk})
    		} if (!this.state.quota || this.state.remain<this.state.requireSpace) {  
    			var quota=this.state.requestQuota;
    			if (this.state.usage+this.state.requireSpace>quota) {
    				quota=(this.state.usage+this.state.requireSpace)*1.5;
    			}
      			return E(HtmlFS, {quota: quota, autoclose: "true", onReady: this.onQuoteOk})
      		} else {
			if (!this.state.noupdate || this.missingKdb().length || !this.state.autoclose) {
				var remain=Math.round((this.state.usage/this.state.quota)*100);				
				return E(FileList, {action: this.action, files: this.state.files, remainPercent: remain})
			} else {
				setTimeout( this.dismiss ,0);
				return E("span", null, "Success");
			}
      		}
	},
	action:function() {
	  var args = Array.prototype.slice.call(arguments);
	  var type=args.shift();
	  var res=null, that=this;
	  if (type=="delete") {
	    this.deleteFile(args[0]);
	  }  else if (type=="reload") {
	  	this.reload();
	  } else if (type=="dismiss") {
	  	this.dismiss();
	  }
	}
});

module.exports=Filemanager;
},{"./checkbrowser":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\checkbrowser.js","./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js","./htmlfs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js":[function(require,module,exports){
/* emulate filesystem on html5 browser */
var get_head=function(url,field,cb){
	var xhr = new XMLHttpRequest();
	xhr.open("HEAD", url, true);
	xhr.onreadystatechange = function() {
			if (this.readyState == this.DONE) {
				cb(xhr.getResponseHeader(field));
			} else {
				if (this.status!==200&&this.status!==206) {
					cb("");
				}
			} 
	};
	xhr.send();	
}
var get_date=function(url,cb) {
	get_head(url,"Last-Modified",function(value){
		cb(value);
	});
}
var get_size=function(url, cb) {
	get_head(url,"Content-Length",function(value){
		cb(parseInt(value));
	});
};
var checkUpdate=function(url,fn,cb) {
	if (!url) {
		cb(false);
		return;
	}
	get_date(url,function(d){
		API.fs.root.getFile(fn, {create: false, exclusive: false}, function(fileEntry) {
			fileEntry.getMetadata(function(metadata){
				var localDate=Date.parse(metadata.modificationTime);
				var urlDate=Date.parse(d);
				cb(urlDate>localDate);
			});
		},function(){
			cb(false);
		});
	});
}
var download=function(url,fn,cb,statuscb,context) {
	 var totalsize=0,batches=null,written=0;
	 var fileEntry=0, fileWriter=0;
	 var createBatches=function(size) {
		var bytes=1024*1024, out=[];
		var b=Math.floor(size / bytes);
		var last=size %bytes;
		for (var i=0;i<=b;i++) {
			out.push(i*bytes);
		}
		out.push(b*bytes+last);
		return out;
	 }
	 var finish=function() {
		 rm(fn,function(){
				fileEntry.moveTo(fileEntry.filesystem.root, fn,function(){
					setTimeout( cb.bind(context,false) , 0) ; 
				},function(e){
					console.log("failed",e)
				});
		 },this); 
	 };
		var tempfn="temp.kdb";
		var batch=function(b) {
		var abort=false;
		var xhr = new XMLHttpRequest();
		var requesturl=url+"?"+Math.random();
		xhr.open('get', requesturl, true);
		xhr.setRequestHeader('Range', 'bytes='+batches[b]+'-'+(batches[b+1]-1));
		xhr.responseType = 'blob';    
		xhr.addEventListener('load', function() {
			var blob=this.response;
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.seek(fileWriter.length);
				fileWriter.write(blob);
				written+=blob.size;
				fileWriter.onwriteend = function(e) {
					if (statuscb) {
						abort=statuscb.apply(context,[ fileWriter.length / totalsize,totalsize ]);
						if (abort) setTimeout( cb.bind(context,false) , 0) ;
				 	}
					b++;
					if (!abort) {
						if (b<batches.length-1) setTimeout(batch.bind(context,b),0);
						else                    finish();
				 	}
			 	};
			}, console.error);
		},false);
		xhr.send();
	}

	get_size(url,function(size){
		totalsize=size;
		if (!size) {
			if (cb) cb.apply(context,[false]);
		} else {//ready to download
			rm(tempfn,function(){
				 batches=createBatches(size);
				 if (statuscb) statuscb.apply(context,[ 0, totalsize ]);
				 API.fs.root.getFile(tempfn, {create: 1, exclusive: false}, function(_fileEntry) {
							fileEntry=_fileEntry;
						batch(0);
				 });
			},this);
		}
	});
}

var readFile=function(filename,cb,context) {
	API.fs.root.getFile(filename, function(fileEntry) {
			var reader = new FileReader();
			reader.onloadend = function(e) {
					if (cb) cb.apply(cb,[this.result]);
				};            
	}, console.error);
}
var writeFile=function(filename,buf,cb,context){
	API.fs.root.getFile(filename, {create: true, exclusive: true}, function(fileEntry) {
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.write(buf);
				fileWriter.onwriteend = function(e) {
					if (cb) cb.apply(cb,[buf.byteLength]);
				};            
			}, console.error);
	}, console.error);
}

var readdir=function(cb,context) {
	var dirReader = API.fs.root.createReader();
	var out=[],that=this;
	dirReader.readEntries(function(entries) {
		if (entries.length) {
			for (var i = 0, entry; entry = entries[i]; ++i) {
				if (entry.isFile) {
					out.push([entry.name,entry.toURL ? entry.toURL() : entry.toURI()]);
				}
			}
		}
		API.files=out;
		if (cb) cb.apply(context,[out]);
	}, function(){
		if (cb) cb.apply(context,[null]);
	});
}
var getFileURL=function(filename) {
	if (!API.files ) return null;
	var file= API.files.filter(function(f){return f[0]==filename});
	if (file.length) return file[0][1];
}
var rm=function(filename,cb,context) {
	var url=getFileURL(filename);
	if (url) rmURL(url,cb,context);
	else if (cb) cb.apply(context,[false]);
}

var rmURL=function(filename,cb,context) {
	webkitResolveLocalFileSystemURL(filename, function(fileEntry) {
		fileEntry.remove(function() {
			if (cb) cb.apply(context,[true]);
		}, console.error);
	},  function(e){
		if (cb) cb.apply(context,[false]);//no such file
	});
}
function errorHandler(e) {
	console.error('Error: ' +e.name+ " "+e.message);
}
var initfs=function(grantedBytes,cb,context) {
	webkitRequestFileSystem(PERSISTENT, grantedBytes,  function(fs) {
		API.fs=fs;
		API.quota=grantedBytes;
		readdir(function(){
			API.initialized=true;
			cb.apply(context,[grantedBytes,fs]);
		},context);
	}, errorHandler);
}
var init=function(quota,cb,context) {
	navigator.webkitPersistentStorage.requestQuota(quota, 
			function(grantedBytes) {
				initfs(grantedBytes,cb,context);
		}, errorHandler
	);
}
var queryQuota=function(cb,context) {
	var that=this;
	navigator.webkitPersistentStorage.queryUsageAndQuota( 
	 function(usage,quota){
			initfs(quota,function(){
				cb.apply(context,[usage,quota]);
			},context);
	});
}
var API={
	init:init
	,readdir:readdir
	,checkUpdate:checkUpdate
	,rm:rm
	,rmURL:rmURL
	,getFileURL:getFileURL
	,writeFile:writeFile
	,readFile:readFile
	,download:download
	,get_head:get_head
	,get_date:get_date
	,get_size:get_size
	,getDownloadSize:get_size
	,queryQuota:queryQuota
}
module.exports=API;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js":[function(require,module,exports){
var html5fs=require("./html5fs");
var E=React.createElement;

var htmlfs = React.createClass({
	getInitialState:function() { 
		return {ready:false, quota:0,usage:0,Initialized:false,autoclose:this.props.autoclose};
	},
	initFilesystem:function() {
		var quota=this.props.quota||1024*1024*128; // default 128MB
		quota=parseInt(quota);
		html5fs.init(quota,function(q){
			this.dialog=false;
			$(this.refs.dialog1.getDOMNode()).modal('hide');
			this.setState({quota:q,autoclose:true});
		},this);
	},
	welcome:function() {
		return (
		E("div", {ref: "dialog1", className: "modal fade", id: "myModal", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "Welcome")
		        ), 
		        E("div", {className: "modal-body"}, 
		          "Browser will ask for your confirmation."
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.initFilesystem, type: "button", 
		            className: "btn btn-primary"}, "Initialize File System")
		        )
		      )
		    )
		  )
		 );
	},
	renderDefault:function(){
		var used=Math.floor(this.state.usage/this.state.quota *100);
		var more=function() {
			if (used>50) return E("button", {type: "button", className: "btn btn-primary"}, "Allocate More");
			else null;
		}
		return (
		E("div", {ref: "dialog1", className: "modal fade", id: "myModal", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "Sandbox File System")
		        ), 
		        E("div", {className: "modal-body"}, 
		          E("div", {className: "progress"}, 
		            E("div", {className: "progress-bar", role: "progressbar", style: {width: used+"%"}}, 
		               used, "%"
		            )
		          ), 
		          E("span", null, this.state.quota, " total , ", this.state.usage, " in used")
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.dismiss, type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "Close"), 
		          more()
		        )
		      )
		    )
		  )
		  );
	},
	dismiss:function() {
		var that=this;
		setTimeout(function(){
			that.props.onReady(that.state.quota,that.state.usage);	
		},0);
	},
	queryQuota:function() {
		if (ksanagap.platform=="chrome") {
			html5fs.queryQuota(function(usage,quota){
				this.setState({usage:usage,quota:quota,initialized:true});
			},this);			
		} else {
			this.setState({usage:333,quota:1000*1000*1024,initialized:true,autoclose:true});
		}
	},
	render:function() {
		var that=this;
		if (!this.state.quota || this.state.quota<this.props.quota) {
			if (this.state.initialized) {
				this.dialog=true;
				return this.welcome();	
			} else {
				return E("span", null, "checking quota");
			}			
		} else {
			if (!this.state.autoclose) {
				this.dialog=true;
				return this.renderDefault(); 
			}
			this.dismiss();
			this.dialog=false;
			return null;
		}
	},
	componentDidMount:function() {
		if (!this.state.quota) {
			this.queryQuota();

		};
	},
	componentDidUpdate:function() {
		if (this.dialog) $(this.refs.dialog1.getDOMNode()).modal('show');
	}
});

module.exports=htmlfs;
},{"./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js":[function(require,module,exports){
var ksana={"platform":"remote"};
if (typeof window!="undefined") {
	window.ksana=ksana;
	if (typeof ksanagap=="undefined") {
		window.ksanagap=require("./ksanagap"); //compatible layer with mobile
	}
}
if (typeof process !="undefined") {
	if (process.versions && process.versions["node-webkit"]) {
  		if (typeof nodeRequire!="undefined") ksana.require=nodeRequire;
  		ksana.platform="node-webkit";
  		window.ksanagap.platform="node-webkit";
		var ksanajs=require("fs").readFileSync("ksana.js","utf8").trim();
		ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
		window.kfs=require("./kfs");
  	}
} else if (typeof chrome!="undefined"){//} && chrome.fileSystem){
//	window.ksanagap=require("./ksanagap"); //compatible layer with mobile
	window.ksanagap.platform="chrome";
	window.kfs=require("./kfs_html5");
	require("./livereload")();
	ksana.platform="chrome";
} else {
	if (typeof ksanagap!="undefined" && typeof fs!="undefined") {//mobile
		var ksanajs=fs.readFileSync("ksana.js","utf8").trim(); //android extra \n at the end
		ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
		ksana.platform=ksanagap.platform;
		if (typeof ksanagap.android !="undefined") {
			ksana.platform="android";
		}
	}
}
var timer=null;
var boot=function(appId,cb) {
	ksana.appId=appId;
	if (ksanagap.platform=="chrome") { //need to wait for jsonp ksana.js
		timer=setInterval(function(){
			if (ksana.ready){
				clearInterval(timer);
				if (ksana.js && ksana.js.files && ksana.js.files.length) {
					require("./installkdb")(ksana.js,cb);
				} else {
					cb();		
				}
			}
		},300);
	} else {
		cb();
	}
}

module.exports={boot:boot
	,htmlfs:require("./htmlfs")
	,html5fs:require("./html5fs")
	,liveupdate:require("./liveupdate")
	,fileinstaller:require("./fileinstaller")
	,downloader:require("./downloader")
	,installkdb:require("./installkdb")
};
},{"./downloader":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js","./fileinstaller":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js","./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js","./htmlfs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js","./installkdb":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\installkdb.js","./kfs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs.js","./kfs_html5":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs_html5.js","./ksanagap":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js","./livereload":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js","./liveupdate":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\liveupdate.js","fs":false}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\installkdb.js":[function(require,module,exports){
var Fileinstaller=require("./fileinstaller");

var getRequire_kdb=function() {
    var required=[];
    ksana.js.files.map(function(f){
      if (f.indexOf(".kdb")==f.length-4) {
        var slash=f.lastIndexOf("/");
        if (slash>-1) {
          var dbid=f.substring(slash+1,f.length-4);
          required.push({url:f,dbid:dbid,filename:dbid+".kdb"});
        } else {
          var dbid=f.substring(0,f.length-4);
          required.push({url:ksana.js.baseurl+f,dbid:dbid,filename:f});
        }        
      }
    });
    return required;
}
var callback=null;
var onReady=function() {
	callback();
}
var openFileinstaller=function(keep) {
	var require_kdb=getRequire_kdb().map(function(db){
	  return {
	    url:window.location.origin+window.location.pathname+db.dbid+".kdb",
	    dbdb:db.dbid,
	    filename:db.filename
	  }
	})
	return React.createElement(Fileinstaller, {quota: "512M", autoclose: !keep, needed: require_kdb, 
	                 onReady: onReady});
}
var installkdb=function(ksanajs,cb,context) {
	console.log(ksanajs.files);
	React.render(openFileinstaller(),document.getElementById("main"));
	callback=cb;
}
module.exports=installkdb;
},{"./fileinstaller":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs.js":[function(require,module,exports){
//Simulate feature in ksanagap
/* 
  runs on node-webkit only
*/

var readDir=function(path) { //simulate Ksanagap function
	var fs=nodeRequire("fs");
	path=path||"..";
	var dirs=[];
	if (path[0]==".") {
		if (path==".") dirs=fs.readdirSync(".");
		else {
			dirs=fs.readdirSync("..");
		}
	} else {
		dirs=fs.readdirSync(path);
	}

	return dirs.join("\uffff");
}
var listApps=function() {
	var fs=nodeRequire("fs");
	var ksanajsfile=function(d) {return "../"+d+"/ksana.js"};
	var dirs=fs.readdirSync("..").filter(function(d){
				return fs.statSync("../"+d).isDirectory() && d[0]!="."
				   && fs.existsSync(ksanajsfile(d));
	});
	
	var out=dirs.map(function(d){
		var content=fs.readFileSync(ksanajsfile(d),"utf8");
  	content=content.replace("})","}");
  	content=content.replace("jsonp_handler(","");
		var obj= JSON.parse(content);
		obj.dbid=d;
		obj.path=d;
		return obj;
	})
	return JSON.stringify(out);
}



var kfs={readDir:readDir,listApps:listApps};

module.exports=kfs;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs_html5.js":[function(require,module,exports){
var readDir=function(){
	return [];
}
var listApps=function(){
	return [];
}
module.exports={readDir:readDir,listApps:listApps};
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js":[function(require,module,exports){
var appname="installer";
var switchApp=function(path) {
	var fs=require("fs");
	path="../"+path;
	appname=path;
	document.location.href= path+"/index.html"; 
	process.chdir(path);
}
var downloader={};
var rootPath="";

var deleteApp=function(app) {
	console.error("not allow on PC, do it in File Explorer/ Finder");
}
var username=function() {
	return "";
}
var useremail=function() {
	return ""
}
var runtime_version=function() {
	return "1.4";
}

//copy from liveupdate
var jsonp=function(url,dbid,callback,context) {
  var script=document.getElementById("jsonp2");
  if (script) {
    script.parentNode.removeChild(script);
  }
  window.jsonp_handler=function(data) {
    if (typeof data=="object") {
      data.dbid=dbid;
      callback.apply(context,[data]);    
    }  
  }
  window.jsonp_error_handler=function() {
    console.error("url unreachable",url);
    callback.apply(context,[null]);
  }
  script=document.createElement('script');
  script.setAttribute('id', "jsonp2");
  script.setAttribute('onerror', "jsonp_error_handler()");
  url=url+'?'+(new Date().getTime());
  script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(script); 
}

var ksanagap={
	platform:"node-webkit",
	startDownload:downloader.startDownload,
	downloadedByte:downloader.downloadedByte,
	downloadingFile:downloader.downloadingFile,
	cancelDownload:downloader.cancelDownload,
	doneDownload:downloader.doneDownload,
	switchApp:switchApp,
	rootPath:rootPath,
	deleteApp: deleteApp,
	username:username, //not support on PC
	useremail:username,
	runtime_version:runtime_version,
	
}

if (typeof process!="undefined") {
	var ksanajs=require("fs").readFileSync("./ksana.js","utf8").trim();
	downloader=require("./downloader");
	console.log(ksanajs);
	//ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
	rootPath=process.cwd();
	rootPath=require("path").resolve(rootPath,"..").replace(/\\/g,"/")+'/';
	ksana.ready=true;
} else{
	var url=window.location.origin+window.location.pathname.replace("index.html","")+"ksana.js";
	jsonp(url,appname,function(data){
		ksana.js=data;
		ksana.ready=true;
	});
}
module.exports=ksanagap;
},{"./downloader":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js","fs":false,"path":false}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js":[function(require,module,exports){
var started=false;
var timer=null;
var bundledate=null;
var get_date=require("./html5fs").get_date;
var checkIfBundleUpdated=function() {
	get_date("bundle.js",function(date){
		if (bundledate &&bundledate!=date){
			location.reload();
		}
		bundledate=date;
	});
}
var livereload=function() {
	if (started) return;

	timer1=setInterval(function(){
		checkIfBundleUpdated();
	},2000);
	started=true;
}

module.exports=livereload;
},{"./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\liveupdate.js":[function(require,module,exports){

var jsonp=function(url,dbid,callback,context) {
  var script=document.getElementById("jsonp");
  if (script) {
    script.parentNode.removeChild(script);
  }
  window.jsonp_handler=function(data) {
    //console.log("receive from ksana.js",data);
    if (typeof data=="object") {
      if (typeof data.dbid=="undefined") {
        data.dbid=dbid;
      }
      callback.apply(context,[data]);
    }  
  }

  window.jsonp_error_handler=function() {
    console.error("url unreachable",url);
    callback.apply(context,[null]);
  }

  script=document.createElement('script');
  script.setAttribute('id', "jsonp");
  script.setAttribute('onerror', "jsonp_error_handler()");
  url=url+'?'+(new Date().getTime());
  script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(script); 
}
var runtime_version_ok=function(minruntime) {
  if (!minruntime) return true;//not mentioned.
  var min=parseFloat(minruntime);
  var runtime=parseFloat( ksanagap.runtime_version()||"1.0");
  if (min>runtime) return false;
  return true;
}

var needToUpdate=function(fromjson,tojson) {
  var needUpdates=[];
  for (var i=0;i<fromjson.length;i++) { 
    var to=tojson[i];
    var from=fromjson[i];
    var newfiles=[],newfilesizes=[],removed=[];
    
    if (!to) continue; //cannot reach host
    if (!runtime_version_ok(to.minruntime)) {
      console.warn("runtime too old, need "+to.minruntime);
      continue; 
    }
    if (!from.filedates) {
      console.warn("missing filedates in ksana.js of "+from.dbid);
      continue;
    }
    from.filedates.map(function(f,idx){
      var newidx=to.files.indexOf( from.files[idx]);
      if (newidx==-1) {
        //file removed in new version
        removed.push(from.files[idx]);
      } else {
        var fromdate=Date.parse(f);
        var todate=Date.parse(to.filedates[newidx]);
        if (fromdate<todate) {
          newfiles.push( to.files[newidx] );
          newfilesizes.push(to.filesizes[newidx]);
        }        
      }
    });
    if (newfiles.length) {
      from.newfiles=newfiles;
      from.newfilesizes=newfilesizes;
      from.removed=removed;
      needUpdates.push(from);
    }
  }
  return needUpdates;
}
var getUpdatables=function(apps,cb,context) {
  getRemoteJson(apps,function(jsons){
    var hasUpdates=needToUpdate(apps,jsons);
    cb.apply(context,[hasUpdates]);
  },context);
}
var getRemoteJson=function(apps,cb,context) {
  var taskqueue=[],output=[];
  var makecb=function(app){
    return function(data){
        if (!(data && typeof data =='object' && data.__empty)) output.push(data);
        if (!app.baseurl) {
          taskqueue.shift({__empty:true});
        } else {
          var url=app.baseurl+"/ksana.js";    
          console.log(url);
          jsonp( url ,app.dbid,taskqueue.shift(), context);           
        }
    };
  };
  apps.forEach(function(app){taskqueue.push(makecb(app))});

  taskqueue.push(function(data){
    output.push(data);
    cb.apply(context,[output]);
  });

  taskqueue.shift()({__empty:true}); //run the task
}
var humanFileSize=function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(bytes < thresh) return bytes + ' B';
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
};

var start=function(ksanajs,cb,context){
  var files=ksanajs.newfiles||ksanajs.files;
  var baseurl=ksanajs.baseurl|| "http://127.0.0.1:8080/"+ksanajs.dbid+"/";
  var started=ksanagap.startDownload(ksanajs.dbid,baseurl,files.join("\uffff"));
  cb.apply(context,[started]);
}
var status=function(){
  var nfile=ksanagap.downloadingFile();
  var downloadedByte=ksanagap.downloadedByte();
  var done=ksanagap.doneDownload();
  return {nfile:nfile,downloadedByte:downloadedByte, done:done};
}

var cancel=function(){
  return ksanagap.cancelDownload();
}

var liveupdate={ humanFileSize: humanFileSize, 
  needToUpdate: needToUpdate , jsonp:jsonp, 
  getUpdatables:getUpdatables,
  start:start,
  cancel:cancel,
  status:status
  };
module.exports=liveupdate;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js":[function(require,module,exports){
function mkdirP (p, mode, f, made) {
     var path = nodeRequire('path');
     var fs = nodeRequire('fs');
	
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    var cb = f || function () {};
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    fs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), mode, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, mode, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, mode, made) {
    var path = nodeRequire('path');
    var fs = nodeRequire('fs');
    if (mode === undefined) {
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), mode, made);
                sync(p, mode, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

},{}]},{},["C:\\ksana2015\\fabrictest01\\index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uXFwuLlxcVXNlcnNcXGNoZW5cXEFwcERhdGFcXFJvYW1pbmdcXG5wbVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyY1xcbWFpbi5qc3giLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1hbmFseXplclxcY29uZmlncy5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWFuYWx5emVyXFxpbmRleC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWFuYWx5emVyXFx0b2tlbml6ZXJzLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtZGF0YWJhc2VcXGJzZWFyY2guanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1kYXRhYmFzZVxcaW5kZXguanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1kYXRhYmFzZVxca2RlLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtZGF0YWJhc2VcXGxpc3RrZGIuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1kYXRhYmFzZVxccGxhdGZvcm0uanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1qc29ucm9tXFxodG1sNXJlYWQuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1qc29ucm9tXFxpbmRleC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWpzb25yb21cXGtkYi5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWpzb25yb21cXGtkYmZzLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtanNvbnJvbVxca2RiZnNfYW5kcm9pZC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWpzb25yb21cXGtkYmZzX2lvcy5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWpzb25yb21cXGtkYncuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXGJvb2xzZWFyY2guanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXGV4Y2VycHQuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXGluZGV4LmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtc2VhcmNoXFxwbGlzdC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLXNlYXJjaFxcc2VhcmNoLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGNoZWNrYnJvd3Nlci5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxkb3dubG9hZGVyLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGZpbGVpbnN0YWxsZXIuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcaHRtbDVmcy5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxodG1sZnMuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcaW5kZXguanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcaW5zdGFsbGtkYi5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxrZnMuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxca2ZzX2h0bWw1LmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGtzYW5hZ2FwLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGxpdmVyZWxvYWQuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcbGl2ZXVwZGF0ZS5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxta2RpcnAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcnVudGltZT1yZXF1aXJlKFwia3NhbmEyMDE1LXdlYnJ1bnRpbWVcIik7XHJcbnJ1bnRpbWUuYm9vdChcImZhYnJpY3Rlc3QwMVwiLGZ1bmN0aW9uKCl7XHJcblx0dmFyIE1haW49UmVhY3QuY3JlYXRlRWxlbWVudChyZXF1aXJlKFwiLi9zcmMvbWFpbi5qc3hcIikpO1xyXG5cdGtzYW5hLm1haW5Db21wb25lbnQ9UmVhY3QucmVuZGVyKE1haW4sZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpKTtcclxufSk7IiwidmFyIGtzZT1yZXF1aXJlKFwia3NhbmEtc2VhcmNoXCIpO1xyXG52YXIgbWFpbmNvbXBvbmVudCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogXCJtYWluY29tcG9uZW50XCIsXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xyXG4gIFx0cmV0dXJuIHtyZXN1bHQ6W119O1xyXG4gIH0sXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6ZnVuY3Rpb24oKSB7XHJcbiAgXHRrc2Uuc2VhcmNoKFwic2FtcGxlXCIsXCLos4fnlJ9cIix7cmFuZ2U6e3N0YXJ0OjB9fSxmdW5jdGlvbihlcnIsZGF0YSl7XHJcbiAgXHRcdHRoaXMuc2V0U3RhdGUoe3Jlc3VsdDpkYXRhLmV4Y2VycHR9KTtcclxuICBcdH0sdGhpcyk7XHJcbiAgfSxcclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCwgXCJIZWxsbyBcIiwgdGhpcy5zdGF0ZS5yZXN1bHQpO1xyXG4gIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzPW1haW5jb21wb25lbnQ7IiwidmFyIHRva2VuaXplcnM9cmVxdWlyZSgnLi90b2tlbml6ZXJzJyk7XHJcbnZhciBub3JtYWxpemVUYmw9bnVsbDtcclxudmFyIHNldE5vcm1hbGl6ZVRhYmxlPWZ1bmN0aW9uKHRibCxvYmopIHtcclxuXHRpZiAoIW9iaikge1xyXG5cdFx0b2JqPXt9O1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8dGJsLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0dmFyIGFycj10YmxbaV0uc3BsaXQoXCI9XCIpO1xyXG5cdFx0XHRvYmpbYXJyWzBdXT1hcnJbMV07XHJcblx0XHR9XHJcblx0fVxyXG5cdG5vcm1hbGl6ZVRibD1vYmo7XHJcblx0cmV0dXJuIG9iajtcclxufVxyXG52YXIgbm9ybWFsaXplMT1mdW5jdGlvbih0b2tlbikge1xyXG5cdGlmICghdG9rZW4pIHJldHVybiBcIlwiO1xyXG5cdHRva2VuPXRva2VuLnJlcGxhY2UoL1sgXFxuXFwuLO+8jOOAgu+8ge+8juOAjOOAje+8mu+8m+OAgV0vZywnJykudHJpbSgpO1xyXG5cdGlmICghbm9ybWFsaXplVGJsKSByZXR1cm4gdG9rZW47XHJcblx0aWYgKHRva2VuLmxlbmd0aD09MSkge1xyXG5cdFx0cmV0dXJuIG5vcm1hbGl6ZVRibFt0b2tlbl0gfHwgdG9rZW47XHJcblx0fSBlbHNlIHtcclxuXHRcdGZvciAodmFyIGk9MDtpPHRva2VuLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0dG9rZW5baV09bm9ybWFsaXplVGJsW3Rva2VuW2ldXSB8fCB0b2tlbltpXTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0b2tlbjtcclxuXHR9XHJcbn1cclxudmFyIGlzU2tpcDE9ZnVuY3Rpb24odG9rZW4pIHtcclxuXHR2YXIgdD10b2tlbi50cmltKCk7XHJcblx0cmV0dXJuICh0PT1cIlwiIHx8IHQ9PVwi44CAXCIgfHwgdD09XCLigLtcIiB8fCB0PT1cIlxcblwiKTtcclxufVxyXG52YXIgbm9ybWFsaXplX3RpYmV0YW49ZnVuY3Rpb24odG9rZW4pIHtcclxuXHRyZXR1cm4gdG9rZW4ucmVwbGFjZSgvW+C8jeC8iyBdL2csJycpLnRyaW0oKTtcclxufVxyXG5cclxudmFyIGlzU2tpcF90aWJldGFuPWZ1bmN0aW9uKHRva2VuKSB7XHJcblx0dmFyIHQ9dG9rZW4udHJpbSgpO1xyXG5cdHJldHVybiAodD09XCJcIiB8fCB0PT1cIuOAgFwiIHx8ICB0PT1cIlxcblwiKTtcdFxyXG59XHJcbnZhciBzaW1wbGUxPXtcclxuXHRmdW5jOntcclxuXHRcdHRva2VuaXplOnRva2VuaXplcnMuc2ltcGxlXHJcblx0XHQsc2V0Tm9ybWFsaXplVGFibGU6c2V0Tm9ybWFsaXplVGFibGVcclxuXHRcdCxub3JtYWxpemU6IG5vcm1hbGl6ZTFcclxuXHRcdCxpc1NraXA6XHRpc1NraXAxXHJcblx0fVxyXG5cdFxyXG59XHJcbnZhciB0aWJldGFuMT17XHJcblx0ZnVuYzp7XHJcblx0XHR0b2tlbml6ZTp0b2tlbml6ZXJzLnRpYmV0YW5cclxuXHRcdCxzZXROb3JtYWxpemVUYWJsZTpzZXROb3JtYWxpemVUYWJsZVxyXG5cdFx0LG5vcm1hbGl6ZTpub3JtYWxpemVfdGliZXRhblxyXG5cdFx0LGlzU2tpcDppc1NraXBfdGliZXRhblxyXG5cdH1cclxufVxyXG5tb2R1bGUuZXhwb3J0cz17XCJzaW1wbGUxXCI6c2ltcGxlMSxcInRpYmV0YW4xXCI6dGliZXRhbjF9IiwiLyogXHJcbiAgY3VzdG9tIGZ1bmMgZm9yIGJ1aWxkaW5nIGFuZCBzZWFyY2hpbmcgeWRiXHJcblxyXG4gIGtlZXAgYWxsIHZlcnNpb25cclxuICBcclxuICBnZXRBUEkodmVyc2lvbik7IC8vcmV0dXJuIGhhc2ggb2YgZnVuY3Rpb25zICwgaWYgdmVyIGlzIG9taXQgLCByZXR1cm4gbGFzdGVzdFxyXG5cdFxyXG4gIHBvc3RpbmdzMlRyZWUgICAgICAvLyBpZiB2ZXJzaW9uIGlzIG5vdCBzdXBwbHksIGdldCBsYXN0ZXN0XHJcbiAgdG9rZW5pemUodGV4dCxhcGkpIC8vIGNvbnZlcnQgYSBzdHJpbmcgaW50byB0b2tlbnMoZGVwZW5kcyBvbiBvdGhlciBhcGkpXHJcbiAgbm9ybWFsaXplVG9rZW4gICAgIC8vIHN0ZW1taW5nIGFuZCBldGNcclxuICBpc1NwYWNlQ2hhciAgICAgICAgLy8gbm90IGEgc2VhcmNoYWJsZSB0b2tlblxyXG4gIGlzU2tpcENoYXIgICAgICAgICAvLyAwIHZwb3NcclxuXHJcbiAgZm9yIGNsaWVudCBhbmQgc2VydmVyIHNpZGVcclxuICBcclxuKi9cclxudmFyIGNvbmZpZ3M9cmVxdWlyZShcIi4vY29uZmlnc1wiKTtcclxudmFyIGNvbmZpZ19zaW1wbGU9XCJzaW1wbGUxXCI7XHJcbnZhciBvcHRpbWl6ZT1mdW5jdGlvbihqc29uLGNvbmZpZykge1xyXG5cdGNvbmZpZz1jb25maWd8fGNvbmZpZ19zaW1wbGU7XHJcblx0cmV0dXJuIGpzb247XHJcbn1cclxuXHJcbnZhciBnZXRBUEk9ZnVuY3Rpb24oY29uZmlnKSB7XHJcblx0Y29uZmlnPWNvbmZpZ3x8Y29uZmlnX3NpbXBsZTtcclxuXHR2YXIgZnVuYz1jb25maWdzW2NvbmZpZ10uZnVuYztcclxuXHRmdW5jLm9wdGltaXplPW9wdGltaXplO1xyXG5cdGlmIChjb25maWc9PVwic2ltcGxlMVwiKSB7XHJcblx0XHQvL2FkZCBjb21tb24gY3VzdG9tIGZ1bmN0aW9uIGhlcmVcclxuXHR9IGVsc2UgaWYgKGNvbmZpZz09XCJ0aWJldGFuMVwiKSB7XHJcblxyXG5cdH0gZWxzZSB0aHJvdyBcImNvbmZpZyBcIitjb25maWcgK1wibm90IHN1cHBvcnRlZFwiO1xyXG5cclxuXHRyZXR1cm4gZnVuYztcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHM9e2dldEFQSTpnZXRBUEl9OyIsInZhciB0aWJldGFuID1mdW5jdGlvbihzKSB7XHJcblx0Ly9jb250aW51b3VzIHRzaGVnIGdyb3VwZWQgaW50byBzYW1lIHRva2VuXHJcblx0Ly9zaGFkIGFuZCBzcGFjZSBncm91cGVkIGludG8gc2FtZSB0b2tlblxyXG5cdHZhciBvZmZzZXQ9MDtcclxuXHR2YXIgdG9rZW5zPVtdLG9mZnNldHM9W107XHJcblx0cz1zLnJlcGxhY2UoL1xcclxcbi9nLCdcXG4nKS5yZXBsYWNlKC9cXHIvZywnXFxuJyk7XHJcblx0dmFyIGFycj1zLnNwbGl0KCdcXG4nKTtcclxuXHJcblx0Zm9yICh2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBsYXN0PTA7XHJcblx0XHR2YXIgc3RyPWFycltpXTtcclxuXHRcdHN0ci5yZXBsYWNlKC9b4LyN4LyLIF0rL2csZnVuY3Rpb24obSxtMSl7XHJcblx0XHRcdHRva2Vucy5wdXNoKHN0ci5zdWJzdHJpbmcobGFzdCxtMSkrbSk7XHJcblx0XHRcdG9mZnNldHMucHVzaChvZmZzZXQrbGFzdCk7XHJcblx0XHRcdGxhc3Q9bTErbS5sZW5ndGg7XHJcblx0XHR9KTtcclxuXHRcdGlmIChsYXN0PHN0ci5sZW5ndGgpIHtcclxuXHRcdFx0dG9rZW5zLnB1c2goc3RyLnN1YnN0cmluZyhsYXN0KSk7XHJcblx0XHRcdG9mZnNldHMucHVzaChsYXN0KTtcclxuXHRcdH1cclxuXHRcdGlmIChpPT09YXJyLmxlbmd0aC0xKSBicmVhaztcclxuXHRcdHRva2Vucy5wdXNoKCdcXG4nKTtcclxuXHRcdG9mZnNldHMucHVzaChvZmZzZXQrbGFzdCk7XHJcblx0XHRvZmZzZXQrPXN0ci5sZW5ndGgrMTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB7dG9rZW5zOnRva2VucyxvZmZzZXRzOm9mZnNldHN9O1xyXG59O1xyXG52YXIgaXNTcGFjZT1mdW5jdGlvbihjKSB7XHJcblx0cmV0dXJuIChjPT1cIiBcIikgOy8vfHwgKGM9PVwiLFwiKSB8fCAoYz09XCIuXCIpO1xyXG59XHJcbnZhciBpc0NKSyA9ZnVuY3Rpb24oYykge3JldHVybiAoKGM+PTB4MzAwMCAmJiBjPD0weDlGRkYpIFxyXG58fCAoYz49MHhEODAwICYmIGM8MHhEQzAwKSB8fCAoYz49MHhGRjAwKSApIDt9XHJcbnZhciBzaW1wbGUxPWZ1bmN0aW9uKHMpIHtcclxuXHR2YXIgb2Zmc2V0PTA7XHJcblx0dmFyIHRva2Vucz1bXSxvZmZzZXRzPVtdO1xyXG5cdHM9cy5yZXBsYWNlKC9cXHJcXG4vZywnXFxuJykucmVwbGFjZSgvXFxyL2csJ1xcbicpO1xyXG5cdGFycj1zLnNwbGl0KCdcXG4nKTtcclxuXHJcblx0dmFyIHB1c2h0b2tlbj1mdW5jdGlvbih0LG9mZikge1xyXG5cdFx0dmFyIGk9MDtcclxuXHRcdGlmICh0LmNoYXJDb2RlQXQoMCk+MjU1KSB7XHJcblx0XHRcdHdoaWxlIChpPHQubGVuZ3RoKSB7XHJcblx0XHRcdFx0dmFyIGM9dC5jaGFyQ29kZUF0KGkpO1xyXG5cdFx0XHRcdG9mZnNldHMucHVzaChvZmYraSk7XHJcblx0XHRcdFx0dG9rZW5zLnB1c2godFtpXSk7XHJcblx0XHRcdFx0aWYgKGM+PTB4RDgwMCAmJiBjPD0weERGRkYpIHtcclxuXHRcdFx0XHRcdHRva2Vuc1t0b2tlbnMubGVuZ3RoLTFdKz10W2ldOyAvL2V4dGVuc2lvbiBCLEMsRFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRva2Vucy5wdXNoKHQpO1xyXG5cdFx0XHRvZmZzZXRzLnB1c2gob2ZmKTtcdFxyXG5cdFx0fVxyXG5cdH1cclxuXHRmb3IgKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIGxhc3Q9MCxzcD1cIlwiO1xyXG5cdFx0c3RyPWFycltpXTtcclxuXHRcdHN0ci5yZXBsYWNlKC9bXzAtOUEtWmEtel0rL2csZnVuY3Rpb24obSxtMSl7XHJcblx0XHRcdHdoaWxlIChpc1NwYWNlKHNwPXN0cltsYXN0XSkgJiYgbGFzdDxzdHIubGVuZ3RoKSB7XHJcblx0XHRcdFx0dG9rZW5zW3Rva2Vucy5sZW5ndGgtMV0rPXNwO1xyXG5cdFx0XHRcdGxhc3QrKztcclxuXHRcdFx0fVxyXG5cdFx0XHRwdXNodG9rZW4oc3RyLnN1YnN0cmluZyhsYXN0LG0xKSttICwgb2Zmc2V0K2xhc3QpO1xyXG5cdFx0XHRvZmZzZXRzLnB1c2gob2Zmc2V0K2xhc3QpO1xyXG5cdFx0XHRsYXN0PW0xK20ubGVuZ3RoO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0aWYgKGxhc3Q8c3RyLmxlbmd0aCkge1xyXG5cdFx0XHR3aGlsZSAoaXNTcGFjZShzcD1zdHJbbGFzdF0pICYmIGxhc3Q8c3RyLmxlbmd0aCkge1xyXG5cdFx0XHRcdHRva2Vuc1t0b2tlbnMubGVuZ3RoLTFdKz1zcDtcclxuXHRcdFx0XHRsYXN0Kys7XHJcblx0XHRcdH1cclxuXHRcdFx0cHVzaHRva2VuKHN0ci5zdWJzdHJpbmcobGFzdCksIG9mZnNldCtsYXN0KTtcclxuXHRcdFx0XHJcblx0XHR9XHRcdFxyXG5cdFx0b2Zmc2V0cy5wdXNoKG9mZnNldCtsYXN0KTtcclxuXHRcdG9mZnNldCs9c3RyLmxlbmd0aCsxO1xyXG5cdFx0aWYgKGk9PT1hcnIubGVuZ3RoLTEpIGJyZWFrO1xyXG5cdFx0dG9rZW5zLnB1c2goJ1xcbicpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHt0b2tlbnM6dG9rZW5zLG9mZnNldHM6b2Zmc2V0c307XHJcblxyXG59O1xyXG5cclxudmFyIHNpbXBsZT1mdW5jdGlvbihzKSB7XHJcblx0dmFyIHRva2VuPScnO1xyXG5cdHZhciB0b2tlbnM9W10sIG9mZnNldHM9W10gO1xyXG5cdHZhciBpPTA7IFxyXG5cdHZhciBsYXN0c3BhY2U9ZmFsc2U7XHJcblx0dmFyIGFkZHRva2VuPWZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKCF0b2tlbikgcmV0dXJuO1xyXG5cdFx0dG9rZW5zLnB1c2godG9rZW4pO1xyXG5cdFx0b2Zmc2V0cy5wdXNoKGkpO1xyXG5cdFx0dG9rZW49Jyc7XHJcblx0fVxyXG5cdHdoaWxlIChpPHMubGVuZ3RoKSB7XHJcblx0XHR2YXIgYz1zLmNoYXJBdChpKTtcclxuXHRcdHZhciBjb2RlPXMuY2hhckNvZGVBdChpKTtcclxuXHRcdGlmIChpc0NKSyhjb2RlKSkge1xyXG5cdFx0XHRhZGR0b2tlbigpO1xyXG5cdFx0XHR0b2tlbj1jO1xyXG5cdFx0XHRpZiAoY29kZT49MHhEODAwICYmIGNvZGU8MHhEQzAwKSB7IC8vaGlnaCBzb3JyYWdhdGVcclxuXHRcdFx0XHR0b2tlbis9cy5jaGFyQXQoaSsxKTtpKys7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkdG9rZW4oKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmIChjPT0nJicgfHwgYz09JzwnIHx8IGM9PSc/JyB8fCBjPT1cIixcIiB8fCBjPT1cIi5cIlxyXG5cdFx0XHR8fCBjPT0nfCcgfHwgYz09J34nIHx8IGM9PSdgJyB8fCBjPT0nOycgXHJcblx0XHRcdHx8IGM9PSc+JyB8fCBjPT0nOicgXHJcblx0XHRcdHx8IGM9PSc9JyB8fCBjPT0nQCcgIHx8IGM9PVwiLVwiIFxyXG5cdFx0XHR8fCBjPT0nXScgfHwgYz09J30nICB8fCBjPT1cIilcIiBcclxuXHRcdFx0Ly98fCBjPT0neycgfHwgYz09J30nfHwgYz09J1snIHx8IGM9PSddJyB8fCBjPT0nKCcgfHwgYz09JyknXHJcblx0XHRcdHx8IGNvZGU9PTB4ZjBiIHx8IGNvZGU9PTB4ZjBkIC8vIHRpYmV0YW4gc3BhY2VcclxuXHRcdFx0fHwgKGNvZGU+PTB4MjAwMCAmJiBjb2RlPD0weDIwNmYpKSB7XHJcblx0XHRcdFx0YWRkdG9rZW4oKTtcclxuXHRcdFx0XHRpZiAoYz09JyYnIHx8IGM9PSc8Jyl7IC8vIHx8IGM9PSd7J3x8IGM9PScoJ3x8IGM9PSdbJykge1xyXG5cdFx0XHRcdFx0dmFyIGVuZGNoYXI9Jz4nO1xyXG5cdFx0XHRcdFx0aWYgKGM9PScmJykgZW5kY2hhcj0nOydcclxuXHRcdFx0XHRcdC8vZWxzZSBpZiAoYz09J3snKSBlbmRjaGFyPSd9JztcclxuXHRcdFx0XHRcdC8vZWxzZSBpZiAoYz09J1snKSBlbmRjaGFyPSddJztcclxuXHRcdFx0XHRcdC8vZWxzZSBpZiAoYz09JygnKSBlbmRjaGFyPScpJztcclxuXHJcblx0XHRcdFx0XHR3aGlsZSAoaTxzLmxlbmd0aCAmJiBzLmNoYXJBdChpKSE9ZW5kY2hhcikge1xyXG5cdFx0XHRcdFx0XHR0b2tlbis9cy5jaGFyQXQoaSk7XHJcblx0XHRcdFx0XHRcdGkrKztcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHRva2VuKz1lbmRjaGFyO1xyXG5cdFx0XHRcdFx0YWRkdG9rZW4oKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dG9rZW49YztcclxuXHRcdFx0XHRcdGFkZHRva2VuKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRva2VuPScnO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmIChjPT1cIiBcIikge1xyXG5cdFx0XHRcdFx0dG9rZW4rPWM7XHJcblx0XHRcdFx0XHRsYXN0c3BhY2U9dHJ1ZTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0aWYgKGxhc3RzcGFjZSkgYWRkdG9rZW4oKTtcclxuXHRcdFx0XHRcdGxhc3RzcGFjZT1mYWxzZTtcclxuXHRcdFx0XHRcdHRva2VuKz1jO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aSsrO1xyXG5cdH1cclxuXHRhZGR0b2tlbigpO1xyXG5cdHJldHVybiB7dG9rZW5zOnRva2VucyxvZmZzZXRzOm9mZnNldHN9O1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtzaW1wbGU6c2ltcGxlLHRpYmV0YW46dGliZXRhbn07IiwidmFyIGluZGV4T2ZTb3J0ZWQgPSBmdW5jdGlvbiAoYXJyYXksIG9iaiwgbmVhcikgeyBcclxuICB2YXIgbG93ID0gMCxcclxuICBoaWdoID0gYXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChsb3cgPCBoaWdoKSB7XHJcbiAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+IDE7XHJcbiAgICBpZiAoYXJyYXlbbWlkXT09b2JqKSByZXR1cm4gbWlkO1xyXG4gICAgYXJyYXlbbWlkXSA8IG9iaiA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xyXG4gIH1cclxuICBpZiAobmVhcikgcmV0dXJuIGxvdztcclxuICBlbHNlIGlmIChhcnJheVtsb3ddPT1vYmopIHJldHVybiBsb3c7ZWxzZSByZXR1cm4gLTE7XHJcbn07XHJcbnZhciBpbmRleE9mU29ydGVkX3N0ciA9IGZ1bmN0aW9uIChhcnJheSwgb2JqLCBuZWFyKSB7IFxyXG4gIHZhciBsb3cgPSAwLFxyXG4gIGhpZ2ggPSBhcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcclxuICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4gMTtcclxuICAgIGlmIChhcnJheVttaWRdPT1vYmopIHJldHVybiBtaWQ7XHJcbiAgICAoYXJyYXlbbWlkXS5sb2NhbGVDb21wYXJlKG9iaik8MCkgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcclxuICB9XHJcbiAgaWYgKG5lYXIpIHJldHVybiBsb3c7XHJcbiAgZWxzZSBpZiAoYXJyYXlbbG93XT09b2JqKSByZXR1cm4gbG93O2Vsc2UgcmV0dXJuIC0xO1xyXG59O1xyXG5cclxuXHJcbnZhciBic2VhcmNoPWZ1bmN0aW9uKGFycmF5LHZhbHVlLG5lYXIpIHtcclxuXHR2YXIgZnVuYz1pbmRleE9mU29ydGVkO1xyXG5cdGlmICh0eXBlb2YgYXJyYXlbMF09PVwic3RyaW5nXCIpIGZ1bmM9aW5kZXhPZlNvcnRlZF9zdHI7XHJcblx0cmV0dXJuIGZ1bmMoYXJyYXksdmFsdWUsbmVhcik7XHJcbn1cclxudmFyIGJzZWFyY2hOZWFyPWZ1bmN0aW9uKGFycmF5LHZhbHVlKSB7XHJcblx0cmV0dXJuIGJzZWFyY2goYXJyYXksdmFsdWUsdHJ1ZSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPWJzZWFyY2g7Ly97YnNlYXJjaE5lYXI6YnNlYXJjaE5lYXIsYnNlYXJjaDpic2VhcmNofTsiLCJ2YXIgS0RFPXJlcXVpcmUoXCIuL2tkZVwiKTtcclxuLy9jdXJyZW50bHkgb25seSBzdXBwb3J0IG5vZGUuanMgZnMsIGtzYW5hZ2FwIG5hdGl2ZSBmcywgaHRtbDUgZmlsZSBzeXN0ZW1cclxuLy91c2Ugc29ja2V0LmlvIHRvIHJlYWQga2RiIGZyb20gcmVtb3RlIHNlcnZlciBpbiBmdXR1cmVcclxubW9kdWxlLmV4cG9ydHM9S0RFOyIsIi8qIEtzYW5hIERhdGFiYXNlIEVuZ2luZVxyXG5cclxuICAgMjAxNS8xLzIgLCBcclxuICAgbW92ZSB0byBrc2FuYS1kYXRhYmFzZVxyXG4gICBzaW1wbGlmaWVkIGJ5IHJlbW92aW5nIGRvY3VtZW50IHN1cHBvcnQgYW5kIHNvY2tldC5pbyBzdXBwb3J0XHJcblxyXG5cclxuKi9cclxudmFyIHBvb2w9e30sbG9jYWxQb29sPXt9O1xyXG52YXIgYXBwcGF0aD1cIlwiO1xyXG52YXIgYnNlYXJjaD1yZXF1aXJlKFwiLi9ic2VhcmNoXCIpO1xyXG52YXIgS2RiPXJlcXVpcmUoJ2tzYW5hLWpzb25yb20nKTtcclxudmFyIGtkYnM9W107IC8vYXZhaWxhYmxlIGtkYiAsIGlkIGFuZCBhYnNvbHV0ZSBwYXRoXHJcbnZhciBzdHJzZXA9XCJcXHVmZmZmXCI7XHJcbnZhciBrZGJsaXN0ZWQ9ZmFsc2U7XHJcbi8qXHJcbnZhciBfZ2V0U3luYz1mdW5jdGlvbihwYXRocyxvcHRzKSB7XHJcblx0dmFyIG91dD1bXTtcclxuXHRmb3IgKHZhciBpIGluIHBhdGhzKSB7XHJcblx0XHRvdXQucHVzaCh0aGlzLmdldFN5bmMocGF0aHNbaV0sb3B0cykpO1x0XHJcblx0fVxyXG5cdHJldHVybiBvdXQ7XHJcbn1cclxuKi9cclxudmFyIF9nZXRzPWZ1bmN0aW9uKHBhdGhzLG9wdHMsY2IpIHsgLy9nZXQgbWFueSBkYXRhIHdpdGggb25lIGNhbGxcclxuXHJcblx0aWYgKCFwYXRocykgcmV0dXJuIDtcclxuXHRpZiAodHlwZW9mIHBhdGhzPT0nc3RyaW5nJykge1xyXG5cdFx0cGF0aHM9W3BhdGhzXTtcclxuXHR9XHJcblx0dmFyIGVuZ2luZT10aGlzLCBvdXRwdXQ9W107XHJcblxyXG5cdHZhciBtYWtlY2I9ZnVuY3Rpb24ocGF0aCl7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0aWYgKCEoZGF0YSAmJiB0eXBlb2YgZGF0YSA9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkpIG91dHB1dC5wdXNoKGRhdGEpO1xyXG5cdFx0XHRcdGVuZ2luZS5nZXQocGF0aCxvcHRzLHRhc2txdWV1ZS5zaGlmdCgpKTtcclxuXHRcdH07XHJcblx0fTtcclxuXHJcblx0dmFyIHRhc2txdWV1ZT1bXTtcclxuXHRmb3IgKHZhciBpPTA7aTxwYXRocy5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAodHlwZW9mIHBhdGhzW2ldPT1cIm51bGxcIikgeyAvL3RoaXMgaXMgb25seSBhIHBsYWNlIGhvbGRlciBmb3Iga2V5IGRhdGEgYWxyZWFkeSBpbiBjbGllbnQgY2FjaGVcclxuXHRcdFx0b3V0cHV0LnB1c2gobnVsbCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0YXNrcXVldWUucHVzaChtYWtlY2IocGF0aHNbaV0pKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHR0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhKXtcclxuXHRcdG91dHB1dC5wdXNoKGRhdGEpO1xyXG5cdFx0Y2IuYXBwbHkoZW5naW5lLmNvbnRleHR8fGVuZ2luZSxbb3V0cHV0LHBhdGhzXSk7IC8vcmV0dXJuIHRvIGNhbGxlclxyXG5cdH0pO1xyXG5cclxuXHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7IC8vcnVuIHRoZSB0YXNrXHJcbn1cclxuXHJcbnZhciBnZXRGaWxlUmFuZ2U9ZnVuY3Rpb24oaSkge1xyXG5cdHZhciBlbmdpbmU9dGhpcztcclxuXHJcblx0dmFyIGZpbGVzZWdjb3VudD1lbmdpbmUuZ2V0KFtcImZpbGVzZWdjb3VudFwiXSk7XHJcblx0aWYgKGZpbGVzZWdjb3VudCkge1xyXG5cdFx0aWYgKGk9PTApIHtcclxuXHRcdFx0cmV0dXJuIHtzdGFydDowLGVuZDpmaWxlc2VnY291bnRbMF0tMX07XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4ge3N0YXJ0OmZpbGVzZWdjb3VudFtpLTFdLGVuZDpmaWxlc2VnY291bnRbaV0tMX07XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vb2xkIGJ1Z2d5IGNvZGVcclxuXHR2YXIgZmlsZW5hbWVzPWVuZ2luZS5nZXQoW1wiZmlsZW5hbWVzXCJdKTtcclxuXHR2YXIgZmlsZW9mZnNldHM9ZW5naW5lLmdldChbXCJmaWxlb2Zmc2V0c1wiXSk7XHJcblx0dmFyIHNlZ29mZnNldHM9ZW5naW5lLmdldChbXCJzZWdvZmZzZXRzXCJdKTtcclxuXHR2YXIgc2VnbmFtZXM9ZW5naW5lLmdldChbXCJzZWduYW1lc1wiXSk7XHJcblx0dmFyIGZpbGVzdGFydD1maWxlb2Zmc2V0c1tpXSwgZmlsZWVuZD1maWxlb2Zmc2V0c1tpKzFdLTE7XHJcblxyXG5cdHZhciBzdGFydD1ic2VhcmNoKHNlZ29mZnNldHMsZmlsZXN0YXJ0LHRydWUpO1xyXG5cdC8vaWYgKHNlZ09mZnNldHNbc3RhcnRdPT1maWxlU3RhcnQpIHN0YXJ0LS07XHJcblx0XHJcblx0Ly93b3JrIGFyb3VuZCBmb3IgamlhbmdrYW5neXVyXHJcblx0d2hpbGUgKHNlZ05hbWVzW3N0YXJ0KzFdPT1cIl9cIikgc3RhcnQrKztcclxuXHJcbiAgLy9pZiAoaT09MCkgc3RhcnQ9MDsgLy93b3JrIGFyb3VuZCBmb3IgZmlyc3QgZmlsZVxyXG5cdHZhciBlbmQ9YnNlYXJjaChzZWdvZmZzZXRzLGZpbGVlbmQsdHJ1ZSk7XHJcblx0cmV0dXJuIHtzdGFydDpzdGFydCxlbmQ6ZW5kfTtcclxufVxyXG5cclxudmFyIGdldGZpbGVzZWc9ZnVuY3Rpb24oYWJzb2x1dGVzZWcpIHtcclxuXHR2YXIgZmlsZW9mZnNldHM9dGhpcy5nZXQoW1wiZmlsZW9mZnNldHNcIl0pO1xyXG5cdHZhciBzZWdvZmZzZXRzPXRoaXMuZ2V0KFtcInNlZ29mZnNldHNcIl0pO1xyXG5cdHZhciBzZWdvZmZzZXQ9c2VnT2Zmc2V0c1thYnNvbHV0ZXNlZ107XHJcblx0dmFyIGZpbGU9YnNlYXJjaChmaWxlT2Zmc2V0cyxzZWdvZmZzZXQsdHJ1ZSktMTtcclxuXHJcblx0dmFyIGZpbGVTdGFydD1maWxlb2Zmc2V0c1tmaWxlXTtcclxuXHR2YXIgc3RhcnQ9YnNlYXJjaChzZWdvZmZzZXRzLGZpbGVTdGFydCx0cnVlKTtcdFxyXG5cclxuXHR2YXIgc2VnPWFic29sdXRlc2VnLXN0YXJ0LTE7XHJcblx0cmV0dXJuIHtmaWxlOmZpbGUsc2VnOnNlZ307XHJcbn1cclxuLy9yZXR1cm4gYXJyYXkgb2Ygb2JqZWN0IG9mIG5maWxlIG5zZWcgZ2l2ZW4gc2VnbmFtZVxyXG52YXIgZmluZFNlZz1mdW5jdGlvbihzZWduYW1lKSB7XHJcblx0dmFyIHNlZ25hbWVzPXRoaXMuZ2V0KFwic2VnbmFtZXNcIik7XHJcblx0dmFyIG91dD1bXTtcclxuXHRmb3IgKHZhciBpPTA7aTxzZWduYW1lcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAoc2VnbmFtZXNbaV09PXNlZ25hbWUpIHtcclxuXHRcdFx0dmFyIGZpbGVzZWc9Z2V0ZmlsZXNlZy5hcHBseSh0aGlzLFtpXSk7XHJcblx0XHRcdG91dC5wdXNoKHtmaWxlOmZpbGVzZWcuZmlsZSxzZWc6ZmlsZXNlZy5zZWcsYWJzc2VnOml9KTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIG91dDtcclxufVxyXG52YXIgZ2V0RmlsZVNlZ09mZnNldHM9ZnVuY3Rpb24oaSkge1xyXG5cdHZhciBzZWdvZmZzZXRzPXRoaXMuZ2V0KFwic2Vnb2Zmc2V0c1wiKTtcclxuXHR2YXIgcmFuZ2U9Z2V0RmlsZVJhbmdlLmFwcGx5KHRoaXMsW2ldKTtcclxuXHRyZXR1cm4gc2Vnb2Zmc2V0cy5zbGljZShyYW5nZS5zdGFydCxyYW5nZS5lbmQrMSk7XHJcbn1cclxuXHJcbnZhciBnZXRGaWxlU2VnTmFtZXM9ZnVuY3Rpb24oaSkge1xyXG5cdHZhciByYW5nZT1nZXRGaWxlUmFuZ2UuYXBwbHkodGhpcyxbaV0pO1xyXG5cdHZhciBzZWduYW1lcz10aGlzLmdldChcInNlZ25hbWVzXCIpO1xyXG5cdHJldHVybiBzZWduYW1lcy5zbGljZShyYW5nZS5zdGFydCxyYW5nZS5lbmQrMSk7XHJcbn1cclxudmFyIGxvY2FsZW5naW5lX2dldD1mdW5jdGlvbihwYXRoLG9wdHMsY2IpIHtcclxuXHR2YXIgZW5naW5lPXRoaXM7XHJcblx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIHtcclxuXHRcdGNiPW9wdHM7XHJcblx0XHRvcHRzPXtyZWN1cnNpdmU6ZmFsc2V9O1xyXG5cdH1cclxuXHRpZiAoIXBhdGgpIHtcclxuXHRcdGlmIChjYikgY2IobnVsbCk7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcblxyXG5cdGlmICh0eXBlb2YgY2IhPVwiZnVuY3Rpb25cIikge1xyXG5cdFx0cmV0dXJuIGVuZ2luZS5rZGIuZ2V0KHBhdGgsb3B0cyk7XHJcblx0fVxyXG5cclxuXHRpZiAodHlwZW9mIHBhdGg9PVwic3RyaW5nXCIpIHtcclxuXHRcdHJldHVybiBlbmdpbmUua2RiLmdldChbcGF0aF0sb3B0cyxjYik7XHJcblx0fSBlbHNlIGlmICh0eXBlb2YgcGF0aFswXSA9PVwic3RyaW5nXCIpIHtcclxuXHRcdHJldHVybiBlbmdpbmUua2RiLmdldChwYXRoLG9wdHMsY2IpO1xyXG5cdH0gZWxzZSBpZiAodHlwZW9mIHBhdGhbMF0gPT1cIm9iamVjdFwiKSB7XHJcblx0XHRyZXR1cm4gX2dldHMuYXBwbHkoZW5naW5lLFtwYXRoLG9wdHMsY2JdKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZW5naW5lLmtkYi5nZXQoW10sb3B0cyxmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0Y2IoZGF0YVswXSk7Ly9yZXR1cm4gdG9wIGxldmVsIGtleXNcclxuXHRcdH0pO1xyXG5cdH1cclxufTtcdFxyXG5cclxudmFyIGdldFByZWxvYWRGaWVsZD1mdW5jdGlvbih1c2VyKSB7XHJcblx0dmFyIHByZWxvYWQ9W1tcIm1ldGFcIl0sW1wiZmlsZW5hbWVzXCJdLFtcImZpbGVvZmZzZXRzXCJdLFtcInNlZ25hbWVzXCJdLFtcInNlZ29mZnNldHNcIl0sW1wiZmlsZXNlZ2NvdW50XCJdXTtcclxuXHQvL1tcInRva2Vuc1wiXSxbXCJwb3N0aW5nc2xlblwiXSBrc2Ugd2lsbCBsb2FkIGl0XHJcblx0aWYgKHVzZXIgJiYgdXNlci5sZW5ndGgpIHsgLy91c2VyIHN1cHBseSBwcmVsb2FkXHJcblx0XHRmb3IgKHZhciBpPTA7aTx1c2VyLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0aWYgKHByZWxvYWQuaW5kZXhPZih1c2VyW2ldKT09LTEpIHtcclxuXHRcdFx0XHRwcmVsb2FkLnB1c2godXNlcltpXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHByZWxvYWQ7XHJcbn1cclxudmFyIGNyZWF0ZUxvY2FsRW5naW5lPWZ1bmN0aW9uKGtkYixvcHRzLGNiLGNvbnRleHQpIHtcclxuXHR2YXIgZW5naW5lPXtrZGI6a2RiLCBxdWVyeUNhY2hlOnt9LCBwb3N0aW5nQ2FjaGU6e30sIGNhY2hlOnt9fTtcclxuXHJcblx0aWYgKHR5cGVvZiBjb250ZXh0PT1cIm9iamVjdFwiKSBlbmdpbmUuY29udGV4dD1jb250ZXh0O1xyXG5cdGVuZ2luZS5nZXQ9bG9jYWxlbmdpbmVfZ2V0O1xyXG5cclxuXHRlbmdpbmUuc2VnT2Zmc2V0PXNlZ09mZnNldDtcclxuXHRlbmdpbmUuZmlsZU9mZnNldD1maWxlT2Zmc2V0O1xyXG5cdGVuZ2luZS5nZXRGaWxlU2VnTmFtZXM9Z2V0RmlsZVNlZ05hbWVzO1xyXG5cdGVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cz1nZXRGaWxlU2VnT2Zmc2V0cztcclxuXHRlbmdpbmUuZ2V0RmlsZVJhbmdlPWdldEZpbGVSYW5nZTtcclxuXHRlbmdpbmUuZmluZFNlZz1maW5kU2VnO1xyXG5cdC8vb25seSBsb2NhbCBlbmdpbmUgYWxsb3cgZ2V0U3luY1xyXG5cdC8vaWYgKGtkYi5mcy5nZXRTeW5jKSBlbmdpbmUuZ2V0U3luYz1lbmdpbmUua2RiLmdldFN5bmM7XHJcblx0XHJcblx0Ly9zcGVlZHkgbmF0aXZlIGZ1bmN0aW9uc1xyXG5cdGlmIChrZGIuZnMubWVyZ2VQb3N0aW5ncykge1xyXG5cdFx0ZW5naW5lLm1lcmdlUG9zdGluZ3M9a2RiLmZzLm1lcmdlUG9zdGluZ3MuYmluZChrZGIuZnMpO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgc2V0UHJlbG9hZD1mdW5jdGlvbihyZXMpIHtcclxuXHRcdGVuZ2luZS5kYm5hbWU9cmVzWzBdLm5hbWU7XHJcblx0XHQvL2VuZ2luZS5jdXN0b21mdW5jPWN1c3RvbWZ1bmMuZ2V0QVBJKHJlc1swXS5jb25maWcpO1xyXG5cdFx0ZW5naW5lLnJlYWR5PXRydWU7XHJcblx0fVxyXG5cclxuXHR2YXIgcHJlbG9hZD1nZXRQcmVsb2FkRmllbGQob3B0cy5wcmVsb2FkKTtcclxuXHR2YXIgb3B0cz17cmVjdXJzaXZlOnRydWV9O1xyXG5cdC8vaWYgKHR5cGVvZiBjYj09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRfZ2V0cy5hcHBseShlbmdpbmUsWyBwcmVsb2FkLCBvcHRzLGZ1bmN0aW9uKHJlcyl7XHJcblx0XHRcdHNldFByZWxvYWQocmVzKTtcclxuXHRcdFx0Y2IuYXBwbHkoZW5naW5lLmNvbnRleHQsW2VuZ2luZV0pO1xyXG5cdFx0fV0pO1xyXG5cdC8vfSBlbHNlIHtcclxuXHQvL1x0c2V0UHJlbG9hZChfZ2V0U3luYy5hcHBseShlbmdpbmUsW3ByZWxvYWQsb3B0c10pKTtcclxuXHQvL31cclxuXHRyZXR1cm4gZW5naW5lO1xyXG59XHJcblxyXG52YXIgc2VnT2Zmc2V0PWZ1bmN0aW9uKHNlZ25hbWUpIHtcclxuXHR2YXIgZW5naW5lPXRoaXM7XHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGg+MSkgdGhyb3cgXCJhcmd1bWVudCA6IHNlZ25hbWUgXCI7XHJcblxyXG5cdHZhciBzZWdOYW1lcz1lbmdpbmUuZ2V0KFwic2VnbmFtZXNcIik7XHJcblx0dmFyIHNlZ09mZnNldHM9ZW5naW5lLmdldChcInNlZ29mZnNldHNcIik7XHJcblxyXG5cdHZhciBpPXNlZ05hbWVzLmluZGV4T2Yoc2VnbmFtZSk7XHJcblx0cmV0dXJuIChpPi0xKT9zZWdPZmZzZXRzW2ldOjA7XHJcbn1cclxudmFyIGZpbGVPZmZzZXQ9ZnVuY3Rpb24oZm4pIHtcclxuXHR2YXIgZW5naW5lPXRoaXM7XHJcblx0dmFyIGZpbGVuYW1lcz1lbmdpbmUuZ2V0KFwiZmlsZW5hbWVzXCIpO1xyXG5cdHZhciBvZmZzZXRzPWVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKTtcclxuXHR2YXIgaT1maWxlbmFtZXMuaW5kZXhPZihmbik7XHJcblx0aWYgKGk9PS0xKSByZXR1cm4gbnVsbDtcclxuXHRyZXR1cm4ge3N0YXJ0OiBvZmZzZXRzW2ldLCBlbmQ6b2Zmc2V0c1tpKzFdfTtcclxufVxyXG5cclxudmFyIGZvbGRlck9mZnNldD1mdW5jdGlvbihmb2xkZXIpIHtcclxuXHR2YXIgZW5naW5lPXRoaXM7XHJcblx0dmFyIHN0YXJ0PTAsZW5kPTA7XHJcblx0dmFyIGZpbGVuYW1lcz1lbmdpbmUuZ2V0KFwiZmlsZW5hbWVzXCIpO1xyXG5cdHZhciBvZmZzZXRzPWVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKTtcclxuXHRmb3IgKHZhciBpPTA7aTxmaWxlbmFtZXMubGVuZ3RoO2krKykge1xyXG5cdFx0aWYgKGZpbGVuYW1lc1tpXS5zdWJzdHJpbmcoMCxmb2xkZXIubGVuZ3RoKT09Zm9sZGVyKSB7XHJcblx0XHRcdGlmICghc3RhcnQpIHN0YXJ0PW9mZnNldHNbaV07XHJcblx0XHRcdGVuZD1vZmZzZXRzW2ldO1xyXG5cdFx0fSBlbHNlIGlmIChzdGFydCkgYnJlYWs7XHJcblx0fVxyXG5cdHJldHVybiB7c3RhcnQ6c3RhcnQsZW5kOmVuZH07XHJcbn1cclxuXHJcbiAvL1RPRE8gZGVsZXRlIGRpcmVjdGx5IGZyb20ga2RiIGluc3RhbmNlXHJcbiAvL2tkYi5mcmVlKCk7XHJcbnZhciBjbG9zZUxvY2FsPWZ1bmN0aW9uKGtkYmlkKSB7XHJcblx0dmFyIGVuZ2luZT1sb2NhbFBvb2xba2RiaWRdO1xyXG5cdGlmIChlbmdpbmUpIHtcclxuXHRcdGVuZ2luZS5rZGIuZnJlZSgpO1xyXG5cdFx0ZGVsZXRlIGxvY2FsUG9vbFtrZGJpZF07XHJcblx0fVxyXG59XHJcbnZhciBjbG9zZT1mdW5jdGlvbihrZGJpZCkge1xyXG5cdHZhciBlbmdpbmU9cG9vbFtrZGJpZF07XHJcblx0aWYgKGVuZ2luZSkge1xyXG5cdFx0ZW5naW5lLmtkYi5mcmVlKCk7XHJcblx0XHRkZWxldGUgcG9vbFtrZGJpZF07XHJcblx0fVxyXG59XHJcblxyXG52YXIgZ2V0TG9jYWxUcmllcz1mdW5jdGlvbihrZGJmbikge1xyXG5cdGlmICgha2RibGlzdGVkKSB7XHJcblx0XHRrZGJzPXJlcXVpcmUoXCIuL2xpc3RrZGJcIikoKTtcclxuXHRcdGtkYmxpc3RlZD10cnVlO1xyXG5cdH1cclxuXHJcblx0dmFyIGtkYmlkPWtkYmZuLnJlcGxhY2UoJy5rZGInLCcnKTtcclxuXHR2YXIgdHJpZXM9IFtcIi4vXCIra2RiaWQrXCIua2RiXCJcclxuXHQgICAgICAgICAgICxcIi4uL1wiK2tkYmlkK1wiLmtkYlwiXHJcblx0XTtcclxuXHJcblx0Zm9yICh2YXIgaT0wO2k8a2Ricy5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAoa2Ric1tpXVswXT09a2RiaWQpIHtcclxuXHRcdFx0dHJpZXMucHVzaChrZGJzW2ldWzFdKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHRyaWVzO1xyXG59XHJcbnZhciBvcGVuTG9jYWxLc2FuYWdhcD1mdW5jdGlvbihrZGJpZCxvcHRzLGNiLGNvbnRleHQpIHtcclxuXHR2YXIga2RiZm49a2RiaWQ7XHJcblx0dmFyIHRyaWVzPWdldExvY2FsVHJpZXMoa2RiZm4pO1xyXG5cclxuXHRmb3IgKHZhciBpPTA7aTx0cmllcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAoZnMuZXhpc3RzU3luYyh0cmllc1tpXSkpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcImtkYiBwYXRoOiBcIitub2RlUmVxdWlyZSgncGF0aCcpLnJlc29sdmUodHJpZXNbaV0pKTtcclxuXHRcdFx0dmFyIGtkYj1uZXcgS2RiLm9wZW4odHJpZXNbaV0sZnVuY3Rpb24oZXJyLGtkYil7XHJcblx0XHRcdFx0aWYgKGVycikge1xyXG5cdFx0XHRcdFx0Y2IuYXBwbHkoY29udGV4dCxbZXJyXSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGNyZWF0ZUxvY2FsRW5naW5lKGtkYixvcHRzLGZ1bmN0aW9uKGVuZ2luZSl7XHJcblx0XHRcdFx0XHRcdGxvY2FsUG9vbFtrZGJpZF09ZW5naW5lO1xyXG5cdFx0XHRcdFx0XHRjYi5hcHBseShjb250ZXh0fHxlbmdpbmUuY29udGV4dCxbMCxlbmdpbmVdKTtcclxuXHRcdFx0XHRcdH0sY29udGV4dCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9XHJcblx0fVxyXG5cdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxba2RiaWQrXCIgbm90IGZvdW5kXCJdKTtcclxuXHRyZXR1cm4gbnVsbDtcclxuXHJcbn1cclxudmFyIG9wZW5Mb2NhbE5vZGU9ZnVuY3Rpb24oa2RiaWQsb3B0cyxjYixjb250ZXh0KSB7XHJcblx0dmFyIGZzPXJlcXVpcmUoJ2ZzJyk7XHJcblx0dmFyIHRyaWVzPWdldExvY2FsVHJpZXMoa2RiaWQpO1xyXG5cclxuXHRmb3IgKHZhciBpPTA7aTx0cmllcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAoZnMuZXhpc3RzU3luYyh0cmllc1tpXSkpIHtcclxuXHJcblx0XHRcdG5ldyBLZGIub3Blbih0cmllc1tpXSxmdW5jdGlvbihlcnIsa2RiKXtcclxuXHRcdFx0XHRpZiAoZXJyKSB7XHJcblx0XHRcdFx0XHRjYi5hcHBseShjb250ZXh0fHxlbmdpbmUuY29udGVudCxbZXJyXSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGNyZWF0ZUxvY2FsRW5naW5lKGtkYixvcHRzLGZ1bmN0aW9uKGVuZ2luZSl7XHJcblx0XHRcdFx0XHRcdFx0bG9jYWxQb29sW2tkYmlkXT1lbmdpbmU7XHJcblx0XHRcdFx0XHRcdFx0Y2IuYXBwbHkoY29udGV4dHx8ZW5naW5lLmNvbnRleHQsWzAsZW5naW5lXSk7XHJcblx0XHRcdFx0XHR9LGNvbnRleHQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHQsW2tkYmlkK1wiIG5vdCBmb3VuZFwiXSk7XHJcblx0cmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbnZhciBvcGVuTG9jYWxIdG1sNT1mdW5jdGlvbihrZGJpZCxvcHRzLGNiLGNvbnRleHQpIHtcdFxyXG5cdHZhciBlbmdpbmU9bG9jYWxQb29sW2tkYmlkXTtcclxuXHR2YXIga2RiZm49a2RiaWQ7XHJcblx0aWYgKGtkYmZuLmluZGV4T2YoXCIua2RiXCIpPT0tMSkga2RiZm4rPVwiLmtkYlwiO1xyXG5cdG5ldyBLZGIub3BlbihrZGJmbixmdW5jdGlvbihlcnIsaGFuZGxlKXtcclxuXHRcdGlmIChlcnIpIHtcclxuXHRcdFx0Y2IuYXBwbHkoY29udGV4dCxbZXJyXSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjcmVhdGVMb2NhbEVuZ2luZShoYW5kbGUsb3B0cyxmdW5jdGlvbihlbmdpbmUpe1xyXG5cdFx0XHRcdGxvY2FsUG9vbFtrZGJpZF09ZW5naW5lO1xyXG5cdFx0XHRcdGNiLmFwcGx5KGNvbnRleHR8fGVuZ2luZS5jb250ZXh0LFswLGVuZ2luZV0pO1xyXG5cdFx0XHR9LGNvbnRleHQpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG59XHJcbi8vb21pdCBjYiBmb3Igc3luY3Jvbml6ZSBvcGVuXHJcbnZhciBvcGVuTG9jYWw9ZnVuY3Rpb24oa2RiaWQsb3B0cyxjYixjb250ZXh0KSAge1xyXG5cdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7IC8vbm8gb3B0c1xyXG5cdFx0aWYgKHR5cGVvZiBjYj09XCJvYmplY3RcIikgY29udGV4dD1jYjtcclxuXHRcdGNiPW9wdHM7XHJcblx0XHRvcHRzPXt9O1xyXG5cdH1cclxuXHJcblx0dmFyIGVuZ2luZT1sb2NhbFBvb2xba2RiaWRdO1xyXG5cdGlmIChlbmdpbmUpIHtcclxuXHRcdGlmIChjYikgY2IuYXBwbHkoY29udGV4dHx8ZW5naW5lLmNvbnRleHQsWzAsZW5naW5lXSk7XHJcblx0XHRyZXR1cm4gZW5naW5lO1xyXG5cdH1cclxuXHJcblx0dmFyIHBsYXRmb3JtPXJlcXVpcmUoXCIuL3BsYXRmb3JtXCIpLmdldFBsYXRmb3JtKCk7XHJcblx0aWYgKHBsYXRmb3JtPT1cIm5vZGUtd2Via2l0XCIgfHwgcGxhdGZvcm09PVwibm9kZVwiKSB7XHJcblx0XHRvcGVuTG9jYWxOb2RlKGtkYmlkLG9wdHMsY2IsY29udGV4dCk7XHJcblx0fSBlbHNlIGlmIChwbGF0Zm9ybT09XCJodG1sNVwiIHx8IHBsYXRmb3JtPT1cImNocm9tZVwiKXtcclxuXHRcdG9wZW5Mb2NhbEh0bWw1KGtkYmlkLG9wdHMsY2IsY29udGV4dCk7XHRcdFxyXG5cdH0gZWxzZSB7XHJcblx0XHRvcGVuTG9jYWxLc2FuYWdhcChrZGJpZCxvcHRzLGNiLGNvbnRleHQpO1x0XHJcblx0fVxyXG59XHJcbnZhciBzZXRQYXRoPWZ1bmN0aW9uKHBhdGgpIHtcclxuXHRhcHBwYXRoPXBhdGg7XHJcblx0Y29uc29sZS5sb2coXCJzZXQgcGF0aFwiLHBhdGgpXHJcbn1cclxuXHJcbnZhciBlbnVtS2RiPWZ1bmN0aW9uKGNiLGNvbnRleHQpe1xyXG5cdHJldHVybiBrZGJzLm1hcChmdW5jdGlvbihrKXtyZXR1cm4ga1swXX0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz17b3BlbjpvcGVuTG9jYWwsc2V0UGF0aDpzZXRQYXRoLCBjbG9zZTpjbG9zZUxvY2FsLCBlbnVtS2RiOmVudW1LZGJ9OyIsIi8qIHJldHVybiBhcnJheSBvZiBkYmlkIGFuZCBhYnNvbHV0ZSBwYXRoKi9cclxudmFyIGxpc3RrZGJfaHRtbDU9ZnVuY3Rpb24oKSB7XHJcblx0dGhyb3cgXCJub3QgaW1wbGVtZW50IHlldFwiO1xyXG5cdHJlcXVpcmUoXCJrc2FuYS1qc29ucm9tXCIpLmh0bWw1ZnMucmVhZGRpcihmdW5jdGlvbihrZGJzKXtcclxuXHRcdFx0Y2IuYXBwbHkodGhpcyxba2Ric10pO1xyXG5cdH0sY29udGV4dHx8dGhpcyk7XHRcdFxyXG5cclxufVxyXG5cclxudmFyIGxpc3RrZGJfbm9kZT1mdW5jdGlvbigpe1xyXG5cdHZhciBmcz1yZXF1aXJlKFwiZnNcIik7XHJcblx0dmFyIHBhdGg9cmVxdWlyZShcInBhdGhcIilcclxuXHR2YXIgcGFyZW50PXBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLFwiLi5cIik7XHJcblx0dmFyIGZpbGVzPWZzLnJlYWRkaXJTeW5jKHBhcmVudCk7XHJcblx0dmFyIG91dHB1dD1bXTtcclxuXHRmaWxlcy5tYXAoZnVuY3Rpb24oZil7XHJcblx0XHR2YXIgc3ViZGlyPXBhcmVudCtwYXRoLnNlcCtmO1xyXG5cdFx0dmFyIHN0YXQ9ZnMuc3RhdFN5bmMoc3ViZGlyICk7XHJcblx0XHRpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XHJcblx0XHRcdHZhciBzdWJmaWxlcz1mcy5yZWFkZGlyU3luYyhzdWJkaXIpO1xyXG5cdFx0XHRmb3IgKHZhciBpPTA7aTxzdWJmaWxlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dmFyIGZpbGU9c3ViZmlsZXNbaV07XHJcblx0XHRcdFx0dmFyIGlkeD1maWxlLmluZGV4T2YoXCIua2RiXCIpO1xyXG5cdFx0XHRcdGlmIChpZHg+LTEmJmlkeD09ZmlsZS5sZW5ndGgtNCkge1xyXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2goWyBmaWxlLnN1YnN0cigwLGZpbGUubGVuZ3RoLTQpLCBzdWJkaXIrcGF0aC5zZXArZmlsZV0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0cmV0dXJuIG91dHB1dDtcclxufVxyXG52YXIgZmlsZU5hbWVPbmx5PWZ1bmN0aW9uKGZuKSB7XHJcblx0dmFyIGF0PWZuLmxhc3RJbmRleE9mKFwiL1wiKTtcclxuXHRpZiAoYXQ+LTEpIHJldHVybiBmbi5zdWJzdHIoYXQrMSk7XHJcblx0cmV0dXJuIGZuO1xyXG59XHJcbnZhciBsaXN0a2RiX2tzYW5hZ2FwPWZ1bmN0aW9uKCkge1xyXG5cdHZhciBvdXRwdXQ9W107XHJcblx0dmFyIGFwcHM9SlNPTi5wYXJzZShrZnMubGlzdEFwcHMoKSk7XHJcblx0Zm9yICh2YXIgaT0wO2k8YXBwcy5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgYXBwPWFwcHNbaV07XHJcblx0XHRpZiAoYXBwLmZpbGVzKSBmb3IgKHZhciBqPTA7ajxhcHAuZmlsZXMubGVuZ3RoO2orKykge1xyXG5cdFx0XHR2YXIgZmlsZT1hcHAuZmlsZXNbal07XHJcblx0XHRcdGlmIChmaWxlLnN1YnN0cihmaWxlLmxlbmd0aC00KT09XCIua2RiXCIpIHtcclxuXHRcdFx0XHRvdXRwdXQucHVzaChbYXBwLmRiaWQsZmlsZU5hbWVPbmx5KGZpbGUpXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG5cdHJldHVybiBvdXRwdXQ7XHJcbn1cclxudmFyIGxpc3RrZGI9ZnVuY3Rpb24oKSB7XHJcblx0dmFyIHBsYXRmb3JtPXJlcXVpcmUoXCIuL3BsYXRmb3JtXCIpLmdldFBsYXRmb3JtKCk7XHJcblx0dmFyIGZpbGVzPVtdO1xyXG5cdGlmIChwbGF0Zm9ybT09XCJub2RlXCIgfHwgcGxhdGZvcm09PVwibm9kZS13ZWJraXRcIikge1xyXG5cdFx0ZmlsZXM9bGlzdGtkYl9ub2RlKCk7XHJcblx0fSBlbHNlIGlmICh0eXBlb2Yga2ZzIT1cInVuZGVmaW5lZFwiKSB7XHJcblx0XHRmaWxlcz1saXN0a2RiX2tzYW5hZ2FwKCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHRocm93IFwibm90IGltcGxlbWVudCB5ZXRcIjtcclxuXHR9XHJcblx0cmV0dXJuIGZpbGVzO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPWxpc3RrZGI7IiwidmFyIGdldFBsYXRmb3JtPWZ1bmN0aW9uKCkge1xyXG5cdGlmICh0eXBlb2Yga3NhbmFnYXA9PVwidW5kZWZpbmVkXCIpIHtcclxuXHRcdHBsYXRmb3JtPVwibm9kZVwiO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRwbGF0Zm9ybT1rc2FuYWdhcC5wbGF0Zm9ybTtcclxuXHR9XHJcblx0cmV0dXJuIHBsYXRmb3JtO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtnZXRQbGF0Zm9ybTpnZXRQbGF0Zm9ybX07IiwiXHJcbi8qIGVtdWxhdGUgZmlsZXN5c3RlbSBvbiBodG1sNSBicm93c2VyICovXHJcbi8qIGVtdWxhdGUgZmlsZXN5c3RlbSBvbiBodG1sNSBicm93c2VyICovXHJcbnZhciByZWFkPWZ1bmN0aW9uKGhhbmRsZSxidWZmZXIsb2Zmc2V0LGxlbmd0aCxwb3NpdGlvbixjYikgey8vYnVmZmVyIGFuZCBvZmZzZXQgaXMgbm90IHVzZWRcclxuXHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0eGhyLm9wZW4oJ0dFVCcsIGhhbmRsZS51cmwgLCB0cnVlKTtcclxuXHR2YXIgcmFuZ2U9W3Bvc2l0aW9uLGxlbmd0aCtwb3NpdGlvbi0xXTtcclxuXHR4aHIuc2V0UmVxdWVzdEhlYWRlcignUmFuZ2UnLCAnYnl0ZXM9JytyYW5nZVswXSsnLScrcmFuZ2VbMV0pO1xyXG5cdHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xyXG5cdHhoci5zZW5kKCk7XHJcblx0eGhyLm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdGNiKDAsdGhhdC5yZXNwb25zZS5ieXRlTGVuZ3RoLHRoYXQucmVzcG9uc2UpO1xyXG5cdFx0fSwwKTtcclxuXHR9OyBcclxufVxyXG52YXIgY2xvc2U9ZnVuY3Rpb24oaGFuZGxlKSB7fVxyXG52YXIgZnN0YXRTeW5jPWZ1bmN0aW9uKGhhbmRsZSkge1xyXG5cdHRocm93IFwibm90IGltcGxlbWVudCB5ZXRcIjtcclxufVxyXG52YXIgZnN0YXQ9ZnVuY3Rpb24oaGFuZGxlLGNiKSB7XHJcblx0dGhyb3cgXCJub3QgaW1wbGVtZW50IHlldFwiO1xyXG59XHJcbnZhciBfb3Blbj1mdW5jdGlvbihmbl91cmwsY2IpIHtcclxuXHRcdHZhciBoYW5kbGU9e307XHJcblx0XHRpZiAoZm5fdXJsLmluZGV4T2YoXCJmaWxlc3lzdGVtOlwiKT09MCl7XHJcblx0XHRcdGhhbmRsZS51cmw9Zm5fdXJsO1xyXG5cdFx0XHRoYW5kbGUuZm49Zm5fdXJsLnN1YnN0ciggZm5fdXJsLmxhc3RJbmRleE9mKFwiL1wiKSsxKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGhhbmRsZS5mbj1mbl91cmw7XHJcblx0XHRcdHZhciB1cmw9QVBJLmZpbGVzLmZpbHRlcihmdW5jdGlvbihmKXsgcmV0dXJuIChmWzBdPT1mbl91cmwpfSk7XHJcblx0XHRcdGlmICh1cmwubGVuZ3RoKSBoYW5kbGUudXJsPXVybFswXVsxXTtcclxuXHRcdFx0ZWxzZSBjYihudWxsKTtcclxuXHRcdH1cclxuXHRcdGNiKGhhbmRsZSk7XHJcbn1cclxudmFyIG9wZW49ZnVuY3Rpb24oZm5fdXJsLGNiKSB7XHJcblx0XHRpZiAoIUFQSS5pbml0aWFsaXplZCkge2luaXQoMTAyNCoxMDI0LGZ1bmN0aW9uKCl7XHJcblx0XHRcdF9vcGVuLmFwcGx5KHRoaXMsW2ZuX3VybCxjYl0pO1xyXG5cdFx0fSx0aGlzKX0gZWxzZSBfb3Blbi5hcHBseSh0aGlzLFtmbl91cmwsY2JdKTtcclxufVxyXG52YXIgbG9hZD1mdW5jdGlvbihmaWxlbmFtZSxtb2RlLGNiKSB7XHJcblx0b3BlbihmaWxlbmFtZSxtb2RlLGNiLHRydWUpO1xyXG59XHJcbmZ1bmN0aW9uIGVycm9ySGFuZGxlcihlKSB7XHJcblx0Y29uc29sZS5lcnJvcignRXJyb3I6ICcgK2UubmFtZSsgXCIgXCIrZS5tZXNzYWdlKTtcclxufVxyXG52YXIgcmVhZGRpcj1mdW5jdGlvbihjYixjb250ZXh0KSB7XHJcblx0IHZhciBkaXJSZWFkZXIgPSBBUEkuZnMucm9vdC5jcmVhdGVSZWFkZXIoKTtcclxuXHQgdmFyIG91dD1bXSx0aGF0PXRoaXM7XHJcblx0XHRkaXJSZWFkZXIucmVhZEVudHJpZXMoZnVuY3Rpb24oZW50cmllcykge1xyXG5cdFx0XHRpZiAoZW50cmllcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgZW50cnk7IGVudHJ5ID0gZW50cmllc1tpXTsgKytpKSB7XHJcblx0XHRcdFx0XHRpZiAoZW50cnkuaXNGaWxlKSB7XHJcblx0XHRcdFx0XHRcdG91dC5wdXNoKFtlbnRyeS5uYW1lLGVudHJ5LnRvVVJMID8gZW50cnkudG9VUkwoKSA6IGVudHJ5LnRvVVJJKCldKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0QVBJLmZpbGVzPW91dDtcclxuXHRcdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtvdXRdKTtcclxuXHRcdH0sIGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbbnVsbF0pO1xyXG5cdFx0fSk7XHJcbn1cclxudmFyIGluaXRmcz1mdW5jdGlvbihncmFudGVkQnl0ZXMsY2IsY29udGV4dCkge1xyXG5cdHdlYmtpdFJlcXVlc3RGaWxlU3lzdGVtKFBFUlNJU1RFTlQsIGdyYW50ZWRCeXRlcywgIGZ1bmN0aW9uKGZzKSB7XHJcblx0XHRBUEkuZnM9ZnM7XHJcblx0XHRBUEkucXVvdGE9Z3JhbnRlZEJ5dGVzO1xyXG5cdFx0cmVhZGRpcihmdW5jdGlvbigpe1xyXG5cdFx0XHRBUEkuaW5pdGlhbGl6ZWQ9dHJ1ZTtcclxuXHRcdFx0Y2IuYXBwbHkoY29udGV4dCxbZ3JhbnRlZEJ5dGVzLGZzXSk7XHJcblx0XHR9LGNvbnRleHQpO1xyXG5cdH0sIGVycm9ySGFuZGxlcik7XHJcbn1cclxudmFyIGluaXQ9ZnVuY3Rpb24ocXVvdGEsY2IsY29udGV4dCkge1xyXG5cdG5hdmlnYXRvci53ZWJraXRQZXJzaXN0ZW50U3RvcmFnZS5yZXF1ZXN0UXVvdGEocXVvdGEsIFxyXG5cdFx0XHRmdW5jdGlvbihncmFudGVkQnl0ZXMpIHtcclxuXHRcdFx0XHRpbml0ZnMoZ3JhbnRlZEJ5dGVzLGNiLGNvbnRleHQpO1xyXG5cdFx0fSwgZXJyb3JIYW5kbGVyIFxyXG5cdCk7XHJcbn1cclxudmFyIEFQST17XHJcblx0cmVhZDpyZWFkXHJcblx0LHJlYWRkaXI6cmVhZGRpclxyXG5cdCxvcGVuOm9wZW5cclxuXHQsY2xvc2U6Y2xvc2VcclxuXHQsZnN0YXRTeW5jOmZzdGF0U3luY1xyXG5cdCxmc3RhdDpmc3RhdFxyXG59XHJcbm1vZHVsZS5leHBvcnRzPUFQSTsiLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0b3BlbjpyZXF1aXJlKFwiLi9rZGJcIilcclxuXHQsY3JlYXRlOnJlcXVpcmUoXCIuL2tkYndcIilcclxufVxyXG4iLCIvKlxyXG5cdEtEQiB2ZXJzaW9uIDMuMCBHUExcclxuXHR5YXBjaGVhaHNoZW5AZ21haWwuY29tXHJcblx0MjAxMy8xMi8yOFxyXG5cdGFzeW5jcm9uaXplIHZlcnNpb24gb2YgeWFkYlxyXG5cclxuICByZW1vdmUgZGVwZW5kZW5jeSBvZiBRLCB0aGFua3MgdG9cclxuICBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQyMzQ2MTkvaG93LXRvLWF2b2lkLWxvbmctbmVzdGluZy1vZi1hc3luY2hyb25vdXMtZnVuY3Rpb25zLWluLW5vZGUtanNcclxuXHJcbiAgMjAxNS8xLzJcclxuICBtb3ZlZCB0byBrc2FuYWZvcmdlL2tzYW5hLWpzb25yb21cclxuICBhZGQgZXJyIGluIGNhbGxiYWNrIGZvciBub2RlLmpzIGNvbXBsaWFudFxyXG4qL1xyXG52YXIgS2ZzPW51bGw7XHJcblxyXG5pZiAodHlwZW9mIGtzYW5hZ2FwPT1cInVuZGVmaW5lZFwiKSB7XHJcblx0S2ZzPXJlcXVpcmUoJy4va2RiZnMnKTtcdFx0XHRcclxufSBlbHNlIHtcclxuXHRpZiAoa3NhbmFnYXAucGxhdGZvcm09PVwiaW9zXCIpIHtcclxuXHRcdEtmcz1yZXF1aXJlKFwiLi9rZGJmc19pb3NcIik7XHJcblx0fSBlbHNlIGlmIChrc2FuYWdhcC5wbGF0Zm9ybT09XCJub2RlLXdlYmtpdFwiKSB7XHJcblx0XHRLZnM9cmVxdWlyZShcIi4va2RiZnNcIik7XHJcblx0fSBlbHNlIGlmIChrc2FuYWdhcC5wbGF0Zm9ybT09XCJjaHJvbWVcIikge1xyXG5cdFx0S2ZzPXJlcXVpcmUoXCIuL2tkYmZzXCIpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRLZnM9cmVxdWlyZShcIi4va2RiZnNfYW5kcm9pZFwiKTtcclxuXHR9XHJcblx0XHRcclxufVxyXG5cclxuXHJcbnZhciBEVD17XHJcblx0dWludDg6JzEnLCAvL3Vuc2lnbmVkIDEgYnl0ZSBpbnRlZ2VyXHJcblx0aW50MzI6JzQnLCAvLyBzaWduZWQgNCBieXRlcyBpbnRlZ2VyXHJcblx0dXRmODonOCcsICBcclxuXHR1Y3MyOicyJyxcclxuXHRib29sOideJywgXHJcblx0YmxvYjonJicsXHJcblx0dXRmOGFycjonKicsIC8vc2hpZnQgb2YgOFxyXG5cdHVjczJhcnI6J0AnLCAvL3NoaWZ0IG9mIDJcclxuXHR1aW50OGFycjonIScsIC8vc2hpZnQgb2YgMVxyXG5cdGludDMyYXJyOickJywgLy9zaGlmdCBvZiA0XHJcblx0dmludDonYCcsXHJcblx0cGludDonficsXHRcclxuXHJcblx0YXJyYXk6J1xcdTAwMWInLFxyXG5cdG9iamVjdDonXFx1MDAxYScgXHJcblx0Ly95ZGIgc3RhcnQgd2l0aCBvYmplY3Qgc2lnbmF0dXJlLFxyXG5cdC8vdHlwZSBhIHlkYiBpbiBjb21tYW5kIHByb21wdCBzaG93cyBub3RoaW5nXHJcbn1cclxudmFyIHZlcmJvc2U9MCwgcmVhZExvZz1mdW5jdGlvbigpe307XHJcbnZhciBfcmVhZExvZz1mdW5jdGlvbihyZWFkdHlwZSxieXRlcykge1xyXG5cdGNvbnNvbGUubG9nKHJlYWR0eXBlLGJ5dGVzLFwiYnl0ZXNcIik7XHJcbn1cclxuaWYgKHZlcmJvc2UpIHJlYWRMb2c9X3JlYWRMb2c7XHJcbnZhciBzdHJzZXA9XCJcXHVmZmZmXCI7XHJcbnZhciBDcmVhdGU9ZnVuY3Rpb24ocGF0aCxvcHRzLGNiKSB7XHJcblx0LyogbG9hZHh4eCBmdW5jdGlvbnMgbW92ZSBmaWxlIHBvaW50ZXIgKi9cclxuXHQvLyBsb2FkIHZhcmlhYmxlIGxlbmd0aCBpbnRcclxuXHRpZiAodHlwZW9mIG9wdHM9PVwiZnVuY3Rpb25cIikge1xyXG5cdFx0Y2I9b3B0cztcclxuXHRcdG9wdHM9e307XHJcblx0fVxyXG5cclxuXHRcclxuXHR2YXIgbG9hZFZJbnQgPWZ1bmN0aW9uKG9wdHMsYmxvY2tzaXplLGNvdW50LGNiKSB7XHJcblx0XHQvL2lmIChjb3VudD09MCkgcmV0dXJuIFtdO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHJcblx0XHR0aGlzLmZzLnJlYWRCdWZfcGFja2VkaW50KG9wdHMuY3VyLGJsb2Nrc2l6ZSxjb3VudCx0cnVlLGZ1bmN0aW9uKG8pe1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwidmludFwiKTtcclxuXHRcdFx0b3B0cy5jdXIrPW8uYWR2O1xyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvLmRhdGFdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHR2YXIgbG9hZFZJbnQxPWZ1bmN0aW9uKG9wdHMsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRsb2FkVkludC5hcHBseSh0aGlzLFtvcHRzLDYsMSxmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInZpbnQxXCIpO1xyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtkYXRhWzBdXSk7XHJcblx0XHR9XSlcclxuXHR9XHJcblx0Ly9mb3IgcG9zdGluZ3NcclxuXHR2YXIgbG9hZFBJbnQgPWZ1bmN0aW9uKG9wdHMsYmxvY2tzaXplLGNvdW50LGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0dGhpcy5mcy5yZWFkQnVmX3BhY2tlZGludChvcHRzLmN1cixibG9ja3NpemUsY291bnQsZmFsc2UsZnVuY3Rpb24obyl7XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJwaW50XCIpO1xyXG5cdFx0XHRvcHRzLmN1cis9by5hZHY7XHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW28uZGF0YV0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdC8vIGl0ZW0gY2FuIGJlIGFueSB0eXBlICh2YXJpYWJsZSBsZW5ndGgpXHJcblx0Ly8gbWF4aW11bSBzaXplIG9mIGFycmF5IGlzIDFUQiAyXjQwXHJcblx0Ly8gc3RydWN0dXJlOlxyXG5cdC8vIHNpZ25hdHVyZSw1IGJ5dGVzIG9mZnNldCwgcGF5bG9hZCwgaXRlbWxlbmd0aHNcclxuXHR2YXIgZ2V0QXJyYXlMZW5ndGg9ZnVuY3Rpb24ob3B0cyxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHZhciBkYXRhb2Zmc2V0PTA7XHJcblxyXG5cdFx0dGhpcy5mcy5yZWFkVUk4KG9wdHMuY3VyLGZ1bmN0aW9uKGxlbil7XHJcblx0XHRcdHZhciBsZW5ndGhvZmZzZXQ9bGVuKjQyOTQ5NjcyOTY7XHJcblx0XHRcdG9wdHMuY3VyKys7XHJcblx0XHRcdHRoYXQuZnMucmVhZFVJMzIob3B0cy5jdXIsZnVuY3Rpb24obGVuKXtcclxuXHRcdFx0XHRvcHRzLmN1cis9NDtcclxuXHRcdFx0XHRkYXRhb2Zmc2V0PW9wdHMuY3VyOyAvL2tlZXAgdGhpc1xyXG5cdFx0XHRcdGxlbmd0aG9mZnNldCs9bGVuO1xyXG5cdFx0XHRcdG9wdHMuY3VyKz1sZW5ndGhvZmZzZXQ7XHJcblxyXG5cdFx0XHRcdGxvYWRWSW50MS5hcHBseSh0aGF0LFtvcHRzLGZ1bmN0aW9uKGNvdW50KXtcclxuXHRcdFx0XHRcdGxvYWRWSW50LmFwcGx5KHRoYXQsW29wdHMsY291bnQqNixjb3VudCxmdW5jdGlvbihzeil7XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdGNiKHtjb3VudDpjb3VudCxzejpzeixvZmZzZXQ6ZGF0YW9mZnNldH0pO1xyXG5cdFx0XHRcdFx0fV0pO1xyXG5cdFx0XHRcdH1dKTtcclxuXHRcdFx0XHRcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHZhciBsb2FkQXJyYXkgPSBmdW5jdGlvbihvcHRzLGJsb2Nrc2l6ZSxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGdldEFycmF5TGVuZ3RoLmFwcGx5KHRoaXMsW29wdHMsZnVuY3Rpb24oTCl7XHJcblx0XHRcdFx0dmFyIG89W107XHJcblx0XHRcdFx0dmFyIGVuZGN1cj1vcHRzLmN1cjtcclxuXHRcdFx0XHRvcHRzLmN1cj1MLm9mZnNldDtcclxuXHJcblx0XHRcdFx0aWYgKG9wdHMubGF6eSkgeyBcclxuXHRcdFx0XHRcdFx0dmFyIG9mZnNldD1MLm9mZnNldDtcclxuXHRcdFx0XHRcdFx0TC5zei5tYXAoZnVuY3Rpb24oc3ope1xyXG5cdFx0XHRcdFx0XHRcdG9bby5sZW5ndGhdPXN0cnNlcCtvZmZzZXQudG9TdHJpbmcoMTYpXHJcblx0XHRcdFx0XHRcdFx0XHQgICArc3Ryc2VwK3N6LnRvU3RyaW5nKDE2KTtcclxuXHRcdFx0XHRcdFx0XHRvZmZzZXQrPXN6O1xyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR2YXIgdGFza3F1ZXVlPVtdO1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaT0wO2k8TC5jb3VudDtpKyspIHtcclxuXHRcdFx0XHRcdFx0dGFza3F1ZXVlLnB1c2goXHJcblx0XHRcdFx0XHRcdFx0KGZ1bmN0aW9uKHN6KXtcclxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiAoXHJcblx0XHRcdFx0XHRcdFx0XHRcdGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZGF0YT09J29iamVjdCcgJiYgZGF0YS5fX2VtcHR5KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgLy9ub3QgcHVzaGluZyB0aGUgZmlyc3QgY2FsbFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cdGVsc2Ugby5wdXNoKGRhdGEpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9wdHMuYmxvY2tzaXplPXN6O1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxvYWQuYXBwbHkodGhhdCxbb3B0cywgdGFza3F1ZXVlLnNoaWZ0KCldKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0XHR9KShMLnN6W2ldKVxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9sYXN0IGNhbGwgdG8gY2hpbGQgbG9hZFxyXG5cdFx0XHRcdFx0dGFza3F1ZXVlLnB1c2goZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0XHRcdG8ucHVzaChkYXRhKTtcclxuXHRcdFx0XHRcdFx0b3B0cy5jdXI9ZW5kY3VyO1xyXG5cdFx0XHRcdFx0XHRjYi5hcHBseSh0aGF0LFtvXSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChvcHRzLmxhenkpIGNiLmFwcGx5KHRoYXQsW29dKTtcclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdF0pXHJcblx0fVx0XHRcclxuXHQvLyBpdGVtIGNhbiBiZSBhbnkgdHlwZSAodmFyaWFibGUgbGVuZ3RoKVxyXG5cdC8vIHN1cHBvcnQgbGF6eSBsb2FkXHJcblx0Ly8gc3RydWN0dXJlOlxyXG5cdC8vIHNpZ25hdHVyZSw1IGJ5dGVzIG9mZnNldCwgcGF5bG9hZCwgaXRlbWxlbmd0aHMsIFxyXG5cdC8vICAgICAgICAgICAgICAgICAgICBzdHJpbmdhcnJheV9zaWduYXR1cmUsIGtleXNcclxuXHR2YXIgbG9hZE9iamVjdCA9IGZ1bmN0aW9uKG9wdHMsYmxvY2tzaXplLGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0dmFyIHN0YXJ0PW9wdHMuY3VyO1xyXG5cdFx0Z2V0QXJyYXlMZW5ndGguYXBwbHkodGhpcyxbb3B0cyxmdW5jdGlvbihMKSB7XHJcblx0XHRcdG9wdHMuYmxvY2tzaXplPWJsb2Nrc2l6ZS1vcHRzLmN1citzdGFydDtcclxuXHRcdFx0bG9hZC5hcHBseSh0aGF0LFtvcHRzLGZ1bmN0aW9uKGtleXMpeyAvL2xvYWQgdGhlIGtleXNcclxuXHRcdFx0XHRpZiAob3B0cy5rZXlzKSB7IC8vY2FsbGVyIGFzayBmb3Iga2V5c1xyXG5cdFx0XHRcdFx0a2V5cy5tYXAoZnVuY3Rpb24oaykgeyBvcHRzLmtleXMucHVzaChrKX0pO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dmFyIG89e307XHJcblx0XHRcdFx0dmFyIGVuZGN1cj1vcHRzLmN1cjtcclxuXHRcdFx0XHRvcHRzLmN1cj1MLm9mZnNldDtcclxuXHRcdFx0XHRpZiAob3B0cy5sYXp5KSB7IFxyXG5cdFx0XHRcdFx0dmFyIG9mZnNldD1MLm9mZnNldDtcclxuXHRcdFx0XHRcdGZvciAodmFyIGk9MDtpPEwuc3oubGVuZ3RoO2krKykge1xyXG5cdFx0XHRcdFx0XHQvL3ByZWZpeCB3aXRoIGEgXFwwLCBpbXBvc3NpYmxlIGZvciBub3JtYWwgc3RyaW5nXHJcblx0XHRcdFx0XHRcdG9ba2V5c1tpXV09c3Ryc2VwK29mZnNldC50b1N0cmluZygxNilcclxuXHRcdFx0XHRcdFx0XHQgICArc3Ryc2VwK0wuc3pbaV0udG9TdHJpbmcoMTYpO1xyXG5cdFx0XHRcdFx0XHRvZmZzZXQrPUwuc3pbaV07XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHZhciB0YXNrcXVldWU9W107XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpPTA7aTxMLmNvdW50O2krKykge1xyXG5cdFx0XHRcdFx0XHR0YXNrcXVldWUucHVzaChcclxuXHRcdFx0XHRcdFx0XHQoZnVuY3Rpb24oc3osa2V5KXtcclxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiAoXHJcblx0XHRcdFx0XHRcdFx0XHRcdGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZGF0YT09J29iamVjdCcgJiYgZGF0YS5fX2VtcHR5KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvL25vdCBzYXZpbmcgdGhlIGZpcnN0IGNhbGw7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG9ba2V5XT1kYXRhOyBcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0b3B0cy5ibG9ja3NpemU9c3o7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHZlcmJvc2UpIHJlYWRMb2coXCJrZXlcIixrZXkpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxvYWQuYXBwbHkodGhhdCxbb3B0cywgdGFza3F1ZXVlLnNoaWZ0KCldKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0XHR9KShMLnN6W2ldLGtleXNbaS0xXSlcclxuXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2xhc3QgY2FsbCB0byBjaGlsZCBsb2FkXHJcblx0XHRcdFx0XHR0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0b1trZXlzW2tleXMubGVuZ3RoLTFdXT1kYXRhO1xyXG5cdFx0XHRcdFx0XHRvcHRzLmN1cj1lbmRjdXI7XHJcblx0XHRcdFx0XHRcdGNiLmFwcGx5KHRoYXQsW29dKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAob3B0cy5sYXp5KSBjYi5hcHBseSh0aGF0LFtvXSk7XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XSk7XHJcblx0XHR9XSk7XHJcblx0fVxyXG5cclxuXHQvL2l0ZW0gaXMgc2FtZSBrbm93biB0eXBlXHJcblx0dmFyIGxvYWRTdHJpbmdBcnJheT1mdW5jdGlvbihvcHRzLGJsb2Nrc2l6ZSxlbmNvZGluZyxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRoaXMuZnMucmVhZFN0cmluZ0FycmF5KG9wdHMuY3VyLGJsb2Nrc2l6ZSxlbmNvZGluZyxmdW5jdGlvbihvKXtcclxuXHRcdFx0b3B0cy5jdXIrPWJsb2Nrc2l6ZTtcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbb10pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdHZhciBsb2FkSW50ZWdlckFycmF5PWZ1bmN0aW9uKG9wdHMsYmxvY2tzaXplLHVuaXRzaXplLGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0bG9hZFZJbnQxLmFwcGx5KHRoaXMsW29wdHMsZnVuY3Rpb24oY291bnQpe1xyXG5cdFx0XHR2YXIgbz10aGF0LmZzLnJlYWRGaXhlZEFycmF5KG9wdHMuY3VyLGNvdW50LHVuaXRzaXplLGZ1bmN0aW9uKG8pe1xyXG5cdFx0XHRcdG9wdHMuY3VyKz1jb3VudCp1bml0c2l6ZTtcclxuXHRcdFx0XHRjYi5hcHBseSh0aGF0LFtvXSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fV0pO1xyXG5cdH1cclxuXHR2YXIgbG9hZEJsb2I9ZnVuY3Rpb24oYmxvY2tzaXplLGNiKSB7XHJcblx0XHR2YXIgbz10aGlzLmZzLnJlYWRCdWYodGhpcy5jdXIsYmxvY2tzaXplKTtcclxuXHRcdHRoaXMuY3VyKz1ibG9ja3NpemU7XHJcblx0XHRyZXR1cm4gbztcclxuXHR9XHRcclxuXHR2YXIgbG9hZGJ5c2lnbmF0dXJlPWZ1bmN0aW9uKG9wdHMsc2lnbmF0dXJlLGNiKSB7XHJcblx0XHQgIHZhciBibG9ja3NpemU9b3B0cy5ibG9ja3NpemV8fHRoaXMuZnMuc2l6ZTsgXHJcblx0XHRcdG9wdHMuY3VyKz10aGlzLmZzLnNpZ25hdHVyZV9zaXplO1xyXG5cdFx0XHR2YXIgZGF0YXNpemU9YmxvY2tzaXplLXRoaXMuZnMuc2lnbmF0dXJlX3NpemU7XHJcblx0XHRcdC8vYmFzaWMgdHlwZXNcclxuXHRcdFx0aWYgKHNpZ25hdHVyZT09PURULmludDMyKSB7XHJcblx0XHRcdFx0b3B0cy5jdXIrPTQ7XHJcblx0XHRcdFx0dGhpcy5mcy5yZWFkSTMyKG9wdHMuY3VyLTQsY2IpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnVpbnQ4KSB7XHJcblx0XHRcdFx0b3B0cy5jdXIrKztcclxuXHRcdFx0XHR0aGlzLmZzLnJlYWRVSTgob3B0cy5jdXItMSxjYik7XHJcblx0XHRcdH0gZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQudXRmOCkge1xyXG5cdFx0XHRcdHZhciBjPW9wdHMuY3VyO29wdHMuY3VyKz1kYXRhc2l6ZTtcclxuXHRcdFx0XHR0aGlzLmZzLnJlYWRTdHJpbmcoYyxkYXRhc2l6ZSwndXRmOCcsY2IpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnVjczIpIHtcclxuXHRcdFx0XHR2YXIgYz1vcHRzLmN1cjtvcHRzLmN1cis9ZGF0YXNpemU7XHJcblx0XHRcdFx0dGhpcy5mcy5yZWFkU3RyaW5nKGMsZGF0YXNpemUsJ3VjczInLGNiKTtcdFxyXG5cdFx0XHR9IGVsc2UgaWYgKHNpZ25hdHVyZT09PURULmJvb2wpIHtcclxuXHRcdFx0XHRvcHRzLmN1cisrO1xyXG5cdFx0XHRcdHRoaXMuZnMucmVhZFVJOChvcHRzLmN1ci0xLGZ1bmN0aW9uKGRhdGEpe2NiKCEhZGF0YSl9KTtcclxuXHRcdFx0fSBlbHNlIGlmIChzaWduYXR1cmU9PT1EVC5ibG9iKSB7XHJcblx0XHRcdFx0bG9hZEJsb2IoZGF0YXNpemUsY2IpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vdmFyaWFibGUgbGVuZ3RoIGludGVnZXJzXHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnZpbnQpIHtcclxuXHRcdFx0XHRsb2FkVkludC5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLGRhdGFzaXplLGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQucGludCkge1xyXG5cdFx0XHRcdGxvYWRQSW50LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsZGF0YXNpemUsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL3NpbXBsZSBhcnJheVxyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC51dGY4YXJyKSB7XHJcblx0XHRcdFx0bG9hZFN0cmluZ0FycmF5LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsJ3V0ZjgnLGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQudWNzMmFycikge1xyXG5cdFx0XHRcdGxvYWRTdHJpbmdBcnJheS5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLCd1Y3MyJyxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnVpbnQ4YXJyKSB7XHJcblx0XHRcdFx0bG9hZEludGVnZXJBcnJheS5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLDEsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC5pbnQzMmFycikge1xyXG5cdFx0XHRcdGxvYWRJbnRlZ2VyQXJyYXkuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSw0LGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9uZXN0ZWQgc3RydWN0dXJlXHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULmFycmF5KSB7XHJcblx0XHRcdFx0bG9hZEFycmF5LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC5vYmplY3QpIHtcclxuXHRcdFx0XHRsb2FkT2JqZWN0LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKCd1bnN1cHBvcnRlZCB0eXBlJyxzaWduYXR1cmUsb3B0cylcclxuXHRcdFx0XHRjYi5hcHBseSh0aGlzLFtudWxsXSk7Ly9tYWtlIHN1cmUgaXQgcmV0dXJuXHJcblx0XHRcdFx0Ly90aHJvdyAndW5zdXBwb3J0ZWQgdHlwZSAnK3NpZ25hdHVyZTtcclxuXHRcdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGxvYWQ9ZnVuY3Rpb24ob3B0cyxjYikge1xyXG5cdFx0b3B0cz1vcHRzfHx7fTsgLy8gdGhpcyB3aWxsIHNlcnZlZCBhcyBjb250ZXh0IGZvciBlbnRpcmUgbG9hZCBwcm9jZWR1cmVcclxuXHRcdG9wdHMuY3VyPW9wdHMuY3VyfHwwO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRoaXMuZnMucmVhZFNpZ25hdHVyZShvcHRzLmN1ciwgZnVuY3Rpb24oc2lnbmF0dXJlKXtcclxuXHRcdFx0bG9hZGJ5c2lnbmF0dXJlLmFwcGx5KHRoYXQsW29wdHMsc2lnbmF0dXJlLGNiXSlcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cdHZhciBDQUNIRT1udWxsO1xyXG5cdHZhciBLRVk9e307XHJcblx0dmFyIEFERFJFU1M9e307XHJcblx0dmFyIHJlc2V0PWZ1bmN0aW9uKGNiKSB7XHJcblx0XHRpZiAoIUNBQ0hFKSB7XHJcblx0XHRcdGxvYWQuYXBwbHkodGhpcyxbe2N1cjowLGxhenk6dHJ1ZX0sZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0Q0FDSEU9ZGF0YTtcclxuXHRcdFx0XHRjYi5jYWxsKHRoaXMpO1xyXG5cdFx0XHR9XSk7XHRcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNiLmNhbGwodGhpcyk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgZXhpc3RzPWZ1bmN0aW9uKHBhdGgsY2IpIHtcclxuXHRcdGlmIChwYXRoLmxlbmd0aD09MCkgcmV0dXJuIHRydWU7XHJcblx0XHR2YXIga2V5PXBhdGgucG9wKCk7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0Z2V0LmFwcGx5KHRoaXMsW3BhdGgsZmFsc2UsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdGlmICghcGF0aC5qb2luKHN0cnNlcCkpIHJldHVybiAoISFLRVlba2V5XSk7XHJcblx0XHRcdHZhciBrZXlzPUtFWVtwYXRoLmpvaW4oc3Ryc2VwKV07XHJcblx0XHRcdHBhdGgucHVzaChrZXkpOy8vcHV0IGl0IGJhY2tcclxuXHRcdFx0aWYgKGtleXMpIGNiLmFwcGx5KHRoYXQsW2tleXMuaW5kZXhPZihrZXkpPi0xXSk7XHJcblx0XHRcdGVsc2UgY2IuYXBwbHkodGhhdCxbZmFsc2VdKTtcclxuXHRcdH1dKTtcclxuXHR9XHJcblxyXG5cdHZhciBnZXRTeW5jPWZ1bmN0aW9uKHBhdGgpIHtcclxuXHRcdGlmICghQ0FDSEUpIHJldHVybiB1bmRlZmluZWQ7XHRcclxuXHRcdHZhciBvPUNBQ0hFO1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8cGF0aC5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHZhciByPW9bcGF0aFtpXV07XHJcblx0XHRcdGlmICh0eXBlb2Ygcj09XCJ1bmRlZmluZWRcIikgcmV0dXJuIG51bGw7XHJcblx0XHRcdG89cjtcclxuXHRcdH1cclxuXHRcdHJldHVybiBvO1xyXG5cdH1cclxuXHR2YXIgZ2V0PWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdFx0aWYgKHR5cGVvZiBwYXRoPT0ndW5kZWZpbmVkJykgcGF0aD1bXTtcclxuXHRcdGlmICh0eXBlb2YgcGF0aD09XCJzdHJpbmdcIikgcGF0aD1bcGF0aF07XHJcblx0XHQvL29wdHMucmVjdXJzaXZlPSEhb3B0cy5yZWN1cnNpdmU7XHJcblx0XHRpZiAodHlwZW9mIG9wdHM9PVwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRjYj1vcHRzO25vZGVcclxuXHRcdFx0b3B0cz17fTtcclxuXHRcdH1cclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRpZiAodHlwZW9mIGNiIT0nZnVuY3Rpb24nKSByZXR1cm4gZ2V0U3luYyhwYXRoKTtcclxuXHJcblx0XHRyZXNldC5hcHBseSh0aGlzLFtmdW5jdGlvbigpe1xyXG5cdFx0XHR2YXIgbz1DQUNIRTtcclxuXHRcdFx0aWYgKHBhdGgubGVuZ3RoPT0wKSB7XHJcblx0XHRcdFx0aWYgKG9wdHMuYWRkcmVzcykge1xyXG5cdFx0XHRcdFx0Y2IoWzAsdGhhdC5mcy5zaXplXSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGNiKE9iamVjdC5rZXlzKENBQ0hFKSk7XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9IFxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIHBhdGhub3c9XCJcIix0YXNrcXVldWU9W10sbmV3b3B0cz17fSxyPW51bGw7XHJcblx0XHRcdHZhciBsYXN0a2V5PVwiXCI7XHJcblxyXG5cdFx0XHRmb3IgKHZhciBpPTA7aTxwYXRoLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0XHR2YXIgdGFzaz0oZnVuY3Rpb24oa2V5LGspe1xyXG5cclxuXHRcdFx0XHRcdHJldHVybiAoZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0XHRcdGlmICghKHR5cGVvZiBkYXRhPT0nb2JqZWN0JyAmJiBkYXRhLl9fZW1wdHkpKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBvW2xhc3RrZXldPT0nc3RyaW5nJyAmJiBvW2xhc3RrZXldWzBdPT1zdHJzZXApIG9bbGFzdGtleV09e307XHJcblx0XHRcdFx0XHRcdFx0b1tsYXN0a2V5XT1kYXRhOyBcclxuXHRcdFx0XHRcdFx0XHRvPW9bbGFzdGtleV07XHJcblx0XHRcdFx0XHRcdFx0cj1kYXRhW2tleV07XHJcblx0XHRcdFx0XHRcdFx0S0VZW3BhdGhub3ddPW9wdHMua2V5cztcdFx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0ZGF0YT1vW2tleV07XHJcblx0XHRcdFx0XHRcdFx0cj1kYXRhO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHI9PT1cInVuZGVmaW5lZFwiKSB7XHJcblx0XHRcdFx0XHRcdFx0dGFza3F1ZXVlPW51bGw7XHJcblx0XHRcdFx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbcl0pOyAvL3JldHVybiBlbXB0eSB2YWx1ZVxyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1x0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBhcnNlSW50KGspKSBwYXRobm93Kz1zdHJzZXA7XHJcblx0XHRcdFx0XHRcdFx0cGF0aG5vdys9a2V5O1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygcj09J3N0cmluZycgJiYgclswXT09c3Ryc2VwKSB7IC8vb2Zmc2V0IG9mIGRhdGEgdG8gYmUgbG9hZGVkXHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgcD1yLnN1YnN0cmluZygxKS5zcGxpdChzdHJzZXApLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gcGFyc2VJbnQoaXRlbSwxNil9KTtcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBjdXI9cFswXSxzej1wWzFdO1xyXG5cdFx0XHRcdFx0XHRcdFx0bmV3b3B0cy5sYXp5PSFvcHRzLnJlY3Vyc2l2ZSB8fCAoazxwYXRoLmxlbmd0aC0xKSA7XHJcblx0XHRcdFx0XHRcdFx0XHRuZXdvcHRzLmJsb2Nrc2l6ZT1zejtuZXdvcHRzLmN1cj1jdXIsbmV3b3B0cy5rZXlzPVtdO1xyXG5cdFx0XHRcdFx0XHRcdFx0bGFzdGtleT1rZXk7IC8vbG9hZCBpcyBzeW5jIGluIGFuZHJvaWRcclxuXHRcdFx0XHRcdFx0XHRcdGlmIChvcHRzLmFkZHJlc3MgJiYgdGFza3F1ZXVlLmxlbmd0aD09MSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRBRERSRVNTW3BhdGhub3ddPVtjdXIsc3pdO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR0YXNrcXVldWUuc2hpZnQoKShudWxsLEFERFJFU1NbcGF0aG5vd10pO1xyXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0bG9hZC5hcHBseSh0aGF0LFtuZXdvcHRzLCB0YXNrcXVldWUuc2hpZnQoKV0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAob3B0cy5hZGRyZXNzICYmIHRhc2txdWV1ZS5sZW5ndGg9PTEpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGFza3F1ZXVlLnNoaWZ0KCkobnVsbCxBRERSRVNTW3BhdGhub3ddKTtcclxuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHRhc2txdWV1ZS5zaGlmdCgpLmFwcGx5KHRoYXQsW3JdKTtcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHQocGF0aFtpXSxpKTtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR0YXNrcXVldWUucHVzaCh0YXNrKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHRhc2txdWV1ZS5sZW5ndGg9PTApIHtcclxuXHRcdFx0XHRjYi5hcHBseSh0aGF0LFtvXSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Ly9sYXN0IGNhbGwgdG8gY2hpbGQgbG9hZFxyXG5cdFx0XHRcdHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEsY3Vyc3ope1xyXG5cdFx0XHRcdFx0aWYgKG9wdHMuYWRkcmVzcykge1xyXG5cdFx0XHRcdFx0XHRjYi5hcHBseSh0aGF0LFtjdXJzel0pO1xyXG5cdFx0XHRcdFx0fSBlbHNle1xyXG5cdFx0XHRcdFx0XHR2YXIga2V5PXBhdGhbcGF0aC5sZW5ndGgtMV07XHJcblx0XHRcdFx0XHRcdG9ba2V5XT1kYXRhOyBLRVlbcGF0aG5vd109b3B0cy5rZXlzO1xyXG5cdFx0XHRcdFx0XHRjYi5hcHBseSh0aGF0LFtkYXRhXSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0dGFza3F1ZXVlLnNoaWZ0KCkoe19fZW1wdHk6dHJ1ZX0pO1x0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fV0pOyAvL3Jlc2V0XHJcblx0fVxyXG5cdC8vIGdldCBhbGwga2V5cyBpbiBnaXZlbiBwYXRoXHJcblx0dmFyIGdldGtleXM9ZnVuY3Rpb24ocGF0aCxjYikge1xyXG5cdFx0aWYgKCFwYXRoKSBwYXRoPVtdXHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0Z2V0LmFwcGx5KHRoaXMsW3BhdGgsZmFsc2UsZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYgKHBhdGggJiYgcGF0aC5sZW5ndGgpIHtcclxuXHRcdFx0XHRjYi5hcHBseSh0aGF0LFtLRVlbcGF0aC5qb2luKHN0cnNlcCldXSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbT2JqZWN0LmtleXMoQ0FDSEUpXSk7IFxyXG5cdFx0XHRcdC8vdG9wIGxldmVsLCBub3JtYWxseSBpdCBpcyB2ZXJ5IHNtYWxsXHJcblx0XHRcdH1cclxuXHRcdH1dKTtcclxuXHR9XHJcblxyXG5cdHZhciBzZXR1cGFwaT1mdW5jdGlvbigpIHtcclxuXHRcdHRoaXMubG9hZD1sb2FkO1xyXG4vL1x0XHR0aGlzLmN1cj0wO1xyXG5cdFx0dGhpcy5jYWNoZT1mdW5jdGlvbigpIHtyZXR1cm4gQ0FDSEV9O1xyXG5cdFx0dGhpcy5rZXk9ZnVuY3Rpb24oKSB7cmV0dXJuIEtFWX07XHJcblx0XHR0aGlzLmZyZWU9ZnVuY3Rpb24oKSB7XHJcblx0XHRcdENBQ0hFPW51bGw7XHJcblx0XHRcdEtFWT1udWxsO1xyXG5cdFx0XHR0aGlzLmZzLmZyZWUoKTtcclxuXHRcdH1cclxuXHRcdHRoaXMuc2V0Q2FjaGU9ZnVuY3Rpb24oYykge0NBQ0hFPWN9O1xyXG5cdFx0dGhpcy5rZXlzPWdldGtleXM7XHJcblx0XHR0aGlzLmdldD1nZXQ7ICAgLy8gZ2V0IGEgZmllbGQsIGxvYWQgaWYgbmVlZGVkXHJcblx0XHR0aGlzLmV4aXN0cz1leGlzdHM7XHJcblx0XHR0aGlzLkRUPURUO1xyXG5cdFx0XHJcblx0XHQvL2luc3RhbGwgdGhlIHN5bmMgdmVyc2lvbiBmb3Igbm9kZVxyXG5cdFx0Ly9pZiAodHlwZW9mIHByb2Nlc3MhPVwidW5kZWZpbmVkXCIpIHJlcXVpcmUoXCIuL2tkYl9zeW5jXCIpKHRoaXMpO1xyXG5cdFx0Ly9pZiAoY2IpIHNldFRpbWVvdXQoY2IuYmluZCh0aGlzKSwwKTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR2YXIgZXJyPTA7XHJcblx0XHRpZiAoY2IpIHtcclxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGNiKGVycix0aGF0KTtcdFxyXG5cdFx0XHR9LDApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHR2YXIgdGhhdD10aGlzO1xyXG5cdHZhciBrZnM9bmV3IEtmcyhwYXRoLG9wdHMsZnVuY3Rpb24oZXJyKXtcclxuXHRcdGlmIChlcnIpIHtcclxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGNiKGVyciwwKTtcclxuXHRcdFx0fSwwKTtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGF0LnNpemU9dGhpcy5zaXplO1xyXG5cdFx0XHRzZXR1cGFwaS5jYWxsKHRoYXQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdH0pO1xyXG5cdHRoaXMuZnM9a2ZzO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5DcmVhdGUuZGF0YXR5cGVzPURUO1xyXG5cclxuaWYgKG1vZHVsZSkgbW9kdWxlLmV4cG9ydHM9Q3JlYXRlO1xyXG4vL3JldHVybiBDcmVhdGU7XHJcbiIsIi8qIG5vZGUuanMgYW5kIGh0bWw1IGZpbGUgc3lzdGVtIGFic3RyYWN0aW9uIGxheWVyKi9cclxudHJ5IHtcclxuXHR2YXIgZnM9cmVxdWlyZShcImZzXCIpO1xyXG5cdHZhciBCdWZmZXI9cmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXI7XHJcbn0gY2F0Y2ggKGUpIHtcclxuXHR2YXIgZnM9cmVxdWlyZSgnLi9odG1sNXJlYWQnKTtcclxuXHR2YXIgQnVmZmVyPWZ1bmN0aW9uKCl7IHJldHVybiBcIlwifTtcclxuXHR2YXIgaHRtbDVmcz10cnVlOyBcdFxyXG59XHJcbnZhciBzaWduYXR1cmVfc2l6ZT0xO1xyXG52YXIgdmVyYm9zZT0wLCByZWFkTG9nPWZ1bmN0aW9uKCl7fTtcclxudmFyIF9yZWFkTG9nPWZ1bmN0aW9uKHJlYWR0eXBlLGJ5dGVzKSB7XHJcblx0Y29uc29sZS5sb2cocmVhZHR5cGUsYnl0ZXMsXCJieXRlc1wiKTtcclxufVxyXG5pZiAodmVyYm9zZSkgcmVhZExvZz1fcmVhZExvZztcclxuXHJcbnZhciB1bnBhY2tfaW50ID0gZnVuY3Rpb24gKGFyLCBjb3VudCAsIHJlc2V0KSB7XHJcbiAgIGNvdW50PWNvdW50fHxhci5sZW5ndGg7XHJcbiAgdmFyIHIgPSBbXSwgaSA9IDAsIHYgPSAwO1xyXG4gIGRvIHtcclxuXHR2YXIgc2hpZnQgPSAwO1xyXG5cdGRvIHtcclxuXHQgIHYgKz0gKChhcltpXSAmIDB4N0YpIDw8IHNoaWZ0KTtcclxuXHQgIHNoaWZ0ICs9IDc7XHQgIFxyXG5cdH0gd2hpbGUgKGFyWysraV0gJiAweDgwKTtcclxuXHRyLnB1c2godik7IGlmIChyZXNldCkgdj0wO1xyXG5cdGNvdW50LS07XHJcbiAgfSB3aGlsZSAoaTxhci5sZW5ndGggJiYgY291bnQpO1xyXG4gIHJldHVybiB7ZGF0YTpyLCBhZHY6aSB9O1xyXG59XHJcbnZhciBPcGVuPWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblxyXG5cdHZhciByZWFkU2lnbmF0dXJlPWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdFx0dmFyIGJ1Zj1uZXcgQnVmZmVyKHNpZ25hdHVyZV9zaXplKTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZiwwLHNpZ25hdHVyZV9zaXplLHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdGlmIChodG1sNWZzKSB2YXIgc2lnbmF0dXJlPVN0cmluZy5mcm9tQ2hhckNvZGUoKG5ldyBVaW50OEFycmF5KGJ1ZmZlcikpWzBdKVxyXG5cdFx0XHRlbHNlIHZhciBzaWduYXR1cmU9YnVmZmVyLnRvU3RyaW5nKCd1dGY4JywwLHNpZ25hdHVyZV9zaXplKTtcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbc2lnbmF0dXJlXSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vdGhpcyBpcyBxdWl0ZSBzbG93XHJcblx0Ly93YWl0IGZvciBTdHJpbmdWaWV3ICtBcnJheUJ1ZmZlciB0byBzb2x2ZSB0aGUgcHJvYmxlbVxyXG5cdC8vaHR0cHM6Ly9ncm91cHMuZ29vZ2xlLmNvbS9hL2Nocm9taXVtLm9yZy9mb3J1bS8jIXRvcGljL2JsaW5rLWRldi95bGdpTllfWlNWMFxyXG5cdC8vaWYgdGhlIHN0cmluZyBpcyBhbHdheXMgdWNzMlxyXG5cdC8vY2FuIHVzZSBVaW50MTYgdG8gcmVhZCBpdC5cclxuXHQvL2h0dHA6Ly91cGRhdGVzLmh0bWw1cm9ja3MuY29tLzIwMTIvMDYvSG93LXRvLWNvbnZlcnQtQXJyYXlCdWZmZXItdG8tYW5kLWZyb20tU3RyaW5nXHJcblx0dmFyIGRlY29kZXV0ZjggPSBmdW5jdGlvbiAodXRmdGV4dCkge1xyXG5cdFx0dmFyIHN0cmluZyA9IFwiXCI7XHJcblx0XHR2YXIgaSA9IDA7XHJcblx0XHR2YXIgYz0wLGMxID0gMCwgYzIgPSAwICwgYzM9MDtcclxuXHRcdGZvciAodmFyIGk9MDtpPHV0ZnRleHQubGVuZ3RoO2krKykge1xyXG5cdFx0XHRpZiAodXRmdGV4dC5jaGFyQ29kZUF0KGkpPjEyNykgYnJlYWs7XHJcblx0XHR9XHJcblx0XHRpZiAoaT49dXRmdGV4dC5sZW5ndGgpIHJldHVybiB1dGZ0ZXh0O1xyXG5cclxuXHRcdHdoaWxlICggaSA8IHV0ZnRleHQubGVuZ3RoICkge1xyXG5cdFx0XHRjID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkpO1xyXG5cdFx0XHRpZiAoYyA8IDEyOCkge1xyXG5cdFx0XHRcdHN0cmluZyArPSB1dGZ0ZXh0W2ldO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcclxuXHRcdFx0XHRjMiA9IHV0ZnRleHQuY2hhckNvZGVBdChpKzEpO1xyXG5cdFx0XHRcdHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDMxKSA8PCA2KSB8IChjMiAmIDYzKSk7XHJcblx0XHRcdFx0aSArPSAyO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XHJcblx0XHRcdFx0YzMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsyKTtcclxuXHRcdFx0XHRzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoKGMgJiAxNSkgPDwgMTIpIHwgKChjMiAmIDYzKSA8PCA2KSB8IChjMyAmIDYzKSk7XHJcblx0XHRcdFx0aSArPSAzO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc3RyaW5nO1xyXG5cdH1cclxuXHJcblx0dmFyIHJlYWRTdHJpbmc9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRcdGVuY29kaW5nPWVuY29kaW5nfHwndXRmOCc7XHJcblx0XHR2YXIgYnVmZmVyPW5ldyBCdWZmZXIoYmxvY2tzaXplKTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZmZlciwwLGJsb2Nrc2l6ZSxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRyZWFkTG9nKFwic3RyaW5nXCIsbGVuKTtcclxuXHRcdFx0aWYgKGh0bWw1ZnMpIHtcclxuXHRcdFx0XHRpZiAoZW5jb2Rpbmc9PSd1dGY4Jykge1xyXG5cdFx0XHRcdFx0dmFyIHN0cj1kZWNvZGV1dGY4KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSkpXHJcblx0XHRcdFx0fSBlbHNlIHsgLy91Y3MyIGlzIDMgdGltZXMgZmFzdGVyXHJcblx0XHRcdFx0XHR2YXIgc3RyPVN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQxNkFycmF5KGJ1ZmZlcikpXHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbc3RyXSk7XHJcblx0XHRcdH0gXHJcblx0XHRcdGVsc2UgY2IuYXBwbHkodGhhdCxbYnVmZmVyLnRvU3RyaW5nKGVuY29kaW5nKV0pO1x0XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vd29yayBhcm91bmQgZm9yIGNocm9tZSBmcm9tQ2hhckNvZGUgY2Fubm90IGFjY2VwdCBodWdlIGFycmF5XHJcblx0Ly9odHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NTY1ODhcclxuXHR2YXIgYnVmMnN0cmluZ2Fycj1mdW5jdGlvbihidWYsZW5jKSB7XHJcblx0XHRpZiAoZW5jPT1cInV0ZjhcIikgXHR2YXIgYXJyPW5ldyBVaW50OEFycmF5KGJ1Zik7XHJcblx0XHRlbHNlIHZhciBhcnI9bmV3IFVpbnQxNkFycmF5KGJ1Zik7XHJcblx0XHR2YXIgaT0wLGNvZGVzPVtdLG91dD1bXSxzPVwiXCI7XHJcblx0XHR3aGlsZSAoaTxhcnIubGVuZ3RoKSB7XHJcblx0XHRcdGlmIChhcnJbaV0pIHtcclxuXHRcdFx0XHRjb2Rlc1tjb2Rlcy5sZW5ndGhdPWFycltpXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzPVN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxjb2Rlcyk7XHJcblx0XHRcdFx0aWYgKGVuYz09XCJ1dGY4XCIpIG91dFtvdXQubGVuZ3RoXT1kZWNvZGV1dGY4KHMpO1xyXG5cdFx0XHRcdGVsc2Ugb3V0W291dC5sZW5ndGhdPXM7XHJcblx0XHRcdFx0Y29kZXM9W107XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRpKys7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdHM9U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGNvZGVzKTtcclxuXHRcdGlmIChlbmM9PVwidXRmOFwiKSBvdXRbb3V0Lmxlbmd0aF09ZGVjb2RldXRmOChzKTtcclxuXHRcdGVsc2Ugb3V0W291dC5sZW5ndGhdPXM7XHJcblxyXG5cdFx0cmV0dXJuIG91dDtcclxuXHR9XHJcblx0dmFyIHJlYWRTdHJpbmdBcnJheSA9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXMsb3V0PW51bGw7XHJcblx0XHRpZiAoYmxvY2tzaXplPT0wKSByZXR1cm4gW107XHJcblx0XHRlbmNvZGluZz1lbmNvZGluZ3x8J3V0ZjgnO1xyXG5cdFx0dmFyIGJ1ZmZlcj1uZXcgQnVmZmVyKGJsb2Nrc2l6ZSk7XHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZmZlciwwLGJsb2Nrc2l6ZSxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRpZiAoaHRtbDVmcykge1xyXG5cdFx0XHRcdHJlYWRMb2coXCJzdHJpbmdBcnJheVwiLGJ1ZmZlci5ieXRlTGVuZ3RoKTtcclxuXHJcblx0XHRcdFx0aWYgKGVuY29kaW5nPT0ndXRmOCcpIHtcclxuXHRcdFx0XHRcdG91dD1idWYyc3RyaW5nYXJyKGJ1ZmZlcixcInV0ZjhcIik7XHJcblx0XHRcdFx0fSBlbHNlIHsgLy91Y3MyIGlzIDMgdGltZXMgZmFzdGVyXHJcblx0XHRcdFx0XHRvdXQ9YnVmMnN0cmluZ2FycihidWZmZXIsXCJ1Y3MyXCIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZWFkTG9nKFwic3RyaW5nQXJyYXlcIixidWZmZXIubGVuZ3RoKTtcclxuXHRcdFx0XHRvdXQ9YnVmZmVyLnRvU3RyaW5nKGVuY29kaW5nKS5zcGxpdCgnXFwwJyk7XHJcblx0XHRcdH0gXHRcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbb3V0XSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0dmFyIHJlYWRVSTMyPWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdFx0dmFyIGJ1ZmZlcj1uZXcgQnVmZmVyKDQpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmZmVyLDAsNCxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRyZWFkTG9nKFwidWkzMlwiLGxlbik7XHJcblx0XHRcdGlmIChodG1sNWZzKXtcclxuXHRcdFx0XHQvL3Y9KG5ldyBVaW50MzJBcnJheShidWZmZXIpKVswXTtcclxuXHRcdFx0XHR2YXIgdj1uZXcgRGF0YVZpZXcoYnVmZmVyKS5nZXRVaW50MzIoMCwgZmFsc2UpXHJcblx0XHRcdFx0Y2Iodik7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBjYi5hcHBseSh0aGF0LFtidWZmZXIucmVhZEludDMyQkUoMCldKTtcdFxyXG5cdFx0fSk7XHRcdFxyXG5cdH1cclxuXHJcblx0dmFyIHJlYWRJMzI9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0XHR2YXIgYnVmZmVyPW5ldyBCdWZmZXIoNCk7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0ZnMucmVhZCh0aGlzLmhhbmRsZSxidWZmZXIsMCw0LHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJpMzJcIixsZW4pO1xyXG5cdFx0XHRpZiAoaHRtbDVmcyl7XHJcblx0XHRcdFx0dmFyIHY9bmV3IERhdGFWaWV3KGJ1ZmZlcikuZ2V0SW50MzIoMCwgZmFsc2UpXHJcblx0XHRcdFx0Y2Iodik7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSAgXHRjYi5hcHBseSh0aGF0LFtidWZmZXIucmVhZEludDMyQkUoMCldKTtcdFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cdHZhciByZWFkVUk4PWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdFx0dmFyIGJ1ZmZlcj1uZXcgQnVmZmVyKDEpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZmZlciwwLDEscG9zLGZ1bmN0aW9uKGVycixsZW4sYnVmZmVyKXtcclxuXHRcdFx0cmVhZExvZyhcInVpOFwiLGxlbik7XHJcblx0XHRcdGlmIChodG1sNWZzKWNiKCAobmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSlbMF0pIDtcclxuXHRcdFx0ZWxzZSAgXHRcdFx0Y2IuYXBwbHkodGhhdCxbYnVmZmVyLnJlYWRVSW50OCgwKV0pO1x0XHJcblx0XHRcdFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cdHZhciByZWFkQnVmPWZ1bmN0aW9uKHBvcyxibG9ja3NpemUsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR2YXIgYnVmPW5ldyBCdWZmZXIoYmxvY2tzaXplKTtcclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmLDAsYmxvY2tzaXplLHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJidWZcIixsZW4pO1xyXG5cdFx0XHR2YXIgYnVmZj1uZXcgVWludDhBcnJheShidWZmZXIpXHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW2J1ZmZdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHR2YXIgcmVhZEJ1Zl9wYWNrZWRpbnQ9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjb3VudCxyZXNldCxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHJlYWRCdWYuYXBwbHkodGhpcyxbcG9zLGJsb2Nrc2l6ZSxmdW5jdGlvbihidWZmZXIpe1xyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFt1bnBhY2tfaW50KGJ1ZmZlcixjb3VudCxyZXNldCldKTtcdFxyXG5cdFx0fV0pO1xyXG5cdFx0XHJcblx0fVxyXG5cdHZhciByZWFkRml4ZWRBcnJheV9odG1sNWZzPWZ1bmN0aW9uKHBvcyxjb3VudCx1bml0c2l6ZSxjYikge1xyXG5cdFx0dmFyIGZ1bmM9bnVsbDtcclxuXHRcdGlmICh1bml0c2l6ZT09PTEpIHtcclxuXHRcdFx0ZnVuYz0nZ2V0VWludDgnOy8vVWludDhBcnJheTtcclxuXHRcdH0gZWxzZSBpZiAodW5pdHNpemU9PT0yKSB7XHJcblx0XHRcdGZ1bmM9J2dldFVpbnQxNic7Ly9VaW50MTZBcnJheTtcclxuXHRcdH0gZWxzZSBpZiAodW5pdHNpemU9PT00KSB7XHJcblx0XHRcdGZ1bmM9J2dldFVpbnQzMic7Ly9VaW50MzJBcnJheTtcclxuXHRcdH0gZWxzZSB0aHJvdyAndW5zdXBwb3J0ZWQgaW50ZWdlciBzaXplJztcclxuXHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLG51bGwsMCx1bml0c2l6ZSpjb3VudCxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRyZWFkTG9nKFwiZml4IGFycmF5XCIsbGVuKTtcclxuXHRcdFx0dmFyIG91dD1bXTtcclxuXHRcdFx0aWYgKHVuaXRzaXplPT0xKSB7XHJcblx0XHRcdFx0b3V0PW5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW4gLyB1bml0c2l6ZTsgaSsrKSB7IC8vZW5kaWFuIHByb2JsZW1cclxuXHRcdFx0XHQvL1x0b3V0LnB1c2goIGZ1bmMoYnVmZmVyLGkqdW5pdHNpemUpKTtcclxuXHRcdFx0XHRcdG91dC5wdXNoKCB2PW5ldyBEYXRhVmlldyhidWZmZXIpW2Z1bmNdKGksZmFsc2UpICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvdXRdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHQvLyBzaWduYXR1cmUsIGl0ZW1jb3VudCwgcGF5bG9hZFxyXG5cdHZhciByZWFkRml4ZWRBcnJheSA9IGZ1bmN0aW9uKHBvcyAsY291bnQsIHVuaXRzaXplLGNiKSB7XHJcblx0XHR2YXIgZnVuYz1udWxsO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdFxyXG5cdFx0aWYgKHVuaXRzaXplKiBjb3VudD50aGlzLnNpemUgJiYgdGhpcy5zaXplKSAge1xyXG5cdFx0XHRjb25zb2xlLmxvZyhcImFycmF5IHNpemUgZXhjZWVkIGZpbGUgc2l6ZVwiLHRoaXMuc2l6ZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZiAoaHRtbDVmcykgcmV0dXJuIHJlYWRGaXhlZEFycmF5X2h0bWw1ZnMuYXBwbHkodGhpcyxbcG9zLGNvdW50LHVuaXRzaXplLGNiXSk7XHJcblxyXG5cdFx0dmFyIGl0ZW1zPW5ldyBCdWZmZXIoIHVuaXRzaXplKiBjb3VudCk7XHJcblx0XHRpZiAodW5pdHNpemU9PT0xKSB7XHJcblx0XHRcdGZ1bmM9aXRlbXMucmVhZFVJbnQ4O1xyXG5cdFx0fSBlbHNlIGlmICh1bml0c2l6ZT09PTIpIHtcclxuXHRcdFx0ZnVuYz1pdGVtcy5yZWFkVUludDE2QkU7XHJcblx0XHR9IGVsc2UgaWYgKHVuaXRzaXplPT09NCkge1xyXG5cdFx0XHRmdW5jPWl0ZW1zLnJlYWRVSW50MzJCRTtcclxuXHRcdH0gZWxzZSB0aHJvdyAndW5zdXBwb3J0ZWQgaW50ZWdlciBzaXplJztcclxuXHRcdC8vY29uc29sZS5sb2coJ2l0ZW1jb3VudCcsaXRlbWNvdW50LCdidWZmZXInLGJ1ZmZlcik7XHJcblxyXG5cdFx0ZnMucmVhZCh0aGlzLmhhbmRsZSxpdGVtcywwLHVuaXRzaXplKmNvdW50LHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJmaXggYXJyYXlcIixsZW4pO1xyXG5cdFx0XHR2YXIgb3V0PVtdO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aCAvIHVuaXRzaXplOyBpKyspIHtcclxuXHRcdFx0XHRvdXQucHVzaCggZnVuYy5hcHBseShpdGVtcyxbaSp1bml0c2l6ZV0pKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvdXRdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0dmFyIGZyZWU9ZnVuY3Rpb24oKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdjbG9zaW5nICcsaGFuZGxlKTtcclxuXHRcdGZzLmNsb3NlU3luYyh0aGlzLmhhbmRsZSk7XHJcblx0fVxyXG5cdHZhciBzZXR1cGFwaT1mdW5jdGlvbigpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR0aGlzLnJlYWRTaWduYXR1cmU9cmVhZFNpZ25hdHVyZTtcclxuXHRcdHRoaXMucmVhZEkzMj1yZWFkSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUkzMj1yZWFkVUkzMjtcclxuXHRcdHRoaXMucmVhZFVJOD1yZWFkVUk4O1xyXG5cdFx0dGhpcy5yZWFkQnVmPXJlYWRCdWY7XHJcblx0XHR0aGlzLnJlYWRCdWZfcGFja2VkaW50PXJlYWRCdWZfcGFja2VkaW50O1xyXG5cdFx0dGhpcy5yZWFkRml4ZWRBcnJheT1yZWFkRml4ZWRBcnJheTtcclxuXHRcdHRoaXMucmVhZFN0cmluZz1yZWFkU3RyaW5nO1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nQXJyYXk9cmVhZFN0cmluZ0FycmF5O1xyXG5cdFx0dGhpcy5zaWduYXR1cmVfc2l6ZT1zaWduYXR1cmVfc2l6ZTtcclxuXHRcdHRoaXMuZnJlZT1mcmVlO1xyXG5cdFx0aWYgKGh0bWw1ZnMpIHtcclxuXHRcdFx0dmFyIGZuPXBhdGg7XHJcblx0XHRcdGlmIChwYXRoLmluZGV4T2YoXCJmaWxlc3lzdGVtOlwiKT09MCkgZm49cGF0aC5zdWJzdHIocGF0aC5sYXN0SW5kZXhPZihcIi9cIikpO1xyXG5cdFx0XHRmcy5mcy5yb290LmdldEZpbGUoZm4se30sZnVuY3Rpb24oZW50cnkpe1xyXG5cdFx0XHQgIGVudHJ5LmdldE1ldGFkYXRhKGZ1bmN0aW9uKG1ldGFkYXRhKSB7IFxyXG5cdFx0XHRcdHRoYXQuc2l6ZT1tZXRhZGF0YS5zaXplO1xyXG5cdFx0XHRcdGlmIChjYikgc2V0VGltZW91dChjYi5iaW5kKHRoYXQpLDApO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHZhciBzdGF0PWZzLmZzdGF0U3luYyh0aGlzLmhhbmRsZSk7XHJcblx0XHRcdHRoaXMuc3RhdD1zdGF0O1xyXG5cdFx0XHR0aGlzLnNpemU9c3RhdC5zaXplO1x0XHRcclxuXHRcdFx0aWYgKGNiKVx0c2V0VGltZW91dChjYi5iaW5kKHRoaXMsMCksMCk7XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciB0aGF0PXRoaXM7XHJcblx0aWYgKGh0bWw1ZnMpIHtcclxuXHRcdGZzLm9wZW4ocGF0aCxmdW5jdGlvbihoKXtcclxuXHRcdFx0aWYgKCFoKSB7XHJcblx0XHRcdFx0aWYgKGNiKVx0c2V0VGltZW91dChjYi5iaW5kKG51bGwsXCJmaWxlIG5vdCBmb3VuZDpcIitwYXRoKSwwKTtcdFxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoYXQuaGFuZGxlPWg7XHJcblx0XHRcdFx0dGhhdC5odG1sNWZzPXRydWU7XHJcblx0XHRcdFx0c2V0dXBhcGkuY2FsbCh0aGF0KTtcclxuXHRcdFx0XHR0aGF0Lm9wZW5lZD10cnVlO1x0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0fSBlbHNlIHtcclxuXHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGgpKXtcclxuXHRcdFx0dGhpcy5oYW5kbGU9ZnMub3BlblN5bmMocGF0aCwncicpOy8vLGZ1bmN0aW9uKGVycixoYW5kbGUpe1xyXG5cdFx0XHR0aGlzLm9wZW5lZD10cnVlO1xyXG5cdFx0XHRzZXR1cGFwaS5jYWxsKHRoaXMpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKGNiKVx0c2V0VGltZW91dChjYi5iaW5kKG51bGwsXCJmaWxlIG5vdCBmb3VuZDpcIitwYXRoKSwwKTtcdFxyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9T3BlbjsiLCIvKlxyXG4gIEpBVkEgY2FuIG9ubHkgcmV0dXJuIE51bWJlciBhbmQgU3RyaW5nXHJcblx0YXJyYXkgYW5kIGJ1ZmZlciByZXR1cm4gaW4gc3RyaW5nIGZvcm1hdFxyXG5cdG5lZWQgSlNPTi5wYXJzZVxyXG4qL1xyXG52YXIgdmVyYm9zZT0wO1xyXG5cclxudmFyIHJlYWRTaWduYXR1cmU9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIHNpZ25hdHVyZVwiKTtcclxuXHR2YXIgc2lnbmF0dXJlPWtmcy5yZWFkVVRGOFN0cmluZyh0aGlzLmhhbmRsZSxwb3MsMSk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoc2lnbmF0dXJlLHNpZ25hdHVyZS5jaGFyQ29kZUF0KDApKTtcclxuXHRjYi5hcHBseSh0aGlzLFtzaWduYXR1cmVdKTtcclxufVxyXG52YXIgcmVhZEkzMj1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgaTMyIGF0IFwiK3Bvcyk7XHJcblx0dmFyIGkzMj1rZnMucmVhZEludDMyKHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoaTMyKTtcclxuXHRjYi5hcHBseSh0aGlzLFtpMzJdKTtcdFxyXG59XHJcbnZhciByZWFkVUkzMj1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgdWkzMiBhdCBcIitwb3MpO1xyXG5cdHZhciB1aTMyPWtmcy5yZWFkVUludDMyKHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcodWkzMik7XHJcblx0Y2IuYXBwbHkodGhpcyxbdWkzMl0pO1xyXG59XHJcbnZhciByZWFkVUk4PWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZCB1aTggYXQgXCIrcG9zKTsgXHJcblx0dmFyIHVpOD1rZnMucmVhZFVJbnQ4KHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcodWk4KTtcclxuXHRjYi5hcHBseSh0aGlzLFt1aThdKTtcclxufVxyXG52YXIgcmVhZEJ1Zj1mdW5jdGlvbihwb3MsYmxvY2tzaXplLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIGJ1ZmZlciBhdCBcIitwb3MrIFwiIGJsb2Nrc2l6ZSBcIitibG9ja3NpemUpO1xyXG5cdHZhciBidWY9a2ZzLnJlYWRCdWYodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSk7XHJcblx0dmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYpO1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwiYnVmZmVyIGxlbmd0aFwiK2J1ZmYubGVuZ3RoKTtcclxuXHRjYi5hcHBseSh0aGlzLFtidWZmXSk7XHRcclxufVxyXG52YXIgcmVhZEJ1Zl9wYWNrZWRpbnQ9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjb3VudCxyZXNldCxjYikge1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZCBwYWNrZWQgaW50IGF0IFwiK3BvcytcIiBibG9ja3NpemUgXCIrYmxvY2tzaXplK1wiIGNvdW50IFwiK2NvdW50KTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkQnVmX3BhY2tlZGludCh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplLGNvdW50LHJlc2V0KTtcclxuXHR2YXIgYWR2PXBhcnNlSW50KGJ1Zik7XHJcblx0dmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYuc3Vic3RyKGJ1Zi5pbmRleE9mKFwiW1wiKSkpO1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicGFja2VkSW50IGxlbmd0aCBcIitidWZmLmxlbmd0aCtcIiBmaXJzdCBpdGVtPVwiK2J1ZmZbMF0pO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3tkYXRhOmJ1ZmYsYWR2OmFkdn1dKTtcdFxyXG59XHJcblxyXG5cclxudmFyIHJlYWRTdHJpbmc9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWRzdHJpbmcgYXQgXCIrcG9zK1wiIGJsb2Nrc2l6ZSBcIiArYmxvY2tzaXplK1wiIGVuYzpcIitlbmNvZGluZyk7XHJcblx0aWYgKGVuY29kaW5nPT1cInVjczJcIikge1xyXG5cdFx0dmFyIHN0cj1rZnMucmVhZFVMRTE2U3RyaW5nKHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHR2YXIgc3RyPWtmcy5yZWFkVVRGOFN0cmluZyh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplKTtcdFxyXG5cdH1cdCBcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhzdHIpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3N0cl0pO1x0XHJcbn1cclxuXHJcbnZhciByZWFkRml4ZWRBcnJheSA9IGZ1bmN0aW9uKHBvcyAsY291bnQsIHVuaXRzaXplLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIGZpeGVkIGFycmF5IGF0IFwiK3BvcytcIiBjb3VudCBcIitjb3VudCtcIiB1bml0c2l6ZSBcIit1bml0c2l6ZSk7IFxyXG5cdHZhciBidWY9a2ZzLnJlYWRGaXhlZEFycmF5KHRoaXMuaGFuZGxlLHBvcyxjb3VudCx1bml0c2l6ZSk7XHJcblx0dmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYpO1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwiYXJyYXkgbGVuZ3RoXCIrYnVmZi5sZW5ndGgpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW2J1ZmZdKTtcdFxyXG59XHJcbnZhciByZWFkU3RyaW5nQXJyYXkgPSBmdW5jdGlvbihwb3MsYmxvY2tzaXplLGVuY29kaW5nLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUubG9nKFwicmVhZCBTdHJpbmcgYXJyYXkgYXQgXCIrcG9zK1wiIGJsb2Nrc2l6ZSBcIitibG9ja3NpemUgK1wiIGVuYyBcIitlbmNvZGluZyk7IFxyXG5cdGVuY29kaW5nID0gZW5jb2Rpbmd8fFwidXRmOFwiO1xyXG5cdHZhciBidWY9a2ZzLnJlYWRTdHJpbmdBcnJheSh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplLGVuY29kaW5nKTtcclxuXHQvL3ZhciBidWZmPUpTT04ucGFyc2UoYnVmKTtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgc3RyaW5nIGFycmF5XCIpO1xyXG5cdHZhciBidWZmPWJ1Zi5zcGxpdChcIlxcdWZmZmZcIik7IC8vY2Fubm90IHJldHVybiBzdHJpbmcgd2l0aCAwXHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJhcnJheSBsZW5ndGhcIitidWZmLmxlbmd0aCk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmZl0pO1x0XHJcbn1cclxudmFyIG1lcmdlUG9zdGluZ3M9ZnVuY3Rpb24ocG9zaXRpb25zLGNiKSB7XHJcblx0dmFyIGJ1Zj1rZnMubWVyZ2VQb3N0aW5ncyh0aGlzLmhhbmRsZSxKU09OLnN0cmluZ2lmeShwb3NpdGlvbnMpKTtcclxuXHRpZiAoIWJ1ZiB8fCBidWYubGVuZ3RoPT0wKSByZXR1cm4gW107XHJcblx0ZWxzZSByZXR1cm4gSlNPTi5wYXJzZShidWYpO1xyXG59XHJcblxyXG52YXIgZnJlZT1mdW5jdGlvbigpIHtcclxuXHQvL2NvbnNvbGUubG9nKCdjbG9zaW5nICcsaGFuZGxlKTtcclxuXHRrZnMuY2xvc2UodGhpcy5oYW5kbGUpO1xyXG59XHJcbnZhciBPcGVuPWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblx0dmFyIHNpZ25hdHVyZV9zaXplPTE7XHJcblx0dmFyIHNldHVwYXBpPWZ1bmN0aW9uKCkgeyBcclxuXHRcdHRoaXMucmVhZFNpZ25hdHVyZT1yZWFkU2lnbmF0dXJlO1xyXG5cdFx0dGhpcy5yZWFkSTMyPXJlYWRJMzI7XHJcblx0XHR0aGlzLnJlYWRVSTMyPXJlYWRVSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUk4PXJlYWRVSTg7XHJcblx0XHR0aGlzLnJlYWRCdWY9cmVhZEJ1ZjtcclxuXHRcdHRoaXMucmVhZEJ1Zl9wYWNrZWRpbnQ9cmVhZEJ1Zl9wYWNrZWRpbnQ7XHJcblx0XHR0aGlzLnJlYWRGaXhlZEFycmF5PXJlYWRGaXhlZEFycmF5O1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nPXJlYWRTdHJpbmc7XHJcblx0XHR0aGlzLnJlYWRTdHJpbmdBcnJheT1yZWFkU3RyaW5nQXJyYXk7XHJcblx0XHR0aGlzLnNpZ25hdHVyZV9zaXplPXNpZ25hdHVyZV9zaXplO1xyXG5cdFx0dGhpcy5tZXJnZVBvc3RpbmdzPW1lcmdlUG9zdGluZ3M7XHJcblx0XHR0aGlzLmZyZWU9ZnJlZTtcclxuXHRcdHRoaXMuc2l6ZT1rZnMuZ2V0RmlsZVNpemUodGhpcy5oYW5kbGUpO1xyXG5cdFx0aWYgKHZlcmJvc2UpIGNvbnNvbGUubG9nKFwiZmlsZXNpemUgIFwiK3RoaXMuc2l6ZSk7XHJcblx0XHRpZiAoY2IpXHRjYi5jYWxsKHRoaXMpO1xyXG5cdH1cclxuXHJcblx0dGhpcy5oYW5kbGU9a2ZzLm9wZW4ocGF0aCk7XHJcblx0dGhpcy5vcGVuZWQ9dHJ1ZTtcclxuXHRzZXR1cGFwaS5jYWxsKHRoaXMpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1PcGVuOyIsIi8qXHJcbiAgSlNDb250ZXh0IGNhbiByZXR1cm4gYWxsIEphdmFzY3JpcHQgdHlwZXMuXHJcbiovXHJcbnZhciB2ZXJib3NlPTE7XHJcblxyXG52YXIgcmVhZFNpZ25hdHVyZT1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgc2lnbmF0dXJlIGF0IFwiK3Bvcyk7XHJcblx0dmFyIHNpZ25hdHVyZT1rZnMucmVhZFVURjhTdHJpbmcodGhpcy5oYW5kbGUscG9zLDEpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHNpZ25hdHVyZStcIiBcIitzaWduYXR1cmUuY2hhckNvZGVBdCgwKSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbc2lnbmF0dXJlXSk7XHJcbn1cclxudmFyIHJlYWRJMzI9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIGkzMiBhdCBcIitwb3MpO1xyXG5cdHZhciBpMzI9a2ZzLnJlYWRJbnQzMih0aGlzLmhhbmRsZSxwb3MpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKGkzMik7XHJcblx0Y2IuYXBwbHkodGhpcyxbaTMyXSk7XHRcclxufVxyXG52YXIgcmVhZFVJMzI9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIHVpMzIgYXQgXCIrcG9zKTtcclxuXHR2YXIgdWkzMj1rZnMucmVhZFVJbnQzMih0aGlzLmhhbmRsZSxwb3MpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHVpMzIpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3VpMzJdKTtcclxufVxyXG52YXIgcmVhZFVJOD1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgdWk4IGF0IFwiK3Bvcyk7IFxyXG5cdHZhciB1aTg9a2ZzLnJlYWRVSW50OCh0aGlzLmhhbmRsZSxwb3MpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHVpOCk7XHJcblx0Y2IuYXBwbHkodGhpcyxbdWk4XSk7XHJcbn1cclxudmFyIHJlYWRCdWY9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjYikge1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmVhZCBidWZmZXIgYXQgXCIrcG9zKTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkQnVmKHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwiYnVmZmVyIGxlbmd0aFwiK2J1Zi5sZW5ndGgpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW2J1Zl0pO1x0XHJcbn1cclxudmFyIHJlYWRCdWZfcGFja2VkaW50PWZ1bmN0aW9uKHBvcyxibG9ja3NpemUsY291bnQscmVzZXQsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgcGFja2VkIGludCBmYXN0LCBibG9ja3NpemUgXCIrYmxvY2tzaXplK1wiIGF0IFwiK3Bvcyk7dmFyIHQ9bmV3IERhdGUoKTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkQnVmX3BhY2tlZGludCh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplLGNvdW50LHJlc2V0KTtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJldHVybiBmcm9tIHBhY2tlZGludCwgdGltZVwiICsgKG5ldyBEYXRlKCktdCkpO1xyXG5cdGlmICh0eXBlb2YgYnVmLmRhdGE9PVwic3RyaW5nXCIpIHtcclxuXHRcdGJ1Zi5kYXRhPWV2YWwoXCJbXCIrYnVmLmRhdGEuc3Vic3RyKDAsYnVmLmRhdGEubGVuZ3RoLTEpK1wiXVwiKTtcclxuXHR9XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJ1bnBhY2tlZCBsZW5ndGhcIitidWYuZGF0YS5sZW5ndGgrXCIgdGltZVwiICsgKG5ldyBEYXRlKCktdCkgKTtcclxuXHRjYi5hcHBseSh0aGlzLFtidWZdKTtcclxufVxyXG5cclxuXHJcbnZhciByZWFkU3RyaW5nPSBmdW5jdGlvbihwb3MsYmxvY2tzaXplLGVuY29kaW5nLGNiKSB7XHJcblxyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmVhZHN0cmluZyBhdCBcIitwb3MrXCIgYmxvY2tzaXplIFwiK2Jsb2Nrc2l6ZStcIiBcIitlbmNvZGluZyk7dmFyIHQ9bmV3IERhdGUoKTtcclxuXHRpZiAoZW5jb2Rpbmc9PVwidWNzMlwiKSB7XHJcblx0XHR2YXIgc3RyPWtmcy5yZWFkVUxFMTZTdHJpbmcodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHZhciBzdHI9a2ZzLnJlYWRVVEY4U3RyaW5nKHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUpO1x0XHJcblx0fVxyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHN0citcIiB0aW1lXCIrKG5ldyBEYXRlKCktdCkpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3N0cl0pO1x0XHJcbn1cclxuXHJcbnZhciByZWFkRml4ZWRBcnJheSA9IGZ1bmN0aW9uKHBvcyAsY291bnQsIHVuaXRzaXplLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIGZpeGVkIGFycmF5IGF0IFwiK3Bvcyk7IHZhciB0PW5ldyBEYXRlKCk7XHJcblx0dmFyIGJ1Zj1rZnMucmVhZEZpeGVkQXJyYXkodGhpcy5oYW5kbGUscG9zLGNvdW50LHVuaXRzaXplKTtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcImFycmF5IGxlbmd0aCBcIitidWYubGVuZ3RoK1wiIHRpbWVcIisobmV3IERhdGUoKS10KSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmXSk7XHRcclxufVxyXG52YXIgcmVhZFN0cmluZ0FycmF5ID0gZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxlbmNvZGluZyxjYikge1xyXG5cdC8vaWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIFN0cmluZyBhcnJheSBcIitibG9ja3NpemUgK1wiIFwiK2VuY29kaW5nKTsgXHJcblx0ZW5jb2RpbmcgPSBlbmNvZGluZ3x8XCJ1dGY4XCI7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIHN0cmluZyBhcnJheSBhdCBcIitwb3MpO3ZhciB0PW5ldyBEYXRlKCk7XHJcblx0dmFyIGJ1Zj1rZnMucmVhZFN0cmluZ0FycmF5KHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUsZW5jb2RpbmcpO1xyXG5cdGlmICh0eXBlb2YgYnVmPT1cInN0cmluZ1wiKSBidWY9YnVmLnNwbGl0KFwiXFwwXCIpO1xyXG5cdC8vdmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYpO1xyXG5cdC8vdmFyIGJ1ZmY9YnVmLnNwbGl0KFwiXFx1ZmZmZlwiKTsgLy9jYW5ub3QgcmV0dXJuIHN0cmluZyB3aXRoIDBcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInN0cmluZyBhcnJheSBsZW5ndGhcIitidWYubGVuZ3RoK1wiIHRpbWVcIisobmV3IERhdGUoKS10KSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmXSk7XHJcbn1cclxuXHJcbnZhciBtZXJnZVBvc3RpbmdzPWZ1bmN0aW9uKHBvc2l0aW9ucykge1xyXG5cdHZhciBidWY9a2ZzLm1lcmdlUG9zdGluZ3ModGhpcy5oYW5kbGUscG9zaXRpb25zKTtcclxuXHRpZiAodHlwZW9mIGJ1Zj09XCJzdHJpbmdcIikge1xyXG5cdFx0YnVmPWV2YWwoXCJbXCIrYnVmLnN1YnN0cigwLGJ1Zi5sZW5ndGgtMSkrXCJdXCIpO1xyXG5cdH1cclxuXHRyZXR1cm4gYnVmO1xyXG59XHJcbnZhciBmcmVlPWZ1bmN0aW9uKCkge1xyXG5cdC8vLy9pZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZygnY2xvc2luZyAnLGhhbmRsZSk7XHJcblx0a2ZzLmNsb3NlKHRoaXMuaGFuZGxlKTtcclxufVxyXG52YXIgT3Blbj1mdW5jdGlvbihwYXRoLG9wdHMsY2IpIHtcclxuXHRvcHRzPW9wdHN8fHt9O1xyXG5cdHZhciBzaWduYXR1cmVfc2l6ZT0xO1xyXG5cdHZhciBzZXR1cGFwaT1mdW5jdGlvbigpIHsgXHJcblx0XHR0aGlzLnJlYWRTaWduYXR1cmU9cmVhZFNpZ25hdHVyZTtcclxuXHRcdHRoaXMucmVhZEkzMj1yZWFkSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUkzMj1yZWFkVUkzMjtcclxuXHRcdHRoaXMucmVhZFVJOD1yZWFkVUk4O1xyXG5cdFx0dGhpcy5yZWFkQnVmPXJlYWRCdWY7XHJcblx0XHR0aGlzLnJlYWRCdWZfcGFja2VkaW50PXJlYWRCdWZfcGFja2VkaW50O1xyXG5cdFx0dGhpcy5yZWFkRml4ZWRBcnJheT1yZWFkRml4ZWRBcnJheTtcclxuXHRcdHRoaXMucmVhZFN0cmluZz1yZWFkU3RyaW5nO1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nQXJyYXk9cmVhZFN0cmluZ0FycmF5O1xyXG5cdFx0dGhpcy5zaWduYXR1cmVfc2l6ZT1zaWduYXR1cmVfc2l6ZTtcclxuXHRcdHRoaXMubWVyZ2VQb3N0aW5ncz1tZXJnZVBvc3RpbmdzO1xyXG5cdFx0dGhpcy5mcmVlPWZyZWU7XHJcblx0XHR0aGlzLnNpemU9a2ZzLmdldEZpbGVTaXplKHRoaXMuaGFuZGxlKTtcclxuXHRcdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwiZmlsZXNpemUgIFwiK3RoaXMuc2l6ZSk7XHJcblx0XHRpZiAoY2IpXHRjYi5jYWxsKHRoaXMpO1xyXG5cdH1cclxuXHJcblx0dGhpcy5oYW5kbGU9a2ZzLm9wZW4ocGF0aCk7XHJcblx0dGhpcy5vcGVuZWQ9dHJ1ZTtcclxuXHRzZXR1cGFwaS5jYWxsKHRoaXMpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1PcGVuOyIsIi8qXHJcbiAgY29udmVydCBhbnkganNvbiBpbnRvIGEgYmluYXJ5IGJ1ZmZlclxyXG4gIHRoZSBidWZmZXIgY2FuIGJlIHNhdmVkIHdpdGggYSBzaW5nbGUgbGluZSBvZiBmcy53cml0ZUZpbGVcclxuKi9cclxuXHJcbnZhciBEVD17XHJcblx0dWludDg6JzEnLCAvL3Vuc2lnbmVkIDEgYnl0ZSBpbnRlZ2VyXHJcblx0aW50MzI6JzQnLCAvLyBzaWduZWQgNCBieXRlcyBpbnRlZ2VyXHJcblx0dXRmODonOCcsICBcclxuXHR1Y3MyOicyJyxcclxuXHRib29sOideJywgXHJcblx0YmxvYjonJicsXHJcblx0dXRmOGFycjonKicsIC8vc2hpZnQgb2YgOFxyXG5cdHVjczJhcnI6J0AnLCAvL3NoaWZ0IG9mIDJcclxuXHR1aW50OGFycjonIScsIC8vc2hpZnQgb2YgMVxyXG5cdGludDMyYXJyOickJywgLy9zaGlmdCBvZiA0XHJcblx0dmludDonYCcsXHJcblx0cGludDonficsXHRcclxuXHJcblx0YXJyYXk6J1xcdTAwMWInLFxyXG5cdG9iamVjdDonXFx1MDAxYScgXHJcblx0Ly95ZGIgc3RhcnQgd2l0aCBvYmplY3Qgc2lnbmF0dXJlLFxyXG5cdC8vdHlwZSBhIHlkYiBpbiBjb21tYW5kIHByb21wdCBzaG93cyBub3RoaW5nXHJcbn1cclxudmFyIGtleV93cml0aW5nPVwiXCI7Ly9mb3IgZGVidWdnaW5nXHJcbnZhciBwYWNrX2ludCA9IGZ1bmN0aW9uIChhciwgc2F2ZWRlbHRhKSB7IC8vIHBhY2sgYXIgaW50b1xyXG4gIGlmICghYXIgfHwgYXIubGVuZ3RoID09PSAwKSByZXR1cm4gW107IC8vIGVtcHR5IGFycmF5XHJcbiAgdmFyIHIgPSBbXSxcclxuICBpID0gMCxcclxuICBqID0gMCxcclxuICBkZWx0YSA9IDAsXHJcbiAgcHJldiA9IDA7XHJcbiAgXHJcbiAgZG8ge1xyXG5cdGRlbHRhID0gYXJbaV07XHJcblx0aWYgKHNhdmVkZWx0YSkge1xyXG5cdFx0ZGVsdGEgLT0gcHJldjtcclxuXHR9XHJcblx0aWYgKGRlbHRhIDwgMCkge1xyXG5cdCAgY29uc29sZS50cmFjZSgnbmVnYXRpdmUnLHByZXYsYXJbaV0pXHJcblx0ICB0aHJvdyAnbmVnZXRpdmUnO1xyXG5cdCAgYnJlYWs7XHJcblx0fVxyXG5cdFxyXG5cdHJbaisrXSA9IGRlbHRhICYgMHg3ZjtcclxuXHRkZWx0YSA+Pj0gNztcclxuXHR3aGlsZSAoZGVsdGEgPiAwKSB7XHJcblx0ICByW2orK10gPSAoZGVsdGEgJiAweDdmKSB8IDB4ODA7XHJcblx0ICBkZWx0YSA+Pj0gNztcclxuXHR9XHJcblx0cHJldiA9IGFyW2ldO1xyXG5cdGkrKztcclxuICB9IHdoaWxlIChpIDwgYXIubGVuZ3RoKTtcclxuICByZXR1cm4gcjtcclxufVxyXG52YXIgS2ZzPWZ1bmN0aW9uKHBhdGgsb3B0cykge1xyXG5cdFxyXG5cdHZhciBoYW5kbGU9bnVsbDtcclxuXHRvcHRzPW9wdHN8fHt9O1xyXG5cdG9wdHMuc2l6ZT1vcHRzLnNpemV8fDY1NTM2KjIwNDg7IFxyXG5cdGNvbnNvbGUubG9nKCdrZGIgZXN0aW1hdGUgc2l6ZTonLG9wdHMuc2l6ZSk7XHJcblx0dmFyIGRidWY9bmV3IEJ1ZmZlcihvcHRzLnNpemUpO1xyXG5cdHZhciBjdXI9MDsvL2RidWYgY3Vyc29yXHJcblx0XHJcblx0dmFyIHdyaXRlU2lnbmF0dXJlPWZ1bmN0aW9uKHZhbHVlLHBvcykge1xyXG5cdFx0ZGJ1Zi53cml0ZSh2YWx1ZSxwb3MsdmFsdWUubGVuZ3RoLCd1dGY4Jyk7XHJcblx0XHRpZiAocG9zK3ZhbHVlLmxlbmd0aD5jdXIpIGN1cj1wb3MrdmFsdWUubGVuZ3RoO1xyXG5cdFx0cmV0dXJuIHZhbHVlLmxlbmd0aDtcclxuXHR9XHJcblx0dmFyIHdyaXRlT2Zmc2V0PWZ1bmN0aW9uKHZhbHVlLHBvcykge1xyXG5cdFx0ZGJ1Zi53cml0ZVVJbnQ4KE1hdGguZmxvb3IodmFsdWUgLyAoNjU1MzYqNjU1MzYpKSxwb3MpO1xyXG5cdFx0ZGJ1Zi53cml0ZVVJbnQzMkJFKCB2YWx1ZSAmIDB4RkZGRkZGRkYscG9zKzEpO1xyXG5cdFx0aWYgKHBvcys1PmN1cikgY3VyPXBvcys1O1xyXG5cdFx0cmV0dXJuIDU7XHJcblx0fVxyXG5cdHZhciB3cml0ZVN0cmluZz0gZnVuY3Rpb24odmFsdWUscG9zLGVuY29kaW5nKSB7XHJcblx0XHRlbmNvZGluZz1lbmNvZGluZ3x8J3VjczInO1xyXG5cdFx0aWYgKHZhbHVlPT1cIlwiKSB0aHJvdyBcImNhbm5vdCB3cml0ZSBudWxsIHN0cmluZ1wiO1xyXG5cdFx0aWYgKGVuY29kaW5nPT09J3V0ZjgnKWRidWYud3JpdGUoRFQudXRmOCxwb3MsMSwndXRmOCcpO1xyXG5cdFx0ZWxzZSBpZiAoZW5jb2Rpbmc9PT0ndWNzMicpZGJ1Zi53cml0ZShEVC51Y3MyLHBvcywxLCd1dGY4Jyk7XHJcblx0XHRlbHNlIHRocm93ICd1bnN1cHBvcnRlZCBlbmNvZGluZyAnK2VuY29kaW5nO1xyXG5cdFx0XHRcclxuXHRcdHZhciBsZW49QnVmZmVyLmJ5dGVMZW5ndGgodmFsdWUsIGVuY29kaW5nKTtcclxuXHRcdGRidWYud3JpdGUodmFsdWUscG9zKzEsbGVuLGVuY29kaW5nKTtcclxuXHRcdFxyXG5cdFx0aWYgKHBvcytsZW4rMT5jdXIpIGN1cj1wb3MrbGVuKzE7XHJcblx0XHRyZXR1cm4gbGVuKzE7IC8vIHNpZ25hdHVyZVxyXG5cdH1cclxuXHR2YXIgd3JpdGVTdHJpbmdBcnJheSA9IGZ1bmN0aW9uKHZhbHVlLHBvcyxlbmNvZGluZykge1xyXG5cdFx0ZW5jb2Rpbmc9ZW5jb2Rpbmd8fCd1Y3MyJztcclxuXHRcdGlmIChlbmNvZGluZz09PSd1dGY4JykgZGJ1Zi53cml0ZShEVC51dGY4YXJyLHBvcywxLCd1dGY4Jyk7XHJcblx0XHRlbHNlIGlmIChlbmNvZGluZz09PSd1Y3MyJylkYnVmLndyaXRlKERULnVjczJhcnIscG9zLDEsJ3V0ZjgnKTtcclxuXHRcdGVsc2UgdGhyb3cgJ3Vuc3VwcG9ydGVkIGVuY29kaW5nICcrZW5jb2Rpbmc7XHJcblx0XHRcclxuXHRcdHZhciB2PXZhbHVlLmpvaW4oJ1xcMCcpO1xyXG5cdFx0dmFyIGxlbj1CdWZmZXIuYnl0ZUxlbmd0aCh2LCBlbmNvZGluZyk7XHJcblx0XHRpZiAoMD09PWxlbikge1xyXG5cdFx0XHR0aHJvdyBcImVtcHR5IHN0cmluZyBhcnJheSBcIiArIGtleV93cml0aW5nO1xyXG5cdFx0fVxyXG5cdFx0ZGJ1Zi53cml0ZSh2LHBvcysxLGxlbixlbmNvZGluZyk7XHJcblx0XHRpZiAocG9zK2xlbisxPmN1cikgY3VyPXBvcytsZW4rMTtcclxuXHRcdHJldHVybiBsZW4rMTtcclxuXHR9XHJcblx0dmFyIHdyaXRlSTMyPWZ1bmN0aW9uKHZhbHVlLHBvcykge1xyXG5cdFx0ZGJ1Zi53cml0ZShEVC5pbnQzMixwb3MsMSwndXRmOCcpO1xyXG5cdFx0ZGJ1Zi53cml0ZUludDMyQkUodmFsdWUscG9zKzEpO1xyXG5cdFx0aWYgKHBvcys1PmN1cikgY3VyPXBvcys1O1xyXG5cdFx0cmV0dXJuIDU7XHJcblx0fVxyXG5cdHZhciB3cml0ZVVJOD1mdW5jdGlvbih2YWx1ZSxwb3MpIHtcclxuXHRcdGRidWYud3JpdGUoRFQudWludDgscG9zLDEsJ3V0ZjgnKTtcclxuXHRcdGRidWYud3JpdGVVSW50OCh2YWx1ZSxwb3MrMSk7XHJcblx0XHRpZiAocG9zKzI+Y3VyKSBjdXI9cG9zKzI7XHJcblx0XHRyZXR1cm4gMjtcclxuXHR9XHJcblx0dmFyIHdyaXRlQm9vbD1mdW5jdGlvbih2YWx1ZSxwb3MpIHtcclxuXHRcdGRidWYud3JpdGUoRFQuYm9vbCxwb3MsMSwndXRmOCcpO1xyXG5cdFx0ZGJ1Zi53cml0ZVVJbnQ4KE51bWJlcih2YWx1ZSkscG9zKzEpO1xyXG5cdFx0aWYgKHBvcysyPmN1cikgY3VyPXBvcysyO1xyXG5cdFx0cmV0dXJuIDI7XHJcblx0fVx0XHRcclxuXHR2YXIgd3JpdGVCbG9iPWZ1bmN0aW9uKHZhbHVlLHBvcykge1xyXG5cdFx0ZGJ1Zi53cml0ZShEVC5ibG9iLHBvcywxLCd1dGY4Jyk7XHJcblx0XHR2YWx1ZS5jb3B5KGRidWYsIHBvcysxKTtcclxuXHRcdHZhciB3cml0dGVuPXZhbHVlLmxlbmd0aCsxO1xyXG5cdFx0aWYgKHBvcyt3cml0dGVuPmN1cikgY3VyPXBvcyt3cml0dGVuO1xyXG5cdFx0cmV0dXJuIHdyaXR0ZW47XHJcblx0fVx0XHRcclxuXHQvKiBubyBzaWduYXR1cmUgKi9cclxuXHR2YXIgd3JpdGVGaXhlZEFycmF5ID0gZnVuY3Rpb24odmFsdWUscG9zLHVuaXRzaXplKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCd2LmxlbicsdmFsdWUubGVuZ3RoLGl0ZW1zLmxlbmd0aCx1bml0c2l6ZSk7XHJcblx0XHRpZiAodW5pdHNpemU9PT0xKSB2YXIgZnVuYz1kYnVmLndyaXRlVUludDg7XHJcblx0XHRlbHNlIGlmICh1bml0c2l6ZT09PTQpdmFyIGZ1bmM9ZGJ1Zi53cml0ZUludDMyQkU7XHJcblx0XHRlbHNlIHRocm93ICd1bnN1cHBvcnRlZCBpbnRlZ2VyIHNpemUnO1xyXG5cdFx0aWYgKCF2YWx1ZS5sZW5ndGgpIHtcclxuXHRcdFx0dGhyb3cgXCJlbXB0eSBmaXhlZCBhcnJheSBcIitrZXlfd3JpdGluZztcclxuXHRcdH1cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoIDsgaSsrKSB7XHJcblx0XHRcdGZ1bmMuYXBwbHkoZGJ1ZixbdmFsdWVbaV0saSp1bml0c2l6ZStwb3NdKVxyXG5cdFx0fVxyXG5cdFx0dmFyIGxlbj11bml0c2l6ZSp2YWx1ZS5sZW5ndGg7XHJcblx0XHRpZiAocG9zK2xlbj5jdXIpIGN1cj1wb3MrbGVuO1xyXG5cdFx0cmV0dXJuIGxlbjtcclxuXHR9XHJcblxyXG5cdHRoaXMud3JpdGVJMzI9d3JpdGVJMzI7XHJcblx0dGhpcy53cml0ZUJvb2w9d3JpdGVCb29sO1xyXG5cdHRoaXMud3JpdGVCbG9iPXdyaXRlQmxvYjtcclxuXHR0aGlzLndyaXRlVUk4PXdyaXRlVUk4O1xyXG5cdHRoaXMud3JpdGVTdHJpbmc9d3JpdGVTdHJpbmc7XHJcblx0dGhpcy53cml0ZVNpZ25hdHVyZT13cml0ZVNpZ25hdHVyZTtcclxuXHR0aGlzLndyaXRlT2Zmc2V0PXdyaXRlT2Zmc2V0OyAvLzUgYnl0ZXMgb2Zmc2V0XHJcblx0dGhpcy53cml0ZVN0cmluZ0FycmF5PXdyaXRlU3RyaW5nQXJyYXk7XHJcblx0dGhpcy53cml0ZUZpeGVkQXJyYXk9d3JpdGVGaXhlZEFycmF5O1xyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImJ1ZlwiLCB7Z2V0IDogZnVuY3Rpb24oKXsgcmV0dXJuIGRidWY7IH19KTtcclxuXHRcclxuXHRyZXR1cm4gdGhpcztcclxufVxyXG5cclxudmFyIENyZWF0ZT1mdW5jdGlvbihwYXRoLG9wdHMpIHtcclxuXHRvcHRzPW9wdHN8fHt9O1xyXG5cdHZhciBrZnM9bmV3IEtmcyhwYXRoLG9wdHMpO1xyXG5cdHZhciBjdXI9MDtcclxuXHJcblx0dmFyIGhhbmRsZT17fTtcclxuXHRcclxuXHQvL25vIHNpZ25hdHVyZVxyXG5cdHZhciB3cml0ZVZJbnQgPWZ1bmN0aW9uKGFycikge1xyXG5cdFx0dmFyIG89cGFja19pbnQoYXJyLGZhbHNlKTtcclxuXHRcdGtmcy53cml0ZUZpeGVkQXJyYXkobyxjdXIsMSk7XHJcblx0XHRjdXIrPW8ubGVuZ3RoO1xyXG5cdH1cclxuXHR2YXIgd3JpdGVWSW50MT1mdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0d3JpdGVWSW50KFt2YWx1ZV0pO1xyXG5cdH1cclxuXHQvL2ZvciBwb3N0aW5nc1xyXG5cdHZhciB3cml0ZVBJbnQgPWZ1bmN0aW9uKGFycikge1xyXG5cdFx0dmFyIG89cGFja19pbnQoYXJyLHRydWUpO1xyXG5cdFx0a2ZzLndyaXRlRml4ZWRBcnJheShvLGN1ciwxKTtcclxuXHRcdGN1cis9by5sZW5ndGg7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBzYXZlVkludCA9IGZ1bmN0aW9uKGFycixrZXkpIHtcclxuXHRcdHZhciBzdGFydD1jdXI7XHJcblx0XHRrZXlfd3JpdGluZz1rZXk7XHJcblx0XHRjdXIrPWtmcy53cml0ZVNpZ25hdHVyZShEVC52aW50LGN1cik7XHJcblx0XHR3cml0ZVZJbnQoYXJyKTtcclxuXHRcdHZhciB3cml0dGVuID0gY3VyLXN0YXJ0O1xyXG5cdFx0cHVzaGl0ZW0oa2V5LHdyaXR0ZW4pO1xyXG5cdFx0cmV0dXJuIHdyaXR0ZW47XHRcdFxyXG5cdH1cclxuXHR2YXIgc2F2ZVBJbnQgPSBmdW5jdGlvbihhcnIsa2V5KSB7XHJcblx0XHR2YXIgc3RhcnQ9Y3VyO1xyXG5cdFx0a2V5X3dyaXRpbmc9a2V5O1xyXG5cdFx0Y3VyKz1rZnMud3JpdGVTaWduYXR1cmUoRFQucGludCxjdXIpO1xyXG5cdFx0d3JpdGVQSW50KGFycik7XHJcblx0XHR2YXIgd3JpdHRlbiA9IGN1ci1zdGFydDtcclxuXHRcdHB1c2hpdGVtKGtleSx3cml0dGVuKTtcclxuXHRcdHJldHVybiB3cml0dGVuO1x0XHJcblx0fVxyXG5cclxuXHRcclxuXHR2YXIgc2F2ZVVJOCA9IGZ1bmN0aW9uKHZhbHVlLGtleSkge1xyXG5cdFx0dmFyIHdyaXR0ZW49a2ZzLndyaXRlVUk4KHZhbHVlLGN1cik7XHJcblx0XHRjdXIrPXdyaXR0ZW47XHJcblx0XHRwdXNoaXRlbShrZXksd3JpdHRlbik7XHJcblx0XHRyZXR1cm4gd3JpdHRlbjtcclxuXHR9XHJcblx0dmFyIHNhdmVCb29sPWZ1bmN0aW9uKHZhbHVlLGtleSkge1xyXG5cdFx0dmFyIHdyaXR0ZW49a2ZzLndyaXRlQm9vbCh2YWx1ZSxjdXIpO1xyXG5cdFx0Y3VyKz13cml0dGVuO1xyXG5cdFx0cHVzaGl0ZW0oa2V5LHdyaXR0ZW4pO1xyXG5cdFx0cmV0dXJuIHdyaXR0ZW47XHJcblx0fVxyXG5cdHZhciBzYXZlSTMyID0gZnVuY3Rpb24odmFsdWUsa2V5KSB7XHJcblx0XHR2YXIgd3JpdHRlbj1rZnMud3JpdGVJMzIodmFsdWUsY3VyKTtcclxuXHRcdGN1cis9d3JpdHRlbjtcclxuXHRcdHB1c2hpdGVtKGtleSx3cml0dGVuKTtcclxuXHRcdHJldHVybiB3cml0dGVuO1xyXG5cdH1cdFxyXG5cdHZhciBzYXZlU3RyaW5nID0gZnVuY3Rpb24odmFsdWUsa2V5LGVuY29kaW5nKSB7XHJcblx0XHRlbmNvZGluZz1lbmNvZGluZ3x8c3RyaW5nZW5jb2Rpbmc7XHJcblx0XHRrZXlfd3JpdGluZz1rZXk7XHJcblx0XHR2YXIgd3JpdHRlbj1rZnMud3JpdGVTdHJpbmcodmFsdWUsY3VyLGVuY29kaW5nKTtcclxuXHRcdGN1cis9d3JpdHRlbjtcclxuXHRcdHB1c2hpdGVtKGtleSx3cml0dGVuKTtcclxuXHRcdHJldHVybiB3cml0dGVuO1xyXG5cdH1cclxuXHR2YXIgc2F2ZVN0cmluZ0FycmF5ID0gZnVuY3Rpb24oYXJyLGtleSxlbmNvZGluZykge1xyXG5cdFx0ZW5jb2Rpbmc9ZW5jb2Rpbmd8fHN0cmluZ2VuY29kaW5nO1xyXG5cdFx0a2V5X3dyaXRpbmc9a2V5O1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0dmFyIHdyaXR0ZW49a2ZzLndyaXRlU3RyaW5nQXJyYXkoYXJyLGN1cixlbmNvZGluZyk7XHJcblx0XHR9IGNhdGNoKGUpIHtcclxuXHRcdFx0dGhyb3cgZTtcclxuXHRcdH1cclxuXHRcdGN1cis9d3JpdHRlbjtcclxuXHRcdHB1c2hpdGVtKGtleSx3cml0dGVuKTtcclxuXHRcdHJldHVybiB3cml0dGVuO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgc2F2ZUJsb2IgPSBmdW5jdGlvbih2YWx1ZSxrZXkpIHtcclxuXHRcdGtleV93cml0aW5nPWtleTtcclxuXHRcdHZhciB3cml0dGVuPWtmcy53cml0ZUJsb2IodmFsdWUsY3VyKTtcclxuXHRcdGN1cis9d3JpdHRlbjtcclxuXHRcdHB1c2hpdGVtKGtleSx3cml0dGVuKTtcclxuXHRcdHJldHVybiB3cml0dGVuO1xyXG5cdH1cclxuXHJcblx0dmFyIGZvbGRlcnM9W107XHJcblx0dmFyIHB1c2hpdGVtPWZ1bmN0aW9uKGtleSx3cml0dGVuKSB7XHJcblx0XHR2YXIgZm9sZGVyPWZvbGRlcnNbZm9sZGVycy5sZW5ndGgtMV07XHRcclxuXHRcdGlmICghZm9sZGVyKSByZXR1cm4gO1xyXG5cdFx0Zm9sZGVyLml0ZW1zbGVuZ3RoLnB1c2god3JpdHRlbik7XHJcblx0XHRpZiAoa2V5KSB7XHJcblx0XHRcdGlmICghZm9sZGVyLmtleXMpIHRocm93ICdjYW5ub3QgaGF2ZSBrZXkgaW4gYXJyYXknO1xyXG5cdFx0XHRmb2xkZXIua2V5cy5wdXNoKGtleSk7XHJcblx0XHR9XHJcblx0fVx0XHJcblx0dmFyIG9wZW4gPSBmdW5jdGlvbihvcHQpIHtcclxuXHRcdHZhciBzdGFydD1jdXI7XHJcblx0XHR2YXIga2V5PW9wdC5rZXkgfHwgbnVsbDtcclxuXHRcdHZhciB0eXBlPW9wdC50eXBlfHxEVC5hcnJheTtcclxuXHRcdGN1cis9a2ZzLndyaXRlU2lnbmF0dXJlKHR5cGUsY3VyKTtcclxuXHRcdGN1cis9a2ZzLndyaXRlT2Zmc2V0KDB4MCxjdXIpOyAvLyBwcmUtYWxsb2Mgc3BhY2UgZm9yIG9mZnNldFxyXG5cdFx0dmFyIGZvbGRlcj17XHJcblx0XHRcdHR5cGU6dHlwZSwga2V5OmtleSxcclxuXHRcdFx0c3RhcnQ6c3RhcnQsZGF0YXN0YXJ0OmN1cixcclxuXHRcdFx0aXRlbXNsZW5ndGg6W10gfTtcclxuXHRcdGlmICh0eXBlPT09RFQub2JqZWN0KSBmb2xkZXIua2V5cz1bXTtcclxuXHRcdGZvbGRlcnMucHVzaChmb2xkZXIpO1xyXG5cdH1cclxuXHR2YXIgb3Blbk9iamVjdCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0b3Blbih7dHlwZTpEVC5vYmplY3Qsa2V5OmtleX0pO1xyXG5cdH1cclxuXHR2YXIgb3BlbkFycmF5ID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0XHRvcGVuKHt0eXBlOkRULmFycmF5LGtleTprZXl9KTtcclxuXHR9XHJcblx0dmFyIHNhdmVJbnRzPWZ1bmN0aW9uKGFycixrZXksZnVuYykge1xyXG5cdFx0ZnVuYy5hcHBseShoYW5kbGUsW2FycixrZXldKTtcclxuXHR9XHJcblx0dmFyIGNsb3NlID0gZnVuY3Rpb24ob3B0KSB7XHJcblx0XHRpZiAoIWZvbGRlcnMubGVuZ3RoKSB0aHJvdyAnZW1wdHkgc3RhY2snO1xyXG5cdFx0dmFyIGZvbGRlcj1mb2xkZXJzLnBvcCgpO1xyXG5cdFx0Ly9qdW1wIHRvIGxlbmd0aHMgYW5kIGtleXNcclxuXHRcdGtmcy53cml0ZU9mZnNldCggY3VyLWZvbGRlci5kYXRhc3RhcnQsIGZvbGRlci5kYXRhc3RhcnQtNSk7XHJcblx0XHR2YXIgaXRlbWNvdW50PWZvbGRlci5pdGVtc2xlbmd0aC5sZW5ndGg7XHJcblx0XHQvL3NhdmUgbGVuZ3Roc1xyXG5cdFx0d3JpdGVWSW50MShpdGVtY291bnQpO1xyXG5cdFx0d3JpdGVWSW50KGZvbGRlci5pdGVtc2xlbmd0aCk7XHJcblx0XHRcclxuXHRcdGlmIChmb2xkZXIudHlwZT09PURULm9iamVjdCkge1xyXG5cdFx0XHQvL3VzZSB1dGY4IGZvciBrZXlzXHJcblx0XHRcdGN1cis9a2ZzLndyaXRlU3RyaW5nQXJyYXkoZm9sZGVyLmtleXMsY3VyLCd1dGY4Jyk7XHJcblx0XHR9XHJcblx0XHR3cml0dGVuPWN1ci1mb2xkZXIuc3RhcnQ7XHJcblx0XHRwdXNoaXRlbShmb2xkZXIua2V5LHdyaXR0ZW4pO1xyXG5cdFx0cmV0dXJuIHdyaXR0ZW47XHJcblx0fVxyXG5cdFxyXG5cdFxyXG5cdHZhciBzdHJpbmdlbmNvZGluZz0ndWNzMic7XHJcblx0dmFyIHN0cmluZ0VuY29kaW5nPWZ1bmN0aW9uKG5ld2VuY29kaW5nKSB7XHJcblx0XHRpZiAobmV3ZW5jb2RpbmcpIHN0cmluZ2VuY29kaW5nPW5ld2VuY29kaW5nO1xyXG5cdFx0ZWxzZSByZXR1cm4gc3RyaW5nZW5jb2Rpbmc7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBhbGxudW1iZXJfZmFzdD1mdW5jdGlvbihhcnIpIHtcclxuXHRcdGlmIChhcnIubGVuZ3RoPDUpIHJldHVybiBhbGxudW1iZXIoYXJyKTtcclxuXHRcdGlmICh0eXBlb2YgYXJyWzBdPT0nbnVtYmVyJ1xyXG5cdFx0ICAgICYmIE1hdGgucm91bmQoYXJyWzBdKT09YXJyWzBdICYmIGFyclswXT49MClcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdHZhciBhbGxzdHJpbmdfZmFzdD1mdW5jdGlvbihhcnIpIHtcclxuXHRcdGlmIChhcnIubGVuZ3RoPDUpIHJldHVybiBhbGxzdHJpbmcoYXJyKTtcclxuXHRcdGlmICh0eXBlb2YgYXJyWzBdPT0nc3RyaW5nJykgcmV0dXJuIHRydWU7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVx0XHJcblx0dmFyIGFsbG51bWJlcj1mdW5jdGlvbihhcnIpIHtcclxuXHRcdGZvciAodmFyIGk9MDtpPGFyci5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgYXJyW2ldIT09J251bWJlcicpIHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHR2YXIgYWxsc3RyaW5nPWZ1bmN0aW9uKGFycikge1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBhcnJbaV0hPT0nc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdHZhciBnZXRFbmNvZGluZz1mdW5jdGlvbihrZXksZW5jcykge1xyXG5cdFx0dmFyIGVuYz1lbmNzW2tleV07XHJcblx0XHRpZiAoIWVuYykgcmV0dXJuIG51bGw7XHJcblx0XHRpZiAoZW5jPT0nZGVsdGEnIHx8IGVuYz09J3Bvc3RpbmcnKSB7XHJcblx0XHRcdHJldHVybiBzYXZlUEludDtcclxuXHRcdH0gZWxzZSBpZiAoZW5jPT1cInZhcmlhYmxlXCIpIHtcclxuXHRcdFx0cmV0dXJuIHNhdmVWSW50O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cdHZhciBzYXZlPWZ1bmN0aW9uKEosa2V5LG9wdHMpIHtcclxuXHRcdG9wdHM9b3B0c3x8e307XHJcblx0XHRcclxuXHRcdGlmICh0eXBlb2YgSj09XCJudWxsXCIgfHwgdHlwZW9mIEo9PVwidW5kZWZpbmVkXCIpIHtcclxuXHRcdFx0dGhyb3cgJ2Nhbm5vdCBzYXZlIG51bGwgdmFsdWUgb2YgWycra2V5KyddIGZvbGRlcnMnK0pTT04uc3RyaW5naWZ5KGZvbGRlcnMpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHR2YXIgdHlwZT1KLmNvbnN0cnVjdG9yLm5hbWU7XHJcblx0XHRpZiAodHlwZT09PSdPYmplY3QnKSB7XHJcblx0XHRcdG9wZW5PYmplY3Qoa2V5KTtcclxuXHRcdFx0Zm9yICh2YXIgaSBpbiBKKSB7XHJcblx0XHRcdFx0c2F2ZShKW2ldLGksb3B0cyk7XHJcblx0XHRcdFx0aWYgKG9wdHMuYXV0b2RlbGV0ZSkgZGVsZXRlIEpbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0Y2xvc2UoKTtcclxuXHRcdH0gZWxzZSBpZiAodHlwZT09PSdBcnJheScpIHtcclxuXHRcdFx0aWYgKGFsbG51bWJlcl9mYXN0KEopKSB7XHJcblx0XHRcdFx0aWYgKEouc29ydGVkKSB7IC8vbnVtYmVyIGFycmF5IGlzIHNvcnRlZFxyXG5cdFx0XHRcdFx0c2F2ZUludHMoSixrZXksc2F2ZVBJbnQpO1x0Ly9wb3N0aW5nIGRlbHRhIGZvcm1hdFxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzYXZlSW50cyhKLGtleSxzYXZlVkludCk7XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAoYWxsc3RyaW5nX2Zhc3QoSikpIHtcclxuXHRcdFx0XHRzYXZlU3RyaW5nQXJyYXkoSixrZXkpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG9wZW5BcnJheShrZXkpO1xyXG5cdFx0XHRcdGZvciAodmFyIGk9MDtpPEoubGVuZ3RoO2krKykge1xyXG5cdFx0XHRcdFx0c2F2ZShKW2ldLG51bGwsb3B0cyk7XHJcblx0XHRcdFx0XHRpZiAob3B0cy5hdXRvZGVsZXRlKSBkZWxldGUgSltpXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2xvc2UoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIGlmICh0eXBlPT09J1N0cmluZycpIHtcclxuXHRcdFx0c2F2ZVN0cmluZyhKLGtleSk7XHJcblx0XHR9IGVsc2UgaWYgKHR5cGU9PT0nTnVtYmVyJykge1xyXG5cdFx0XHRpZiAoSj49MCYmSjwyNTYpIHNhdmVVSTgoSixrZXkpO1xyXG5cdFx0XHRlbHNlIHNhdmVJMzIoSixrZXkpO1xyXG5cdFx0fSBlbHNlIGlmICh0eXBlPT09J0Jvb2xlYW4nKSB7XHJcblx0XHRcdHNhdmVCb29sKEosa2V5KTtcclxuXHRcdH0gZWxzZSBpZiAodHlwZT09PSdCdWZmZXInKSB7XHJcblx0XHRcdHNhdmVCbG9iKEosa2V5KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRocm93ICd1bnN1cHBvcnRlZCB0eXBlICcrdHlwZTtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0dmFyIGZyZWU9ZnVuY3Rpb24oKSB7XHJcblx0XHR3aGlsZSAoZm9sZGVycy5sZW5ndGgpIGNsb3NlKCk7XHJcblx0XHRrZnMuZnJlZSgpO1xyXG5cdH1cclxuXHR2YXIgY3VycmVudHNpemU9ZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gY3VyO1xyXG5cdH1cclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGhhbmRsZSwgXCJzaXplXCIsIHtnZXQgOiBmdW5jdGlvbigpeyByZXR1cm4gY3VyOyB9fSk7XHJcblxyXG5cdHZhciB3cml0ZUZpbGU9ZnVuY3Rpb24oZm4sb3B0cyxjYikge1xyXG5cdFx0aWYgKHR5cGVvZiBmcz09XCJ1bmRlZmluZWRcIikge1xyXG5cdFx0XHR2YXIgZnM9b3B0cy5mc3x8cmVxdWlyZSgnZnMnKTtcdFxyXG5cdFx0fVxyXG5cdFx0dmFyIHRvdGFsYnl0ZT1oYW5kbGUuY3VycmVudHNpemUoKTtcclxuXHRcdHZhciB3cml0dGVuPTAsYmF0Y2g9MDtcclxuXHRcdFxyXG5cdFx0aWYgKHR5cGVvZiBjYj09XCJ1bmRlZmluZWRcIiB8fCB0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRcdGNiPW9wdHM7XHJcblx0XHR9XHJcblx0XHRvcHRzPW9wdHN8fHt9O1xyXG5cdFx0YmF0Y2hzaXplPW9wdHMuYmF0Y2hzaXplfHwxMDI0KjEwMjQqMTY7IC8vMTYgTUJcclxuXHJcblx0XHRpZiAoZnMuZXhpc3RzU3luYyhmbikpIGZzLnVubGlua1N5bmMoZm4pO1xyXG5cclxuXHRcdHZhciB3cml0ZUNiPWZ1bmN0aW9uKHRvdGFsLHdyaXR0ZW4sY2IsbmV4dCkge1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0aWYgKGVycikgdGhyb3cgXCJ3cml0ZSBlcnJvclwiK2VycjtcclxuXHRcdFx0XHRjYih0b3RhbCx3cml0dGVuKTtcclxuXHRcdFx0XHRiYXRjaCsrO1xyXG5cdFx0XHRcdG5leHQoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBuZXh0PWZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAoYmF0Y2g8YmF0Y2hlcykge1xyXG5cdFx0XHRcdHZhciBidWZzdGFydD1iYXRjaHNpemUqYmF0Y2g7XHJcblx0XHRcdFx0dmFyIGJ1ZmVuZD1idWZzdGFydCtiYXRjaHNpemU7XHJcblx0XHRcdFx0aWYgKGJ1ZmVuZD50b3RhbGJ5dGUpIGJ1ZmVuZD10b3RhbGJ5dGU7XHJcblx0XHRcdFx0dmFyIHNsaWNlZD1rZnMuYnVmLnNsaWNlKGJ1ZnN0YXJ0LGJ1ZmVuZCk7XHJcblx0XHRcdFx0d3JpdHRlbis9c2xpY2VkLmxlbmd0aDtcclxuXHRcdFx0XHRmcy5hcHBlbmRGaWxlKGZuLHNsaWNlZCx3cml0ZUNiKHRvdGFsYnl0ZSx3cml0dGVuLCBjYixuZXh0KSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHZhciBiYXRjaGVzPTErTWF0aC5mbG9vcihoYW5kbGUuc2l6ZS9iYXRjaHNpemUpO1xyXG5cdFx0bmV4dCgpO1xyXG5cdH1cclxuXHRoYW5kbGUuZnJlZT1mcmVlO1xyXG5cdGhhbmRsZS5zYXZlSTMyPXNhdmVJMzI7XHJcblx0aGFuZGxlLnNhdmVVSTg9c2F2ZVVJODtcclxuXHRoYW5kbGUuc2F2ZUJvb2w9c2F2ZUJvb2w7XHJcblx0aGFuZGxlLnNhdmVTdHJpbmc9c2F2ZVN0cmluZztcclxuXHRoYW5kbGUuc2F2ZVZJbnQ9c2F2ZVZJbnQ7XHJcblx0aGFuZGxlLnNhdmVQSW50PXNhdmVQSW50O1xyXG5cdGhhbmRsZS5zYXZlSW50cz1zYXZlSW50cztcclxuXHRoYW5kbGUuc2F2ZUJsb2I9c2F2ZUJsb2I7XHJcblx0aGFuZGxlLnNhdmU9c2F2ZTtcclxuXHRoYW5kbGUub3BlbkFycmF5PW9wZW5BcnJheTtcclxuXHRoYW5kbGUub3Blbk9iamVjdD1vcGVuT2JqZWN0O1xyXG5cdGhhbmRsZS5zdHJpbmdFbmNvZGluZz1zdHJpbmdFbmNvZGluZztcclxuXHQvL3RoaXMuaW50ZWdlckVuY29kaW5nPWludGVnZXJFbmNvZGluZztcclxuXHRoYW5kbGUuY2xvc2U9Y2xvc2U7XHJcblx0aGFuZGxlLndyaXRlRmlsZT13cml0ZUZpbGU7XHJcblx0aGFuZGxlLmN1cnJlbnRzaXplPWN1cnJlbnRzaXplO1xyXG5cdHJldHVybiBoYW5kbGU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPUNyZWF0ZTsiLCIvKlxyXG4gIFRPRE9cclxuICBhbmQgbm90XHJcblxyXG4qL1xyXG5cclxuLy8gaHR0cDovL2pzZmlkZGxlLm5ldC9uZW9zd2YvYVh6V3cvXHJcbnZhciBwbGlzdD1yZXF1aXJlKCcuL3BsaXN0Jyk7XHJcbmZ1bmN0aW9uIGludGVyc2VjdChJLCBKKSB7XHJcbiAgdmFyIGkgPSBqID0gMDtcclxuICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gIHdoaWxlKCBpIDwgSS5sZW5ndGggJiYgaiA8IEoubGVuZ3RoICl7XHJcbiAgICAgaWYgICAgICAoSVtpXSA8IEpbal0pIGkrKzsgXHJcbiAgICAgZWxzZSBpZiAoSVtpXSA+IEpbal0pIGorKzsgXHJcbiAgICAgZWxzZSB7XHJcbiAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF09bFtpXTtcclxuICAgICAgIGkrKztqKys7XHJcbiAgICAgfVxyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKiByZXR1cm4gYWxsIGl0ZW1zIGluIEkgYnV0IG5vdCBpbiBKICovXHJcbmZ1bmN0aW9uIHN1YnRyYWN0KEksIEopIHtcclxuICB2YXIgaSA9IGogPSAwO1xyXG4gIHZhciByZXN1bHQgPSBbXTtcclxuXHJcbiAgd2hpbGUoIGkgPCBJLmxlbmd0aCAmJiBqIDwgSi5sZW5ndGggKXtcclxuICAgIGlmIChJW2ldPT1KW2pdKSB7XHJcbiAgICAgIGkrKztqKys7XHJcbiAgICB9IGVsc2UgaWYgKElbaV08SltqXSkge1xyXG4gICAgICB3aGlsZSAoSVtpXTxKW2pdKSByZXN1bHRbcmVzdWx0Lmxlbmd0aF09IElbaSsrXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdoaWxlKEpbal08SVtpXSkgaisrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKGo9PUoubGVuZ3RoKSB7XHJcbiAgICB3aGlsZSAoaTxJLmxlbmd0aCkgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdPUlbaSsrXTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbnZhciB1bmlvbj1mdW5jdGlvbihhLGIpIHtcclxuXHRpZiAoIWEgfHwgIWEubGVuZ3RoKSByZXR1cm4gYjtcclxuXHRpZiAoIWIgfHwgIWIubGVuZ3RoKSByZXR1cm4gYTtcclxuICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgIHZhciBhaSA9IDA7XHJcbiAgICB2YXIgYmkgPSAwO1xyXG4gICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICBpZiAoIGFpIDwgYS5sZW5ndGggJiYgYmkgPCBiLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZiAoYVthaV0gPCBiW2JpXSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdPWFbYWldO1xyXG4gICAgICAgICAgICAgICAgYWkrKztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChhW2FpXSA+IGJbYmldKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF09YltiaV07XHJcbiAgICAgICAgICAgICAgICBiaSsrO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdPWFbYWldO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdPWJbYmldO1xyXG4gICAgICAgICAgICAgICAgYWkrKztcclxuICAgICAgICAgICAgICAgIGJpKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGFpIDwgYS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBhLnNsaWNlKGFpLCBhLmxlbmd0aCkpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9IGVsc2UgaWYgKGJpIDwgYi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBiLnNsaWNlKGJpLCBiLmxlbmd0aCkpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbnZhciBPUEVSQVRJT049eydpbmNsdWRlJzppbnRlcnNlY3QsICd1bmlvbic6dW5pb24sICdleGNsdWRlJzpzdWJ0cmFjdH07XHJcblxyXG52YXIgYm9vbFNlYXJjaD1mdW5jdGlvbihvcHRzKSB7XHJcbiAgb3B0cz1vcHRzfHx7fTtcclxuICBvcHM9b3B0cy5vcHx8dGhpcy5vcHRzLm9wO1xyXG4gIHRoaXMuZG9jcz1bXTtcclxuXHRpZiAoIXRoaXMucGhyYXNlcy5sZW5ndGgpIHJldHVybjtcclxuXHR2YXIgcj10aGlzLnBocmFzZXNbMF0uZG9jcztcclxuICAvKiBpZ25vcmUgb3BlcmF0b3Igb2YgZmlyc3QgcGhyYXNlICovXHJcblx0Zm9yICh2YXIgaT0xO2k8dGhpcy5waHJhc2VzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBvcD0gb3BzW2ldIHx8ICd1bmlvbic7XHJcblx0XHRyPU9QRVJBVElPTltvcF0ocix0aGlzLnBocmFzZXNbaV0uZG9jcyk7XHJcblx0fVxyXG5cdHRoaXMuZG9jcz1wbGlzdC51bmlxdWUocik7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9e3NlYXJjaDpib29sU2VhcmNofSIsInZhciBwbGlzdD1yZXF1aXJlKFwiLi9wbGlzdFwiKTtcclxuXHJcbnZhciBnZXRQaHJhc2VXaWR0aHM9ZnVuY3Rpb24gKFEscGhyYXNlaWQsdnBvc3MpIHtcclxuXHR2YXIgcmVzPVtdO1xyXG5cdGZvciAodmFyIGkgaW4gdnBvc3MpIHtcclxuXHRcdHJlcy5wdXNoKGdldFBocmFzZVdpZHRoKFEscGhyYXNlaWQsdnBvc3NbaV0pKTtcclxuXHR9XHJcblx0cmV0dXJuIHJlcztcclxufVxyXG52YXIgZ2V0UGhyYXNlV2lkdGg9ZnVuY3Rpb24gKFEscGhyYXNlaWQsdnBvcykge1xyXG5cdHZhciBQPVEucGhyYXNlc1twaHJhc2VpZF07XHJcblx0dmFyIHdpZHRoPTAsdmFyd2lkdGg9ZmFsc2U7XHJcblx0aWYgKFAud2lkdGgpIHJldHVybiBQLndpZHRoOyAvLyBubyB3aWxkY2FyZFxyXG5cdGlmIChQLnRlcm1pZC5sZW5ndGg8MikgcmV0dXJuIFAudGVybWxlbmd0aFswXTtcclxuXHR2YXIgbGFzdHRlcm1wb3N0aW5nPVEudGVybXNbUC50ZXJtaWRbUC50ZXJtaWQubGVuZ3RoLTFdXS5wb3N0aW5nO1xyXG5cclxuXHRmb3IgKHZhciBpIGluIFAudGVybWlkKSB7XHJcblx0XHR2YXIgVD1RLnRlcm1zW1AudGVybWlkW2ldXTtcclxuXHRcdGlmIChULm9wPT0nd2lsZGNhcmQnKSB7XHJcblx0XHRcdHdpZHRoKz1ULndpZHRoO1xyXG5cdFx0XHRpZiAoVC53aWxkY2FyZD09JyonKSB2YXJ3aWR0aD10cnVlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0d2lkdGgrPVAudGVybWxlbmd0aFtpXTtcclxuXHRcdH1cclxuXHR9XHJcblx0aWYgKHZhcndpZHRoKSB7IC8vd2lkdGggbWlnaHQgYmUgc21hbGxlciBkdWUgdG8gKiB3aWxkY2FyZFxyXG5cdFx0dmFyIGF0PXBsaXN0LmluZGV4T2ZTb3J0ZWQobGFzdHRlcm1wb3N0aW5nLHZwb3MpO1xyXG5cdFx0dmFyIGVuZHBvcz1sYXN0dGVybXBvc3RpbmdbYXRdO1xyXG5cdFx0aWYgKGVuZHBvcy12cG9zPHdpZHRoKSB3aWR0aD1lbmRwb3MtdnBvcysxO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHdpZHRoO1xyXG59XHJcbi8qIHJldHVybiBbdnBvcywgcGhyYXNlaWQsIHBocmFzZXdpZHRoLCBvcHRpb25hbF90YWduYW1lXSBieSBzbG90IHJhbmdlKi9cclxudmFyIGhpdEluUmFuZ2U9ZnVuY3Rpb24oUSxzdGFydHZwb3MsZW5kdnBvcykge1xyXG5cdHZhciByZXM9W107XHJcblx0aWYgKCFRIHx8ICFRLnJhd3Jlc3VsdCB8fCAhUS5yYXdyZXN1bHQubGVuZ3RoKSByZXR1cm4gcmVzO1xyXG5cdGZvciAodmFyIGk9MDtpPFEucGhyYXNlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgUD1RLnBocmFzZXNbaV07XHJcblx0XHRpZiAoIVAucG9zdGluZykgY29udGludWU7XHJcblx0XHR2YXIgcz1wbGlzdC5pbmRleE9mU29ydGVkKFAucG9zdGluZyxzdGFydHZwb3MpO1xyXG5cdFx0dmFyIGU9cGxpc3QuaW5kZXhPZlNvcnRlZChQLnBvc3RpbmcsZW5kdnBvcyk7XHJcblx0XHR2YXIgcj1QLnBvc3Rpbmcuc2xpY2UocyxlKzEpO1xyXG5cdFx0dmFyIHdpZHRoPWdldFBocmFzZVdpZHRocyhRLGkscik7XHJcblxyXG5cdFx0cmVzPXJlcy5jb25jYXQoci5tYXAoZnVuY3Rpb24odnBvcyxpZHgpeyByZXR1cm4gW3Zwb3Msd2lkdGhbaWR4XSxpXSB9KSk7XHJcblx0fVxyXG5cdC8vIG9yZGVyIGJ5IHZwb3MsIGlmIHZwb3MgaXMgdGhlIHNhbWUsIGxhcmdlciB3aWR0aCBjb21lIGZpcnN0LlxyXG5cdC8vIHNvIHRoZSBvdXRwdXQgd2lsbCBiZVxyXG5cdC8vIDx0YWcxPjx0YWcyPm9uZTwvdGFnMj50d288L3RhZzE+XHJcblx0Ly9UT0RPLCBtaWdodCBjYXVzZSBvdmVybGFwIGlmIHNhbWUgdnBvcyBhbmQgc2FtZSB3aWR0aFxyXG5cdC8vbmVlZCB0byBjaGVjayB0YWcgbmFtZVxyXG5cdHJlcy5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGFbMF09PWJbMF0/IGJbMV0tYVsxXSA6YVswXS1iWzBdfSk7XHJcblxyXG5cdHJldHVybiByZXM7XHJcbn1cclxuXHJcbnZhciB0YWdzSW5SYW5nZT1mdW5jdGlvbihRLHJlbmRlclRhZ3Msc3RhcnR2cG9zLGVuZHZwb3MpIHtcclxuXHR2YXIgcmVzPVtdO1xyXG5cdGlmICh0eXBlb2YgcmVuZGVyVGFncz09XCJzdHJpbmdcIikgcmVuZGVyVGFncz1bcmVuZGVyVGFnc107XHJcblxyXG5cdHJlbmRlclRhZ3MubWFwKGZ1bmN0aW9uKHRhZyl7XHJcblx0XHR2YXIgc3RhcnRzPVEuZW5naW5lLmdldChbXCJmaWVsZHNcIix0YWcrXCJfc3RhcnRcIl0pO1xyXG5cdFx0dmFyIGVuZHM9US5lbmdpbmUuZ2V0KFtcImZpZWxkc1wiLHRhZytcIl9lbmRcIl0pO1xyXG5cdFx0aWYgKCFzdGFydHMpIHJldHVybjtcclxuXHJcblx0XHR2YXIgcz1wbGlzdC5pbmRleE9mU29ydGVkKHN0YXJ0cyxzdGFydHZwb3MpO1xyXG5cdFx0dmFyIGU9cztcclxuXHRcdHdoaWxlIChlPHN0YXJ0cy5sZW5ndGggJiYgc3RhcnRzW2VdPGVuZHZwb3MpIGUrKztcclxuXHRcdHZhciBvcGVudGFncz1zdGFydHMuc2xpY2UocyxlKTtcclxuXHJcblx0XHRzPXBsaXN0LmluZGV4T2ZTb3J0ZWQoZW5kcyxzdGFydHZwb3MpO1xyXG5cdFx0ZT1zO1xyXG5cdFx0d2hpbGUgKGU8ZW5kcy5sZW5ndGggJiYgZW5kc1tlXTxlbmR2cG9zKSBlKys7XHJcblx0XHR2YXIgY2xvc2V0YWdzPWVuZHMuc2xpY2UocyxlKTtcclxuXHJcblx0XHRvcGVudGFncy5tYXAoZnVuY3Rpb24oc3RhcnQsaWR4KSB7XHJcblx0XHRcdHJlcy5wdXNoKFtzdGFydCxjbG9zZXRhZ3NbaWR4XS1zdGFydCx0YWddKTtcclxuXHRcdH0pXHJcblx0fSk7XHJcblx0Ly8gb3JkZXIgYnkgdnBvcywgaWYgdnBvcyBpcyB0aGUgc2FtZSwgbGFyZ2VyIHdpZHRoIGNvbWUgZmlyc3QuXHJcblx0cmVzLnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYVswXT09YlswXT8gYlsxXS1hWzFdIDphWzBdLWJbMF19KTtcclxuXHJcblx0cmV0dXJuIHJlcztcclxufVxyXG5cclxuLypcclxuZ2l2ZW4gYSB2cG9zIHJhbmdlIHN0YXJ0LCBmaWxlLCBjb252ZXJ0IHRvIGZpbGVzdGFydCwgZmlsZWVuZFxyXG4gICBmaWxlc3RhcnQgOiBzdGFydGluZyBmaWxlXHJcbiAgIHN0YXJ0ICAgOiB2cG9zIHN0YXJ0XHJcbiAgIHNob3dmaWxlOiBob3cgbWFueSBmaWxlcyB0byBkaXNwbGF5XHJcbiAgIHNob3dwYWdlOiBob3cgbWFueSBwYWdlcyB0byBkaXNwbGF5XHJcblxyXG5vdXRwdXQ6XHJcbiAgIGFycmF5IG9mIGZpbGVpZCB3aXRoIGhpdHNcclxuKi9cclxudmFyIGdldEZpbGVXaXRoSGl0cz1mdW5jdGlvbihlbmdpbmUsUSxyYW5nZSkge1xyXG5cdHZhciBmaWxlT2Zmc2V0cz1lbmdpbmUuZ2V0KFwiZmlsZW9mZnNldHNcIik7XHJcblx0dmFyIG91dD1bXSxmaWxlY291bnQ9MTAwO1xyXG5cdHZhciBzdGFydD0wICwgZW5kPVEuYnlGaWxlLmxlbmd0aDtcclxuXHRRLmV4Y2VycHRPdmVyZmxvdz1mYWxzZTtcclxuXHRpZiAocmFuZ2Uuc3RhcnQpIHtcclxuXHRcdHZhciBmaXJzdD1yYW5nZS5zdGFydCA7XHJcblx0XHR2YXIgbGFzdD1yYW5nZS5lbmQ7XHJcblx0XHRpZiAoIWxhc3QpIGxhc3Q9TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XHJcblx0XHRmb3IgKHZhciBpPTA7aTxmaWxlT2Zmc2V0cy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdC8vaWYgKGZpbGVPZmZzZXRzW2ldPmZpcnN0KSBicmVhaztcclxuXHRcdFx0aWYgKGZpbGVPZmZzZXRzW2ldPmxhc3QpIHtcclxuXHRcdFx0XHRlbmQ9aTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZmlsZU9mZnNldHNbaV08Zmlyc3QpIHN0YXJ0PWk7XHJcblx0XHR9XHRcdFxyXG5cdH0gZWxzZSB7XHJcblx0XHRzdGFydD1yYW5nZS5maWxlc3RhcnQgfHwgMDtcclxuXHRcdGlmIChyYW5nZS5tYXhmaWxlKSB7XHJcblx0XHRcdGZpbGVjb3VudD1yYW5nZS5tYXhmaWxlO1xyXG5cdFx0fSBlbHNlIGlmIChyYW5nZS5zaG93c2VnKSB7XHJcblx0XHRcdHRocm93IFwibm90IGltcGxlbWVudCB5ZXRcIlxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGZpbGVXaXRoSGl0cz1bXSx0b3RhbGhpdD0wO1xyXG5cdHJhbmdlLm1heGhpdD1yYW5nZS5tYXhoaXR8fDEwMDA7XHJcblxyXG5cdGZvciAodmFyIGk9c3RhcnQ7aTxlbmQ7aSsrKSB7XHJcblx0XHRpZihRLmJ5RmlsZVtpXS5sZW5ndGg+MCkge1xyXG5cdFx0XHR0b3RhbGhpdCs9US5ieUZpbGVbaV0ubGVuZ3RoO1xyXG5cdFx0XHRmaWxlV2l0aEhpdHMucHVzaChpKTtcclxuXHRcdFx0cmFuZ2UubmV4dEZpbGVTdGFydD1pO1xyXG5cdFx0XHRpZiAoZmlsZVdpdGhIaXRzLmxlbmd0aD49ZmlsZWNvdW50KSB7XHJcblx0XHRcdFx0US5leGNlcnB0T3ZlcmZsb3c9dHJ1ZTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodG90YWxoaXQ+cmFuZ2UubWF4aGl0KSB7XHJcblx0XHRcdFx0US5leGNlcnB0T3ZlcmZsb3c9dHJ1ZTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRpZiAoaT49ZW5kKSB7IC8vbm8gbW9yZSBmaWxlXHJcblx0XHRRLmV4Y2VycHRTdG9wPXRydWU7XHJcblx0fVxyXG5cdHJldHVybiBmaWxlV2l0aEhpdHM7XHJcbn1cclxudmFyIHJlc3VsdGxpc3Q9ZnVuY3Rpb24oZW5naW5lLFEsb3B0cyxjYikge1xyXG5cdHZhciBvdXRwdXQ9W107XHJcblx0aWYgKCFRLnJhd3Jlc3VsdCB8fCAhUS5yYXdyZXN1bHQubGVuZ3RoKSB7XHJcblx0XHRjYihvdXRwdXQpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0aWYgKG9wdHMucmFuZ2UpIHtcclxuXHRcdGlmIChvcHRzLnJhbmdlLm1heGhpdCAmJiAhb3B0cy5yYW5nZS5tYXhmaWxlKSB7XHJcblx0XHRcdG9wdHMucmFuZ2UubWF4ZmlsZT1vcHRzLnJhbmdlLm1heGhpdDtcclxuXHRcdFx0b3B0cy5yYW5nZS5tYXhzZWc9b3B0cy5yYW5nZS5tYXhoaXQ7XHJcblx0XHR9XHJcblx0XHRpZiAoIW9wdHMucmFuZ2UubWF4c2VnKSBvcHRzLnJhbmdlLm1heHNlZz0xMDA7XHJcblx0XHRpZiAoIW9wdHMucmFuZ2UuZW5kKSB7XHJcblx0XHRcdG9wdHMucmFuZ2UuZW5kPU51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xyXG5cdFx0fVxyXG5cdH1cclxuXHR2YXIgZmlsZVdpdGhIaXRzPWdldEZpbGVXaXRoSGl0cyhlbmdpbmUsUSxvcHRzLnJhbmdlKTtcclxuXHRpZiAoIWZpbGVXaXRoSGl0cy5sZW5ndGgpIHtcclxuXHRcdGNiKG91dHB1dCk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHR2YXIgb3V0cHV0PVtdLGZpbGVzPVtdOy8vdGVtcG9yYXJ5IGhvbGRlciBmb3Igc2VnbmFtZXNcclxuXHRmb3IgKHZhciBpPTA7aTxmaWxlV2l0aEhpdHMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIG5maWxlPWZpbGVXaXRoSGl0c1tpXTtcclxuXHRcdHZhciBzZWdvZmZzZXRzPWVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cyhuZmlsZSk7XHJcblx0XHR2YXIgc2VnbmFtZXM9ZW5naW5lLmdldEZpbGVTZWdOYW1lcyhuZmlsZSk7XHJcblx0XHRmaWxlc1tuZmlsZV09e3NlZ29mZnNldHM6c2Vnb2Zmc2V0c307XHJcblx0XHR2YXIgc2Vnd2l0aGhpdD1wbGlzdC5ncm91cGJ5cG9zdGluZzIoUS5ieUZpbGVbIG5maWxlIF0sICBzZWdvZmZzZXRzKTtcclxuXHRcdC8vaWYgKHNlZ29mZnNldHNbMF09PTEpXHJcblx0XHQvL3NlZ3dpdGhoaXQuc2hpZnQoKTsgLy90aGUgZmlyc3QgaXRlbSBpcyBub3QgdXNlZCAoMH5RLmJ5RmlsZVswXSApXHJcblxyXG5cdFx0Zm9yICh2YXIgaj0wOyBqPHNlZ3dpdGhoaXQubGVuZ3RoO2orKykge1xyXG5cdFx0XHRpZiAoIXNlZ3dpdGhoaXRbal0ubGVuZ3RoKSBjb250aW51ZTtcclxuXHRcdFx0Ly92YXIgb2Zmc2V0cz1zZWd3aXRoaGl0W2pdLm1hcChmdW5jdGlvbihwKXtyZXR1cm4gcC0gZmlsZU9mZnNldHNbaV19KTtcclxuXHRcdFx0aWYgKHNlZ29mZnNldHNbal0+b3B0cy5yYW5nZS5lbmQpIGJyZWFrO1xyXG5cdFx0XHRvdXRwdXQucHVzaCggIHtmaWxlOiBuZmlsZSwgc2VnOmosICBzZWduYW1lOnNlZ25hbWVzW2pdfSk7XHJcblx0XHRcdGlmIChvdXRwdXQubGVuZ3RoPm9wdHMucmFuZ2UubWF4c2VnKSBicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBzZWdwYXRocz1vdXRwdXQubWFwKGZ1bmN0aW9uKHApe1xyXG5cdFx0cmV0dXJuIFtcImZpbGVjb250ZW50c1wiLHAuZmlsZSxwLnNlZ107XHJcblx0fSk7XHJcblx0Ly9wcmVwYXJlIHRoZSB0ZXh0XHJcblx0ZW5naW5lLmdldChzZWdwYXRocyxmdW5jdGlvbihzZWdzKXtcclxuXHRcdHZhciBzZXE9MDtcclxuXHRcdGlmIChzZWdzKSBmb3IgKHZhciBpPTA7aTxzZWdzLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0dmFyIHN0YXJ0dnBvcz1maWxlc1tvdXRwdXRbaV0uZmlsZV0uc2Vnb2Zmc2V0c1tvdXRwdXRbaV0uc2VnLTFdIHx8MDtcclxuXHRcdFx0dmFyIGVuZHZwb3M9ZmlsZXNbb3V0cHV0W2ldLmZpbGVdLnNlZ29mZnNldHNbb3V0cHV0W2ldLnNlZ107XHJcblx0XHRcdHZhciBobD17fTtcclxuXHJcblx0XHRcdGlmIChvcHRzLnJhbmdlICYmIG9wdHMucmFuZ2Uuc3RhcnQgICkge1xyXG5cdFx0XHRcdGlmICggc3RhcnR2cG9zPG9wdHMucmFuZ2Uuc3RhcnQpIHN0YXJ0dnBvcz1vcHRzLnJhbmdlLnN0YXJ0O1xyXG5cdFx0XHQvL1x0aWYgKGVuZHZwb3M+b3B0cy5yYW5nZS5lbmQpIGVuZHZwb3M9b3B0cy5yYW5nZS5lbmQ7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGlmIChvcHRzLm5vaGlnaGxpZ2h0KSB7XHJcblx0XHRcdFx0aGwudGV4dD1zZWdzW2ldO1xyXG5cdFx0XHRcdGhsLmhpdHM9aGl0SW5SYW5nZShRLHN0YXJ0dnBvcyxlbmR2cG9zKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR2YXIgbz17bm9jcmxmOnRydWUsbm9zcGFuOnRydWUsXHJcblx0XHRcdFx0XHR0ZXh0OnNlZ3NbaV0sc3RhcnR2cG9zOnN0YXJ0dnBvcywgZW5kdnBvczogZW5kdnBvcywgXHJcblx0XHRcdFx0XHRROlEsZnVsbHRleHQ6b3B0cy5mdWxsdGV4dH07XHJcblx0XHRcdFx0aGw9aGlnaGxpZ2h0KFEsbyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGhsLnRleHQpIHtcclxuXHRcdFx0XHRvdXRwdXRbaV0udGV4dD1obC50ZXh0O1xyXG5cdFx0XHRcdG91dHB1dFtpXS5oaXRzPWhsLmhpdHM7XHJcblx0XHRcdFx0b3V0cHV0W2ldLnNlcT1zZXE7XHJcblx0XHRcdFx0c2VxKz1obC5oaXRzLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0b3V0cHV0W2ldLnN0YXJ0PXN0YXJ0dnBvcztcdFx0XHRcdFxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG91dHB1dFtpXT1udWxsOyAvL3JlbW92ZSBpdGVtIHZwb3MgbGVzcyB0aGFuIG9wdHMucmFuZ2Uuc3RhcnRcclxuXHRcdFx0fVxyXG5cdFx0fSBcclxuXHRcdG91dHB1dD1vdXRwdXQuZmlsdGVyKGZ1bmN0aW9uKG8pe3JldHVybiBvIT1udWxsfSk7XHJcblx0XHRjYihvdXRwdXQpO1xyXG5cdH0pO1xyXG59XHJcbnZhciBpbmplY3RUYWc9ZnVuY3Rpb24oUSxvcHRzKXtcclxuXHR2YXIgaGl0cz1vcHRzLmhpdHM7XHJcblx0dmFyIHRhZ3M9b3B0cy50YWdzO1xyXG5cdGlmICghdGFncykgdGFncz1bXTtcclxuXHR2YXIgaGl0Y2xhc3M9b3B0cy5oaXRjbGFzc3x8J2hsJztcclxuXHR2YXIgb3V0cHV0PScnLE89W10saj0wLGs9MDtcclxuXHR2YXIgc3Vycm91bmQ9b3B0cy5zdXJyb3VuZHx8NTtcclxuXHJcblx0dmFyIHRva2Vucz1RLnRva2VuaXplKG9wdHMudGV4dCkudG9rZW5zO1xyXG5cdHZhciB2cG9zPW9wdHMudnBvcztcclxuXHR2YXIgaT0wLHByZXZpbnJhbmdlPSEhb3B0cy5mdWxsdGV4dCAsaW5yYW5nZT0hIW9wdHMuZnVsbHRleHQ7XHJcblx0dmFyIGhpdHN0YXJ0PTAsaGl0ZW5kPTAsdGFnc3RhcnQ9MCx0YWdlbmQ9MCx0YWdjbGFzcz1cIlwiO1xyXG5cdHdoaWxlIChpPHRva2Vucy5sZW5ndGgpIHtcclxuXHRcdHZhciBza2lwPVEuaXNTa2lwKHRva2Vuc1tpXSk7XHJcblx0XHR2YXIgaGFzaGl0PWZhbHNlO1xyXG5cdFx0aW5yYW5nZT1vcHRzLmZ1bGx0ZXh0IHx8IChqPGhpdHMubGVuZ3RoICYmIHZwb3Mrc3Vycm91bmQ+PWhpdHNbal1bMF0gfHxcclxuXHRcdFx0XHQoaj4wICYmIGo8PWhpdHMubGVuZ3RoICYmICBoaXRzW2otMV1bMF0rc3Vycm91bmQqMj49dnBvcykpO1x0XHJcblxyXG5cdFx0aWYgKHByZXZpbnJhbmdlIT1pbnJhbmdlKSB7XHJcblx0XHRcdG91dHB1dCs9b3B0cy5hYnJpZGdlfHxcIi4uLlwiO1xyXG5cdFx0fVxyXG5cdFx0cHJldmlucmFuZ2U9aW5yYW5nZTtcclxuXHRcdHZhciB0b2tlbj10b2tlbnNbaV07XHJcblx0XHRpZiAob3B0cy5ub2NybGYgJiYgdG9rZW49PVwiXFxuXCIpIHRva2VuPVwiXCI7XHJcblxyXG5cdFx0aWYgKGlucmFuZ2UgJiYgaTx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHRcdGlmIChza2lwKSB7XHJcblx0XHRcdFx0b3V0cHV0Kz10b2tlbjtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR2YXIgY2xhc3Nlcz1cIlwiO1x0XHJcblxyXG5cdFx0XHRcdC8vY2hlY2sgaGl0XHJcblx0XHRcdFx0aWYgKGo8aGl0cy5sZW5ndGggJiYgdnBvcz09aGl0c1tqXVswXSkge1xyXG5cdFx0XHRcdFx0dmFyIG5waHJhc2U9aGl0c1tqXVsyXSAlIDEwLCB3aWR0aD1oaXRzW2pdWzFdO1xyXG5cdFx0XHRcdFx0aGl0c3RhcnQ9aGl0c1tqXVswXTtcclxuXHRcdFx0XHRcdGhpdGVuZD1oaXRzdGFydCt3aWR0aDtcclxuXHRcdFx0XHRcdGorKztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vY2hlY2sgdGFnXHJcblx0XHRcdFx0aWYgKGs8dGFncy5sZW5ndGggJiYgdnBvcz09dGFnc1trXVswXSkge1xyXG5cdFx0XHRcdFx0dmFyIHdpZHRoPXRhZ3Nba11bMV07XHJcblx0XHRcdFx0XHR0YWdzdGFydD10YWdzW2tdWzBdO1xyXG5cdFx0XHRcdFx0dGFnZW5kPXRhZ3N0YXJ0K3dpZHRoO1xyXG5cdFx0XHRcdFx0dGFnY2xhc3M9dGFnc1trXVsyXTtcclxuXHRcdFx0XHRcdGsrKztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmICh2cG9zPj1oaXRzdGFydCAmJiB2cG9zPGhpdGVuZCkgY2xhc3Nlcz1oaXRjbGFzcytcIiBcIitoaXRjbGFzcytucGhyYXNlO1xyXG5cdFx0XHRcdGlmICh2cG9zPj10YWdzdGFydCAmJiB2cG9zPHRhZ2VuZCkgY2xhc3Nlcys9XCIgXCIrdGFnY2xhc3M7XHJcblxyXG5cdFx0XHRcdGlmIChjbGFzc2VzIHx8ICFvcHRzLm5vc3Bhbikge1xyXG5cdFx0XHRcdFx0b3V0cHV0Kz0nPHNwYW4gdnBvcz1cIicrdnBvcysnXCInO1xyXG5cdFx0XHRcdFx0aWYgKGNsYXNzZXMpIGNsYXNzZXM9JyBjbGFzcz1cIicrY2xhc3NlcysnXCInO1xyXG5cdFx0XHRcdFx0b3V0cHV0Kz1jbGFzc2VzKyc+JztcclxuXHRcdFx0XHRcdG91dHB1dCs9dG9rZW4rJzwvc3Bhbj4nO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRvdXRwdXQrPXRva2VuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKCFza2lwKSB2cG9zKys7XHJcblx0XHRpKys7IFxyXG5cdH1cclxuXHJcblx0Ty5wdXNoKG91dHB1dCk7XHJcblx0b3V0cHV0PVwiXCI7XHJcblxyXG5cdHJldHVybiBPLmpvaW4oXCJcIik7XHJcbn1cclxudmFyIGhpZ2hsaWdodD1mdW5jdGlvbihRLG9wdHMpIHtcclxuXHRpZiAoIW9wdHMudGV4dCkgcmV0dXJuIHt0ZXh0OlwiXCIsaGl0czpbXX07XHJcblx0dmFyIG9wdD17dGV4dDpvcHRzLnRleHQsXHJcblx0XHRoaXRzOm51bGwsYWJyaWRnZTpvcHRzLmFicmlkZ2UsdnBvczpvcHRzLnN0YXJ0dnBvcyxcclxuXHRcdGZ1bGx0ZXh0Om9wdHMuZnVsbHRleHQscmVuZGVyVGFnczpvcHRzLnJlbmRlclRhZ3Msbm9zcGFuOm9wdHMubm9zcGFuLG5vY3JsZjpvcHRzLm5vY3JsZixcclxuXHR9O1xyXG5cclxuXHRvcHQuaGl0cz1oaXRJblJhbmdlKG9wdHMuUSxvcHRzLnN0YXJ0dnBvcyxvcHRzLmVuZHZwb3MpO1xyXG5cdHJldHVybiB7dGV4dDppbmplY3RUYWcoUSxvcHQpLGhpdHM6b3B0LmhpdHN9O1xyXG59XHJcblxyXG52YXIgZ2V0U2VnPWZ1bmN0aW9uKGVuZ2luZSxmaWxlaWQsc2VnaWQsY2IpIHtcclxuXHR2YXIgZmlsZU9mZnNldHM9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdHZhciBzZWdwYXRocz1bXCJmaWxlY29udGVudHNcIixmaWxlaWQsc2VnaWRdO1xyXG5cdHZhciBzZWduYW1lcz1lbmdpbmUuZ2V0RmlsZVNlZ05hbWVzKGZpbGVpZCk7XHJcblxyXG5cdGVuZ2luZS5nZXQoc2VncGF0aHMsZnVuY3Rpb24odGV4dCl7XHJcblx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbe3RleHQ6dGV4dCxmaWxlOmZpbGVpZCxzZWc6c2VnaWQsc2VnbmFtZTpzZWduYW1lc1tzZWdpZF19XSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBnZXRTZWdTeW5jPWZ1bmN0aW9uKGVuZ2luZSxmaWxlaWQsc2VnaWQpIHtcclxuXHR2YXIgZmlsZU9mZnNldHM9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdHZhciBzZWdwYXRocz1bXCJmaWxlY29udGVudHNcIixmaWxlaWQsc2VnaWRdO1xyXG5cdHZhciBzZWduYW1lcz1lbmdpbmUuZ2V0RmlsZVNlZ05hbWVzKGZpbGVpZCk7XHJcblxyXG5cdHZhciB0ZXh0PWVuZ2luZS5nZXQoc2VncGF0aHMpO1xyXG5cdHJldHVybiB7dGV4dDp0ZXh0LGZpbGU6ZmlsZWlkLHNlZzpzZWdpZCxzZWduYW1lOnNlZ25hbWVzW3NlZ2lkXX07XHJcbn1cclxuXHJcbnZhciBnZXRSYW5nZT1mdW5jdGlvbihlbmdpbmUsc3RhcnQsZW5kLGNiKSB7XHJcblx0dmFyIGZpbGVvZmZzZXRzPWVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKTtcclxuXHQvL3ZhciBwYWdlcGF0aHM9W1wiZmlsZUNvbnRlbnRzXCIsXTtcclxuXHQvL2ZpbmQgZmlyc3QgcGFnZSBhbmQgbGFzdCBwYWdlXHJcblx0Ly9jcmVhdGUgZ2V0IHBhdGhzXHJcblxyXG59XHJcblxyXG52YXIgZ2V0RmlsZT1mdW5jdGlvbihlbmdpbmUsZmlsZWlkLGNiKSB7XHJcblx0dmFyIGZpbGVuYW1lPWVuZ2luZS5nZXQoXCJmaWxlbmFtZXNcIilbZmlsZWlkXTtcclxuXHR2YXIgc2VnbmFtZXM9ZW5naW5lLmdldEZpbGVTZWdOYW1lcyhmaWxlaWQpO1xyXG5cdHZhciBmaWxlc3RhcnQ9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpW2ZpbGVpZF07XHJcblx0dmFyIG9mZnNldHM9ZW5naW5lLmdldEZpbGVTZWdPZmZzZXRzKGZpbGVpZCk7XHJcblx0dmFyIHBjPTA7XHJcblx0ZW5naW5lLmdldChbXCJmaWxlQ29udGVudHNcIixmaWxlaWRdLHRydWUsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHR2YXIgdGV4dD1kYXRhLm1hcChmdW5jdGlvbih0LGlkeCkge1xyXG5cdFx0XHRpZiAoaWR4PT0wKSByZXR1cm4gXCJcIjsgXHJcblx0XHRcdHZhciBwYj0nPHBiIG49XCInK3NlZ25hbWVzW2lkeF0rJ1wiPjwvcGI+JztcclxuXHRcdFx0cmV0dXJuIHBiK3Q7XHJcblx0XHR9KTtcclxuXHRcdGNiKHt0ZXh0czpkYXRhLHRleHQ6dGV4dC5qb2luKFwiXCIpLHNlZ25hbWVzOnNlZ25hbWVzLGZpbGVzdGFydDpmaWxlc3RhcnQsb2Zmc2V0czpvZmZzZXRzLGZpbGU6ZmlsZWlkLGZpbGVuYW1lOmZpbGVuYW1lfSk7IC8vZm9yY2UgZGlmZmVyZW50IHRva2VuXHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBoaWdobGlnaHRSYW5nZT1mdW5jdGlvbihRLHN0YXJ0dnBvcyxlbmR2cG9zLG9wdHMsY2Ipe1xyXG5cdC8vbm90IGltcGxlbWVudCB5ZXRcclxufVxyXG5cclxudmFyIGhpZ2hsaWdodEZpbGU9ZnVuY3Rpb24oUSxmaWxlaWQsb3B0cyxjYikge1xyXG5cdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRjYj1vcHRzO1xyXG5cdH1cclxuXHJcblx0aWYgKCFRIHx8ICFRLmVuZ2luZSkgcmV0dXJuIGNiKG51bGwpO1xyXG5cclxuXHR2YXIgc2Vnb2Zmc2V0cz1RLmVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cyhmaWxlaWQpO1xyXG5cdHZhciBvdXRwdXQ9W107XHRcclxuXHQvL2NvbnNvbGUubG9nKHN0YXJ0dnBvcyxlbmR2cG9zKVxyXG5cdFEuZW5naW5lLmdldChbXCJmaWxlQ29udGVudHNcIixmaWxlaWRdLHRydWUsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRpZiAoIWRhdGEpIHtcclxuXHRcdFx0Y29uc29sZS5lcnJvcihcIndyb25nIGZpbGUgaWRcIixmaWxlaWQpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Zm9yICh2YXIgaT0wO2k8ZGF0YS5sZW5ndGgtMTtpKysgKXtcclxuXHRcdFx0XHR2YXIgc3RhcnR2cG9zPXNlZ29mZnNldHNbaV07XHJcblx0XHRcdFx0dmFyIGVuZHZwb3M9c2Vnb2Zmc2V0c1tpKzFdO1xyXG5cdFx0XHRcdHZhciBzZWduYW1lcz1RLmVuZ2luZS5nZXRGaWxlU2VnTmFtZXMoZmlsZWlkKTtcclxuXHRcdFx0XHR2YXIgc2VnPWdldFNlZ1N5bmMoUS5lbmdpbmUsIGZpbGVpZCxpKzEpO1xyXG5cdFx0XHRcdFx0dmFyIG9wdD17dGV4dDpzZWcudGV4dCxoaXRzOm51bGwsdGFnOidobCcsdnBvczpzdGFydHZwb3MsXHJcblx0XHRcdFx0XHRmdWxsdGV4dDp0cnVlLG5vc3BhbjpvcHRzLm5vc3Bhbixub2NybGY6b3B0cy5ub2NybGZ9O1xyXG5cdFx0XHRcdHZhciBzZWduYW1lPXNlZ25hbWVzW2krMV07XHJcblx0XHRcdFx0b3B0LmhpdHM9aGl0SW5SYW5nZShRLHN0YXJ0dnBvcyxlbmR2cG9zKTtcclxuXHRcdFx0XHR2YXIgcGI9JzxwYiBuPVwiJytzZWduYW1lKydcIj48L3BiPic7XHJcblx0XHRcdFx0dmFyIHdpdGh0YWc9aW5qZWN0VGFnKFEsb3B0KTtcclxuXHRcdFx0XHRvdXRwdXQucHVzaChwYit3aXRodGFnKTtcclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdGNiLmFwcGx5KFEuZW5naW5lLmNvbnRleHQsW3t0ZXh0Om91dHB1dC5qb2luKFwiXCIpLGZpbGU6ZmlsZWlkfV0pO1xyXG5cdH0pXHJcbn1cclxudmFyIGhpZ2hsaWdodFNlZz1mdW5jdGlvbihRLGZpbGVpZCxzZWdpZCxvcHRzLGNiKSB7XHJcblx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIHtcclxuXHRcdGNiPW9wdHM7XHJcblx0fVxyXG5cclxuXHRpZiAoIVEgfHwgIVEuZW5naW5lKSByZXR1cm4gY2IobnVsbCk7XHJcblx0dmFyIHNlZ29mZnNldHM9US5lbmdpbmUuZ2V0RmlsZVNlZ09mZnNldHMoZmlsZWlkKTtcclxuXHR2YXIgc3RhcnR2cG9zPXNlZ29mZnNldHNbc2VnaWQtMV07XHJcblx0dmFyIGVuZHZwb3M9c2Vnb2Zmc2V0c1tzZWdpZF07XHJcblx0dmFyIHNlZ25hbWVzPVEuZW5naW5lLmdldEZpbGVTZWdOYW1lcyhmaWxlaWQpO1xyXG5cclxuXHR0aGlzLmdldFNlZyhRLmVuZ2luZSxmaWxlaWQsc2VnaWQsZnVuY3Rpb24ocmVzKXtcclxuXHRcdHZhciBvcHQ9e3RleHQ6cmVzLnRleHQsaGl0czpudWxsLHZwb3M6c3RhcnR2cG9zLGZ1bGx0ZXh0OnRydWUsXHJcblx0XHRcdG5vc3BhbjpvcHRzLm5vc3Bhbixub2NybGY6b3B0cy5ub2NybGZ9O1xyXG5cdFx0b3B0LmhpdHM9aGl0SW5SYW5nZShRLHN0YXJ0dnBvcyxlbmR2cG9zKTtcclxuXHRcdGlmIChvcHRzLnJlbmRlclRhZ3MpIHtcclxuXHRcdFx0b3B0LnRhZ3M9dGFnc0luUmFuZ2UoUSxvcHRzLnJlbmRlclRhZ3Msc3RhcnR2cG9zLGVuZHZwb3MpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBzZWduYW1lPXNlZ25hbWVzW3NlZ2lkXTtcclxuXHRcdGNiLmFwcGx5KFEuZW5naW5lLmNvbnRleHQsW3t0ZXh0OmluamVjdFRhZyhRLG9wdCksc2VnOnNlZ2lkLGZpbGU6ZmlsZWlkLGhpdHM6b3B0LmhpdHMsc2VnbmFtZTpzZWduYW1lfV0pO1xyXG5cdH0pO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtyZXN1bHRsaXN0OnJlc3VsdGxpc3QsIFxyXG5cdGhpdEluUmFuZ2U6aGl0SW5SYW5nZSwgXHJcblx0aGlnaGxpZ2h0U2VnOmhpZ2hsaWdodFNlZyxcclxuXHRnZXRTZWc6Z2V0U2VnLFxyXG5cdGhpZ2hsaWdodEZpbGU6aGlnaGxpZ2h0RmlsZSxcclxuXHRnZXRGaWxlOmdldEZpbGVcclxuXHQvL2hpZ2hsaWdodFJhbmdlOmhpZ2hsaWdodFJhbmdlLFxyXG4gIC8vZ2V0UmFuZ2U6Z2V0UmFuZ2UsXHJcbn07IiwiLypcclxuICBLc2FuYSBTZWFyY2ggRW5naW5lLlxyXG5cclxuICBuZWVkIGEgS0RFIGluc3RhbmNlIHRvIGJlIGZ1bmN0aW9uYWxcclxuICBcclxuKi9cclxudmFyIGJzZWFyY2g9cmVxdWlyZShcIi4vYnNlYXJjaFwiKTtcclxudmFyIGRvc2VhcmNoPXJlcXVpcmUoXCIuL3NlYXJjaFwiKTtcclxuXHJcbnZhciBwcmVwYXJlRW5naW5lRm9yU2VhcmNoPWZ1bmN0aW9uKGVuZ2luZSxjYil7XHJcblx0aWYgKGVuZ2luZS5hbmFseXplcikge1xyXG5cdFx0Y2IoKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIGFuYWx5emVyPXJlcXVpcmUoXCJrc2FuYS1hbmFseXplclwiKTtcclxuXHR2YXIgY29uZmlnPWVuZ2luZS5nZXQoXCJtZXRhXCIpLmNvbmZpZztcclxuXHRlbmdpbmUuYW5hbHl6ZXI9YW5hbHl6ZXIuZ2V0QVBJKGNvbmZpZyk7XHJcblx0ZW5naW5lLmdldChbW1widG9rZW5zXCJdLFtcInBvc3RpbmdzbGVuZ3RoXCJdXSxmdW5jdGlvbigpe1xyXG5cdFx0Y2IoKTtcclxuXHR9KTtcclxufVxyXG5cclxudmFyIF9zZWFyY2g9ZnVuY3Rpb24oZW5naW5lLHEsb3B0cyxjYixjb250ZXh0KSB7XHJcblx0aWYgKHR5cGVvZiBlbmdpbmU9PVwic3RyaW5nXCIpIHsvL2Jyb3dzZXIgb25seVxyXG5cdFx0dmFyIGtkZT1yZXF1aXJlKFwia3NhbmEtZGF0YWJhc2VcIik7XHJcblx0XHRpZiAodHlwZW9mIG9wdHM9PVwiZnVuY3Rpb25cIikgeyAvL3VzZXIgZGlkbid0IHN1cHBseSBvcHRpb25zXHJcblx0XHRcdGlmICh0eXBlb2YgY2I9PVwib2JqZWN0XCIpY29udGV4dD1jYjtcclxuXHRcdFx0Y2I9b3B0cztcclxuXHRcdFx0b3B0cz17fTtcclxuXHRcdH1cclxuXHRcdG9wdHMucT1xO1xyXG5cdFx0b3B0cy5kYmlkPWVuZ2luZTtcclxuXHRcdGtkZS5vcGVuKG9wdHMuZGJpZCxmdW5jdGlvbihlcnIsZGIpe1xyXG5cdFx0XHRpZiAoZXJyKSB7XHJcblx0XHRcdFx0Y2IoZXJyKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Y29uc29sZS5sb2coXCJvcGVuZWRcIixvcHRzLmRiaWQpXHJcblx0XHRcdHByZXBhcmVFbmdpbmVGb3JTZWFyY2goZGIsZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gZG9zZWFyY2goZGIscSxvcHRzLGNiKTtcdFxyXG5cdFx0XHR9KTtcclxuXHRcdH0sY29udGV4dCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHByZXBhcmVFbmdpbmVGb3JTZWFyY2goZW5naW5lLGZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBkb3NlYXJjaChlbmdpbmUscSxvcHRzLGNiKTtcdFxyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG52YXIgX2hpZ2hsaWdodFNlZz1mdW5jdGlvbihlbmdpbmUsZmlsZWlkLHNlZ2lkLG9wdHMsY2Ipe1xyXG5cdGlmICghb3B0cy5xKSBvcHRzLnE9XCJcIjsgXHJcblx0X3NlYXJjaChlbmdpbmUsb3B0cy5xLG9wdHMsZnVuY3Rpb24oUSl7XHJcblx0XHRhcGkuZXhjZXJwdC5oaWdobGlnaHRTZWcoUSxmaWxlaWQsc2VnaWQsb3B0cyxjYik7XHJcblx0fSk7XHRcclxufVxyXG52YXIgX2hpZ2hsaWdodFJhbmdlPWZ1bmN0aW9uKGVuZ2luZSxzdGFydCxlbmQsb3B0cyxjYil7XHJcblxyXG5cdGlmIChvcHRzLnEpIHtcclxuXHRcdF9zZWFyY2goZW5naW5lLG9wdHMucSxvcHRzLGZ1bmN0aW9uKFEpe1xyXG5cdFx0XHRhcGkuZXhjZXJwdC5oaWdobGlnaHRSYW5nZShRLHN0YXJ0LGVuZCxvcHRzLGNiKTtcclxuXHRcdH0pO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRwcmVwYXJlRW5naW5lRm9yU2VhcmNoKGVuZ2luZSxmdW5jdGlvbigpe1xyXG5cdFx0XHRhcGkuZXhjZXJwdC5nZXRSYW5nZShlbmdpbmUsc3RhcnQsZW5kLGNiKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufVxyXG52YXIgX2hpZ2hsaWdodEZpbGU9ZnVuY3Rpb24oZW5naW5lLGZpbGVpZCxvcHRzLGNiKXtcclxuXHRpZiAoIW9wdHMucSkgb3B0cy5xPVwiXCI7IFxyXG5cdF9zZWFyY2goZW5naW5lLG9wdHMucSxvcHRzLGZ1bmN0aW9uKFEpe1xyXG5cdFx0YXBpLmV4Y2VycHQuaGlnaGxpZ2h0RmlsZShRLGZpbGVpZCxvcHRzLGNiKTtcclxuXHR9KTtcclxuXHQvKlxyXG5cdH0gZWxzZSB7XHJcblx0XHRhcGkuZXhjZXJwdC5nZXRGaWxlKGVuZ2luZSxmaWxlaWQsZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbZGF0YV0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdCovXHJcbn1cclxuXHJcbnZhciB2cG9zMmZpbGVzZWc9ZnVuY3Rpb24oZW5naW5lLHZwb3MpIHtcclxuICAgIHZhciBzZWdvZmZzZXRzPWVuZ2luZS5nZXQoXCJzZWdvZmZzZXRzXCIpO1xyXG4gICAgdmFyIGZpbGVvZmZzZXRzPWVuZ2luZS5nZXQoW1wiZmlsZW9mZnNldHNcIl0pO1xyXG4gICAgdmFyIHNlZ25hbWVzPWVuZ2luZS5nZXQoXCJzZWduYW1lc1wiKTtcclxuICAgIHZhciBmaWxlaWQ9YnNlYXJjaChmaWxlb2Zmc2V0cyx2cG9zKzEsdHJ1ZSk7XHJcbiAgICBmaWxlaWQtLTtcclxuICAgIHZhciBzZWdpZD1ic2VhcmNoKHNlZ29mZnNldHMsdnBvcysxLHRydWUpO1xyXG5cdHZhciByYW5nZT1lbmdpbmUuZ2V0RmlsZVJhbmdlKGZpbGVpZCk7XHJcblx0c2VnaWQtPXJhbmdlLnN0YXJ0O1xyXG4gICAgcmV0dXJuIHtmaWxlOmZpbGVpZCxzZWc6c2VnaWR9O1xyXG59XHJcbnZhciBhcGk9e1xyXG5cdHNlYXJjaDpfc2VhcmNoXHJcbi8vXHQsY29uY29yZGFuY2U6cmVxdWlyZShcIi4vY29uY29yZGFuY2VcIilcclxuLy9cdCxyZWdleDpyZXF1aXJlKFwiLi9yZWdleFwiKVxyXG5cdCxoaWdobGlnaHRTZWc6X2hpZ2hsaWdodFNlZ1xyXG5cdCxoaWdobGlnaHRGaWxlOl9oaWdobGlnaHRGaWxlXHJcbi8vXHQsaGlnaGxpZ2h0UmFuZ2U6X2hpZ2hsaWdodFJhbmdlXHJcblx0LGV4Y2VycHQ6cmVxdWlyZShcIi4vZXhjZXJwdFwiKVxyXG5cdCx2cG9zMmZpbGVzZWc6dnBvczJmaWxlc2VnXHJcbn1cclxubW9kdWxlLmV4cG9ydHM9YXBpOyIsIlxyXG52YXIgdW5wYWNrID0gZnVuY3Rpb24gKGFyKSB7IC8vIHVucGFjayB2YXJpYWJsZSBsZW5ndGggaW50ZWdlciBsaXN0XHJcbiAgdmFyIHIgPSBbXSxcclxuICBpID0gMCxcclxuICB2ID0gMDtcclxuICBkbyB7XHJcblx0dmFyIHNoaWZ0ID0gMDtcclxuXHRkbyB7XHJcblx0ICB2ICs9ICgoYXJbaV0gJiAweDdGKSA8PCBzaGlmdCk7XHJcblx0ICBzaGlmdCArPSA3O1xyXG5cdH0gd2hpbGUgKGFyWysraV0gJiAweDgwKTtcclxuXHRyW3IubGVuZ3RoXT12O1xyXG4gIH0gd2hpbGUgKGkgPCBhci5sZW5ndGgpO1xyXG4gIHJldHVybiByO1xyXG59XHJcblxyXG4vKlxyXG4gICBhcnI6ICBbMSwxLDEsMSwxLDEsMSwxLDFdXHJcbiAgIGxldmVsczogWzAsMSwxLDIsMiwwLDEsMl1cclxuICAgb3V0cHV0OiBbNSwxLDMsMSwxLDMsMSwxXVxyXG4qL1xyXG5cclxudmFyIGdyb3Vwc3VtPWZ1bmN0aW9uKGFycixsZXZlbHMpIHtcclxuICBpZiAoYXJyLmxlbmd0aCE9bGV2ZWxzLmxlbmd0aCsxKSByZXR1cm4gbnVsbDtcclxuICB2YXIgc3RhY2s9W107XHJcbiAgdmFyIG91dHB1dD1uZXcgQXJyYXkobGV2ZWxzLmxlbmd0aCk7XHJcbiAgZm9yICh2YXIgaT0wO2k8bGV2ZWxzLmxlbmd0aDtpKyspIG91dHB1dFtpXT0wO1xyXG4gIGZvciAodmFyIGk9MTtpPGFyci5sZW5ndGg7aSsrKSB7IC8vZmlyc3Qgb25lIG91dCBvZiB0b2Mgc2NvcGUsIGlnbm9yZWRcclxuICAgIGlmIChzdGFjay5sZW5ndGg+bGV2ZWxzW2ktMV0pIHtcclxuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aD5sZXZlbHNbaS0xXSkgc3RhY2sucG9wKCk7XHJcbiAgICB9XHJcbiAgICBzdGFjay5wdXNoKGktMSk7XHJcbiAgICBmb3IgKHZhciBqPTA7ajxzdGFjay5sZW5ndGg7aisrKSB7XHJcbiAgICAgIG91dHB1dFtzdGFja1tqXV0rPWFycltpXTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG91dHB1dDtcclxufVxyXG4vKiBhcnI9IDEgLCAyICwgMyAsNCAsNSw2LDcgLy90b2tlbiBwb3N0aW5nXHJcbiAgcG9zdGluZz0gMyAsIDUgIC8vdGFnIHBvc3RpbmdcclxuICBvdXQgPSAzICwgMiwgMlxyXG4qL1xyXG52YXIgY291bnRieXBvc3RpbmcgPSBmdW5jdGlvbiAoYXJyLCBwb3N0aW5nKSB7XHJcbiAgaWYgKCFwb3N0aW5nLmxlbmd0aCkgcmV0dXJuIFthcnIubGVuZ3RoXTtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGZvciAodmFyIGk9MDtpPHBvc3RpbmcubGVuZ3RoO2krKykgb3V0W2ldPTA7XHJcbiAgb3V0W3Bvc3RpbmcubGVuZ3RoXT0wO1xyXG4gIHZhciBwPTAsaT0wLGxhc3RpPTA7XHJcbiAgd2hpbGUgKGk8YXJyLmxlbmd0aCAmJiBwPHBvc3RpbmcubGVuZ3RoKSB7XHJcbiAgICBpZiAoYXJyW2ldPD1wb3N0aW5nW3BdKSB7XHJcbiAgICAgIHdoaWxlIChwPHBvc3RpbmcubGVuZ3RoICYmIGk8YXJyLmxlbmd0aCAmJiBhcnJbaV08PXBvc3RpbmdbcF0pIHtcclxuICAgICAgICBvdXRbcF0rKztcclxuICAgICAgICBpKys7XHJcbiAgICAgIH0gICAgICBcclxuICAgIH0gXHJcbiAgICBwKys7XHJcbiAgfVxyXG4gIG91dFtwb3N0aW5nLmxlbmd0aF0gPSBhcnIubGVuZ3RoLWk7IC8vcmVtYWluaW5nXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxudmFyIGdyb3VwYnlwb3N0aW5nPWZ1bmN0aW9uKGFycixncG9zdGluZykgeyAvL3JlbGF0aXZlIHZwb3NcclxuICBpZiAoIWdwb3N0aW5nLmxlbmd0aCkgcmV0dXJuIFthcnIubGVuZ3RoXTtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGZvciAodmFyIGk9MDtpPD1ncG9zdGluZy5sZW5ndGg7aSsrKSBvdXRbaV09W107XHJcbiAgXHJcbiAgdmFyIHA9MCxpPTAsbGFzdGk9MDtcclxuICB3aGlsZSAoaTxhcnIubGVuZ3RoICYmIHA8Z3Bvc3RpbmcubGVuZ3RoKSB7XHJcbiAgICBpZiAoYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgIHdoaWxlIChwPGdwb3N0aW5nLmxlbmd0aCAmJiBpPGFyci5sZW5ndGggJiYgYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgICAgdmFyIHN0YXJ0PTA7XHJcbiAgICAgICAgaWYgKHA+MCkgc3RhcnQ9Z3Bvc3RpbmdbcC0xXTtcclxuICAgICAgICBvdXRbcF0ucHVzaChhcnJbaSsrXS1zdGFydCk7ICAvLyByZWxhdGl2ZVxyXG4gICAgICB9ICAgICAgXHJcbiAgICB9IFxyXG4gICAgcCsrO1xyXG4gIH1cclxuICAvL3JlbWFpbmluZ1xyXG4gIHdoaWxlKGk8YXJyLmxlbmd0aCkgb3V0W291dC5sZW5ndGgtMV0ucHVzaChhcnJbaSsrXS1ncG9zdGluZ1tncG9zdGluZy5sZW5ndGgtMV0pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxudmFyIGdyb3VwYnlwb3N0aW5nMj1mdW5jdGlvbihhcnIsZ3Bvc3RpbmcpIHsgLy9hYnNvbHV0ZSB2cG9zXHJcbiAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHJldHVybiBbXTtcclxuICBpZiAoIWdwb3N0aW5nLmxlbmd0aCkgcmV0dXJuIFthcnIubGVuZ3RoXTtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGZvciAodmFyIGk9MDtpPD1ncG9zdGluZy5sZW5ndGg7aSsrKSBvdXRbaV09W107XHJcbiAgXHJcbiAgdmFyIHA9MCxpPTAsbGFzdGk9MDtcclxuICB3aGlsZSAoaTxhcnIubGVuZ3RoICYmIHA8Z3Bvc3RpbmcubGVuZ3RoKSB7XHJcbiAgICBpZiAoYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgIHdoaWxlIChwPGdwb3N0aW5nLmxlbmd0aCAmJiBpPGFyci5sZW5ndGggJiYgYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgICAgdmFyIHN0YXJ0PTA7XHJcbiAgICAgICAgaWYgKHA+MCkgc3RhcnQ9Z3Bvc3RpbmdbcC0xXTsgLy9hYnNvbHV0ZVxyXG4gICAgICAgIG91dFtwXS5wdXNoKGFycltpKytdKTtcclxuICAgICAgfSAgICAgIFxyXG4gICAgfSBcclxuICAgIHArKztcclxuICB9XHJcbiAgLy9yZW1haW5pbmdcclxuICB3aGlsZShpPGFyci5sZW5ndGgpIG91dFtvdXQubGVuZ3RoLTFdLnB1c2goYXJyW2krK10tZ3Bvc3RpbmdbZ3Bvc3RpbmcubGVuZ3RoLTFdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcbnZhciBncm91cGJ5YmxvY2syID0gZnVuY3Rpb24oYXIsIG50b2tlbixzbG90c2hpZnQsb3B0cykge1xyXG4gIGlmICghYXIubGVuZ3RoKSByZXR1cm4gW3t9LHt9XTtcclxuICBcclxuICBzbG90c2hpZnQgPSBzbG90c2hpZnQgfHwgMTY7XHJcbiAgdmFyIGcgPSBNYXRoLnBvdygyLHNsb3RzaGlmdCk7XHJcbiAgdmFyIGkgPSAwO1xyXG4gIHZhciByID0ge30sIG50b2tlbnM9e307XHJcbiAgdmFyIGdyb3VwY291bnQ9MDtcclxuICBkbyB7XHJcbiAgICB2YXIgZ3JvdXAgPSBNYXRoLmZsb29yKGFyW2ldIC8gZykgO1xyXG4gICAgaWYgKCFyW2dyb3VwXSkge1xyXG4gICAgICByW2dyb3VwXSA9IFtdO1xyXG4gICAgICBudG9rZW5zW2dyb3VwXT1bXTtcclxuICAgICAgZ3JvdXBjb3VudCsrO1xyXG4gICAgfVxyXG4gICAgcltncm91cF0ucHVzaChhcltpXSAlIGcpO1xyXG4gICAgbnRva2Vuc1tncm91cF0ucHVzaChudG9rZW5baV0pO1xyXG4gICAgaSsrO1xyXG4gIH0gd2hpbGUgKGkgPCBhci5sZW5ndGgpO1xyXG4gIGlmIChvcHRzKSBvcHRzLmdyb3VwY291bnQ9Z3JvdXBjb3VudDtcclxuICByZXR1cm4gW3IsbnRva2Vuc107XHJcbn1cclxudmFyIGdyb3VwYnlzbG90ID0gZnVuY3Rpb24gKGFyLCBzbG90c2hpZnQsIG9wdHMpIHtcclxuICBpZiAoIWFyLmxlbmd0aClcclxuXHRyZXR1cm4ge307XHJcbiAgXHJcbiAgc2xvdHNoaWZ0ID0gc2xvdHNoaWZ0IHx8IDE2O1xyXG4gIHZhciBnID0gTWF0aC5wb3coMixzbG90c2hpZnQpO1xyXG4gIHZhciBpID0gMDtcclxuICB2YXIgciA9IHt9O1xyXG4gIHZhciBncm91cGNvdW50PTA7XHJcbiAgZG8ge1xyXG5cdHZhciBncm91cCA9IE1hdGguZmxvb3IoYXJbaV0gLyBnKSA7XHJcblx0aWYgKCFyW2dyb3VwXSkge1xyXG5cdCAgcltncm91cF0gPSBbXTtcclxuXHQgIGdyb3VwY291bnQrKztcclxuXHR9XHJcblx0cltncm91cF0ucHVzaChhcltpXSAlIGcpO1xyXG5cdGkrKztcclxuICB9IHdoaWxlIChpIDwgYXIubGVuZ3RoKTtcclxuICBpZiAob3B0cykgb3B0cy5ncm91cGNvdW50PWdyb3VwY291bnQ7XHJcbiAgcmV0dXJuIHI7XHJcbn1cclxuLypcclxudmFyIGlkZW50aXR5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG52YXIgc29ydGVkSW5kZXggPSBmdW5jdGlvbiAoYXJyYXksIG9iaiwgaXRlcmF0b3IpIHsgLy90YWtlbiBmcm9tIHVuZGVyc2NvcmVcclxuICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBpZGVudGl0eSk7XHJcbiAgdmFyIGxvdyA9IDAsXHJcbiAgaGlnaCA9IGFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAobG93IDwgaGlnaCkge1xyXG5cdHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4gMTtcclxuXHRpdGVyYXRvcihhcnJheVttaWRdKSA8IGl0ZXJhdG9yKG9iaikgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcclxuICB9XHJcbiAgcmV0dXJuIGxvdztcclxufTsqL1xyXG5cclxudmFyIGluZGV4T2ZTb3J0ZWQgPSBmdW5jdGlvbiAoYXJyYXksIG9iaikgeyBcclxuICB2YXIgbG93ID0gMCxcclxuICBoaWdoID0gYXJyYXkubGVuZ3RoLTE7XHJcbiAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcclxuICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4gMTtcclxuICAgIGFycmF5W21pZF0gPCBvYmogPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcclxuICB9XHJcbiAgcmV0dXJuIGxvdztcclxufTtcclxudmFyIHBsaGVhZD1mdW5jdGlvbihwbCwgcGx0YWcsIG9wdHMpIHtcclxuICBvcHRzPW9wdHN8fHt9O1xyXG4gIG9wdHMubWF4PW9wdHMubWF4fHwxO1xyXG4gIHZhciBvdXQ9W107XHJcbiAgaWYgKHBsdGFnLmxlbmd0aDxwbC5sZW5ndGgpIHtcclxuICAgIGZvciAodmFyIGk9MDtpPHBsdGFnLmxlbmd0aDtpKyspIHtcclxuICAgICAgIGsgPSBpbmRleE9mU29ydGVkKHBsLCBwbHRhZ1tpXSk7XHJcbiAgICAgICBpZiAoaz4tMSAmJiBrPHBsLmxlbmd0aCkge1xyXG4gICAgICAgIGlmIChwbFtrXT09cGx0YWdbaV0pIHtcclxuICAgICAgICAgIG91dFtvdXQubGVuZ3RoXT1wbHRhZ1tpXTtcclxuICAgICAgICAgIGlmIChvdXQubGVuZ3RoPj1vcHRzLm1heCkgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGZvciAodmFyIGk9MDtpPHBsLmxlbmd0aDtpKyspIHtcclxuICAgICAgIGsgPSBpbmRleE9mU29ydGVkKHBsdGFnLCBwbFtpXSk7XHJcbiAgICAgICBpZiAoaz4tMSAmJiBrPHBsdGFnLmxlbmd0aCkge1xyXG4gICAgICAgIGlmIChwbHRhZ1trXT09cGxbaV0pIHtcclxuICAgICAgICAgIG91dFtvdXQubGVuZ3RoXT1wbHRhZ1trXTtcclxuICAgICAgICAgIGlmIChvdXQubGVuZ3RoPj1vcHRzLm1heCkgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuLypcclxuIHBsMiBvY2N1ciBhZnRlciBwbDEsIFxyXG4gcGwyPj1wbDErbWluZGlzXHJcbiBwbDI8PXBsMSttYXhkaXNcclxuKi9cclxudmFyIHBsZm9sbG93MiA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgbWluZGlzLCBtYXhkaXMpIHtcclxuICB2YXIgciA9IFtdLGk9MDtcclxuICB2YXIgc3dhcCA9IDA7XHJcbiAgXHJcbiAgd2hpbGUgKGk8cGwxLmxlbmd0aCl7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBtaW5kaXMpO1xyXG4gICAgdmFyIHQgPSAocGwyW2tdID49IChwbDFbaV0gK21pbmRpcykgJiYgcGwyW2tdPD0ocGwxW2ldK21heGRpcykpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkge1xyXG4gICAgICByW3IubGVuZ3RoXT1wbDFbaV07XHJcbiAgICAgIGkrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChrPj1wbDIubGVuZ3RoKSBicmVhaztcclxuICAgICAgdmFyIGsyPWluZGV4T2ZTb3J0ZWQgKHBsMSxwbDJba10tbWF4ZGlzKTtcclxuICAgICAgaWYgKGsyPmkpIHtcclxuICAgICAgICB2YXIgdCA9IChwbDJba10gPj0gKHBsMVtpXSArbWluZGlzKSAmJiBwbDJba108PShwbDFbaV0rbWF4ZGlzKSkgPyBrIDogLTE7XHJcbiAgICAgICAgaWYgKHQ+LTEpIHJbci5sZW5ndGhdPXBsMVtrMl07XHJcbiAgICAgICAgaT1rMjtcclxuICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG5cclxudmFyIHBsbm90Zm9sbG93MiA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgbWluZGlzLCBtYXhkaXMpIHtcclxuICB2YXIgciA9IFtdLGk9MDtcclxuICBcclxuICB3aGlsZSAoaTxwbDEubGVuZ3RoKXtcclxuICAgIHZhciBrID0gaW5kZXhPZlNvcnRlZChwbDIsIHBsMVtpXSArIG1pbmRpcyk7XHJcbiAgICB2YXIgdCA9IChwbDJba10gPj0gKHBsMVtpXSArbWluZGlzKSAmJiBwbDJba108PShwbDFbaV0rbWF4ZGlzKSkgPyBrIDogLTE7XHJcbiAgICBpZiAodCA+IC0xKSB7XHJcbiAgICAgIGkrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChrPj1wbDIubGVuZ3RoKSB7XHJcbiAgICAgICAgcj1yLmNvbmNhdChwbDEuc2xpY2UoaSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBrMj1pbmRleE9mU29ydGVkIChwbDEscGwyW2tdLW1heGRpcyk7XHJcbiAgICAgICAgaWYgKGsyPmkpIHtcclxuICAgICAgICAgIHI9ci5jb25jYXQocGwxLnNsaWNlKGksazIpKTtcclxuICAgICAgICAgIGk9azI7XHJcbiAgICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbi8qIHRoaXMgaXMgaW5jb3JyZWN0ICovXHJcbnZhciBwbGZvbGxvdyA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgZGlzdGFuY2UpIHtcclxuICB2YXIgciA9IFtdLGk9MDtcclxuXHJcbiAgd2hpbGUgKGk8cGwxLmxlbmd0aCl7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBkaXN0YW5jZSk7XHJcbiAgICB2YXIgdCA9IChwbDJba10gPT09IChwbDFbaV0gKyBkaXN0YW5jZSkpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkge1xyXG4gICAgICByLnB1c2gocGwxW2ldKTtcclxuICAgICAgaSsrO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGs+PXBsMi5sZW5ndGgpIGJyZWFrO1xyXG4gICAgICB2YXIgazI9aW5kZXhPZlNvcnRlZCAocGwxLHBsMltrXS1kaXN0YW5jZSk7XHJcbiAgICAgIGlmIChrMj5pKSB7XHJcbiAgICAgICAgdCA9IChwbDJba10gPT09IChwbDFbazJdICsgZGlzdGFuY2UpKSA/IGsgOiAtMTtcclxuICAgICAgICBpZiAodD4tMSkge1xyXG4gICAgICAgICAgIHIucHVzaChwbDFbazJdKTtcclxuICAgICAgICAgICBrMisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpPWsyO1xyXG4gICAgICB9IGVsc2UgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbnZhciBwbG5vdGZvbGxvdyA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgZGlzdGFuY2UpIHtcclxuICB2YXIgciA9IFtdO1xyXG4gIHZhciByID0gW10saT0wO1xyXG4gIHZhciBzd2FwID0gMDtcclxuICBcclxuICB3aGlsZSAoaTxwbDEubGVuZ3RoKXtcclxuICAgIHZhciBrID0gaW5kZXhPZlNvcnRlZChwbDIsIHBsMVtpXSArIGRpc3RhbmNlKTtcclxuICAgIHZhciB0ID0gKHBsMltrXSA9PT0gKHBsMVtpXSArIGRpc3RhbmNlKSkgPyBrIDogLTE7XHJcbiAgICBpZiAodCA+IC0xKSB7IFxyXG4gICAgICBpKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaz49cGwyLmxlbmd0aCkge1xyXG4gICAgICAgIHI9ci5jb25jYXQocGwxLnNsaWNlKGkpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgazI9aW5kZXhPZlNvcnRlZCAocGwxLHBsMltrXS1kaXN0YW5jZSk7XHJcbiAgICAgICAgaWYgKGsyPmkpIHtcclxuICAgICAgICAgIHI9ci5jb25jYXQocGwxLnNsaWNlKGksazIpKTtcclxuICAgICAgICAgIGk9azI7XHJcbiAgICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbnZhciBwbGFuZCA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgZGlzdGFuY2UpIHtcclxuICB2YXIgciA9IFtdO1xyXG4gIHZhciBzd2FwID0gMDtcclxuICBcclxuICBpZiAocGwxLmxlbmd0aCA+IHBsMi5sZW5ndGgpIHsgLy9zd2FwIGZvciBmYXN0ZXIgY29tcGFyZVxyXG4gICAgdmFyIHQgPSBwbDI7XHJcbiAgICBwbDIgPSBwbDE7XHJcbiAgICBwbDEgPSB0O1xyXG4gICAgc3dhcCA9IGRpc3RhbmNlO1xyXG4gICAgZGlzdGFuY2UgPSAtZGlzdGFuY2U7XHJcbiAgfVxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGwxLmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBkaXN0YW5jZSk7XHJcbiAgICB2YXIgdCA9IChwbDJba10gPT09IChwbDFbaV0gKyBkaXN0YW5jZSkpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkge1xyXG4gICAgICByLnB1c2gocGwxW2ldIC0gc3dhcCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbnZhciBjb21iaW5lPWZ1bmN0aW9uIChwb3N0aW5ncykge1xyXG4gIHZhciBvdXQ9W107XHJcbiAgZm9yICh2YXIgaSBpbiBwb3N0aW5ncykge1xyXG4gICAgb3V0PW91dC5jb25jYXQocG9zdGluZ3NbaV0pO1xyXG4gIH1cclxuICBvdXQuc29ydChmdW5jdGlvbihhLGIpe3JldHVybiBhLWJ9KTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG52YXIgdW5pcXVlID0gZnVuY3Rpb24oYXIpe1xyXG4gICBpZiAoIWFyIHx8ICFhci5sZW5ndGgpIHJldHVybiBbXTtcclxuICAgdmFyIHUgPSB7fSwgYSA9IFtdO1xyXG4gICBmb3IodmFyIGkgPSAwLCBsID0gYXIubGVuZ3RoOyBpIDwgbDsgKytpKXtcclxuICAgIGlmKHUuaGFzT3duUHJvcGVydHkoYXJbaV0pKSBjb250aW51ZTtcclxuICAgIGEucHVzaChhcltpXSk7XHJcbiAgICB1W2FyW2ldXSA9IDE7XHJcbiAgIH1cclxuICAgcmV0dXJuIGE7XHJcbn1cclxuXHJcblxyXG5cclxudmFyIHBscGhyYXNlID0gZnVuY3Rpb24gKHBvc3RpbmdzLG9wcykge1xyXG4gIHZhciByID0gW107XHJcbiAgZm9yICh2YXIgaT0wO2k8cG9zdGluZ3MubGVuZ3RoO2krKykge1xyXG4gIFx0aWYgKCFwb3N0aW5nc1tpXSkgIHJldHVybiBbXTtcclxuICBcdGlmICgwID09PSBpKSB7XHJcbiAgXHQgIHIgPSBwb3N0aW5nc1swXTtcclxuICBcdH0gZWxzZSB7XHJcbiAgICAgIGlmIChvcHNbaV09PSdhbmRub3QnKSB7XHJcbiAgICAgICAgciA9IHBsbm90Zm9sbG93KHIsIHBvc3RpbmdzW2ldLCBpKTsgIFxyXG4gICAgICB9ZWxzZSB7XHJcbiAgICAgICAgciA9IHBsYW5kKHIsIHBvc3RpbmdzW2ldLCBpKTsgIFxyXG4gICAgICB9XHJcbiAgXHR9XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiByO1xyXG59XHJcbi8vcmV0dXJuIGFuIGFycmF5IG9mIGdyb3VwIGhhdmluZyBhbnkgb2YgcGwgaXRlbVxyXG52YXIgbWF0Y2hQb3N0aW5nPWZ1bmN0aW9uKHBsLGd1cGwsc3RhcnQsZW5kKSB7XHJcbiAgc3RhcnQ9c3RhcnR8fDA7XHJcbiAgZW5kPWVuZHx8LTE7XHJcbiAgaWYgKGVuZD09LTEpIGVuZD1NYXRoLnBvdygyLCA1Myk7IC8vIG1heCBpbnRlZ2VyIHZhbHVlXHJcblxyXG4gIHZhciBjb3VudD0wLCBpID0gaj0gMCwgIHJlc3VsdCA9IFtdICx2PTA7XHJcbiAgdmFyIGRvY3M9W10sIGZyZXE9W107XHJcbiAgaWYgKCFwbCkgcmV0dXJuIHtkb2NzOltdLGZyZXE6W119O1xyXG4gIHdoaWxlKCBpIDwgcGwubGVuZ3RoICYmIGogPCBndXBsLmxlbmd0aCApe1xyXG4gICAgIGlmIChwbFtpXSA8IGd1cGxbal0gKXsgXHJcbiAgICAgICBjb3VudCsrO1xyXG4gICAgICAgdj1wbFtpXTtcclxuICAgICAgIGkrKzsgXHJcbiAgICAgfSBlbHNlIHtcclxuICAgICAgIGlmIChjb3VudCkge1xyXG4gICAgICAgIGlmICh2Pj1zdGFydCAmJiB2PGVuZCkge1xyXG4gICAgICAgICAgZG9jcy5wdXNoKGopO1xyXG4gICAgICAgICAgZnJlcS5wdXNoKGNvdW50KTsgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgfVxyXG4gICAgICAgaisrO1xyXG4gICAgICAgY291bnQ9MDtcclxuICAgICB9XHJcbiAgfVxyXG4gIGlmIChjb3VudCAmJiBqPGd1cGwubGVuZ3RoICYmIHY+PXN0YXJ0ICYmIHY8ZW5kKSB7XHJcbiAgICBkb2NzLnB1c2goaik7XHJcbiAgICBmcmVxLnB1c2goY291bnQpO1xyXG4gICAgY291bnQ9MDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB3aGlsZSAoaj09Z3VwbC5sZW5ndGggJiYgaTxwbC5sZW5ndGggJiYgcGxbaV0gPj0gZ3VwbFtndXBsLmxlbmd0aC0xXSkge1xyXG4gICAgICBpKys7XHJcbiAgICAgIGNvdW50Kys7XHJcbiAgICB9XHJcbiAgICBpZiAodj49c3RhcnQgJiYgdjxlbmQpIHtcclxuICAgICAgZG9jcy5wdXNoKGopO1xyXG4gICAgICBmcmVxLnB1c2goY291bnQpOyAgICAgIFxyXG4gICAgfVxyXG4gIH0gXHJcbiAgcmV0dXJuIHtkb2NzOmRvY3MsZnJlcTpmcmVxfTtcclxufVxyXG5cclxudmFyIHRyaW09ZnVuY3Rpb24oYXJyLHN0YXJ0LGVuZCkge1xyXG4gIHZhciBzPWluZGV4T2ZTb3J0ZWQoYXJyLHN0YXJ0KTtcclxuICB2YXIgZT1pbmRleE9mU29ydGVkKGFycixlbmQpO1xyXG4gIHJldHVybiBhcnIuc2xpY2UocyxlKzEpO1xyXG59XHJcbnZhciBwbGlzdD17fTtcclxucGxpc3QudW5wYWNrPXVucGFjaztcclxucGxpc3QucGxwaHJhc2U9cGxwaHJhc2U7XHJcbnBsaXN0LnBsaGVhZD1wbGhlYWQ7XHJcbnBsaXN0LnBsZm9sbG93Mj1wbGZvbGxvdzI7XHJcbnBsaXN0LnBsbm90Zm9sbG93Mj1wbG5vdGZvbGxvdzI7XHJcbnBsaXN0LnBsZm9sbG93PXBsZm9sbG93O1xyXG5wbGlzdC5wbG5vdGZvbGxvdz1wbG5vdGZvbGxvdztcclxucGxpc3QudW5pcXVlPXVuaXF1ZTtcclxucGxpc3QuaW5kZXhPZlNvcnRlZD1pbmRleE9mU29ydGVkO1xyXG5wbGlzdC5tYXRjaFBvc3Rpbmc9bWF0Y2hQb3N0aW5nO1xyXG5wbGlzdC50cmltPXRyaW07XHJcblxyXG5wbGlzdC5ncm91cGJ5c2xvdD1ncm91cGJ5c2xvdDtcclxucGxpc3QuZ3JvdXBieWJsb2NrMj1ncm91cGJ5YmxvY2syO1xyXG5wbGlzdC5jb3VudGJ5cG9zdGluZz1jb3VudGJ5cG9zdGluZztcclxucGxpc3QuZ3JvdXBieXBvc3Rpbmc9Z3JvdXBieXBvc3Rpbmc7XHJcbnBsaXN0Lmdyb3VwYnlwb3N0aW5nMj1ncm91cGJ5cG9zdGluZzI7XHJcbnBsaXN0Lmdyb3Vwc3VtPWdyb3Vwc3VtO1xyXG5wbGlzdC5jb21iaW5lPWNvbWJpbmU7XHJcbm1vZHVsZS5leHBvcnRzPXBsaXN0OyIsIi8qXHJcbnZhciBkb3NlYXJjaDI9ZnVuY3Rpb24oZW5naW5lLG9wdHMsY2IsY29udGV4dCkge1xyXG5cdG9wdHNcclxuXHRcdG5maWxlLG5wYWdlICAvL3JldHVybiBhIGhpZ2hsaWdodGVkIHBhZ2VcclxuXHRcdG5maWxlLFtwYWdlc10gLy9yZXR1cm4gaGlnaGxpZ2h0ZWQgcGFnZXMgXHJcblx0XHRuZmlsZSAgICAgICAgLy9yZXR1cm4gZW50aXJlIGhpZ2hsaWdodGVkIGZpbGVcclxuXHRcdGFic19ucGFnZVxyXG5cdFx0W2Fic19wYWdlc10gIC8vcmV0dXJuIHNldCBvZiBoaWdobGlnaHRlZCBwYWdlcyAobWF5IGNyb3NzIGZpbGUpXHJcblxyXG5cdFx0ZmlsZW5hbWUsIHBhZ2VuYW1lXHJcblx0XHRmaWxlbmFtZSxbcGFnZW5hbWVzXVxyXG5cclxuXHRcdGV4Y2VycHQgICAgICAvL1xyXG5cdCAgICBzb3J0QnkgICAgICAgLy9kZWZhdWx0IG5hdHVyYWwsIHNvcnRieSBieSB2c20gcmFua2luZ1xyXG5cclxuXHQvL3JldHVybiBlcnIsYXJyYXlfb2Zfc3RyaW5nICxRICAoUSBjb250YWlucyBsb3cgbGV2ZWwgc2VhcmNoIHJlc3VsdClcclxufVxyXG5cclxuKi9cclxuLyogVE9ETyBzb3J0ZWQgdG9rZW5zICovXHJcbnZhciBwbGlzdD1yZXF1aXJlKFwiLi9wbGlzdFwiKTtcclxudmFyIGJvb2xzZWFyY2g9cmVxdWlyZShcIi4vYm9vbHNlYXJjaFwiKTtcclxudmFyIGV4Y2VycHQ9cmVxdWlyZShcIi4vZXhjZXJwdFwiKTtcclxudmFyIHBhcnNlVGVybSA9IGZ1bmN0aW9uKGVuZ2luZSxyYXcsb3B0cykge1xyXG5cdGlmICghcmF3KSByZXR1cm47XHJcblx0dmFyIHJlcz17cmF3OnJhdyx2YXJpYW50czpbXSx0ZXJtOicnLG9wOicnfTtcclxuXHR2YXIgdGVybT1yYXcsIG9wPTA7XHJcblx0dmFyIGZpcnN0Y2hhcj10ZXJtWzBdO1xyXG5cdHZhciB0ZXJtcmVnZXg9XCJcIjtcclxuXHRpZiAoZmlyc3RjaGFyPT0nLScpIHtcclxuXHRcdHRlcm09dGVybS5zdWJzdHJpbmcoMSk7XHJcblx0XHRmaXJzdGNoYXI9dGVybVswXTtcclxuXHRcdHJlcy5leGNsdWRlPXRydWU7IC8vZXhjbHVkZVxyXG5cdH1cclxuXHR0ZXJtPXRlcm0udHJpbSgpO1xyXG5cdHZhciBsYXN0Y2hhcj10ZXJtW3Rlcm0ubGVuZ3RoLTFdO1xyXG5cdHRlcm09ZW5naW5lLmFuYWx5emVyLm5vcm1hbGl6ZSh0ZXJtKTtcclxuXHRcclxuXHRpZiAodGVybS5pbmRleE9mKFwiJVwiKT4tMSkge1xyXG5cdFx0dmFyIHRlcm1yZWdleD1cIl5cIit0ZXJtLnJlcGxhY2UoLyUrL2csXCIuK1wiKStcIiRcIjtcclxuXHRcdGlmIChmaXJzdGNoYXI9PVwiJVwiKSBcdHRlcm1yZWdleD1cIi4rXCIrdGVybXJlZ2V4LnN1YnN0cigxKTtcclxuXHRcdGlmIChsYXN0Y2hhcj09XCIlXCIpIFx0dGVybXJlZ2V4PXRlcm1yZWdleC5zdWJzdHIoMCx0ZXJtcmVnZXgubGVuZ3RoLTEpK1wiLitcIjtcclxuXHR9XHJcblxyXG5cdGlmICh0ZXJtcmVnZXgpIHtcclxuXHRcdHJlcy52YXJpYW50cz1leHBhbmRUZXJtKGVuZ2luZSx0ZXJtcmVnZXgpO1xyXG5cdH1cclxuXHJcblx0cmVzLmtleT10ZXJtO1xyXG5cdHJldHVybiByZXM7XHJcbn1cclxudmFyIGV4cGFuZFRlcm09ZnVuY3Rpb24oZW5naW5lLHJlZ2V4KSB7XHJcblx0dmFyIHI9bmV3IFJlZ0V4cChyZWdleCk7XHJcblx0dmFyIHRva2Vucz1lbmdpbmUuZ2V0KFwidG9rZW5zXCIpO1xyXG5cdHZhciBwb3N0aW5nc0xlbmd0aD1lbmdpbmUuZ2V0KFwicG9zdGluZ3NsZW5ndGhcIik7XHJcblx0aWYgKCFwb3N0aW5nc0xlbmd0aCkgcG9zdGluZ3NMZW5ndGg9W107XHJcblx0dmFyIG91dD1bXTtcclxuXHRmb3IgKHZhciBpPTA7aTx0b2tlbnMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIG09dG9rZW5zW2ldLm1hdGNoKHIpO1xyXG5cdFx0aWYgKG0pIHtcclxuXHRcdFx0b3V0LnB1c2goW21bMF0scG9zdGluZ3NMZW5ndGhbaV18fDFdKTtcclxuXHRcdH1cclxuXHR9XHJcblx0b3V0LnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYlsxXS1hWzFdfSk7XHJcblx0cmV0dXJuIG91dDtcclxufVxyXG52YXIgaXNXaWxkY2FyZD1mdW5jdGlvbihyYXcpIHtcclxuXHRyZXR1cm4gISFyYXcubWF0Y2goL1tcXCpcXD9dLyk7XHJcbn1cclxuXHJcbnZhciBpc09yVGVybT1mdW5jdGlvbih0ZXJtKSB7XHJcblx0dGVybT10ZXJtLnRyaW0oKTtcclxuXHRyZXR1cm4gKHRlcm1bdGVybS5sZW5ndGgtMV09PT0nLCcpO1xyXG59XHJcbnZhciBvcnRlcm09ZnVuY3Rpb24oZW5naW5lLHRlcm0sa2V5KSB7XHJcblx0XHR2YXIgdD17dGV4dDprZXl9O1xyXG5cdFx0aWYgKGVuZ2luZS5hbmFseXplci5zaW1wbGlmaWVkVG9rZW4pIHtcclxuXHRcdFx0dC5zaW1wbGlmaWVkPWVuZ2luZS5hbmFseXplci5zaW1wbGlmaWVkVG9rZW4oa2V5KTtcclxuXHRcdH1cclxuXHRcdHRlcm0udmFyaWFudHMucHVzaCh0KTtcclxufVxyXG52YXIgb3JUZXJtcz1mdW5jdGlvbihlbmdpbmUsdG9rZW5zLG5vdykge1xyXG5cdHZhciByYXc9dG9rZW5zW25vd107XHJcblx0dmFyIHRlcm09cGFyc2VUZXJtKGVuZ2luZSxyYXcpO1xyXG5cdGlmICghdGVybSkgcmV0dXJuO1xyXG5cdG9ydGVybShlbmdpbmUsdGVybSx0ZXJtLmtleSk7XHJcblx0d2hpbGUgKGlzT3JUZXJtKHJhdykpICB7XHJcblx0XHRyYXc9dG9rZW5zWysrbm93XTtcclxuXHRcdHZhciB0ZXJtMj1wYXJzZVRlcm0oZW5naW5lLHJhdyk7XHJcblx0XHRvcnRlcm0oZW5naW5lLHRlcm0sdGVybTIua2V5KTtcclxuXHRcdGZvciAodmFyIGkgaW4gdGVybTIudmFyaWFudHMpe1xyXG5cdFx0XHR0ZXJtLnZhcmlhbnRzW2ldPXRlcm0yLnZhcmlhbnRzW2ldO1xyXG5cdFx0fVxyXG5cdFx0dGVybS5rZXkrPScsJyt0ZXJtMi5rZXk7XHJcblx0fVxyXG5cdHJldHVybiB0ZXJtO1xyXG59XHJcblxyXG52YXIgZ2V0T3BlcmF0b3I9ZnVuY3Rpb24ocmF3KSB7XHJcblx0dmFyIG9wPScnO1xyXG5cdGlmIChyYXdbMF09PScrJykgb3A9J2luY2x1ZGUnO1xyXG5cdGlmIChyYXdbMF09PSctJykgb3A9J2V4Y2x1ZGUnO1xyXG5cdHJldHVybiBvcDtcclxufVxyXG52YXIgcGFyc2VQaHJhc2U9ZnVuY3Rpb24ocSkge1xyXG5cdHZhciBtYXRjaD1xLm1hdGNoKC8oXCIuKz9cInwnLis/J3xcXFMrKS9nKVxyXG5cdG1hdGNoPW1hdGNoLm1hcChmdW5jdGlvbihzdHIpe1xyXG5cdFx0dmFyIG49c3RyLmxlbmd0aCwgaD1zdHIuY2hhckF0KDApLCB0PXN0ci5jaGFyQXQobi0xKVxyXG5cdFx0aWYgKGg9PT10JiYoaD09PSdcIid8aD09PVwiJ1wiKSkgc3RyPXN0ci5zdWJzdHIoMSxuLTIpXHJcblx0XHRyZXR1cm4gc3RyO1xyXG5cdH0pXHJcblx0cmV0dXJuIG1hdGNoO1xyXG59XHJcbnZhciB0aWJldGFuTnVtYmVyPXtcclxuXHRcIlxcdTBmMjBcIjpcIjBcIixcIlxcdTBmMjFcIjpcIjFcIixcIlxcdTBmMjJcIjpcIjJcIixcdFwiXFx1MGYyM1wiOlwiM1wiLFx0XCJcXHUwZjI0XCI6XCI0XCIsXHJcblx0XCJcXHUwZjI1XCI6XCI1XCIsXCJcXHUwZjI2XCI6XCI2XCIsXCJcXHUwZjI3XCI6XCI3XCIsXCJcXHUwZjI4XCI6XCI4XCIsXCJcXHUwZjI5XCI6XCI5XCJcclxufVxyXG52YXIgcGFyc2VOdW1iZXI9ZnVuY3Rpb24ocmF3KSB7XHJcblx0dmFyIG49cGFyc2VJbnQocmF3LDEwKTtcclxuXHRpZiAoaXNOYU4obikpe1xyXG5cdFx0dmFyIGNvbnZlcnRlZD1bXTtcclxuXHRcdGZvciAodmFyIGk9MDtpPHJhdy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHZhciBubj10aWJldGFuTnVtYmVyW3Jhd1tpXV07XHJcblx0XHRcdGlmICh0eXBlb2Ygbm4gIT1cInVuZGVmaW5lZFwiKSBjb252ZXJ0ZWRbaV09bm47XHJcblx0XHRcdGVsc2UgYnJlYWs7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyc2VJbnQoY29udmVydGVkLDEwKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIG47XHJcblx0fVxyXG59XHJcbnZhciBwYXJzZVdpbGRjYXJkPWZ1bmN0aW9uKHJhdykge1xyXG5cdHZhciBuPXBhcnNlTnVtYmVyKHJhdykgfHwgMTtcclxuXHR2YXIgcWNvdW50PXJhdy5zcGxpdCgnPycpLmxlbmd0aC0xO1xyXG5cdHZhciBzY291bnQ9cmF3LnNwbGl0KCcqJykubGVuZ3RoLTE7XHJcblx0dmFyIHR5cGU9Jyc7XHJcblx0aWYgKHFjb3VudCkgdHlwZT0nPyc7XHJcblx0ZWxzZSBpZiAoc2NvdW50KSB0eXBlPScqJztcclxuXHRyZXR1cm4ge3dpbGRjYXJkOnR5cGUsIHdpZHRoOiBuICwgb3A6J3dpbGRjYXJkJ307XHJcbn1cclxuXHJcbnZhciBuZXdQaHJhc2U9ZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHt0ZXJtaWQ6W10scG9zdGluZzpbXSxyYXc6JycsdGVybWxlbmd0aDpbXX07XHJcbn0gXHJcbnZhciBwYXJzZVF1ZXJ5PWZ1bmN0aW9uKHEsc2VwKSB7XHJcblx0aWYgKHNlcCAmJiBxLmluZGV4T2Yoc2VwKT4tMSkge1xyXG5cdFx0dmFyIG1hdGNoPXEuc3BsaXQoc2VwKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dmFyIG1hdGNoPXEubWF0Y2goLyhcIi4rP1wifCcuKz8nfFxcUyspL2cpXHJcblx0XHRtYXRjaD1tYXRjaC5tYXAoZnVuY3Rpb24oc3RyKXtcclxuXHRcdFx0dmFyIG49c3RyLmxlbmd0aCwgaD1zdHIuY2hhckF0KDApLCB0PXN0ci5jaGFyQXQobi0xKVxyXG5cdFx0XHRpZiAoaD09PXQmJihoPT09J1wiJ3xoPT09XCInXCIpKSBzdHI9c3RyLnN1YnN0cigxLG4tMilcclxuXHRcdFx0cmV0dXJuIHN0clxyXG5cdFx0fSlcclxuXHRcdC8vY29uc29sZS5sb2coaW5wdXQsJz09PicsbWF0Y2gpXHRcdFxyXG5cdH1cclxuXHRyZXR1cm4gbWF0Y2g7XHJcbn1cclxudmFyIGxvYWRQaHJhc2U9ZnVuY3Rpb24ocGhyYXNlKSB7XHJcblx0LyogcmVtb3ZlIGxlYWRpbmcgYW5kIGVuZGluZyB3aWxkY2FyZCAqL1xyXG5cdHZhciBRPXRoaXM7XHJcblx0dmFyIGNhY2hlPVEuZW5naW5lLnBvc3RpbmdDYWNoZTtcclxuXHRpZiAoY2FjaGVbcGhyYXNlLmtleV0pIHtcclxuXHRcdHBocmFzZS5wb3N0aW5nPWNhY2hlW3BocmFzZS5rZXldO1xyXG5cdFx0cmV0dXJuIFE7XHJcblx0fVxyXG5cdGlmIChwaHJhc2UudGVybWlkLmxlbmd0aD09MSkge1xyXG5cdFx0aWYgKCFRLnRlcm1zLmxlbmd0aCl7XHJcblx0XHRcdHBocmFzZS5wb3N0aW5nPVtdO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y2FjaGVbcGhyYXNlLmtleV09cGhyYXNlLnBvc3Rpbmc9US50ZXJtc1twaHJhc2UudGVybWlkWzBdXS5wb3N0aW5nO1x0XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gUTtcclxuXHR9XHJcblxyXG5cdHZhciBpPTAsIHI9W10sZGlzPTA7XHJcblx0d2hpbGUoaTxwaHJhc2UudGVybWlkLmxlbmd0aCkge1xyXG5cdCAgdmFyIFQ9US50ZXJtc1twaHJhc2UudGVybWlkW2ldXTtcclxuXHRcdGlmICgwID09PSBpKSB7XHJcblx0XHRcdHIgPSBULnBvc3Rpbmc7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0ICAgIGlmIChULm9wPT0nd2lsZGNhcmQnKSB7XHJcblx0XHQgICAgXHRUPVEudGVybXNbcGhyYXNlLnRlcm1pZFtpKytdXTtcclxuXHRcdCAgICBcdHZhciB3aWR0aD1ULndpZHRoO1xyXG5cdFx0ICAgIFx0dmFyIHdpbGRjYXJkPVQud2lsZGNhcmQ7XHJcblx0XHQgICAgXHRUPVEudGVybXNbcGhyYXNlLnRlcm1pZFtpXV07XHJcblx0XHQgICAgXHR2YXIgbWluZGlzPWRpcztcclxuXHRcdCAgICBcdGlmICh3aWxkY2FyZD09Jz8nKSBtaW5kaXM9ZGlzK3dpZHRoO1xyXG5cdFx0ICAgIFx0aWYgKFQuZXhjbHVkZSkgciA9IHBsaXN0LnBsbm90Zm9sbG93MihyLCBULnBvc3RpbmcsIG1pbmRpcywgZGlzK3dpZHRoKTtcclxuXHRcdCAgICBcdGVsc2UgciA9IHBsaXN0LnBsZm9sbG93MihyLCBULnBvc3RpbmcsIG1pbmRpcywgZGlzK3dpZHRoKTtcdFx0ICAgIFx0XHJcblx0XHQgICAgXHRkaXMrPSh3aWR0aC0xKTtcclxuXHRcdCAgICB9ZWxzZSB7XHJcblx0XHQgICAgXHRpZiAoVC5wb3N0aW5nKSB7XHJcblx0XHQgICAgXHRcdGlmIChULmV4Y2x1ZGUpIHIgPSBwbGlzdC5wbG5vdGZvbGxvdyhyLCBULnBvc3RpbmcsIGRpcyk7XHJcblx0XHQgICAgXHRcdGVsc2UgciA9IHBsaXN0LnBsZm9sbG93KHIsIFQucG9zdGluZywgZGlzKTtcclxuXHRcdCAgICBcdH1cclxuXHRcdCAgICB9XHJcblx0XHR9XHJcblx0XHRkaXMgKz0gcGhyYXNlLnRlcm1sZW5ndGhbaV07XHJcblx0XHRpKys7XHJcblx0XHRpZiAoIXIpIHJldHVybiBRO1xyXG4gIH1cclxuICBwaHJhc2UucG9zdGluZz1yO1xyXG4gIGNhY2hlW3BocmFzZS5rZXldPXI7XHJcbiAgcmV0dXJuIFE7XHJcbn1cclxudmFyIHRyaW1TcGFjZT1mdW5jdGlvbihlbmdpbmUscXVlcnkpIHtcclxuXHRpZiAoIXF1ZXJ5KSByZXR1cm4gXCJcIjtcclxuXHR2YXIgaT0wO1xyXG5cdHZhciBpc1NraXA9ZW5naW5lLmFuYWx5emVyLmlzU2tpcDtcclxuXHR3aGlsZSAoaXNTa2lwKHF1ZXJ5W2ldKSAmJiBpPHF1ZXJ5Lmxlbmd0aCkgaSsrO1xyXG5cdHJldHVybiBxdWVyeS5zdWJzdHJpbmcoaSk7XHJcbn1cclxudmFyIGdldFNlZ1dpdGhIaXQ9ZnVuY3Rpb24oZmlsZWlkLG9mZnNldHMpIHtcclxuXHR2YXIgUT10aGlzLGVuZ2luZT1RLmVuZ2luZTtcclxuXHR2YXIgc2VnV2l0aEhpdD1wbGlzdC5ncm91cGJ5cG9zdGluZzIoUS5ieUZpbGVbZmlsZWlkIF0sIG9mZnNldHMpO1xyXG5cdGlmIChzZWdXaXRoSGl0Lmxlbmd0aCkgc2VnV2l0aEhpdC5zaGlmdCgpOyAvL3RoZSBmaXJzdCBpdGVtIGlzIG5vdCB1c2VkICgwflEuYnlGaWxlWzBdIClcclxuXHR2YXIgb3V0PVtdO1xyXG5cdHNlZ1dpdGhIaXQubWFwKGZ1bmN0aW9uKHAsaWR4KXtpZiAocC5sZW5ndGgpIG91dC5wdXNoKGlkeCl9KTtcclxuXHRyZXR1cm4gb3V0O1xyXG59XHJcbnZhciBzZWdXaXRoSGl0PWZ1bmN0aW9uKGZpbGVpZCkge1xyXG5cdHZhciBRPXRoaXMsZW5naW5lPVEuZW5naW5lO1xyXG5cdHZhciBvZmZzZXRzPWVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cyhmaWxlaWQpO1xyXG5cdHJldHVybiBnZXRTZWdXaXRoSGl0LmFwcGx5KHRoaXMsW2ZpbGVpZCxvZmZzZXRzXSk7XHJcbn1cclxudmFyIGlzU2ltcGxlUGhyYXNlPWZ1bmN0aW9uKHBocmFzZSkge1xyXG5cdHZhciBtPXBocmFzZS5tYXRjaCgvW1xcPyVeXS8pO1xyXG5cdHJldHVybiAhbTtcclxufVxyXG5cclxuLy8g55m86I+p5o+Q5b+DICAgPT0+IOeZvOiPqSAg5o+Q5b+DICAgICAgIDIgMiAgIFxyXG4vLyDoj6nmj5Dlv4MgICAgID09PiDoj6nmj5AgIOaPkOW/gyAgICAgICAxIDJcclxuLy8g5Yqr5YqrICAgICAgID09PiDliqsgICAg5YqrICAgICAgICAgMSAxICAgLy8gaW52YWxpZFxyXG4vLyDlm6Dnt6PmiYDnlJ/pgZMgID09PiDlm6Dnt6MgIOaJgOeUnyAgIOmBkyAgIDIgMiAxXHJcbnZhciBzcGxpdFBocmFzZT1mdW5jdGlvbihlbmdpbmUsc2ltcGxlcGhyYXNlLGJpZ3JhbSkge1xyXG5cdHZhciBiaWdyYW09YmlncmFtfHxlbmdpbmUuZ2V0KFwibWV0YVwiKS5iaWdyYW18fFtdO1xyXG5cdHZhciB0b2tlbnM9ZW5naW5lLmFuYWx5emVyLnRva2VuaXplKHNpbXBsZXBocmFzZSkudG9rZW5zO1xyXG5cdHZhciBsb2FkdG9rZW5zPVtdLGxlbmd0aHM9W10saj0wLGxhc3RiaWdyYW1wb3M9LTE7XHJcblx0d2hpbGUgKGorMTx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHR2YXIgdG9rZW49ZW5naW5lLmFuYWx5emVyLm5vcm1hbGl6ZSh0b2tlbnNbal0pO1xyXG5cdFx0dmFyIG5leHR0b2tlbj1lbmdpbmUuYW5hbHl6ZXIubm9ybWFsaXplKHRva2Vuc1tqKzFdKTtcclxuXHRcdHZhciBiaT10b2tlbituZXh0dG9rZW47XHJcblx0XHR2YXIgaT1wbGlzdC5pbmRleE9mU29ydGVkKGJpZ3JhbSxiaSk7XHJcblx0XHRpZiAoYmlncmFtW2ldPT1iaSkge1xyXG5cdFx0XHRsb2FkdG9rZW5zLnB1c2goYmkpO1xyXG5cdFx0XHRpZiAoaiszPHRva2Vucy5sZW5ndGgpIHtcclxuXHRcdFx0XHRsYXN0YmlncmFtcG9zPWo7XHJcblx0XHRcdFx0aisrO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmIChqKzI9PXRva2Vucy5sZW5ndGgpeyBcclxuXHRcdFx0XHRcdGlmIChsYXN0YmlncmFtcG9zKzE9PWogKSB7XHJcblx0XHRcdFx0XHRcdGxlbmd0aHNbbGVuZ3Rocy5sZW5ndGgtMV0tLTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGxhc3RiaWdyYW1wb3M9ajtcclxuXHRcdFx0XHRcdGorKztcclxuXHRcdFx0XHR9ZWxzZSB7XHJcblx0XHRcdFx0XHRsYXN0YmlncmFtcG9zPWo7XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0bGVuZ3Rocy5wdXNoKDIpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKCFiaWdyYW0gfHwgbGFzdGJpZ3JhbXBvcz09LTEgfHwgbGFzdGJpZ3JhbXBvcysxIT1qKSB7XHJcblx0XHRcdFx0bG9hZHRva2Vucy5wdXNoKHRva2VuKTtcclxuXHRcdFx0XHRsZW5ndGhzLnB1c2goMSk7XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aisrO1xyXG5cdH1cclxuXHJcblx0d2hpbGUgKGo8dG9rZW5zLmxlbmd0aCkge1xyXG5cdFx0dmFyIHRva2VuPWVuZ2luZS5hbmFseXplci5ub3JtYWxpemUodG9rZW5zW2pdKTtcclxuXHRcdGxvYWR0b2tlbnMucHVzaCh0b2tlbik7XHJcblx0XHRsZW5ndGhzLnB1c2goMSk7XHJcblx0XHRqKys7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4ge3Rva2Vuczpsb2FkdG9rZW5zLCBsZW5ndGhzOiBsZW5ndGhzICwgdG9rZW5sZW5ndGg6IHRva2Vucy5sZW5ndGh9O1xyXG59XHJcbi8qIGhvc3QgaGFzIGZhc3QgbmF0aXZlIGZ1bmN0aW9uICovXHJcbnZhciBmYXN0UGhyYXNlPWZ1bmN0aW9uKGVuZ2luZSxwaHJhc2UpIHtcclxuXHR2YXIgcGhyYXNlX3Rlcm09bmV3UGhyYXNlKCk7XHJcblx0Ly92YXIgdG9rZW5zPWVuZ2luZS5hbmFseXplci50b2tlbml6ZShwaHJhc2UpLnRva2VucztcclxuXHR2YXIgc3BsaXR0ZWQ9c3BsaXRQaHJhc2UoZW5naW5lLHBocmFzZSk7XHJcblxyXG5cdHZhciBwYXRocz1wb3N0aW5nUGF0aEZyb21Ub2tlbnMoZW5naW5lLHNwbGl0dGVkLnRva2Vucyk7XHJcbi8vY3JlYXRlIHdpbGRjYXJkXHJcblxyXG5cdHBocmFzZV90ZXJtLndpZHRoPXNwbGl0dGVkLnRva2VubGVuZ3RoOyAvL2ZvciBleGNlcnB0LmpzIHRvIGdldFBocmFzZVdpZHRoXHJcblxyXG5cdGVuZ2luZS5nZXQocGF0aHMse2FkZHJlc3M6dHJ1ZX0sZnVuY3Rpb24ocG9zdGluZ0FkZHJlc3MpeyAvL3RoaXMgaXMgc3luY1xyXG5cdFx0cGhyYXNlX3Rlcm0ua2V5PXBocmFzZTtcclxuXHRcdHZhciBwb3N0aW5nQWRkcmVzc1dpdGhXaWxkY2FyZD1bXTtcclxuXHRcdGZvciAodmFyIGk9MDtpPHBvc3RpbmdBZGRyZXNzLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0cG9zdGluZ0FkZHJlc3NXaXRoV2lsZGNhcmQucHVzaChwb3N0aW5nQWRkcmVzc1tpXSk7XHJcblx0XHRcdGlmIChzcGxpdHRlZC5sZW5ndGhzW2ldPjEpIHtcclxuXHRcdFx0XHRwb3N0aW5nQWRkcmVzc1dpdGhXaWxkY2FyZC5wdXNoKFtzcGxpdHRlZC5sZW5ndGhzW2ldLDBdKTsgLy93aWxkY2FyZCBoYXMgYmxvY2tzaXplPT0wIFxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbmdpbmUucG9zdGluZ0NhY2hlW3BocmFzZV09ZW5naW5lLm1lcmdlUG9zdGluZ3MocG9zdGluZ0FkZHJlc3NXaXRoV2lsZGNhcmQpO1xyXG5cdH0pO1xyXG5cdHJldHVybiBwaHJhc2VfdGVybTtcclxuXHQvLyBwdXQgcG9zdGluZyBpbnRvIGNhY2hlW3BocmFzZS5rZXldXHJcbn1cclxudmFyIHNsb3dQaHJhc2U9ZnVuY3Rpb24oZW5naW5lLHRlcm1zLHBocmFzZSkge1xyXG5cdHZhciBqPTAsdG9rZW5zPWVuZ2luZS5hbmFseXplci50b2tlbml6ZShwaHJhc2UpLnRva2VucztcclxuXHR2YXIgcGhyYXNlX3Rlcm09bmV3UGhyYXNlKCk7XHJcblx0dmFyIHRlcm1pZD0wO1xyXG5cdHdoaWxlIChqPHRva2Vucy5sZW5ndGgpIHtcclxuXHRcdHZhciByYXc9dG9rZW5zW2pdLCB0ZXJtbGVuZ3RoPTE7XHJcblx0XHRpZiAoaXNXaWxkY2FyZChyYXcpKSB7XHJcblx0XHRcdGlmIChwaHJhc2VfdGVybS50ZXJtaWQubGVuZ3RoPT0wKSAgeyAvL3NraXAgbGVhZGluZyB3aWxkIGNhcmRcclxuXHRcdFx0XHRqKytcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0ZXJtcy5wdXNoKHBhcnNlV2lsZGNhcmQocmF3KSk7XHJcblx0XHRcdHRlcm1pZD10ZXJtcy5sZW5ndGgtMTtcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWlkLnB1c2godGVybWlkKTtcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWxlbmd0aC5wdXNoKHRlcm1sZW5ndGgpO1xyXG5cdFx0fSBlbHNlIGlmIChpc09yVGVybShyYXcpKXtcclxuXHRcdFx0dmFyIHRlcm09b3JUZXJtcy5hcHBseSh0aGlzLFt0b2tlbnMsal0pO1xyXG5cdFx0XHRpZiAodGVybSkge1xyXG5cdFx0XHRcdHRlcm1zLnB1c2godGVybSk7XHJcblx0XHRcdFx0dGVybWlkPXRlcm1zLmxlbmd0aC0xO1xyXG5cdFx0XHRcdGorPXRlcm0ua2V5LnNwbGl0KCcsJykubGVuZ3RoLTE7XHRcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcdGorKztcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWlkLnB1c2godGVybWlkKTtcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWxlbmd0aC5wdXNoKHRlcm1sZW5ndGgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dmFyIHBocmFzZT1cIlwiO1xyXG5cdFx0XHR3aGlsZSAoajx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0aWYgKCEoaXNXaWxkY2FyZCh0b2tlbnNbal0pIHx8IGlzT3JUZXJtKHRva2Vuc1tqXSkpKSB7XHJcblx0XHRcdFx0XHRwaHJhc2UrPXRva2Vuc1tqXTtcclxuXHRcdFx0XHRcdGorKztcclxuXHRcdFx0XHR9IGVsc2UgYnJlYWs7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBzcGxpdHRlZD1zcGxpdFBocmFzZShlbmdpbmUscGhyYXNlKTtcclxuXHRcdFx0Zm9yICh2YXIgaT0wO2k8c3BsaXR0ZWQudG9rZW5zLmxlbmd0aDtpKyspIHtcclxuXHJcblx0XHRcdFx0dmFyIHRlcm09cGFyc2VUZXJtKGVuZ2luZSxzcGxpdHRlZC50b2tlbnNbaV0pO1xyXG5cdFx0XHRcdHZhciB0ZXJtaWR4PXRlcm1zLm1hcChmdW5jdGlvbihhKXtyZXR1cm4gYS5rZXl9KS5pbmRleE9mKHRlcm0ua2V5KTtcclxuXHRcdFx0XHRpZiAodGVybWlkeD09LTEpIHtcclxuXHRcdFx0XHRcdHRlcm1zLnB1c2godGVybSk7XHJcblx0XHRcdFx0XHR0ZXJtaWQ9dGVybXMubGVuZ3RoLTE7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRlcm1pZD10ZXJtaWR4O1xyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdHBocmFzZV90ZXJtLnRlcm1pZC5wdXNoKHRlcm1pZCk7XHJcblx0XHRcdFx0cGhyYXNlX3Rlcm0udGVybWxlbmd0aC5wdXNoKHNwbGl0dGVkLmxlbmd0aHNbaV0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRqKys7XHJcblx0fVxyXG5cdHBocmFzZV90ZXJtLmtleT1waHJhc2U7XHJcblx0Ly9yZW1vdmUgZW5kaW5nIHdpbGRjYXJkXHJcblx0dmFyIFA9cGhyYXNlX3Rlcm0gLCBUPW51bGw7XHJcblx0ZG8ge1xyXG5cdFx0VD10ZXJtc1tQLnRlcm1pZFtQLnRlcm1pZC5sZW5ndGgtMV1dO1xyXG5cdFx0aWYgKCFUKSBicmVhaztcclxuXHRcdGlmIChULndpbGRjYXJkKSBQLnRlcm1pZC5wb3AoKTsgZWxzZSBicmVhaztcclxuXHR9IHdoaWxlKFQpO1x0XHRcclxuXHRyZXR1cm4gcGhyYXNlX3Rlcm07XHJcbn1cclxudmFyIG5ld1F1ZXJ5ID1mdW5jdGlvbihlbmdpbmUscXVlcnksb3B0cykge1xyXG5cdC8vaWYgKCFxdWVyeSkgcmV0dXJuO1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblx0cXVlcnk9dHJpbVNwYWNlKGVuZ2luZSxxdWVyeSk7XHJcblxyXG5cdHZhciBwaHJhc2VzPXF1ZXJ5LHBocmFzZXM9W107XHJcblx0aWYgKHR5cGVvZiBxdWVyeT09J3N0cmluZycgJiYgcXVlcnkpIHtcclxuXHRcdHBocmFzZXM9cGFyc2VRdWVyeShxdWVyeSxvcHRzLnBocmFzZV9zZXAgfHwgXCJcIik7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBwaHJhc2VfdGVybXM9W10sIHRlcm1zPVtdLHZhcmlhbnRzPVtdLG9wZXJhdG9ycz1bXTtcclxuXHR2YXIgcGM9MDsvL3BocmFzZSBjb3VudFxyXG5cdGZvciAgKHZhciBpPTA7aTxwaHJhc2VzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBvcD1nZXRPcGVyYXRvcihwaHJhc2VzW3BjXSk7XHJcblx0XHRpZiAob3ApIHBocmFzZXNbcGNdPXBocmFzZXNbcGNdLnN1YnN0cmluZygxKTtcclxuXHJcblx0XHQvKiBhdXRvIGFkZCArIGZvciBuYXR1cmFsIG9yZGVyID8qL1xyXG5cdFx0Ly9pZiAoIW9wdHMucmFuayAmJiBvcCE9J2V4Y2x1ZGUnICYmaSkgb3A9J2luY2x1ZGUnO1xyXG5cdFx0b3BlcmF0b3JzLnB1c2gob3ApO1xyXG5cclxuXHRcdGlmIChpc1NpbXBsZVBocmFzZShwaHJhc2VzW3BjXSkgJiYgZW5naW5lLm1lcmdlUG9zdGluZ3MgKSB7XHJcblx0XHRcdHZhciBwaHJhc2VfdGVybT1mYXN0UGhyYXNlKGVuZ2luZSxwaHJhc2VzW3BjXSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR2YXIgcGhyYXNlX3Rlcm09c2xvd1BocmFzZShlbmdpbmUsdGVybXMscGhyYXNlc1twY10pO1xyXG5cdFx0fVxyXG5cdFx0cGhyYXNlX3Rlcm1zLnB1c2gocGhyYXNlX3Rlcm0pO1xyXG5cclxuXHRcdGlmICghZW5naW5lLm1lcmdlUG9zdGluZ3MgJiYgcGhyYXNlX3Rlcm1zW3BjXS50ZXJtaWQubGVuZ3RoPT0wKSB7XHJcblx0XHRcdHBocmFzZV90ZXJtcy5wb3AoKTtcclxuXHRcdH0gZWxzZSBwYysrO1xyXG5cdH1cclxuXHRvcHRzLm9wPW9wZXJhdG9ycztcclxuXHJcblx0dmFyIFE9e2RibmFtZTplbmdpbmUuZGJuYW1lLGVuZ2luZTplbmdpbmUsb3B0czpvcHRzLHF1ZXJ5OnF1ZXJ5LFxyXG5cdFx0cGhyYXNlczpwaHJhc2VfdGVybXMsdGVybXM6dGVybXNcclxuXHR9O1xyXG5cdFEudG9rZW5pemU9ZnVuY3Rpb24oKSB7cmV0dXJuIGVuZ2luZS5hbmFseXplci50b2tlbml6ZS5hcHBseShlbmdpbmUsYXJndW1lbnRzKTt9XHJcblx0US5pc1NraXA9ZnVuY3Rpb24oKSB7cmV0dXJuIGVuZ2luZS5hbmFseXplci5pc1NraXAuYXBwbHkoZW5naW5lLGFyZ3VtZW50cyk7fVxyXG5cdFEubm9ybWFsaXplPWZ1bmN0aW9uKCkge3JldHVybiBlbmdpbmUuYW5hbHl6ZXIubm9ybWFsaXplLmFwcGx5KGVuZ2luZSxhcmd1bWVudHMpO31cclxuXHRRLnNlZ1dpdGhIaXQ9c2VnV2l0aEhpdDtcclxuXHJcblx0Ly9RLmdldFJhbmdlPWZ1bmN0aW9uKCkge3JldHVybiB0aGF0LmdldFJhbmdlLmFwcGx5KHRoYXQsYXJndW1lbnRzKX07XHJcblx0Ly9BUEkucXVlcnlpZD0nUScrKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoxMDAwMDAwMCkpLnRvU3RyaW5nKDE2KTtcclxuXHRyZXR1cm4gUTtcclxufVxyXG52YXIgcG9zdGluZ1BhdGhGcm9tVG9rZW5zPWZ1bmN0aW9uKGVuZ2luZSx0b2tlbnMpIHtcclxuXHR2YXIgYWxsdG9rZW5zPWVuZ2luZS5nZXQoXCJ0b2tlbnNcIik7XHJcblxyXG5cdHZhciB0b2tlbklkcz10b2tlbnMubWFwKGZ1bmN0aW9uKHQpeyByZXR1cm4gMSthbGx0b2tlbnMuaW5kZXhPZih0KX0pO1xyXG5cdHZhciBwb3N0aW5naWQ9W107XHJcblx0Zm9yICh2YXIgaT0wO2k8dG9rZW5JZHMubGVuZ3RoO2krKykge1xyXG5cdFx0cG9zdGluZ2lkLnB1c2goIHRva2VuSWRzW2ldKTsgLy8gdG9rZW5JZD09MCAsIGVtcHR5IHRva2VuXHJcblx0fVxyXG5cdHJldHVybiBwb3N0aW5naWQubWFwKGZ1bmN0aW9uKHQpe3JldHVybiBbXCJwb3N0aW5nc1wiLHRdfSk7XHJcbn1cclxudmFyIGxvYWRQb3N0aW5ncz1mdW5jdGlvbihlbmdpbmUsdG9rZW5zLGNiKSB7XHJcblx0dmFyIHRvbG9hZHRva2Vucz10b2tlbnMuZmlsdGVyKGZ1bmN0aW9uKHQpe1xyXG5cdFx0cmV0dXJuICFlbmdpbmUucG9zdGluZ0NhY2hlW3Qua2V5XTsgLy9hbHJlYWR5IGluIGNhY2hlXHJcblx0fSk7XHJcblx0aWYgKHRvbG9hZHRva2Vucy5sZW5ndGg9PTApIHtcclxuXHRcdGNiKCk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBwb3N0aW5nUGF0aHM9cG9zdGluZ1BhdGhGcm9tVG9rZW5zKGVuZ2luZSx0b2tlbnMubWFwKGZ1bmN0aW9uKHQpe3JldHVybiB0LmtleX0pKTtcclxuXHRlbmdpbmUuZ2V0KHBvc3RpbmdQYXRocyxmdW5jdGlvbihwb3N0aW5ncyl7XHJcblx0XHRwb3N0aW5ncy5tYXAoZnVuY3Rpb24ocCxpKSB7IHRva2Vuc1tpXS5wb3N0aW5nPXAgfSk7XHJcblx0XHRpZiAoY2IpIGNiKCk7XHJcblx0fSk7XHJcbn1cclxudmFyIGdyb3VwQnk9ZnVuY3Rpb24oUSxwb3N0aW5nKSB7XHJcblx0cGhyYXNlcy5mb3JFYWNoKGZ1bmN0aW9uKFApe1xyXG5cdFx0dmFyIGtleT1QLmtleTtcclxuXHRcdHZhciBkb2NmcmVxPWRvY2ZyZXFjYWNoZVtrZXldO1xyXG5cdFx0aWYgKCFkb2NmcmVxKSBkb2NmcmVxPWRvY2ZyZXFjYWNoZVtrZXldPXt9O1xyXG5cdFx0aWYgKCFkb2NmcmVxW3RoYXQuZ3JvdXB1bml0XSkge1xyXG5cdFx0XHRkb2NmcmVxW3RoYXQuZ3JvdXB1bml0XT17ZG9jbGlzdDpudWxsLGZyZXE6bnVsbH07XHJcblx0XHR9XHRcdFxyXG5cdFx0aWYgKFAucG9zdGluZykge1xyXG5cdFx0XHR2YXIgcmVzPW1hdGNoUG9zdGluZyhlbmdpbmUsUC5wb3N0aW5nKTtcclxuXHRcdFx0UC5mcmVxPXJlcy5mcmVxO1xyXG5cdFx0XHRQLmRvY3M9cmVzLmRvY3M7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRQLmRvY3M9W107XHJcblx0XHRcdFAuZnJlcT1bXTtcclxuXHRcdH1cclxuXHRcdGRvY2ZyZXFbdGhhdC5ncm91cHVuaXRdPXtkb2NsaXN0OlAuZG9jcyxmcmVxOlAuZnJlcX07XHJcblx0fSk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxudmFyIGdyb3VwQnlGb2xkZXI9ZnVuY3Rpb24oZW5naW5lLGZpbGVoaXRzKSB7XHJcblx0dmFyIGZpbGVzPWVuZ2luZS5nZXQoXCJmaWxlbmFtZXNcIik7XHJcblx0dmFyIHByZXZmb2xkZXI9XCJcIixoaXRzPTAsb3V0PVtdO1xyXG5cdGZvciAodmFyIGk9MDtpPGZpbGVoaXRzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBmbj1maWxlc1tpXTtcclxuXHRcdHZhciBmb2xkZXI9Zm4uc3Vic3RyaW5nKDAsZm4uaW5kZXhPZignLycpKTtcclxuXHRcdGlmIChwcmV2Zm9sZGVyICYmIHByZXZmb2xkZXIhPWZvbGRlcikge1xyXG5cdFx0XHRvdXQucHVzaChoaXRzKTtcclxuXHRcdFx0aGl0cz0wO1xyXG5cdFx0fVxyXG5cdFx0aGl0cys9ZmlsZWhpdHNbaV0ubGVuZ3RoO1xyXG5cdFx0cHJldmZvbGRlcj1mb2xkZXI7XHJcblx0fVxyXG5cdG91dC5wdXNoKGhpdHMpO1xyXG5cdHJldHVybiBvdXQ7XHJcbn1cclxudmFyIHBocmFzZV9pbnRlcnNlY3Q9ZnVuY3Rpb24oZW5naW5lLFEpIHtcclxuXHR2YXIgaW50ZXJzZWN0ZWQ9bnVsbDtcclxuXHR2YXIgZmlsZW9mZnNldHM9US5lbmdpbmUuZ2V0KFwiZmlsZW9mZnNldHNcIik7XHJcblx0dmFyIGVtcHR5PVtdLGVtcHR5Y291bnQ9MCxoYXNoaXQ9MDtcclxuXHRmb3IgKHZhciBpPTA7aTxRLnBocmFzZXMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIGJ5ZmlsZT1wbGlzdC5ncm91cGJ5cG9zdGluZzIoUS5waHJhc2VzW2ldLnBvc3RpbmcsZmlsZW9mZnNldHMpO1xyXG5cdFx0aWYgKGJ5ZmlsZS5sZW5ndGgpIGJ5ZmlsZS5zaGlmdCgpO1xyXG5cdFx0aWYgKGJ5ZmlsZS5sZW5ndGgpIGJ5ZmlsZS5wb3AoKTtcclxuXHRcdGJ5ZmlsZS5wb3AoKTtcclxuXHRcdGlmIChpbnRlcnNlY3RlZD09bnVsbCkge1xyXG5cdFx0XHRpbnRlcnNlY3RlZD1ieWZpbGU7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRmb3IgKHZhciBqPTA7ajxieWZpbGUubGVuZ3RoO2orKykge1xyXG5cdFx0XHRcdGlmICghKGJ5ZmlsZVtqXS5sZW5ndGggJiYgaW50ZXJzZWN0ZWRbal0ubGVuZ3RoKSkge1xyXG5cdFx0XHRcdFx0aW50ZXJzZWN0ZWRbal09ZW1wdHk7IC8vcmV1c2UgZW1wdHkgYXJyYXlcclxuXHRcdFx0XHRcdGVtcHR5Y291bnQrKztcclxuXHRcdFx0XHR9IGVsc2UgaGFzaGl0Kys7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdFEuYnlGaWxlPWludGVyc2VjdGVkO1xyXG5cdFEuYnlGb2xkZXI9Z3JvdXBCeUZvbGRlcihlbmdpbmUsUS5ieUZpbGUpO1xyXG5cdHZhciBvdXQ9W107XHJcblx0Ly9jYWxjdWxhdGUgbmV3IHJhd3Bvc3RpbmdcclxuXHRmb3IgKHZhciBpPTA7aTxRLmJ5RmlsZS5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAoUS5ieUZpbGVbaV0ubGVuZ3RoKSBvdXQ9b3V0LmNvbmNhdChRLmJ5RmlsZVtpXSk7XHJcblx0fVxyXG5cdFEucmF3cmVzdWx0PW91dDtcclxuXHRjb3VudEZvbGRlckZpbGUoUSk7XHJcbn1cclxudmFyIGNvdW50Rm9sZGVyRmlsZT1mdW5jdGlvbihRKSB7XHJcblx0US5maWxlV2l0aEhpdENvdW50PTA7XHJcblx0US5ieUZpbGUubWFwKGZ1bmN0aW9uKGYpe2lmIChmLmxlbmd0aCkgUS5maWxlV2l0aEhpdENvdW50Kyt9KTtcclxuXHRcdFx0XHJcblx0US5mb2xkZXJXaXRoSGl0Q291bnQ9MDtcclxuXHRRLmJ5Rm9sZGVyLm1hcChmdW5jdGlvbihmKXtpZiAoZikgUS5mb2xkZXJXaXRoSGl0Q291bnQrK30pO1xyXG59XHJcblxyXG52YXIgbWFpbj1mdW5jdGlvbihlbmdpbmUscSxvcHRzLGNiKXtcclxuXHR2YXIgc3RhcnR0aW1lPW5ldyBEYXRlKCk7XHJcblx0dmFyIG1ldGE9ZW5naW5lLmdldChcIm1ldGFcIik7XHJcblx0aWYgKG1ldGEubm9ybWFsaXplICYmIGVuZ2luZS5hbmFseXplci5zZXROb3JtYWxpemVUYWJsZSkge1xyXG5cdFx0bWV0YS5ub3JtYWxpemVPYmo9ZW5naW5lLmFuYWx5emVyLnNldE5vcm1hbGl6ZVRhYmxlKG1ldGEubm9ybWFsaXplLG1ldGEubm9ybWFsaXplT2JqKTtcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIGNiPW9wdHM7XHJcblx0b3B0cz1vcHRzfHx7fTtcclxuXHR2YXIgUT1lbmdpbmUucXVlcnlDYWNoZVtxXTtcclxuXHRpZiAoIVEpIFE9bmV3UXVlcnkoZW5naW5lLHEsb3B0cyk7IFxyXG5cdGlmICghUSkge1xyXG5cdFx0ZW5naW5lLnNlYXJjaHRpbWU9bmV3IERhdGUoKS1zdGFydHRpbWU7XHJcblx0XHRlbmdpbmUudG90YWx0aW1lPWVuZ2luZS5zZWFyY2h0aW1lO1xyXG5cdFx0aWYgKGVuZ2luZS5jb250ZXh0KSBjYi5hcHBseShlbmdpbmUuY29udGV4dCxbXCJlbXB0eSByZXN1bHRcIix7cmF3cmVzdWx0OltdfV0pO1xyXG5cdFx0ZWxzZSBjYihcImVtcHR5IHJlc3VsdFwiLHtyYXdyZXN1bHQ6W119KTtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cdGVuZ2luZS5xdWVyeUNhY2hlW3FdPVE7XHJcblx0aWYgKFEucGhyYXNlcy5sZW5ndGgpIHtcclxuXHRcdGxvYWRQb3N0aW5ncyhlbmdpbmUsUS50ZXJtcyxmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiAoIVEucGhyYXNlc1swXS5wb3N0aW5nKSB7XHJcblx0XHRcdFx0ZW5naW5lLnNlYXJjaHRpbWU9bmV3IERhdGUoKS1zdGFydHRpbWU7XHJcblx0XHRcdFx0ZW5naW5lLnRvdGFsdGltZT1lbmdpbmUuc2VhcmNodGltZVxyXG5cclxuXHRcdFx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbXCJubyBzdWNoIHBvc3RpbmdcIix7cmF3cmVzdWx0OltdfV0pO1xyXG5cdFx0XHRcdHJldHVybjtcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCFRLnBocmFzZXNbMF0ucG9zdGluZy5sZW5ndGgpIHsgLy9cclxuXHRcdFx0XHRRLnBocmFzZXMuZm9yRWFjaChsb2FkUGhyYXNlLmJpbmQoUSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChRLnBocmFzZXMubGVuZ3RoPT0xKSB7XHJcblx0XHRcdFx0US5yYXdyZXN1bHQ9US5waHJhc2VzWzBdLnBvc3Rpbmc7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cGhyYXNlX2ludGVyc2VjdChlbmdpbmUsUSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGZpbGVvZmZzZXRzPVEuZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwic2VhcmNoIG9wdHMgXCIrSlNPTi5zdHJpbmdpZnkob3B0cykpO1xyXG5cclxuXHRcdFx0aWYgKCFRLmJ5RmlsZSAmJiBRLnJhd3Jlc3VsdCAmJiAhb3B0cy5ub2dyb3VwKSB7XHJcblx0XHRcdFx0US5ieUZpbGU9cGxpc3QuZ3JvdXBieXBvc3RpbmcyKFEucmF3cmVzdWx0LCBmaWxlb2Zmc2V0cyk7XHJcblx0XHRcdFx0US5ieUZpbGUuc2hpZnQoKTtRLmJ5RmlsZS5wb3AoKTtcclxuXHRcdFx0XHRRLmJ5Rm9sZGVyPWdyb3VwQnlGb2xkZXIoZW5naW5lLFEuYnlGaWxlKTtcclxuXHJcblx0XHRcdFx0Y291bnRGb2xkZXJGaWxlKFEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAob3B0cy5yYW5nZSkge1xyXG5cdFx0XHRcdGVuZ2luZS5zZWFyY2h0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0XHRcdGV4Y2VycHQucmVzdWx0bGlzdChlbmdpbmUsUSxvcHRzLGZ1bmN0aW9uKGRhdGEpIHsgXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiZXhjZXJwdCBva1wiKTtcclxuXHRcdFx0XHRcdFEuZXhjZXJwdD1kYXRhO1xyXG5cdFx0XHRcdFx0ZW5naW5lLnRvdGFsdGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdFx0XHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0LFswLFFdKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRlbmdpbmUuc2VhcmNodGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdFx0XHRlbmdpbmUudG90YWx0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0XHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0LFswLFFdKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fSBlbHNlIHsgLy9lbXB0eSBzZWFyY2hcclxuXHRcdGVuZ2luZS5zZWFyY2h0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0ZW5naW5lLnRvdGFsdGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0LFswLFFdKTtcclxuXHR9O1xyXG59XHJcblxyXG5tYWluLnNwbGl0UGhyYXNlPXNwbGl0UGhyYXNlOyAvL2p1c3QgZm9yIGRlYnVnXHJcbm1vZHVsZS5leHBvcnRzPW1haW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qXHJcbmNvbnZlcnQgdG8gcHVyZSBqc1xyXG5zYXZlIC1nIHJlYWN0aWZ5XHJcbiovXHJcbnZhciBFPVJlYWN0LmNyZWF0ZUVsZW1lbnQ7XHJcblxyXG52YXIgaGFza3NhbmFnYXA9KHR5cGVvZiBrc2FuYWdhcCE9XCJ1bmRlZmluZWRcIik7XHJcbmlmIChoYXNrc2FuYWdhcCAmJiAodHlwZW9mIGNvbnNvbGU9PVwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIGNvbnNvbGUubG9nPT1cInVuZGVmaW5lZFwiKSkge1xyXG5cdFx0d2luZG93LmNvbnNvbGU9e2xvZzprc2FuYWdhcC5sb2csZXJyb3I6a3NhbmFnYXAuZXJyb3IsZGVidWc6a3NhbmFnYXAuZGVidWcsd2Fybjprc2FuYWdhcC53YXJufTtcclxuXHRcdGNvbnNvbGUubG9nKFwiaW5zdGFsbCBjb25zb2xlIG91dHB1dCBmdW5jaXRvblwiKTtcclxufVxyXG5cclxudmFyIGNoZWNrZnM9ZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIChuYXZpZ2F0b3IgJiYgbmF2aWdhdG9yLndlYmtpdFBlcnNpc3RlbnRTdG9yYWdlKSB8fCBoYXNrc2FuYWdhcDtcclxufVxyXG52YXIgZmVhdHVyZWNoZWNrcz17XHJcblx0XCJmc1wiOmNoZWNrZnNcclxufVxyXG52YXIgY2hlY2ticm93c2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG5cdGdldEluaXRpYWxTdGF0ZTpmdW5jdGlvbigpIHtcclxuXHJcblx0XHR2YXIgbWlzc2luZ0ZlYXR1cmVzPXRoaXMuZ2V0TWlzc2luZ0ZlYXR1cmVzKCk7XHJcblx0XHRyZXR1cm4ge3JlYWR5OmZhbHNlLCBtaXNzaW5nOm1pc3NpbmdGZWF0dXJlc307XHJcblx0fSxcclxuXHRnZXRNaXNzaW5nRmVhdHVyZXM6ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgZmVhdHVyZT10aGlzLnByb3BzLmZlYXR1cmUuc3BsaXQoXCIsXCIpO1xyXG5cdFx0dmFyIHN0YXR1cz1bXTtcclxuXHRcdGZlYXR1cmUubWFwKGZ1bmN0aW9uKGYpe1xyXG5cdFx0XHR2YXIgY2hlY2tlcj1mZWF0dXJlY2hlY2tzW2ZdO1xyXG5cdFx0XHRpZiAoY2hlY2tlcikgY2hlY2tlcj1jaGVja2VyKCk7XHJcblx0XHRcdHN0YXR1cy5wdXNoKFtmLGNoZWNrZXJdKTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHN0YXR1cy5maWx0ZXIoZnVuY3Rpb24oZil7cmV0dXJuICFmWzFdfSk7XHJcblx0fSxcclxuXHRkb3dubG9hZGJyb3dzZXI6ZnVuY3Rpb24oKSB7XHJcblx0XHR3aW5kb3cubG9jYXRpb249XCJodHRwczovL3d3dy5nb29nbGUuY29tL2Nocm9tZS9cIlxyXG5cdH0sXHJcblx0cmVuZGVyTWlzc2luZzpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBzaG93TWlzc2luZz1mdW5jdGlvbihtKSB7XHJcblx0XHRcdHJldHVybiBFKFwiZGl2XCIsIG51bGwsIG0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIChcclxuXHRcdCBFKFwiZGl2XCIsIHtyZWY6IFwiZGlhbG9nMVwiLCBjbGFzc05hbWU6IFwibW9kYWwgZmFkZVwiLCBcImRhdGEtYmFja2Ryb3BcIjogXCJzdGF0aWNcIn0sIFxyXG5cdFx0ICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1kaWFsb2dcIn0sIFxyXG5cdFx0ICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWNvbnRlbnRcIn0sIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtaGVhZGVyXCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiYnV0dG9uXCIsIHt0eXBlOiBcImJ1dHRvblwiLCBjbGFzc05hbWU6IFwiY2xvc2VcIiwgXCJkYXRhLWRpc21pc3NcIjogXCJtb2RhbFwiLCBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwifSwgXCLDl1wiKSwgXHJcblx0XHQgICAgICAgICAgRShcImg0XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtdGl0bGVcIn0sIFwiQnJvd3NlciBDaGVja1wiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWJvZHlcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJwXCIsIG51bGwsIFwiU29ycnkgYnV0IHRoZSBmb2xsb3dpbmcgZmVhdHVyZSBpcyBtaXNzaW5nXCIpLCBcclxuXHRcdCAgICAgICAgICB0aGlzLnN0YXRlLm1pc3NpbmcubWFwKHNob3dNaXNzaW5nKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWZvb3RlclwifSwgXHJcblx0XHQgICAgICAgICAgRShcImJ1dHRvblwiLCB7b25DbGljazogdGhpcy5kb3dubG9hZGJyb3dzZXIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsYXNzTmFtZTogXCJidG4gYnRuLXByaW1hcnlcIn0sIFwiRG93bmxvYWQgR29vZ2xlIENocm9tZVwiKVxyXG5cdFx0ICAgICAgICApXHJcblx0XHQgICAgICApXHJcblx0XHQgICAgKVxyXG5cdFx0ICApXHJcblx0XHQgKTtcclxuXHR9LFxyXG5cdHJlbmRlclJlYWR5OmZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIEUoXCJzcGFuXCIsIG51bGwsIFwiYnJvd3NlciBva1wiKVxyXG5cdH0sXHJcblx0cmVuZGVyOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gICh0aGlzLnN0YXRlLm1pc3NpbmcubGVuZ3RoKT90aGlzLnJlbmRlck1pc3NpbmcoKTp0aGlzLnJlbmRlclJlYWR5KCk7XHJcblx0fSxcclxuXHRjb21wb25lbnREaWRNb3VudDpmdW5jdGlvbigpIHtcclxuXHRcdGlmICghdGhpcy5zdGF0ZS5taXNzaW5nLmxlbmd0aCkge1xyXG5cdFx0XHR0aGlzLnByb3BzLm9uUmVhZHkoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdCQodGhpcy5yZWZzLmRpYWxvZzEuZ2V0RE9NTm9kZSgpKS5tb2RhbCgnc2hvdycpO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1jaGVja2Jyb3dzZXI7IiwiXHJcbnZhciB1c2VyQ2FuY2VsPWZhbHNlO1xyXG52YXIgZmlsZXM9W107XHJcbnZhciB0b3RhbERvd25sb2FkQnl0ZT0wO1xyXG52YXIgdGFyZ2V0UGF0aD1cIlwiO1xyXG52YXIgdGVtcFBhdGg9XCJcIjtcclxudmFyIG5maWxlPTA7XHJcbnZhciBiYXNldXJsPVwiXCI7XHJcbnZhciByZXN1bHQ9XCJcIjtcclxudmFyIGRvd25sb2FkaW5nPWZhbHNlO1xyXG52YXIgc3RhcnREb3dubG9hZD1mdW5jdGlvbihkYmlkLF9iYXNldXJsLF9maWxlcykgeyAvL3JldHVybiBkb3dubG9hZCBpZFxyXG5cdHZhciBmcyAgICAgPSByZXF1aXJlKFwiZnNcIik7XHJcblx0dmFyIHBhdGggICA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG5cclxuXHRcclxuXHRmaWxlcz1fZmlsZXMuc3BsaXQoXCJcXHVmZmZmXCIpO1xyXG5cdGlmIChkb3dubG9hZGluZykgcmV0dXJuIGZhbHNlOyAvL29ubHkgb25lIHNlc3Npb25cclxuXHR1c2VyQ2FuY2VsPWZhbHNlO1xyXG5cdHRvdGFsRG93bmxvYWRCeXRlPTA7XHJcblx0bmV4dEZpbGUoKTtcclxuXHRkb3dubG9hZGluZz10cnVlO1xyXG5cdGJhc2V1cmw9X2Jhc2V1cmw7XHJcblx0aWYgKGJhc2V1cmxbYmFzZXVybC5sZW5ndGgtMV0hPScvJyliYXNldXJsKz0nLyc7XHJcblx0dGFyZ2V0UGF0aD1rc2FuYWdhcC5yb290UGF0aCtkYmlkKycvJztcclxuXHR0ZW1wUGF0aD1rc2FuYWdhcC5yb290UGF0aCtcIi50bXAvXCI7XHJcblx0cmVzdWx0PVwiXCI7XHJcblx0cmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbnZhciBuZXh0RmlsZT1mdW5jdGlvbigpIHtcclxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRpZiAobmZpbGU9PWZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRuZmlsZSsrO1xyXG5cdFx0XHRlbmREb3dubG9hZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0ZG93bmxvYWRGaWxlKG5maWxlKyspO1x0XHJcblx0XHR9XHJcblx0fSwxMDApO1xyXG59XHJcblxyXG52YXIgZG93bmxvYWRGaWxlPWZ1bmN0aW9uKG5maWxlKSB7XHJcblx0dmFyIHVybD1iYXNldXJsK2ZpbGVzW25maWxlXTtcclxuXHR2YXIgdG1wZmlsZW5hbWU9dGVtcFBhdGgrZmlsZXNbbmZpbGVdO1xyXG5cdHZhciBta2RpcnAgPSByZXF1aXJlKFwiLi9ta2RpcnBcIik7XHJcblx0dmFyIGZzICAgICA9IHJlcXVpcmUoXCJmc1wiKTtcclxuXHR2YXIgaHR0cCAgID0gcmVxdWlyZShcImh0dHBcIik7XHJcblxyXG5cdG1rZGlycC5zeW5jKHBhdGguZGlybmFtZSh0bXBmaWxlbmFtZSkpO1xyXG5cdHZhciB3cml0ZVN0cmVhbSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHRtcGZpbGVuYW1lKTtcclxuXHR2YXIgZGF0YWxlbmd0aD0wO1xyXG5cdHZhciByZXF1ZXN0ID0gaHR0cC5nZXQodXJsLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG5cdFx0cmVzcG9uc2Uub24oJ2RhdGEnLGZ1bmN0aW9uKGNodW5rKXtcclxuXHRcdFx0d3JpdGVTdHJlYW0ud3JpdGUoY2h1bmspO1xyXG5cdFx0XHR0b3RhbERvd25sb2FkQnl0ZSs9Y2h1bmsubGVuZ3RoO1xyXG5cdFx0XHRpZiAodXNlckNhbmNlbCkge1xyXG5cdFx0XHRcdHdyaXRlU3RyZWFtLmVuZCgpO1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtuZXh0RmlsZSgpO30sMTAwKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRyZXNwb25zZS5vbihcImVuZFwiLGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR3cml0ZVN0cmVhbS5lbmQoKTtcclxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe25leHRGaWxlKCk7fSwxMDApO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBjYW5jZWxEb3dubG9hZD1mdW5jdGlvbigpIHtcclxuXHR1c2VyQ2FuY2VsPXRydWU7XHJcblx0ZW5kRG93bmxvYWQoKTtcclxufVxyXG52YXIgdmVyaWZ5PWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB0cnVlO1xyXG59XHJcbnZhciBlbmREb3dubG9hZD1mdW5jdGlvbigpIHtcclxuXHRuZmlsZT1maWxlcy5sZW5ndGgrMTsvL3N0b3BcclxuXHRyZXN1bHQ9XCJjYW5jZWxsZWRcIjtcclxuXHRkb3dubG9hZGluZz1mYWxzZTtcclxuXHRpZiAodXNlckNhbmNlbCkgcmV0dXJuO1xyXG5cdHZhciBmcyAgICAgPSByZXF1aXJlKFwiZnNcIik7XHJcblx0dmFyIG1rZGlycCA9IHJlcXVpcmUoXCIuL21rZGlycFwiKTtcclxuXHJcblx0Zm9yICh2YXIgaT0wO2k8ZmlsZXMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIHRhcmdldGZpbGVuYW1lPXRhcmdldFBhdGgrZmlsZXNbaV07XHJcblx0XHR2YXIgdG1wZmlsZW5hbWUgICA9dGVtcFBhdGgrZmlsZXNbaV07XHJcblx0XHRta2RpcnAuc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0ZmlsZW5hbWUpKTtcclxuXHRcdGZzLnJlbmFtZVN5bmModG1wZmlsZW5hbWUsdGFyZ2V0ZmlsZW5hbWUpO1xyXG5cdH1cclxuXHRpZiAodmVyaWZ5KCkpIHtcclxuXHRcdHJlc3VsdD1cInN1Y2Nlc3NcIjtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmVzdWx0PVwiZXJyb3JcIjtcclxuXHR9XHJcbn1cclxuXHJcbnZhciBkb3dubG9hZGVkQnl0ZT1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gdG90YWxEb3dubG9hZEJ5dGU7XHJcbn1cclxudmFyIGRvbmVEb3dubG9hZD1mdW5jdGlvbigpIHtcclxuXHRpZiAobmZpbGU+ZmlsZXMubGVuZ3RoKSByZXR1cm4gcmVzdWx0O1xyXG5cdGVsc2UgcmV0dXJuIFwiXCI7XHJcbn1cclxudmFyIGRvd25sb2FkaW5nRmlsZT1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gbmZpbGUtMTtcclxufVxyXG5cclxudmFyIGRvd25sb2FkZXI9e3N0YXJ0RG93bmxvYWQ6c3RhcnREb3dubG9hZCwgZG93bmxvYWRlZEJ5dGU6ZG93bmxvYWRlZEJ5dGUsXHJcblx0ZG93bmxvYWRpbmdGaWxlOmRvd25sb2FkaW5nRmlsZSwgY2FuY2VsRG93bmxvYWQ6Y2FuY2VsRG93bmxvYWQsZG9uZURvd25sb2FkOmRvbmVEb3dubG9hZH07XHJcbm1vZHVsZS5leHBvcnRzPWRvd25sb2FkZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG4vKiB0b2RvICwgb3B0aW9uYWwga2RiICovXHJcblxyXG52YXIgSHRtbEZTPXJlcXVpcmUoXCIuL2h0bWxmc1wiKTtcclxudmFyIGh0bWw1ZnM9cmVxdWlyZShcIi4vaHRtbDVmc1wiKTtcclxudmFyIENoZWNrQnJvd3Nlcj1yZXF1aXJlKFwiLi9jaGVja2Jyb3dzZXJcIik7XHJcbnZhciBFPVJlYWN0LmNyZWF0ZUVsZW1lbnQ7XHJcbiAgXHJcblxyXG52YXIgRmlsZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcblx0Z2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIHtkb3dubG9hZGluZzpmYWxzZSxwcm9ncmVzczowfTtcclxuXHR9LFxyXG5cdHVwZGF0YWJsZTpmdW5jdGlvbihmKSB7XHJcbiAgICAgICAgdmFyIGNsYXNzZXM9XCJidG4gYnRuLXdhcm5pbmdcIjtcclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kb3dubG9hZGluZykgY2xhc3Nlcys9XCIgZGlzYWJsZWRcIjtcclxuXHRcdGlmIChmLmhhc1VwZGF0ZSkgcmV0dXJuICAgRShcImJ1dHRvblwiLCB7Y2xhc3NOYW1lOiBjbGFzc2VzLCBcclxuXHRcdFx0XCJkYXRhLWZpbGVuYW1lXCI6IGYuZmlsZW5hbWUsIFwiZGF0YS11cmxcIjogZi51cmwsIFxyXG5cdCAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuZG93bmxvYWRcclxuXHQgICAgICAgfSwgXCJVcGRhdGVcIilcclxuXHRcdGVsc2UgcmV0dXJuIG51bGw7XHJcblx0fSxcclxuXHRzaG93TG9jYWw6ZnVuY3Rpb24oZikge1xyXG4gICAgICAgIHZhciBjbGFzc2VzPVwiYnRuIGJ0bi1kYW5nZXJcIjtcclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kb3dubG9hZGluZykgY2xhc3Nlcys9XCIgZGlzYWJsZWRcIjtcclxuXHQgIHJldHVybiBFKFwidHJcIiwgbnVsbCwgRShcInRkXCIsIG51bGwsIGYuZmlsZW5hbWUpLCBcclxuXHQgICAgICBFKFwidGRcIiwgbnVsbCksIFxyXG5cdCAgICAgIEUoXCJ0ZFwiLCB7Y2xhc3NOYW1lOiBcInB1bGwtcmlnaHRcIn0sIFxyXG5cdCAgICAgIHRoaXMudXBkYXRhYmxlKGYpLCBFKFwiYnV0dG9uXCIsIHtjbGFzc05hbWU6IGNsYXNzZXMsIFxyXG5cdCAgICAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuZGVsZXRlRmlsZSwgXCJkYXRhLWZpbGVuYW1lXCI6IGYuZmlsZW5hbWV9LCBcIkRlbGV0ZVwiKVxyXG5cdCAgICAgICAgXHJcblx0ICAgICAgKVxyXG5cdCAgKVxyXG5cdH0sICBcclxuXHRzaG93UmVtb3RlOmZ1bmN0aW9uKGYpIHsgXHJcblx0ICB2YXIgY2xhc3Nlcz1cImJ0biBidG4td2FybmluZ1wiO1xyXG5cdCAgaWYgKHRoaXMuc3RhdGUuZG93bmxvYWRpbmcpIGNsYXNzZXMrPVwiIGRpc2FibGVkXCI7XHJcblx0ICByZXR1cm4gKEUoXCJ0clwiLCB7XCJkYXRhLWlkXCI6IGYuZmlsZW5hbWV9LCBFKFwidGRcIiwgbnVsbCwgXHJcblx0ICAgICAgZi5maWxlbmFtZSksIFxyXG5cdCAgICAgIEUoXCJ0ZFwiLCBudWxsLCBmLmRlc2MpLCBcclxuXHQgICAgICBFKFwidGRcIiwgbnVsbCwgXHJcblx0ICAgICAgRShcInNwYW5cIiwge1wiZGF0YS1maWxlbmFtZVwiOiBmLmZpbGVuYW1lLCBcImRhdGEtdXJsXCI6IGYudXJsLCBcclxuXHQgICAgICAgICAgICBjbGFzc05hbWU6IGNsYXNzZXMsIFxyXG5cdCAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuZG93bmxvYWR9LCBcIkRvd25sb2FkXCIpXHJcblx0ICAgICAgKVxyXG5cdCAgKSk7XHJcblx0fSxcclxuXHRzaG93RmlsZTpmdW5jdGlvbihmKSB7XHJcblx0Ly9cdHJldHVybiA8c3BhbiBkYXRhLWlkPXtmLmZpbGVuYW1lfT57Zi51cmx9PC9zcGFuPlxyXG5cdFx0cmV0dXJuIChmLnJlYWR5KT90aGlzLnNob3dMb2NhbChmKTp0aGlzLnNob3dSZW1vdGUoZik7XHJcblx0fSxcclxuXHRyZWxvYWREaXI6ZnVuY3Rpb24oKSB7XHJcblx0XHR0aGlzLnByb3BzLmFjdGlvbihcInJlbG9hZFwiKTtcclxuXHR9LFxyXG5cdGRvd25sb2FkOmZ1bmN0aW9uKGUpIHtcclxuXHRcdHZhciB1cmw9ZS50YXJnZXQuZGF0YXNldFtcInVybFwiXTtcclxuXHRcdHZhciBmaWxlbmFtZT1lLnRhcmdldC5kYXRhc2V0W1wiZmlsZW5hbWVcIl07XHJcblx0XHR0aGlzLnNldFN0YXRlKHtkb3dubG9hZGluZzp0cnVlLHByb2dyZXNzOjAsdXJsOnVybH0pO1xyXG5cdFx0dGhpcy51c2VyYnJlYWs9ZmFsc2U7XHJcblx0XHRodG1sNWZzLmRvd25sb2FkKHVybCxmaWxlbmFtZSxmdW5jdGlvbigpe1xyXG5cdFx0XHR0aGlzLnJlbG9hZERpcigpO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtkb3dubG9hZGluZzpmYWxzZSxwcm9ncmVzczoxfSk7XHJcblx0XHRcdH0sZnVuY3Rpb24ocHJvZ3Jlc3MsdG90YWwpe1xyXG5cdFx0XHRcdGlmIChwcm9ncmVzcz09MCkge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7bWVzc2FnZTpcInRvdGFsIFwiK3RvdGFsfSlcclxuXHRcdFx0IFx0fVxyXG5cdFx0XHQgXHR0aGlzLnNldFN0YXRlKHtwcm9ncmVzczpwcm9ncmVzc30pO1xyXG5cdFx0XHQgXHQvL2lmIHVzZXIgcHJlc3MgYWJvcnQgcmV0dXJuIHRydWVcclxuXHRcdFx0IFx0cmV0dXJuIHRoaXMudXNlcmJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHQsdGhpcyk7XHJcblx0fSxcclxuXHRkZWxldGVGaWxlOmZ1bmN0aW9uKCBlKSB7XHJcblx0XHR2YXIgZmlsZW5hbWU9ZS50YXJnZXQuYXR0cmlidXRlc1tcImRhdGEtZmlsZW5hbWVcIl0udmFsdWU7XHJcblx0XHR0aGlzLnByb3BzLmFjdGlvbihcImRlbGV0ZVwiLGZpbGVuYW1lKTtcclxuXHR9LFxyXG5cdGFsbEZpbGVzUmVhZHk6ZnVuY3Rpb24oZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMucHJvcHMuZmlsZXMuZXZlcnkoZnVuY3Rpb24oZil7IHJldHVybiBmLnJlYWR5fSk7XHJcblx0fSxcclxuXHRkaXNtaXNzOmZ1bmN0aW9uKCkge1xyXG5cdFx0JCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XHJcblx0XHR0aGlzLnByb3BzLmFjdGlvbihcImRpc21pc3NcIik7XHJcblx0fSxcclxuXHRhYm9ydGRvd25sb2FkOmZ1bmN0aW9uKCkge1xyXG5cdFx0dGhpcy51c2VyYnJlYWs9dHJ1ZTtcclxuXHR9LFxyXG5cdHNob3dQcm9ncmVzczpmdW5jdGlvbigpIHtcclxuXHQgICAgIGlmICh0aGlzLnN0YXRlLmRvd25sb2FkaW5nKSB7XHJcblx0ICAgICAgdmFyIHByb2dyZXNzPU1hdGgucm91bmQodGhpcy5zdGF0ZS5wcm9ncmVzcyoxMDApO1xyXG5cdCAgICAgIHJldHVybiAoXHJcblx0ICAgICAgXHRFKFwiZGl2XCIsIG51bGwsIFxyXG5cdCAgICAgIFx0XCJEb3dubG9hZGluZyBmcm9tIFwiLCB0aGlzLnN0YXRlLnVybCwgXHJcblx0ICAgICAgRShcImRpdlwiLCB7a2V5OiBcInByb2dyZXNzXCIsIGNsYXNzTmFtZTogXCJwcm9ncmVzcyBjb2wtbWQtOFwifSwgXHJcblx0ICAgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJwcm9ncmVzcy1iYXJcIiwgcm9sZTogXCJwcm9ncmVzc2JhclwiLCBcclxuXHQgICAgICAgICAgICAgIFwiYXJpYS12YWx1ZW5vd1wiOiBwcm9ncmVzcywgXCJhcmlhLXZhbHVlbWluXCI6IFwiMFwiLCBcclxuXHQgICAgICAgICAgICAgIFwiYXJpYS12YWx1ZW1heFwiOiBcIjEwMFwiLCBzdHlsZToge3dpZHRoOiBwcm9ncmVzcytcIiVcIn19LCBcclxuXHQgICAgICAgICAgICBwcm9ncmVzcywgXCIlXCJcclxuXHQgICAgICAgICAgKVxyXG5cdCAgICAgICAgKSwgXHJcblx0ICAgICAgICBFKFwiYnV0dG9uXCIsIHtvbkNsaWNrOiB0aGlzLmFib3J0ZG93bmxvYWQsIFxyXG5cdCAgICAgICAgXHRjbGFzc05hbWU6IFwiYnRuIGJ0bi1kYW5nZXIgY29sLW1kLTRcIn0sIFwiQWJvcnRcIilcclxuXHQgICAgICAgIClcclxuXHQgICAgICAgICk7XHJcblx0ICAgICAgfSBlbHNlIHtcclxuXHQgICAgICBcdFx0aWYgKCB0aGlzLmFsbEZpbGVzUmVhZHkoKSApIHtcclxuXHQgICAgICBcdFx0XHRyZXR1cm4gRShcImJ1dHRvblwiLCB7b25DbGljazogdGhpcy5kaXNtaXNzLCBjbGFzc05hbWU6IFwiYnRuIGJ0bi1zdWNjZXNzXCJ9LCBcIk9rXCIpXHJcblx0ICAgICAgXHRcdH0gZWxzZSByZXR1cm4gbnVsbDtcclxuXHQgICAgICBcdFx0XHJcblx0ICAgICAgfVxyXG5cdH0sXHJcblx0c2hvd1VzYWdlOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHBlcmNlbnQ9dGhpcy5wcm9wcy5yZW1haW5QZXJjZW50O1xyXG4gICAgICAgICAgIHJldHVybiAoRShcImRpdlwiLCBudWxsLCBFKFwic3BhblwiLCB7Y2xhc3NOYW1lOiBcInB1bGwtbGVmdFwifSwgXCJVc2FnZTpcIiksIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJwcm9ncmVzc1wifSwgXHJcblx0XHQgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXN1Y2Nlc3MgcHJvZ3Jlc3MtYmFyLXN0cmlwZWRcIiwgcm9sZTogXCJwcm9ncmVzc2JhclwiLCBzdHlsZToge3dpZHRoOiBwZXJjZW50K1wiJVwifX0sIFxyXG5cdFx0ICAgIFx0cGVyY2VudCtcIiVcIlxyXG5cdFx0ICApXHJcblx0XHQpKSk7XHJcblx0fSxcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKSB7XHJcblx0ICBcdHJldHVybiAoXHJcblx0XHRFKFwiZGl2XCIsIHtyZWY6IFwiZGlhbG9nMVwiLCBjbGFzc05hbWU6IFwibW9kYWwgZmFkZVwiLCBcImRhdGEtYmFja2Ryb3BcIjogXCJzdGF0aWNcIn0sIFxyXG5cdFx0ICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1kaWFsb2dcIn0sIFxyXG5cdFx0ICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWNvbnRlbnRcIn0sIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtaGVhZGVyXCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiaDRcIiwge2NsYXNzTmFtZTogXCJtb2RhbC10aXRsZVwifSwgXCJGaWxlIEluc3RhbGxlclwiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWJvZHlcIn0sIFxyXG5cdFx0ICAgICAgICBcdEUoXCJ0YWJsZVwiLCB7Y2xhc3NOYW1lOiBcInRhYmxlXCJ9LCBcclxuXHRcdCAgICAgICAgXHRFKFwidGJvZHlcIiwgbnVsbCwgXHJcblx0XHQgICAgICAgICAgXHR0aGlzLnByb3BzLmZpbGVzLm1hcCh0aGlzLnNob3dGaWxlKVxyXG5cdFx0ICAgICAgICAgIFx0KVxyXG5cdFx0ICAgICAgICAgIClcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1mb290ZXJcIn0sIFxyXG5cdFx0ICAgICAgICBcdHRoaXMuc2hvd1VzYWdlKCksIFxyXG5cdFx0ICAgICAgICAgICB0aGlzLnNob3dQcm9ncmVzcygpXHJcblx0XHQgICAgICAgIClcclxuXHRcdCAgICAgIClcclxuXHRcdCAgICApXHJcblx0XHQgIClcclxuXHRcdCk7XHJcblx0fSxcdFxyXG5cdGNvbXBvbmVudERpZE1vdW50OmZ1bmN0aW9uKCkge1xyXG5cdFx0JCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdzaG93Jyk7XHJcblx0fVxyXG59KTtcclxuLypUT0RPIGtkYiBjaGVjayB2ZXJzaW9uKi9cclxudmFyIEZpbGVtYW5hZ2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG5cdGdldEluaXRpYWxTdGF0ZTpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBxdW90YT10aGlzLmdldFF1b3RhKCk7XHJcblx0XHRyZXR1cm4ge2Jyb3dzZXJSZWFkeTpmYWxzZSxub3VwZGF0ZTp0cnVlLFx0cmVxdWVzdFF1b3RhOnF1b3RhLHJlbWFpbjowfTtcclxuXHR9LFxyXG5cdGdldFF1b3RhOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHE9dGhpcy5wcm9wcy5xdW90YXx8XCIxMjhNXCI7XHJcblx0XHR2YXIgdW5pdD1xW3EubGVuZ3RoLTFdO1xyXG5cdFx0dmFyIHRpbWVzPTE7XHJcblx0XHRpZiAodW5pdD09XCJNXCIpIHRpbWVzPTEwMjQqMTAyNDtcclxuXHRcdGVsc2UgaWYgKHVuaXQ9XCJLXCIpIHRpbWVzPTEwMjQ7XHJcblx0XHRyZXR1cm4gcGFyc2VJbnQocSkgKiB0aW1lcztcclxuXHR9LFxyXG5cdG1pc3NpbmdLZGI6ZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAoa3NhbmFnYXAucGxhdGZvcm0hPVwiY2hyb21lXCIpIHJldHVybiBbXTtcclxuXHRcdHZhciBtaXNzaW5nPXRoaXMucHJvcHMubmVlZGVkLmZpbHRlcihmdW5jdGlvbihrZGIpe1xyXG5cdFx0XHRmb3IgKHZhciBpIGluIGh0bWw1ZnMuZmlsZXMpIHtcclxuXHRcdFx0XHRpZiAoaHRtbDVmcy5maWxlc1tpXVswXT09a2RiLmZpbGVuYW1lKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9LHRoaXMpO1xyXG5cdFx0cmV0dXJuIG1pc3Npbmc7XHJcblx0fSxcclxuXHRnZXRSZW1vdGVVcmw6ZnVuY3Rpb24oZm4pIHtcclxuXHRcdHZhciBmPXRoaXMucHJvcHMubmVlZGVkLmZpbHRlcihmdW5jdGlvbihmKXtyZXR1cm4gZi5maWxlbmFtZT09Zm59KTtcclxuXHRcdGlmIChmLmxlbmd0aCApIHJldHVybiBmWzBdLnVybDtcclxuXHR9LFxyXG5cdGdlbkZpbGVMaXN0OmZ1bmN0aW9uKGV4aXN0aW5nLG1pc3Npbmcpe1xyXG5cdFx0dmFyIG91dD1bXTtcclxuXHRcdGZvciAodmFyIGkgaW4gZXhpc3RpbmcpIHtcclxuXHRcdFx0dmFyIHVybD10aGlzLmdldFJlbW90ZVVybChleGlzdGluZ1tpXVswXSk7XHJcblx0XHRcdG91dC5wdXNoKHtmaWxlbmFtZTpleGlzdGluZ1tpXVswXSwgdXJsIDp1cmwsIHJlYWR5OnRydWUgfSk7XHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpIGluIG1pc3NpbmcpIHtcclxuXHRcdFx0b3V0LnB1c2gobWlzc2luZ1tpXSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb3V0O1xyXG5cdH0sXHJcblx0cmVsb2FkOmZ1bmN0aW9uKCkge1xyXG5cdFx0aHRtbDVmcy5yZWFkZGlyKGZ1bmN0aW9uKGZpbGVzKXtcclxuICBcdFx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczp0aGlzLmdlbkZpbGVMaXN0KGZpbGVzLHRoaXMubWlzc2luZ0tkYigpKX0pO1xyXG4gIFx0XHR9LHRoaXMpO1xyXG5cdCB9LFxyXG5cdGRlbGV0ZUZpbGU6ZnVuY3Rpb24oZm4pIHtcclxuXHQgIGh0bWw1ZnMucm0oZm4sZnVuY3Rpb24oKXtcclxuXHQgIFx0dGhpcy5yZWxvYWQoKTtcclxuXHQgIH0sdGhpcyk7XHJcblx0fSxcclxuXHRvblF1b3RlT2s6ZnVuY3Rpb24ocXVvdGEsdXNhZ2UpIHtcclxuXHRcdGlmIChrc2FuYWdhcC5wbGF0Zm9ybSE9XCJjaHJvbWVcIikge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwib25xdW90ZW9rXCIpO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtub3VwZGF0ZTp0cnVlLG1pc3Npbmc6W10sZmlsZXM6W10sYXV0b2Nsb3NlOnRydWVcclxuXHRcdFx0XHQscXVvdGE6cXVvdGEscmVtYWluOnF1b3RhLXVzYWdlLHVzYWdlOnVzYWdlfSk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coXCJxdW90ZSBva1wiKTtcclxuXHRcdHZhciBmaWxlcz10aGlzLmdlbkZpbGVMaXN0KGh0bWw1ZnMuZmlsZXMsdGhpcy5taXNzaW5nS2RiKCkpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRoYXQuY2hlY2tJZlVwZGF0ZShmaWxlcyxmdW5jdGlvbihoYXN1cGRhdGUpIHtcclxuXHRcdFx0dmFyIG1pc3Npbmc9dGhpcy5taXNzaW5nS2RiKCk7XHJcblx0XHRcdHZhciBhdXRvY2xvc2U9dGhpcy5wcm9wcy5hdXRvY2xvc2U7XHJcblx0XHRcdGlmIChtaXNzaW5nLmxlbmd0aCkgYXV0b2Nsb3NlPWZhbHNlO1xyXG5cdFx0XHR0aGF0LnNldFN0YXRlKHthdXRvY2xvc2U6YXV0b2Nsb3NlLFxyXG5cdFx0XHRcdHF1b3RhOnF1b3RhLHVzYWdlOnVzYWdlLGZpbGVzOmZpbGVzLFxyXG5cdFx0XHRcdG1pc3Npbmc6bWlzc2luZyxcclxuXHRcdFx0XHRub3VwZGF0ZTohaGFzdXBkYXRlLFxyXG5cdFx0XHRcdHJlbWFpbjpxdW90YS11c2FnZX0pO1xyXG5cdFx0fSk7XHJcblx0fSwgIFxyXG5cdG9uQnJvd3Nlck9rOmZ1bmN0aW9uKCkge1xyXG5cdCAgdGhpcy50b3RhbERvd25sb2FkU2l6ZSgpO1xyXG5cdH0sIFxyXG5cdGRpc21pc3M6ZnVuY3Rpb24oKSB7XHJcblx0XHR0aGlzLnByb3BzLm9uUmVhZHkodGhpcy5zdGF0ZS51c2FnZSx0aGlzLnN0YXRlLnF1b3RhKTtcclxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0dmFyIG1vZGFsaW49JChcIi5tb2RhbC5pblwiKTtcclxuXHRcdFx0aWYgKG1vZGFsaW4ubW9kYWwpIG1vZGFsaW4ubW9kYWwoJ2hpZGUnKTtcclxuXHRcdH0sNTAwKTtcclxuXHR9LCBcclxuXHR0b3RhbERvd25sb2FkU2l6ZTpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBmaWxlcz10aGlzLm1pc3NpbmdLZGIoKTtcclxuXHRcdHZhciB0YXNrcXVldWU9W10sdG90YWxzaXplPTA7XHJcblx0XHRmb3IgKHZhciBpPTA7aTxmaWxlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHRhc2txdWV1ZS5wdXNoKFxyXG5cdFx0XHRcdChmdW5jdGlvbihpZHgpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIChmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0aWYgKCEodHlwZW9mIGRhdGE9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkpIHRvdGFsc2l6ZSs9ZGF0YTtcclxuXHRcdFx0XHRcdFx0aHRtbDVmcy5nZXREb3dubG9hZFNpemUoZmlsZXNbaWR4XS51cmwsdGFza3F1ZXVlLnNoaWZ0KCkpO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fSkoaSlcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhKXtcdFxyXG5cdFx0XHR0b3RhbHNpemUrPWRhdGE7XHJcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXt0aGF0LnNldFN0YXRlKHtyZXF1aXJlU3BhY2U6dG90YWxzaXplLGJyb3dzZXJSZWFkeTp0cnVlfSl9LDApO1xyXG5cdFx0fSk7XHJcblx0XHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7XHJcblx0fSxcclxuXHRjaGVja0lmVXBkYXRlOmZ1bmN0aW9uKGZpbGVzLGNiKSB7XHJcblx0XHR2YXIgdGFza3F1ZXVlPVtdO1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8ZmlsZXMubGVuZ3RoO2krKykge1xyXG5cdFx0XHR0YXNrcXVldWUucHVzaChcclxuXHRcdFx0XHQoZnVuY3Rpb24oaWR4KXtcclxuXHRcdFx0XHRcdHJldHVybiAoZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0XHRcdGlmICghKHR5cGVvZiBkYXRhPT0nb2JqZWN0JyAmJiBkYXRhLl9fZW1wdHkpKSBmaWxlc1tpZHgtMV0uaGFzVXBkYXRlPWRhdGE7XHJcblx0XHRcdFx0XHRcdGh0bWw1ZnMuY2hlY2tVcGRhdGUoZmlsZXNbaWR4XS51cmwsZmlsZXNbaWR4XS5maWxlbmFtZSx0YXNrcXVldWUuc2hpZnQoKSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KShpKVxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEpe1x0XHJcblx0XHRcdGZpbGVzW2ZpbGVzLmxlbmd0aC0xXS5oYXNVcGRhdGU9ZGF0YTtcclxuXHRcdFx0dmFyIGhhc3VwZGF0ZT1maWxlcy5zb21lKGZ1bmN0aW9uKGYpe3JldHVybiBmLmhhc1VwZGF0ZX0pO1xyXG5cdFx0XHRpZiAoY2IpIGNiLmFwcGx5KHRoYXQsW2hhc3VwZGF0ZV0pO1xyXG5cdFx0fSk7XHJcblx0XHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7XHJcblx0fSxcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKXtcclxuICAgIFx0XHRpZiAoIXRoaXMuc3RhdGUuYnJvd3NlclJlYWR5KSB7ICAgXHJcbiAgICAgIFx0XHRcdHJldHVybiBFKENoZWNrQnJvd3Nlciwge2ZlYXR1cmU6IFwiZnNcIiwgb25SZWFkeTogdGhpcy5vbkJyb3dzZXJPa30pXHJcbiAgICBcdFx0fSBpZiAoIXRoaXMuc3RhdGUucXVvdGEgfHwgdGhpcy5zdGF0ZS5yZW1haW48dGhpcy5zdGF0ZS5yZXF1aXJlU3BhY2UpIHsgIFxyXG4gICAgXHRcdFx0dmFyIHF1b3RhPXRoaXMuc3RhdGUucmVxdWVzdFF1b3RhO1xyXG4gICAgXHRcdFx0aWYgKHRoaXMuc3RhdGUudXNhZ2UrdGhpcy5zdGF0ZS5yZXF1aXJlU3BhY2U+cXVvdGEpIHtcclxuICAgIFx0XHRcdFx0cXVvdGE9KHRoaXMuc3RhdGUudXNhZ2UrdGhpcy5zdGF0ZS5yZXF1aXJlU3BhY2UpKjEuNTtcclxuICAgIFx0XHRcdH1cclxuICAgICAgXHRcdFx0cmV0dXJuIEUoSHRtbEZTLCB7cXVvdGE6IHF1b3RhLCBhdXRvY2xvc2U6IFwidHJ1ZVwiLCBvblJlYWR5OiB0aGlzLm9uUXVvdGVPa30pXHJcbiAgICAgIFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZiAoIXRoaXMuc3RhdGUubm91cGRhdGUgfHwgdGhpcy5taXNzaW5nS2RiKCkubGVuZ3RoIHx8ICF0aGlzLnN0YXRlLmF1dG9jbG9zZSkge1xyXG5cdFx0XHRcdHZhciByZW1haW49TWF0aC5yb3VuZCgodGhpcy5zdGF0ZS51c2FnZS90aGlzLnN0YXRlLnF1b3RhKSoxMDApO1x0XHRcdFx0XHJcblx0XHRcdFx0cmV0dXJuIEUoRmlsZUxpc3QsIHthY3Rpb246IHRoaXMuYWN0aW9uLCBmaWxlczogdGhpcy5zdGF0ZS5maWxlcywgcmVtYWluUGVyY2VudDogcmVtYWlufSlcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KCB0aGlzLmRpc21pc3MgLDApO1xyXG5cdFx0XHRcdHJldHVybiBFKFwic3BhblwiLCBudWxsLCBcIlN1Y2Nlc3NcIik7XHJcblx0XHRcdH1cclxuICAgICAgXHRcdH1cclxuXHR9LFxyXG5cdGFjdGlvbjpmdW5jdGlvbigpIHtcclxuXHQgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHQgIHZhciB0eXBlPWFyZ3Muc2hpZnQoKTtcclxuXHQgIHZhciByZXM9bnVsbCwgdGhhdD10aGlzO1xyXG5cdCAgaWYgKHR5cGU9PVwiZGVsZXRlXCIpIHtcclxuXHQgICAgdGhpcy5kZWxldGVGaWxlKGFyZ3NbMF0pO1xyXG5cdCAgfSAgZWxzZSBpZiAodHlwZT09XCJyZWxvYWRcIikge1xyXG5cdCAgXHR0aGlzLnJlbG9hZCgpO1xyXG5cdCAgfSBlbHNlIGlmICh0eXBlPT1cImRpc21pc3NcIikge1xyXG5cdCAgXHR0aGlzLmRpc21pc3MoKTtcclxuXHQgIH1cclxuXHR9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHM9RmlsZW1hbmFnZXI7IiwiLyogZW11bGF0ZSBmaWxlc3lzdGVtIG9uIGh0bWw1IGJyb3dzZXIgKi9cclxudmFyIGdldF9oZWFkPWZ1bmN0aW9uKHVybCxmaWVsZCxjYil7XHJcblx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdHhoci5vcGVuKFwiSEVBRFwiLCB1cmwsIHRydWUpO1xyXG5cdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKHRoaXMucmVhZHlTdGF0ZSA9PSB0aGlzLkRPTkUpIHtcclxuXHRcdFx0XHRjYih4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoZmllbGQpKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRpZiAodGhpcy5zdGF0dXMhPT0yMDAmJnRoaXMuc3RhdHVzIT09MjA2KSB7XHJcblx0XHRcdFx0XHRjYihcIlwiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gXHJcblx0fTtcclxuXHR4aHIuc2VuZCgpO1x0XHJcbn1cclxudmFyIGdldF9kYXRlPWZ1bmN0aW9uKHVybCxjYikge1xyXG5cdGdldF9oZWFkKHVybCxcIkxhc3QtTW9kaWZpZWRcIixmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRjYih2YWx1ZSk7XHJcblx0fSk7XHJcbn1cclxudmFyIGdldF9zaXplPWZ1bmN0aW9uKHVybCwgY2IpIHtcclxuXHRnZXRfaGVhZCh1cmwsXCJDb250ZW50LUxlbmd0aFwiLGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdGNiKHBhcnNlSW50KHZhbHVlKSk7XHJcblx0fSk7XHJcbn07XHJcbnZhciBjaGVja1VwZGF0ZT1mdW5jdGlvbih1cmwsZm4sY2IpIHtcclxuXHRpZiAoIXVybCkge1xyXG5cdFx0Y2IoZmFsc2UpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRnZXRfZGF0ZSh1cmwsZnVuY3Rpb24oZCl7XHJcblx0XHRBUEkuZnMucm9vdC5nZXRGaWxlKGZuLCB7Y3JlYXRlOiBmYWxzZSwgZXhjbHVzaXZlOiBmYWxzZX0sIGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xyXG5cdFx0XHRmaWxlRW50cnkuZ2V0TWV0YWRhdGEoZnVuY3Rpb24obWV0YWRhdGEpe1xyXG5cdFx0XHRcdHZhciBsb2NhbERhdGU9RGF0ZS5wYXJzZShtZXRhZGF0YS5tb2RpZmljYXRpb25UaW1lKTtcclxuXHRcdFx0XHR2YXIgdXJsRGF0ZT1EYXRlLnBhcnNlKGQpO1xyXG5cdFx0XHRcdGNiKHVybERhdGU+bG9jYWxEYXRlKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LGZ1bmN0aW9uKCl7XHJcblx0XHRcdGNiKGZhbHNlKTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG59XHJcbnZhciBkb3dubG9hZD1mdW5jdGlvbih1cmwsZm4sY2Isc3RhdHVzY2IsY29udGV4dCkge1xyXG5cdCB2YXIgdG90YWxzaXplPTAsYmF0Y2hlcz1udWxsLHdyaXR0ZW49MDtcclxuXHQgdmFyIGZpbGVFbnRyeT0wLCBmaWxlV3JpdGVyPTA7XHJcblx0IHZhciBjcmVhdGVCYXRjaGVzPWZ1bmN0aW9uKHNpemUpIHtcclxuXHRcdHZhciBieXRlcz0xMDI0KjEwMjQsIG91dD1bXTtcclxuXHRcdHZhciBiPU1hdGguZmxvb3Ioc2l6ZSAvIGJ5dGVzKTtcclxuXHRcdHZhciBsYXN0PXNpemUgJWJ5dGVzO1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8PWI7aSsrKSB7XHJcblx0XHRcdG91dC5wdXNoKGkqYnl0ZXMpO1xyXG5cdFx0fVxyXG5cdFx0b3V0LnB1c2goYipieXRlcytsYXN0KTtcclxuXHRcdHJldHVybiBvdXQ7XHJcblx0IH1cclxuXHQgdmFyIGZpbmlzaD1mdW5jdGlvbigpIHtcclxuXHRcdCBybShmbixmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGZpbGVFbnRyeS5tb3ZlVG8oZmlsZUVudHJ5LmZpbGVzeXN0ZW0ucm9vdCwgZm4sZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdHNldFRpbWVvdXQoIGNiLmJpbmQoY29udGV4dCxmYWxzZSkgLCAwKSA7IFxyXG5cdFx0XHRcdH0sZnVuY3Rpb24oZSl7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImZhaWxlZFwiLGUpXHJcblx0XHRcdFx0fSk7XHJcblx0XHQgfSx0aGlzKTsgXHJcblx0IH07XHJcblx0XHR2YXIgdGVtcGZuPVwidGVtcC5rZGJcIjtcclxuXHRcdHZhciBiYXRjaD1mdW5jdGlvbihiKSB7XHJcblx0XHR2YXIgYWJvcnQ9ZmFsc2U7XHJcblx0XHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHR2YXIgcmVxdWVzdHVybD11cmwrXCI/XCIrTWF0aC5yYW5kb20oKTtcclxuXHRcdHhoci5vcGVuKCdnZXQnLCByZXF1ZXN0dXJsLCB0cnVlKTtcclxuXHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdSYW5nZScsICdieXRlcz0nK2JhdGNoZXNbYl0rJy0nKyhiYXRjaGVzW2IrMV0tMSkpO1xyXG5cdFx0eGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJzsgICAgXHJcblx0XHR4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgYmxvYj10aGlzLnJlc3BvbnNlO1xyXG5cdFx0XHRmaWxlRW50cnkuY3JlYXRlV3JpdGVyKGZ1bmN0aW9uKGZpbGVXcml0ZXIpIHtcclxuXHRcdFx0XHRmaWxlV3JpdGVyLnNlZWsoZmlsZVdyaXRlci5sZW5ndGgpO1xyXG5cdFx0XHRcdGZpbGVXcml0ZXIud3JpdGUoYmxvYik7XHJcblx0XHRcdFx0d3JpdHRlbis9YmxvYi5zaXplO1xyXG5cdFx0XHRcdGZpbGVXcml0ZXIub253cml0ZWVuZCA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRcdGlmIChzdGF0dXNjYikge1xyXG5cdFx0XHRcdFx0XHRhYm9ydD1zdGF0dXNjYi5hcHBseShjb250ZXh0LFsgZmlsZVdyaXRlci5sZW5ndGggLyB0b3RhbHNpemUsdG90YWxzaXplIF0pO1xyXG5cdFx0XHRcdFx0XHRpZiAoYWJvcnQpIHNldFRpbWVvdXQoIGNiLmJpbmQoY29udGV4dCxmYWxzZSkgLCAwKSA7XHJcblx0XHRcdFx0IFx0fVxyXG5cdFx0XHRcdFx0YisrO1xyXG5cdFx0XHRcdFx0aWYgKCFhYm9ydCkge1xyXG5cdFx0XHRcdFx0XHRpZiAoYjxiYXRjaGVzLmxlbmd0aC0xKSBzZXRUaW1lb3V0KGJhdGNoLmJpbmQoY29udGV4dCxiKSwwKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSAgICAgICAgICAgICAgICAgICAgZmluaXNoKCk7XHJcblx0XHRcdFx0IFx0fVxyXG5cdFx0XHQgXHR9O1xyXG5cdFx0XHR9LCBjb25zb2xlLmVycm9yKTtcclxuXHRcdH0sZmFsc2UpO1xyXG5cdFx0eGhyLnNlbmQoKTtcclxuXHR9XHJcblxyXG5cdGdldF9zaXplKHVybCxmdW5jdGlvbihzaXplKXtcclxuXHRcdHRvdGFsc2l6ZT1zaXplO1xyXG5cdFx0aWYgKCFzaXplKSB7XHJcblx0XHRcdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbZmFsc2VdKTtcclxuXHRcdH0gZWxzZSB7Ly9yZWFkeSB0byBkb3dubG9hZFxyXG5cdFx0XHRybSh0ZW1wZm4sZnVuY3Rpb24oKXtcclxuXHRcdFx0XHQgYmF0Y2hlcz1jcmVhdGVCYXRjaGVzKHNpemUpO1xyXG5cdFx0XHRcdCBpZiAoc3RhdHVzY2IpIHN0YXR1c2NiLmFwcGx5KGNvbnRleHQsWyAwLCB0b3RhbHNpemUgXSk7XHJcblx0XHRcdFx0IEFQSS5mcy5yb290LmdldEZpbGUodGVtcGZuLCB7Y3JlYXRlOiAxLCBleGNsdXNpdmU6IGZhbHNlfSwgZnVuY3Rpb24oX2ZpbGVFbnRyeSkge1xyXG5cdFx0XHRcdFx0XHRcdGZpbGVFbnRyeT1fZmlsZUVudHJ5O1xyXG5cdFx0XHRcdFx0XHRiYXRjaCgwKTtcclxuXHRcdFx0XHQgfSk7XHJcblx0XHRcdH0sdGhpcyk7XHJcblx0XHR9XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciByZWFkRmlsZT1mdW5jdGlvbihmaWxlbmFtZSxjYixjb250ZXh0KSB7XHJcblx0QVBJLmZzLnJvb3QuZ2V0RmlsZShmaWxlbmFtZSwgZnVuY3Rpb24oZmlsZUVudHJ5KSB7XHJcblx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdFx0aWYgKGNiKSBjYi5hcHBseShjYixbdGhpcy5yZXN1bHRdKTtcclxuXHRcdFx0XHR9OyAgICAgICAgICAgIFxyXG5cdH0sIGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcbnZhciB3cml0ZUZpbGU9ZnVuY3Rpb24oZmlsZW5hbWUsYnVmLGNiLGNvbnRleHQpe1xyXG5cdEFQSS5mcy5yb290LmdldEZpbGUoZmlsZW5hbWUsIHtjcmVhdGU6IHRydWUsIGV4Y2x1c2l2ZTogdHJ1ZX0sIGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xyXG5cdFx0XHRmaWxlRW50cnkuY3JlYXRlV3JpdGVyKGZ1bmN0aW9uKGZpbGVXcml0ZXIpIHtcclxuXHRcdFx0XHRmaWxlV3JpdGVyLndyaXRlKGJ1Zik7XHJcblx0XHRcdFx0ZmlsZVdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdFx0aWYgKGNiKSBjYi5hcHBseShjYixbYnVmLmJ5dGVMZW5ndGhdKTtcclxuXHRcdFx0XHR9OyAgICAgICAgICAgIFxyXG5cdFx0XHR9LCBjb25zb2xlLmVycm9yKTtcclxuXHR9LCBjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxudmFyIHJlYWRkaXI9ZnVuY3Rpb24oY2IsY29udGV4dCkge1xyXG5cdHZhciBkaXJSZWFkZXIgPSBBUEkuZnMucm9vdC5jcmVhdGVSZWFkZXIoKTtcclxuXHR2YXIgb3V0PVtdLHRoYXQ9dGhpcztcclxuXHRkaXJSZWFkZXIucmVhZEVudHJpZXMoZnVuY3Rpb24oZW50cmllcykge1xyXG5cdFx0aWYgKGVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBlbnRyeTsgZW50cnkgPSBlbnRyaWVzW2ldOyArK2kpIHtcclxuXHRcdFx0XHRpZiAoZW50cnkuaXNGaWxlKSB7XHJcblx0XHRcdFx0XHRvdXQucHVzaChbZW50cnkubmFtZSxlbnRyeS50b1VSTCA/IGVudHJ5LnRvVVJMKCkgOiBlbnRyeS50b1VSSSgpXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRBUEkuZmlsZXM9b3V0O1xyXG5cdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtvdXRdKTtcclxuXHR9LCBmdW5jdGlvbigpe1xyXG5cdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtudWxsXSk7XHJcblx0fSk7XHJcbn1cclxudmFyIGdldEZpbGVVUkw9ZnVuY3Rpb24oZmlsZW5hbWUpIHtcclxuXHRpZiAoIUFQSS5maWxlcyApIHJldHVybiBudWxsO1xyXG5cdHZhciBmaWxlPSBBUEkuZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYpe3JldHVybiBmWzBdPT1maWxlbmFtZX0pO1xyXG5cdGlmIChmaWxlLmxlbmd0aCkgcmV0dXJuIGZpbGVbMF1bMV07XHJcbn1cclxudmFyIHJtPWZ1bmN0aW9uKGZpbGVuYW1lLGNiLGNvbnRleHQpIHtcclxuXHR2YXIgdXJsPWdldEZpbGVVUkwoZmlsZW5hbWUpO1xyXG5cdGlmICh1cmwpIHJtVVJMKHVybCxjYixjb250ZXh0KTtcclxuXHRlbHNlIGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbZmFsc2VdKTtcclxufVxyXG5cclxudmFyIHJtVVJMPWZ1bmN0aW9uKGZpbGVuYW1lLGNiLGNvbnRleHQpIHtcclxuXHR3ZWJraXRSZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMKGZpbGVuYW1lLCBmdW5jdGlvbihmaWxlRW50cnkpIHtcclxuXHRcdGZpbGVFbnRyeS5yZW1vdmUoZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbdHJ1ZV0pO1xyXG5cdFx0fSwgY29uc29sZS5lcnJvcik7XHJcblx0fSwgIGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtmYWxzZV0pOy8vbm8gc3VjaCBmaWxlXHJcblx0fSk7XHJcbn1cclxuZnVuY3Rpb24gZXJyb3JIYW5kbGVyKGUpIHtcclxuXHRjb25zb2xlLmVycm9yKCdFcnJvcjogJyArZS5uYW1lKyBcIiBcIitlLm1lc3NhZ2UpO1xyXG59XHJcbnZhciBpbml0ZnM9ZnVuY3Rpb24oZ3JhbnRlZEJ5dGVzLGNiLGNvbnRleHQpIHtcclxuXHR3ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbShQRVJTSVNURU5ULCBncmFudGVkQnl0ZXMsICBmdW5jdGlvbihmcykge1xyXG5cdFx0QVBJLmZzPWZzO1xyXG5cdFx0QVBJLnF1b3RhPWdyYW50ZWRCeXRlcztcclxuXHRcdHJlYWRkaXIoZnVuY3Rpb24oKXtcclxuXHRcdFx0QVBJLmluaXRpYWxpemVkPXRydWU7XHJcblx0XHRcdGNiLmFwcGx5KGNvbnRleHQsW2dyYW50ZWRCeXRlcyxmc10pO1xyXG5cdFx0fSxjb250ZXh0KTtcclxuXHR9LCBlcnJvckhhbmRsZXIpO1xyXG59XHJcbnZhciBpbml0PWZ1bmN0aW9uKHF1b3RhLGNiLGNvbnRleHQpIHtcclxuXHRuYXZpZ2F0b3Iud2Via2l0UGVyc2lzdGVudFN0b3JhZ2UucmVxdWVzdFF1b3RhKHF1b3RhLCBcclxuXHRcdFx0ZnVuY3Rpb24oZ3JhbnRlZEJ5dGVzKSB7XHJcblx0XHRcdFx0aW5pdGZzKGdyYW50ZWRCeXRlcyxjYixjb250ZXh0KTtcclxuXHRcdH0sIGVycm9ySGFuZGxlclxyXG5cdCk7XHJcbn1cclxudmFyIHF1ZXJ5UXVvdGE9ZnVuY3Rpb24oY2IsY29udGV4dCkge1xyXG5cdHZhciB0aGF0PXRoaXM7XHJcblx0bmF2aWdhdG9yLndlYmtpdFBlcnNpc3RlbnRTdG9yYWdlLnF1ZXJ5VXNhZ2VBbmRRdW90YSggXHJcblx0IGZ1bmN0aW9uKHVzYWdlLHF1b3RhKXtcclxuXHRcdFx0aW5pdGZzKHF1b3RhLGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Y2IuYXBwbHkoY29udGV4dCxbdXNhZ2UscXVvdGFdKTtcclxuXHRcdFx0fSxjb250ZXh0KTtcclxuXHR9KTtcclxufVxyXG52YXIgQVBJPXtcclxuXHRpbml0OmluaXRcclxuXHQscmVhZGRpcjpyZWFkZGlyXHJcblx0LGNoZWNrVXBkYXRlOmNoZWNrVXBkYXRlXHJcblx0LHJtOnJtXHJcblx0LHJtVVJMOnJtVVJMXHJcblx0LGdldEZpbGVVUkw6Z2V0RmlsZVVSTFxyXG5cdCx3cml0ZUZpbGU6d3JpdGVGaWxlXHJcblx0LHJlYWRGaWxlOnJlYWRGaWxlXHJcblx0LGRvd25sb2FkOmRvd25sb2FkXHJcblx0LGdldF9oZWFkOmdldF9oZWFkXHJcblx0LGdldF9kYXRlOmdldF9kYXRlXHJcblx0LGdldF9zaXplOmdldF9zaXplXHJcblx0LGdldERvd25sb2FkU2l6ZTpnZXRfc2l6ZVxyXG5cdCxxdWVyeVF1b3RhOnF1ZXJ5UXVvdGFcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1BUEk7IiwidmFyIGh0bWw1ZnM9cmVxdWlyZShcIi4vaHRtbDVmc1wiKTtcclxudmFyIEU9UmVhY3QuY3JlYXRlRWxlbWVudDtcclxuXHJcbnZhciBodG1sZnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcblx0Z2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkgeyBcclxuXHRcdHJldHVybiB7cmVhZHk6ZmFsc2UsIHF1b3RhOjAsdXNhZ2U6MCxJbml0aWFsaXplZDpmYWxzZSxhdXRvY2xvc2U6dGhpcy5wcm9wcy5hdXRvY2xvc2V9O1xyXG5cdH0sXHJcblx0aW5pdEZpbGVzeXN0ZW06ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgcXVvdGE9dGhpcy5wcm9wcy5xdW90YXx8MTAyNCoxMDI0KjEyODsgLy8gZGVmYXVsdCAxMjhNQlxyXG5cdFx0cXVvdGE9cGFyc2VJbnQocXVvdGEpO1xyXG5cdFx0aHRtbDVmcy5pbml0KHF1b3RhLGZ1bmN0aW9uKHEpe1xyXG5cdFx0XHR0aGlzLmRpYWxvZz1mYWxzZTtcclxuXHRcdFx0JCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3F1b3RhOnEsYXV0b2Nsb3NlOnRydWV9KTtcclxuXHRcdH0sdGhpcyk7XHJcblx0fSxcclxuXHR3ZWxjb21lOmZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIChcclxuXHRcdEUoXCJkaXZcIiwge3JlZjogXCJkaWFsb2cxXCIsIGNsYXNzTmFtZTogXCJtb2RhbCBmYWRlXCIsIGlkOiBcIm15TW9kYWxcIiwgXCJkYXRhLWJhY2tkcm9wXCI6IFwic3RhdGljXCJ9LCBcclxuXHRcdCAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtZGlhbG9nXCJ9LCBcclxuXHRcdCAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1jb250ZW50XCJ9LCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWhlYWRlclwifSwgXHJcblx0XHQgICAgICAgICAgRShcImg0XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtdGl0bGVcIn0sIFwiV2VsY29tZVwiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWJvZHlcIn0sIFxyXG5cdFx0ICAgICAgICAgIFwiQnJvd3NlciB3aWxsIGFzayBmb3IgeW91ciBjb25maXJtYXRpb24uXCJcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1mb290ZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJidXR0b25cIiwge29uQ2xpY2s6IHRoaXMuaW5pdEZpbGVzeXN0ZW0sIHR5cGU6IFwiYnV0dG9uXCIsIFxyXG5cdFx0ICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0biBidG4tcHJpbWFyeVwifSwgXCJJbml0aWFsaXplIEZpbGUgU3lzdGVtXCIpXHJcblx0XHQgICAgICAgIClcclxuXHRcdCAgICAgIClcclxuXHRcdCAgICApXHJcblx0XHQgIClcclxuXHRcdCApO1xyXG5cdH0sXHJcblx0cmVuZGVyRGVmYXVsdDpmdW5jdGlvbigpe1xyXG5cdFx0dmFyIHVzZWQ9TWF0aC5mbG9vcih0aGlzLnN0YXRlLnVzYWdlL3RoaXMuc3RhdGUucXVvdGEgKjEwMCk7XHJcblx0XHR2YXIgbW9yZT1mdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKHVzZWQ+NTApIHJldHVybiBFKFwiYnV0dG9uXCIsIHt0eXBlOiBcImJ1dHRvblwiLCBjbGFzc05hbWU6IFwiYnRuIGJ0bi1wcmltYXJ5XCJ9LCBcIkFsbG9jYXRlIE1vcmVcIik7XHJcblx0XHRcdGVsc2UgbnVsbDtcclxuXHRcdH1cclxuXHRcdHJldHVybiAoXHJcblx0XHRFKFwiZGl2XCIsIHtyZWY6IFwiZGlhbG9nMVwiLCBjbGFzc05hbWU6IFwibW9kYWwgZmFkZVwiLCBpZDogXCJteU1vZGFsXCIsIFwiZGF0YS1iYWNrZHJvcFwiOiBcInN0YXRpY1wifSwgXHJcblx0XHQgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWRpYWxvZ1wifSwgXHJcblx0XHQgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtY29udGVudFwifSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1oZWFkZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJoNFwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLXRpdGxlXCJ9LCBcIlNhbmRib3ggRmlsZSBTeXN0ZW1cIilcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1ib2R5XCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwicHJvZ3Jlc3NcIn0sIFxyXG5cdFx0ICAgICAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInByb2dyZXNzLWJhclwiLCByb2xlOiBcInByb2dyZXNzYmFyXCIsIHN0eWxlOiB7d2lkdGg6IHVzZWQrXCIlXCJ9fSwgXHJcblx0XHQgICAgICAgICAgICAgICB1c2VkLCBcIiVcIlxyXG5cdFx0ICAgICAgICAgICAgKVxyXG5cdFx0ICAgICAgICAgICksIFxyXG5cdFx0ICAgICAgICAgIEUoXCJzcGFuXCIsIG51bGwsIHRoaXMuc3RhdGUucXVvdGEsIFwiIHRvdGFsICwgXCIsIHRoaXMuc3RhdGUudXNhZ2UsIFwiIGluIHVzZWRcIilcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1mb290ZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJidXR0b25cIiwge29uQ2xpY2s6IHRoaXMuZGlzbWlzcywgdHlwZTogXCJidXR0b25cIiwgY2xhc3NOYW1lOiBcImJ0biBidG4tZGVmYXVsdFwiLCBcImRhdGEtZGlzbWlzc1wiOiBcIm1vZGFsXCJ9LCBcIkNsb3NlXCIpLCBcclxuXHRcdCAgICAgICAgICBtb3JlKClcclxuXHRcdCAgICAgICAgKVxyXG5cdFx0ICAgICAgKVxyXG5cdFx0ICAgIClcclxuXHRcdCAgKVxyXG5cdFx0ICApO1xyXG5cdH0sXHJcblx0ZGlzbWlzczpmdW5jdGlvbigpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdHRoYXQucHJvcHMub25SZWFkeSh0aGF0LnN0YXRlLnF1b3RhLHRoYXQuc3RhdGUudXNhZ2UpO1x0XHJcblx0XHR9LDApO1xyXG5cdH0sXHJcblx0cXVlcnlRdW90YTpmdW5jdGlvbigpIHtcclxuXHRcdGlmIChrc2FuYWdhcC5wbGF0Zm9ybT09XCJjaHJvbWVcIikge1xyXG5cdFx0XHRodG1sNWZzLnF1ZXJ5UXVvdGEoZnVuY3Rpb24odXNhZ2UscXVvdGEpe1xyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe3VzYWdlOnVzYWdlLHF1b3RhOnF1b3RhLGluaXRpYWxpemVkOnRydWV9KTtcclxuXHRcdFx0fSx0aGlzKTtcdFx0XHRcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3VzYWdlOjMzMyxxdW90YToxMDAwKjEwMDAqMTAyNCxpbml0aWFsaXplZDp0cnVlLGF1dG9jbG9zZTp0cnVlfSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLnF1b3RhIHx8IHRoaXMuc3RhdGUucXVvdGE8dGhpcy5wcm9wcy5xdW90YSkge1xyXG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5pbml0aWFsaXplZCkge1xyXG5cdFx0XHRcdHRoaXMuZGlhbG9nPXRydWU7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMud2VsY29tZSgpO1x0XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIEUoXCJzcGFuXCIsIG51bGwsIFwiY2hlY2tpbmcgcXVvdGFcIik7XHJcblx0XHRcdH1cdFx0XHRcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmICghdGhpcy5zdGF0ZS5hdXRvY2xvc2UpIHtcclxuXHRcdFx0XHR0aGlzLmRpYWxvZz10cnVlO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckRlZmF1bHQoKTsgXHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5kaXNtaXNzKCk7XHJcblx0XHRcdHRoaXMuZGlhbG9nPWZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9LFxyXG5cdGNvbXBvbmVudERpZE1vdW50OmZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLnF1b3RhKSB7XHJcblx0XHRcdHRoaXMucXVlcnlRdW90YSgpO1xyXG5cclxuXHRcdH07XHJcblx0fSxcclxuXHRjb21wb25lbnREaWRVcGRhdGU6ZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodGhpcy5kaWFsb2cpICQodGhpcy5yZWZzLmRpYWxvZzEuZ2V0RE9NTm9kZSgpKS5tb2RhbCgnc2hvdycpO1xyXG5cdH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1odG1sZnM7IiwidmFyIGtzYW5hPXtcInBsYXRmb3JtXCI6XCJyZW1vdGVcIn07XHJcbmlmICh0eXBlb2Ygd2luZG93IT1cInVuZGVmaW5lZFwiKSB7XHJcblx0d2luZG93LmtzYW5hPWtzYW5hO1xyXG5cdGlmICh0eXBlb2Yga3NhbmFnYXA9PVwidW5kZWZpbmVkXCIpIHtcclxuXHRcdHdpbmRvdy5rc2FuYWdhcD1yZXF1aXJlKFwiLi9rc2FuYWdhcFwiKTsgLy9jb21wYXRpYmxlIGxheWVyIHdpdGggbW9iaWxlXHJcblx0fVxyXG59XHJcbmlmICh0eXBlb2YgcHJvY2VzcyAhPVwidW5kZWZpbmVkXCIpIHtcclxuXHRpZiAocHJvY2Vzcy52ZXJzaW9ucyAmJiBwcm9jZXNzLnZlcnNpb25zW1wibm9kZS13ZWJraXRcIl0pIHtcclxuICBcdFx0aWYgKHR5cGVvZiBub2RlUmVxdWlyZSE9XCJ1bmRlZmluZWRcIikga3NhbmEucmVxdWlyZT1ub2RlUmVxdWlyZTtcclxuICBcdFx0a3NhbmEucGxhdGZvcm09XCJub2RlLXdlYmtpdFwiO1xyXG4gIFx0XHR3aW5kb3cua3NhbmFnYXAucGxhdGZvcm09XCJub2RlLXdlYmtpdFwiO1xyXG5cdFx0dmFyIGtzYW5hanM9cmVxdWlyZShcImZzXCIpLnJlYWRGaWxlU3luYyhcImtzYW5hLmpzXCIsXCJ1dGY4XCIpLnRyaW0oKTtcclxuXHRcdGtzYW5hLmpzPUpTT04ucGFyc2Uoa3NhbmFqcy5zdWJzdHJpbmcoMTQsa3NhbmFqcy5sZW5ndGgtMSkpO1xyXG5cdFx0d2luZG93Lmtmcz1yZXF1aXJlKFwiLi9rZnNcIik7XHJcbiAgXHR9XHJcbn0gZWxzZSBpZiAodHlwZW9mIGNocm9tZSE9XCJ1bmRlZmluZWRcIil7Ly99ICYmIGNocm9tZS5maWxlU3lzdGVtKXtcclxuLy9cdHdpbmRvdy5rc2FuYWdhcD1yZXF1aXJlKFwiLi9rc2FuYWdhcFwiKTsgLy9jb21wYXRpYmxlIGxheWVyIHdpdGggbW9iaWxlXHJcblx0d2luZG93LmtzYW5hZ2FwLnBsYXRmb3JtPVwiY2hyb21lXCI7XHJcblx0d2luZG93Lmtmcz1yZXF1aXJlKFwiLi9rZnNfaHRtbDVcIik7XHJcblx0cmVxdWlyZShcIi4vbGl2ZXJlbG9hZFwiKSgpO1xyXG5cdGtzYW5hLnBsYXRmb3JtPVwiY2hyb21lXCI7XHJcbn0gZWxzZSB7XHJcblx0aWYgKHR5cGVvZiBrc2FuYWdhcCE9XCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgZnMhPVwidW5kZWZpbmVkXCIpIHsvL21vYmlsZVxyXG5cdFx0dmFyIGtzYW5hanM9ZnMucmVhZEZpbGVTeW5jKFwia3NhbmEuanNcIixcInV0ZjhcIikudHJpbSgpOyAvL2FuZHJvaWQgZXh0cmEgXFxuIGF0IHRoZSBlbmRcclxuXHRcdGtzYW5hLmpzPUpTT04ucGFyc2Uoa3NhbmFqcy5zdWJzdHJpbmcoMTQsa3NhbmFqcy5sZW5ndGgtMSkpO1xyXG5cdFx0a3NhbmEucGxhdGZvcm09a3NhbmFnYXAucGxhdGZvcm07XHJcblx0XHRpZiAodHlwZW9mIGtzYW5hZ2FwLmFuZHJvaWQgIT1cInVuZGVmaW5lZFwiKSB7XHJcblx0XHRcdGtzYW5hLnBsYXRmb3JtPVwiYW5kcm9pZFwiO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG52YXIgdGltZXI9bnVsbDtcclxudmFyIGJvb3Q9ZnVuY3Rpb24oYXBwSWQsY2IpIHtcclxuXHRrc2FuYS5hcHBJZD1hcHBJZDtcclxuXHRpZiAoa3NhbmFnYXAucGxhdGZvcm09PVwiY2hyb21lXCIpIHsgLy9uZWVkIHRvIHdhaXQgZm9yIGpzb25wIGtzYW5hLmpzXHJcblx0XHR0aW1lcj1zZXRJbnRlcnZhbChmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiAoa3NhbmEucmVhZHkpe1xyXG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG5cdFx0XHRcdGlmIChrc2FuYS5qcyAmJiBrc2FuYS5qcy5maWxlcyAmJiBrc2FuYS5qcy5maWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdHJlcXVpcmUoXCIuL2luc3RhbGxrZGJcIikoa3NhbmEuanMsY2IpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjYigpO1x0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0sMzAwKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0Y2IoKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPXtib290OmJvb3RcclxuXHQsaHRtbGZzOnJlcXVpcmUoXCIuL2h0bWxmc1wiKVxyXG5cdCxodG1sNWZzOnJlcXVpcmUoXCIuL2h0bWw1ZnNcIilcclxuXHQsbGl2ZXVwZGF0ZTpyZXF1aXJlKFwiLi9saXZldXBkYXRlXCIpXHJcblx0LGZpbGVpbnN0YWxsZXI6cmVxdWlyZShcIi4vZmlsZWluc3RhbGxlclwiKVxyXG5cdCxkb3dubG9hZGVyOnJlcXVpcmUoXCIuL2Rvd25sb2FkZXJcIilcclxuXHQsaW5zdGFsbGtkYjpyZXF1aXJlKFwiLi9pbnN0YWxsa2RiXCIpXHJcbn07IiwidmFyIEZpbGVpbnN0YWxsZXI9cmVxdWlyZShcIi4vZmlsZWluc3RhbGxlclwiKTtcclxuXHJcbnZhciBnZXRSZXF1aXJlX2tkYj1mdW5jdGlvbigpIHtcclxuICAgIHZhciByZXF1aXJlZD1bXTtcclxuICAgIGtzYW5hLmpzLmZpbGVzLm1hcChmdW5jdGlvbihmKXtcclxuICAgICAgaWYgKGYuaW5kZXhPZihcIi5rZGJcIik9PWYubGVuZ3RoLTQpIHtcclxuICAgICAgICB2YXIgc2xhc2g9Zi5sYXN0SW5kZXhPZihcIi9cIik7XHJcbiAgICAgICAgaWYgKHNsYXNoPi0xKSB7XHJcbiAgICAgICAgICB2YXIgZGJpZD1mLnN1YnN0cmluZyhzbGFzaCsxLGYubGVuZ3RoLTQpO1xyXG4gICAgICAgICAgcmVxdWlyZWQucHVzaCh7dXJsOmYsZGJpZDpkYmlkLGZpbGVuYW1lOmRiaWQrXCIua2RiXCJ9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIGRiaWQ9Zi5zdWJzdHJpbmcoMCxmLmxlbmd0aC00KTtcclxuICAgICAgICAgIHJlcXVpcmVkLnB1c2goe3VybDprc2FuYS5qcy5iYXNldXJsK2YsZGJpZDpkYmlkLGZpbGVuYW1lOmZ9KTtcclxuICAgICAgICB9ICAgICAgICBcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVxdWlyZWQ7XHJcbn1cclxudmFyIGNhbGxiYWNrPW51bGw7XHJcbnZhciBvblJlYWR5PWZ1bmN0aW9uKCkge1xyXG5cdGNhbGxiYWNrKCk7XHJcbn1cclxudmFyIG9wZW5GaWxlaW5zdGFsbGVyPWZ1bmN0aW9uKGtlZXApIHtcclxuXHR2YXIgcmVxdWlyZV9rZGI9Z2V0UmVxdWlyZV9rZGIoKS5tYXAoZnVuY3Rpb24oZGIpe1xyXG5cdCAgcmV0dXJuIHtcclxuXHQgICAgdXJsOndpbmRvdy5sb2NhdGlvbi5vcmlnaW4rd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lK2RiLmRiaWQrXCIua2RiXCIsXHJcblx0ICAgIGRiZGI6ZGIuZGJpZCxcclxuXHQgICAgZmlsZW5hbWU6ZGIuZmlsZW5hbWVcclxuXHQgIH1cclxuXHR9KVxyXG5cdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEZpbGVpbnN0YWxsZXIsIHtxdW90YTogXCI1MTJNXCIsIGF1dG9jbG9zZTogIWtlZXAsIG5lZWRlZDogcmVxdWlyZV9rZGIsIFxyXG5cdCAgICAgICAgICAgICAgICAgb25SZWFkeTogb25SZWFkeX0pO1xyXG59XHJcbnZhciBpbnN0YWxsa2RiPWZ1bmN0aW9uKGtzYW5hanMsY2IsY29udGV4dCkge1xyXG5cdGNvbnNvbGUubG9nKGtzYW5hanMuZmlsZXMpO1xyXG5cdFJlYWN0LnJlbmRlcihvcGVuRmlsZWluc3RhbGxlcigpLGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFpblwiKSk7XHJcblx0Y2FsbGJhY2s9Y2I7XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9aW5zdGFsbGtkYjsiLCIvL1NpbXVsYXRlIGZlYXR1cmUgaW4ga3NhbmFnYXBcclxuLyogXHJcbiAgcnVucyBvbiBub2RlLXdlYmtpdCBvbmx5XHJcbiovXHJcblxyXG52YXIgcmVhZERpcj1mdW5jdGlvbihwYXRoKSB7IC8vc2ltdWxhdGUgS3NhbmFnYXAgZnVuY3Rpb25cclxuXHR2YXIgZnM9bm9kZVJlcXVpcmUoXCJmc1wiKTtcclxuXHRwYXRoPXBhdGh8fFwiLi5cIjtcclxuXHR2YXIgZGlycz1bXTtcclxuXHRpZiAocGF0aFswXT09XCIuXCIpIHtcclxuXHRcdGlmIChwYXRoPT1cIi5cIikgZGlycz1mcy5yZWFkZGlyU3luYyhcIi5cIik7XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZGlycz1mcy5yZWFkZGlyU3luYyhcIi4uXCIpO1xyXG5cdFx0fVxyXG5cdH0gZWxzZSB7XHJcblx0XHRkaXJzPWZzLnJlYWRkaXJTeW5jKHBhdGgpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRpcnMuam9pbihcIlxcdWZmZmZcIik7XHJcbn1cclxudmFyIGxpc3RBcHBzPWZ1bmN0aW9uKCkge1xyXG5cdHZhciBmcz1ub2RlUmVxdWlyZShcImZzXCIpO1xyXG5cdHZhciBrc2FuYWpzZmlsZT1mdW5jdGlvbihkKSB7cmV0dXJuIFwiLi4vXCIrZCtcIi9rc2FuYS5qc1wifTtcclxuXHR2YXIgZGlycz1mcy5yZWFkZGlyU3luYyhcIi4uXCIpLmZpbHRlcihmdW5jdGlvbihkKXtcclxuXHRcdFx0XHRyZXR1cm4gZnMuc3RhdFN5bmMoXCIuLi9cIitkKS5pc0RpcmVjdG9yeSgpICYmIGRbMF0hPVwiLlwiXHJcblx0XHRcdFx0ICAgJiYgZnMuZXhpc3RzU3luYyhrc2FuYWpzZmlsZShkKSk7XHJcblx0fSk7XHJcblx0XHJcblx0dmFyIG91dD1kaXJzLm1hcChmdW5jdGlvbihkKXtcclxuXHRcdHZhciBjb250ZW50PWZzLnJlYWRGaWxlU3luYyhrc2FuYWpzZmlsZShkKSxcInV0ZjhcIik7XHJcbiAgXHRjb250ZW50PWNvbnRlbnQucmVwbGFjZShcIn0pXCIsXCJ9XCIpO1xyXG4gIFx0Y29udGVudD1jb250ZW50LnJlcGxhY2UoXCJqc29ucF9oYW5kbGVyKFwiLFwiXCIpO1xyXG5cdFx0dmFyIG9iaj0gSlNPTi5wYXJzZShjb250ZW50KTtcclxuXHRcdG9iai5kYmlkPWQ7XHJcblx0XHRvYmoucGF0aD1kO1xyXG5cdFx0cmV0dXJuIG9iajtcclxuXHR9KVxyXG5cdHJldHVybiBKU09OLnN0cmluZ2lmeShvdXQpO1xyXG59XHJcblxyXG5cclxuXHJcbnZhciBrZnM9e3JlYWREaXI6cmVhZERpcixsaXN0QXBwczpsaXN0QXBwc307XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1rZnM7IiwidmFyIHJlYWREaXI9ZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gW107XHJcbn1cclxudmFyIGxpc3RBcHBzPWZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIFtdO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtyZWFkRGlyOnJlYWREaXIsbGlzdEFwcHM6bGlzdEFwcHN9OyIsInZhciBhcHBuYW1lPVwiaW5zdGFsbGVyXCI7XHJcbnZhciBzd2l0Y2hBcHA9ZnVuY3Rpb24ocGF0aCkge1xyXG5cdHZhciBmcz1yZXF1aXJlKFwiZnNcIik7XHJcblx0cGF0aD1cIi4uL1wiK3BhdGg7XHJcblx0YXBwbmFtZT1wYXRoO1xyXG5cdGRvY3VtZW50LmxvY2F0aW9uLmhyZWY9IHBhdGgrXCIvaW5kZXguaHRtbFwiOyBcclxuXHRwcm9jZXNzLmNoZGlyKHBhdGgpO1xyXG59XHJcbnZhciBkb3dubG9hZGVyPXt9O1xyXG52YXIgcm9vdFBhdGg9XCJcIjtcclxuXHJcbnZhciBkZWxldGVBcHA9ZnVuY3Rpb24oYXBwKSB7XHJcblx0Y29uc29sZS5lcnJvcihcIm5vdCBhbGxvdyBvbiBQQywgZG8gaXQgaW4gRmlsZSBFeHBsb3Jlci8gRmluZGVyXCIpO1xyXG59XHJcbnZhciB1c2VybmFtZT1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gXCJcIjtcclxufVxyXG52YXIgdXNlcmVtYWlsPWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiBcIlwiXHJcbn1cclxudmFyIHJ1bnRpbWVfdmVyc2lvbj1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gXCIxLjRcIjtcclxufVxyXG5cclxuLy9jb3B5IGZyb20gbGl2ZXVwZGF0ZVxyXG52YXIganNvbnA9ZnVuY3Rpb24odXJsLGRiaWQsY2FsbGJhY2ssY29udGV4dCkge1xyXG4gIHZhciBzY3JpcHQ9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqc29ucDJcIik7XHJcbiAgaWYgKHNjcmlwdCkge1xyXG4gICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuICB9XHJcbiAgd2luZG93Lmpzb25wX2hhbmRsZXI9ZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgaWYgKHR5cGVvZiBkYXRhPT1cIm9iamVjdFwiKSB7XHJcbiAgICAgIGRhdGEuZGJpZD1kYmlkO1xyXG4gICAgICBjYWxsYmFjay5hcHBseShjb250ZXh0LFtkYXRhXSk7ICAgIFxyXG4gICAgfSAgXHJcbiAgfVxyXG4gIHdpbmRvdy5qc29ucF9lcnJvcl9oYW5kbGVyPWZ1bmN0aW9uKCkge1xyXG4gICAgY29uc29sZS5lcnJvcihcInVybCB1bnJlYWNoYWJsZVwiLHVybCk7XHJcbiAgICBjYWxsYmFjay5hcHBseShjb250ZXh0LFtudWxsXSk7XHJcbiAgfVxyXG4gIHNjcmlwdD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICBzY3JpcHQuc2V0QXR0cmlidXRlKCdpZCcsIFwianNvbnAyXCIpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ29uZXJyb3InLCBcImpzb25wX2Vycm9yX2hhbmRsZXIoKVwiKTtcclxuICB1cmw9dXJsKyc/JysobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ3NyYycsIHVybCk7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpOyBcclxufVxyXG5cclxudmFyIGtzYW5hZ2FwPXtcclxuXHRwbGF0Zm9ybTpcIm5vZGUtd2Via2l0XCIsXHJcblx0c3RhcnREb3dubG9hZDpkb3dubG9hZGVyLnN0YXJ0RG93bmxvYWQsXHJcblx0ZG93bmxvYWRlZEJ5dGU6ZG93bmxvYWRlci5kb3dubG9hZGVkQnl0ZSxcclxuXHRkb3dubG9hZGluZ0ZpbGU6ZG93bmxvYWRlci5kb3dubG9hZGluZ0ZpbGUsXHJcblx0Y2FuY2VsRG93bmxvYWQ6ZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZCxcclxuXHRkb25lRG93bmxvYWQ6ZG93bmxvYWRlci5kb25lRG93bmxvYWQsXHJcblx0c3dpdGNoQXBwOnN3aXRjaEFwcCxcclxuXHRyb290UGF0aDpyb290UGF0aCxcclxuXHRkZWxldGVBcHA6IGRlbGV0ZUFwcCxcclxuXHR1c2VybmFtZTp1c2VybmFtZSwgLy9ub3Qgc3VwcG9ydCBvbiBQQ1xyXG5cdHVzZXJlbWFpbDp1c2VybmFtZSxcclxuXHRydW50aW1lX3ZlcnNpb246cnVudGltZV92ZXJzaW9uLFxyXG5cdFxyXG59XHJcblxyXG5pZiAodHlwZW9mIHByb2Nlc3MhPVwidW5kZWZpbmVkXCIpIHtcclxuXHR2YXIga3NhbmFqcz1yZXF1aXJlKFwiZnNcIikucmVhZEZpbGVTeW5jKFwiLi9rc2FuYS5qc1wiLFwidXRmOFwiKS50cmltKCk7XHJcblx0ZG93bmxvYWRlcj1yZXF1aXJlKFwiLi9kb3dubG9hZGVyXCIpO1xyXG5cdGNvbnNvbGUubG9nKGtzYW5hanMpO1xyXG5cdC8va3NhbmEuanM9SlNPTi5wYXJzZShrc2FuYWpzLnN1YnN0cmluZygxNCxrc2FuYWpzLmxlbmd0aC0xKSk7XHJcblx0cm9vdFBhdGg9cHJvY2Vzcy5jd2QoKTtcclxuXHRyb290UGF0aD1yZXF1aXJlKFwicGF0aFwiKS5yZXNvbHZlKHJvb3RQYXRoLFwiLi5cIikucmVwbGFjZSgvXFxcXC9nLFwiL1wiKSsnLyc7XHJcblx0a3NhbmEucmVhZHk9dHJ1ZTtcclxufSBlbHNle1xyXG5cdHZhciB1cmw9d2luZG93LmxvY2F0aW9uLm9yaWdpbit3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZShcImluZGV4Lmh0bWxcIixcIlwiKStcImtzYW5hLmpzXCI7XHJcblx0anNvbnAodXJsLGFwcG5hbWUsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRrc2FuYS5qcz1kYXRhO1xyXG5cdFx0a3NhbmEucmVhZHk9dHJ1ZTtcclxuXHR9KTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1rc2FuYWdhcDsiLCJ2YXIgc3RhcnRlZD1mYWxzZTtcclxudmFyIHRpbWVyPW51bGw7XHJcbnZhciBidW5kbGVkYXRlPW51bGw7XHJcbnZhciBnZXRfZGF0ZT1yZXF1aXJlKFwiLi9odG1sNWZzXCIpLmdldF9kYXRlO1xyXG52YXIgY2hlY2tJZkJ1bmRsZVVwZGF0ZWQ9ZnVuY3Rpb24oKSB7XHJcblx0Z2V0X2RhdGUoXCJidW5kbGUuanNcIixmdW5jdGlvbihkYXRlKXtcclxuXHRcdGlmIChidW5kbGVkYXRlICYmYnVuZGxlZGF0ZSE9ZGF0ZSl7XHJcblx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xyXG5cdFx0fVxyXG5cdFx0YnVuZGxlZGF0ZT1kYXRlO1xyXG5cdH0pO1xyXG59XHJcbnZhciBsaXZlcmVsb2FkPWZ1bmN0aW9uKCkge1xyXG5cdGlmIChzdGFydGVkKSByZXR1cm47XHJcblxyXG5cdHRpbWVyMT1zZXRJbnRlcnZhbChmdW5jdGlvbigpe1xyXG5cdFx0Y2hlY2tJZkJ1bmRsZVVwZGF0ZWQoKTtcclxuXHR9LDIwMDApO1xyXG5cdHN0YXJ0ZWQ9dHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHM9bGl2ZXJlbG9hZDsiLCJcclxudmFyIGpzb25wPWZ1bmN0aW9uKHVybCxkYmlkLGNhbGxiYWNrLGNvbnRleHQpIHtcclxuICB2YXIgc2NyaXB0PWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianNvbnBcIik7XHJcbiAgaWYgKHNjcmlwdCkge1xyXG4gICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuICB9XHJcbiAgd2luZG93Lmpzb25wX2hhbmRsZXI9ZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgLy9jb25zb2xlLmxvZyhcInJlY2VpdmUgZnJvbSBrc2FuYS5qc1wiLGRhdGEpO1xyXG4gICAgaWYgKHR5cGVvZiBkYXRhPT1cIm9iamVjdFwiKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgZGF0YS5kYmlkPT1cInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgZGF0YS5kYmlkPWRiaWQ7XHJcbiAgICAgIH1cclxuICAgICAgY2FsbGJhY2suYXBwbHkoY29udGV4dCxbZGF0YV0pO1xyXG4gICAgfSAgXHJcbiAgfVxyXG5cclxuICB3aW5kb3cuanNvbnBfZXJyb3JfaGFuZGxlcj1mdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJ1cmwgdW5yZWFjaGFibGVcIix1cmwpO1xyXG4gICAgY2FsbGJhY2suYXBwbHkoY29udGV4dCxbbnVsbF0pO1xyXG4gIH1cclxuXHJcbiAgc2NyaXB0PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ2lkJywgXCJqc29ucFwiKTtcclxuICBzY3JpcHQuc2V0QXR0cmlidXRlKCdvbmVycm9yJywgXCJqc29ucF9lcnJvcl9oYW5kbGVyKClcIik7XHJcbiAgdXJsPXVybCsnPycrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcclxuICBzY3JpcHQuc2V0QXR0cmlidXRlKCdzcmMnLCB1cmwpO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTsgXHJcbn1cclxudmFyIHJ1bnRpbWVfdmVyc2lvbl9vaz1mdW5jdGlvbihtaW5ydW50aW1lKSB7XHJcbiAgaWYgKCFtaW5ydW50aW1lKSByZXR1cm4gdHJ1ZTsvL25vdCBtZW50aW9uZWQuXHJcbiAgdmFyIG1pbj1wYXJzZUZsb2F0KG1pbnJ1bnRpbWUpO1xyXG4gIHZhciBydW50aW1lPXBhcnNlRmxvYXQoIGtzYW5hZ2FwLnJ1bnRpbWVfdmVyc2lvbigpfHxcIjEuMFwiKTtcclxuICBpZiAobWluPnJ1bnRpbWUpIHJldHVybiBmYWxzZTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxudmFyIG5lZWRUb1VwZGF0ZT1mdW5jdGlvbihmcm9tanNvbix0b2pzb24pIHtcclxuICB2YXIgbmVlZFVwZGF0ZXM9W107XHJcbiAgZm9yICh2YXIgaT0wO2k8ZnJvbWpzb24ubGVuZ3RoO2krKykgeyBcclxuICAgIHZhciB0bz10b2pzb25baV07XHJcbiAgICB2YXIgZnJvbT1mcm9tanNvbltpXTtcclxuICAgIHZhciBuZXdmaWxlcz1bXSxuZXdmaWxlc2l6ZXM9W10scmVtb3ZlZD1bXTtcclxuICAgIFxyXG4gICAgaWYgKCF0bykgY29udGludWU7IC8vY2Fubm90IHJlYWNoIGhvc3RcclxuICAgIGlmICghcnVudGltZV92ZXJzaW9uX29rKHRvLm1pbnJ1bnRpbWUpKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcInJ1bnRpbWUgdG9vIG9sZCwgbmVlZCBcIit0by5taW5ydW50aW1lKTtcclxuICAgICAgY29udGludWU7IFxyXG4gICAgfVxyXG4gICAgaWYgKCFmcm9tLmZpbGVkYXRlcykge1xyXG4gICAgICBjb25zb2xlLndhcm4oXCJtaXNzaW5nIGZpbGVkYXRlcyBpbiBrc2FuYS5qcyBvZiBcIitmcm9tLmRiaWQpO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGZyb20uZmlsZWRhdGVzLm1hcChmdW5jdGlvbihmLGlkeCl7XHJcbiAgICAgIHZhciBuZXdpZHg9dG8uZmlsZXMuaW5kZXhPZiggZnJvbS5maWxlc1tpZHhdKTtcclxuICAgICAgaWYgKG5ld2lkeD09LTEpIHtcclxuICAgICAgICAvL2ZpbGUgcmVtb3ZlZCBpbiBuZXcgdmVyc2lvblxyXG4gICAgICAgIHJlbW92ZWQucHVzaChmcm9tLmZpbGVzW2lkeF0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBmcm9tZGF0ZT1EYXRlLnBhcnNlKGYpO1xyXG4gICAgICAgIHZhciB0b2RhdGU9RGF0ZS5wYXJzZSh0by5maWxlZGF0ZXNbbmV3aWR4XSk7XHJcbiAgICAgICAgaWYgKGZyb21kYXRlPHRvZGF0ZSkge1xyXG4gICAgICAgICAgbmV3ZmlsZXMucHVzaCggdG8uZmlsZXNbbmV3aWR4XSApO1xyXG4gICAgICAgICAgbmV3ZmlsZXNpemVzLnB1c2godG8uZmlsZXNpemVzW25ld2lkeF0pO1xyXG4gICAgICAgIH0gICAgICAgIFxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmIChuZXdmaWxlcy5sZW5ndGgpIHtcclxuICAgICAgZnJvbS5uZXdmaWxlcz1uZXdmaWxlcztcclxuICAgICAgZnJvbS5uZXdmaWxlc2l6ZXM9bmV3ZmlsZXNpemVzO1xyXG4gICAgICBmcm9tLnJlbW92ZWQ9cmVtb3ZlZDtcclxuICAgICAgbmVlZFVwZGF0ZXMucHVzaChmcm9tKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG5lZWRVcGRhdGVzO1xyXG59XHJcbnZhciBnZXRVcGRhdGFibGVzPWZ1bmN0aW9uKGFwcHMsY2IsY29udGV4dCkge1xyXG4gIGdldFJlbW90ZUpzb24oYXBwcyxmdW5jdGlvbihqc29ucyl7XHJcbiAgICB2YXIgaGFzVXBkYXRlcz1uZWVkVG9VcGRhdGUoYXBwcyxqc29ucyk7XHJcbiAgICBjYi5hcHBseShjb250ZXh0LFtoYXNVcGRhdGVzXSk7XHJcbiAgfSxjb250ZXh0KTtcclxufVxyXG52YXIgZ2V0UmVtb3RlSnNvbj1mdW5jdGlvbihhcHBzLGNiLGNvbnRleHQpIHtcclxuICB2YXIgdGFza3F1ZXVlPVtdLG91dHB1dD1bXTtcclxuICB2YXIgbWFrZWNiPWZ1bmN0aW9uKGFwcCl7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgaWYgKCEoZGF0YSAmJiB0eXBlb2YgZGF0YSA9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkpIG91dHB1dC5wdXNoKGRhdGEpO1xyXG4gICAgICAgIGlmICghYXBwLmJhc2V1cmwpIHtcclxuICAgICAgICAgIHRhc2txdWV1ZS5zaGlmdCh7X19lbXB0eTp0cnVlfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhciB1cmw9YXBwLmJhc2V1cmwrXCIva3NhbmEuanNcIjsgICAgXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyh1cmwpO1xyXG4gICAgICAgICAganNvbnAoIHVybCAsYXBwLmRiaWQsdGFza3F1ZXVlLnNoaWZ0KCksIGNvbnRleHQpOyAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICB9O1xyXG4gIGFwcHMuZm9yRWFjaChmdW5jdGlvbihhcHApe3Rhc2txdWV1ZS5wdXNoKG1ha2VjYihhcHApKX0pO1xyXG5cclxuICB0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhKXtcclxuICAgIG91dHB1dC5wdXNoKGRhdGEpO1xyXG4gICAgY2IuYXBwbHkoY29udGV4dCxbb3V0cHV0XSk7XHJcbiAgfSk7XHJcblxyXG4gIHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTsgLy9ydW4gdGhlIHRhc2tcclxufVxyXG52YXIgaHVtYW5GaWxlU2l6ZT1mdW5jdGlvbihieXRlcywgc2kpIHtcclxuICAgIHZhciB0aHJlc2ggPSBzaSA/IDEwMDAgOiAxMDI0O1xyXG4gICAgaWYoYnl0ZXMgPCB0aHJlc2gpIHJldHVybiBieXRlcyArICcgQic7XHJcbiAgICB2YXIgdW5pdHMgPSBzaSA/IFsna0InLCdNQicsJ0dCJywnVEInLCdQQicsJ0VCJywnWkInLCdZQiddIDogWydLaUInLCdNaUInLCdHaUInLCdUaUInLCdQaUInLCdFaUInLCdaaUInLCdZaUInXTtcclxuICAgIHZhciB1ID0gLTE7XHJcbiAgICBkbyB7XHJcbiAgICAgICAgYnl0ZXMgLz0gdGhyZXNoO1xyXG4gICAgICAgICsrdTtcclxuICAgIH0gd2hpbGUoYnl0ZXMgPj0gdGhyZXNoKTtcclxuICAgIHJldHVybiBieXRlcy50b0ZpeGVkKDEpKycgJyt1bml0c1t1XTtcclxufTtcclxuXHJcbnZhciBzdGFydD1mdW5jdGlvbihrc2FuYWpzLGNiLGNvbnRleHQpe1xyXG4gIHZhciBmaWxlcz1rc2FuYWpzLm5ld2ZpbGVzfHxrc2FuYWpzLmZpbGVzO1xyXG4gIHZhciBiYXNldXJsPWtzYW5hanMuYmFzZXVybHx8IFwiaHR0cDovLzEyNy4wLjAuMTo4MDgwL1wiK2tzYW5hanMuZGJpZCtcIi9cIjtcclxuICB2YXIgc3RhcnRlZD1rc2FuYWdhcC5zdGFydERvd25sb2FkKGtzYW5hanMuZGJpZCxiYXNldXJsLGZpbGVzLmpvaW4oXCJcXHVmZmZmXCIpKTtcclxuICBjYi5hcHBseShjb250ZXh0LFtzdGFydGVkXSk7XHJcbn1cclxudmFyIHN0YXR1cz1mdW5jdGlvbigpe1xyXG4gIHZhciBuZmlsZT1rc2FuYWdhcC5kb3dubG9hZGluZ0ZpbGUoKTtcclxuICB2YXIgZG93bmxvYWRlZEJ5dGU9a3NhbmFnYXAuZG93bmxvYWRlZEJ5dGUoKTtcclxuICB2YXIgZG9uZT1rc2FuYWdhcC5kb25lRG93bmxvYWQoKTtcclxuICByZXR1cm4ge25maWxlOm5maWxlLGRvd25sb2FkZWRCeXRlOmRvd25sb2FkZWRCeXRlLCBkb25lOmRvbmV9O1xyXG59XHJcblxyXG52YXIgY2FuY2VsPWZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIGtzYW5hZ2FwLmNhbmNlbERvd25sb2FkKCk7XHJcbn1cclxuXHJcbnZhciBsaXZldXBkYXRlPXsgaHVtYW5GaWxlU2l6ZTogaHVtYW5GaWxlU2l6ZSwgXHJcbiAgbmVlZFRvVXBkYXRlOiBuZWVkVG9VcGRhdGUgLCBqc29ucDpqc29ucCwgXHJcbiAgZ2V0VXBkYXRhYmxlczpnZXRVcGRhdGFibGVzLFxyXG4gIHN0YXJ0OnN0YXJ0LFxyXG4gIGNhbmNlbDpjYW5jZWwsXHJcbiAgc3RhdHVzOnN0YXR1c1xyXG4gIH07XHJcbm1vZHVsZS5leHBvcnRzPWxpdmV1cGRhdGU7IiwiZnVuY3Rpb24gbWtkaXJQIChwLCBtb2RlLCBmLCBtYWRlKSB7XHJcbiAgICAgdmFyIHBhdGggPSBub2RlUmVxdWlyZSgncGF0aCcpO1xyXG4gICAgIHZhciBmcyA9IG5vZGVSZXF1aXJlKCdmcycpO1xyXG5cdFxyXG4gICAgaWYgKHR5cGVvZiBtb2RlID09PSAnZnVuY3Rpb24nIHx8IG1vZGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGYgPSBtb2RlO1xyXG4gICAgICAgIG1vZGUgPSAweDFGRiAmICh+cHJvY2Vzcy51bWFzaygpKTtcclxuICAgIH1cclxuICAgIGlmICghbWFkZSkgbWFkZSA9IG51bGw7XHJcblxyXG4gICAgdmFyIGNiID0gZiB8fCBmdW5jdGlvbiAoKSB7fTtcclxuICAgIGlmICh0eXBlb2YgbW9kZSA9PT0gJ3N0cmluZycpIG1vZGUgPSBwYXJzZUludChtb2RlLCA4KTtcclxuICAgIHAgPSBwYXRoLnJlc29sdmUocCk7XHJcblxyXG4gICAgZnMubWtkaXIocCwgbW9kZSwgZnVuY3Rpb24gKGVyKSB7XHJcbiAgICAgICAgaWYgKCFlcikge1xyXG4gICAgICAgICAgICBtYWRlID0gbWFkZSB8fCBwO1xyXG4gICAgICAgICAgICByZXR1cm4gY2IobnVsbCwgbWFkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaCAoZXIuY29kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdFTk9FTlQnOlxyXG4gICAgICAgICAgICAgICAgbWtkaXJQKHBhdGguZGlybmFtZShwKSwgbW9kZSwgZnVuY3Rpb24gKGVyLCBtYWRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyKSBjYihlciwgbWFkZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBta2RpclAocCwgbW9kZSwgY2IsIG1hZGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIEluIHRoZSBjYXNlIG9mIGFueSBvdGhlciBlcnJvciwganVzdCBzZWUgaWYgdGhlcmUncyBhIGRpclxyXG4gICAgICAgICAgICAvLyB0aGVyZSBhbHJlYWR5LiAgSWYgc28sIHRoZW4gaG9vcmF5ISAgSWYgbm90LCB0aGVuIHNvbWV0aGluZ1xyXG4gICAgICAgICAgICAvLyBpcyBib3JrZWQuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBmcy5zdGF0KHAsIGZ1bmN0aW9uIChlcjIsIHN0YXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgc3RhdCBmYWlscywgdGhlbiB0aGF0J3Mgc3VwZXIgd2VpcmQuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbGV0IHRoZSBvcmlnaW5hbCBlcnJvciBiZSB0aGUgZmFpbHVyZSByZWFzb24uXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyMiB8fCAhc3RhdC5pc0RpcmVjdG9yeSgpKSBjYihlciwgbWFkZSlcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGNiKG51bGwsIG1hZGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxubWtkaXJQLnN5bmMgPSBmdW5jdGlvbiBzeW5jIChwLCBtb2RlLCBtYWRlKSB7XHJcbiAgICB2YXIgcGF0aCA9IG5vZGVSZXF1aXJlKCdwYXRoJyk7XHJcbiAgICB2YXIgZnMgPSBub2RlUmVxdWlyZSgnZnMnKTtcclxuICAgIGlmIChtb2RlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBtb2RlID0gMHgxRkYgJiAofnByb2Nlc3MudW1hc2soKSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIW1hZGUpIG1hZGUgPSBudWxsO1xyXG5cclxuICAgIGlmICh0eXBlb2YgbW9kZSA9PT0gJ3N0cmluZycpIG1vZGUgPSBwYXJzZUludChtb2RlLCA4KTtcclxuICAgIHAgPSBwYXRoLnJlc29sdmUocCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBmcy5ta2RpclN5bmMocCwgbW9kZSk7XHJcbiAgICAgICAgbWFkZSA9IG1hZGUgfHwgcDtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnIwKSB7XHJcbiAgICAgICAgc3dpdGNoIChlcnIwLmNvZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnRU5PRU5UJyA6XHJcbiAgICAgICAgICAgICAgICBtYWRlID0gc3luYyhwYXRoLmRpcm5hbWUocCksIG1vZGUsIG1hZGUpO1xyXG4gICAgICAgICAgICAgICAgc3luYyhwLCBtb2RlLCBtYWRlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgYW55IG90aGVyIGVycm9yLCBqdXN0IHNlZSBpZiB0aGVyZSdzIGEgZGlyXHJcbiAgICAgICAgICAgIC8vIHRoZXJlIGFscmVhZHkuICBJZiBzbywgdGhlbiBob29yYXkhICBJZiBub3QsIHRoZW4gc29tZXRoaW5nXHJcbiAgICAgICAgICAgIC8vIGlzIGJvcmtlZC5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHZhciBzdGF0O1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ID0gZnMuc3RhdFN5bmMocCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXQuaXNEaXJlY3RvcnkoKSkgdGhyb3cgZXJyMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbWFkZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbWtkaXJQLm1rZGlycCA9IG1rZGlyUC5ta2RpclAgPSBta2RpclA7XHJcbiJdfQ==
