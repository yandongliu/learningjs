////////////////////////////////////////////////////////////////////////////////////////////////
// utilities for
//   loading a real number file
//   loading a text file
//   normalize matrix of real numbers
//
// author: yandong liu
//  email: yandongl _at_ cs.cmu.edu
////////////////////////////////////////////////////////////////////////////////////////////////
'use strict';
if(typeof require === 'function') {
  var fs = require('fs');
  var lazy = require("lazy");
}

var util = {

normalize: function(data, nfeatures) {
  for(var i=0;i<data.length;i++) {
    var mean=0.0, stderr = 0.0;
    for(var j=0;j<nfeatures;j++) {
      mean += data[i][j];
    }
    mean/=nfeatures;
    for(var j=0;j<nfeatures;j++) {
      var a = data[i][j]-mean;
      stderr += a*a;
    }
    stderr = Math.sqrt(stderr/nfeatures);
    for(var j=0;j<nfeatures;j++) {
      data[i][j] -= mean;
      data[i][j] /=stderr;
    }
  }
},

loadTextFile: function(fn, cb) {
  var data=[];
  var header = true;
  var targets=[];
  var label_col = -1;
  var l_features_id=[];
  var featuresType={};
  var l_features_name=[];
  var feature_name2id=[];
  var s_targets={};
  var l_targets=[];
  var nfeatures = 0; 
  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }
  new lazy(fs.createReadStream(fn))
  .on('end', function() {

    for(var key in s_targets) {
      if (s_targets.hasOwnProperty(key)) {
        l_targets.push(key);
      }
    }

    cb({data:data, l_featuresIndex:l_features_id, nfeatures:nfeatures, targets:targets, l_targets:l_targets, ntargets:l_targets.length, featureNames:l_features_name, feature_name2id:feature_name2id, featuresType:featuresType});
  })
  .lines
  .forEach(function(line){
    if(header) {
      header=false;
      var aa = line.toString().split(',');
      for(var i=0;i<aa.length;i++) {
        aa[i] = aa[i].trim();
        if (aa[i] === 'label') label_col = i;
        else {
          l_features_id.push(i);//id is the index in input file
          l_features_name.push(aa[i]);
          feature_name2id[aa[i]]=i;
        }
      }
      //console.log('l_featuresIndex:',l_features);
      //console.log('featureNames:',l_features_name);
      if(label_col === -1) {
        console.log('ERROR. No label column found');
        process.exit(1);
      }
      nfeatures = l_features_id.length;
    } else {
      var aa = line.toString().split(',');
      if (aa.length == (nfeatures+1)) {
        for(var i=0;i<aa.length;i++) {
          aa[i] = aa[i].trim();
        }
        if(aa[label_col] === 'feature_type') {
          for(var i=0;i<nfeatures;i++) {
            featuresType[l_features_name[i]]=aa[l_features_id[i]];//id points to index in input file
          }
        } else {
          var dd=[];
          for(var i=0;i<nfeatures;i++) {
            var a = aa[l_features_id[i]];
            dd.push(a);
          }
          s_targets[aa[label_col]]=1;
          data.push(dd);
          targets.push(aa[label_col]);
        }
      } else {
        console.log('skip line:', line.toString());
      }
    }
  }); 
},

loadRealFile: function(fn, cb) {
  var data=[];
  var header = true;
  var targets=[];
  var label_col = -1;
  var l_features=[];
  var l_features_name=[];
  var s_targets={};
  var l_targets=[];
  var nfeatures = 0; 
  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }
  new lazy(fs.createReadStream(fn))
  .on('end', function() {

    for(var key in s_targets) {
      if (s_targets.hasOwnProperty(key)) {
        l_targets.push(key);
      }
    } 

    var ntargets = l_targets.length;
    cb({data:data, l_featuresIndex:l_features, nfeatures:nfeatures, targets:targets, l_targets:l_targets, ntargets:ntargets, featureNames:l_features_name});
  })
  .lines
  .forEach(function(line){
    if(header) {
      header=false;
      var aa = line.toString().split(',');
      for(var i=0;i<aa.length;i++) {
        aa[i] = aa[i].trim();
        if (aa[i] === 'label') label_col = i;
        else {
          l_features.push(i);
          l_features_name.push(aa[i]);
        }
      }
      if(label_col === -1) {
        console.log('ERROR. No label column found');
        process.exit(1);
      }
      nfeatures = l_features.length;
    } else {
      var aa = line.toString().split(',');
      var dd=[];
      for(var i=0;i<aa.length;i++) {
        aa[i] = aa[i].trim();
      }
      if(aa[label_col]==='feature_type') return true;
      for(var i=0;i<nfeatures;i++) {
        var a = parseFloat(aa[l_features[i]]);
        dd.push(a||0);
      }
      s_targets[aa[label_col]]=1;
      data.push(dd);
      targets.push(aa[label_col]);
    }
  }); 
} 

}

function loadString (content, cb) {
  var data=[];
  var header = true;
  var targets=[];
  var label_col = -1;
  var l_features_id=[];
  var l_features_name=[];
  var feature_name2id=[];
  var s_targets={};
  var l_targets=[];
  var nfeatures = 0; 
  var featuresType={};
  var data_start_line=1;

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }

  var lines = content.split('\n');
  //header
  var aa = lines[0].toString().split(',');
  for(var i=0;i<aa.length;i++) {
    aa[i] = aa[i].trim();
    if (aa[i] === 'label') label_col = i;
    else {
      l_features_id.push(i);
      l_features_name.push(aa[i]);
      feature_name2id[aa[i]]=i;
    }
  }
  if(label_col === -1) {
    console.log('ERROR. No label column found');
    return;
  }

  nfeatures = l_features_id.length;

  aa = lines[1].toString().split(',');
  if(aa[label_col].trim() === 'feature_type') {
    data_start_line++;
    var cnt = 0;
    for(var i=0;i<aa.length;i++) {
      aa[i] = aa[i].trim();
      if(i!==label_col) {
        featuresType[l_features_name[cnt]]=aa[i];
        cnt++;
      }
    }
  }

  for(var j=data_start_line;j<lines.length;j++) {
    var line = lines[j].toString();
    aa = line.split(',');
    if (aa.length == (nfeatures+1)) {
      for(var i=0;i<aa.length;i++) {
        aa[i] = aa[i].trim();
      }
      var dd=[];
      for(var i=0;i<nfeatures;i++) {
        var a = aa[l_features_id[i]];
        dd.push(a);
      }
      s_targets[aa[label_col]]=1;
      data.push(dd);
      targets.push(aa[label_col]);
    } else {
      console.log('skip line:', line);
    }
  }

  for(var key in s_targets) {
    if (s_targets.hasOwnProperty(key)) {
      l_targets.push(key);
    }
  }

  var ntargets = l_targets.length;

  cb({data:data, l_featuresIndex:l_features_id, nfeatures:nfeatures, targets:targets, l_targets:l_targets, ntargets:ntargets, featureNames:l_features_name, feature_name2id:feature_name2id, featuresType:featuresType});

}

if(typeof module !== 'undefined' && module.exports) 
  module.exports = util;
