////////////////////////////////////////////////////////////////////////////////////////////////
// c45 decision tree algorithm (https://en.wikipedia.org/wiki/C4.5_algorithm)
// upon the implementation of id3 decision tree at https://github.com/willkurt/ID3-Decision-Tree
//
// author: yandong liu
//  email: yandongl _at_ cs.cmu.edu
////////////////////////////////////////////////////////////////////////////////////////////////


var learningjs=(function (exports) {
  'use strict';

  var _und;

  if(typeof _ === 'undefined')
    if(typeof require === 'function')
      var __ = require('underscore');

  if(typeof _ !== 'undefined')
    _und = _;
  else if(typeof __ !== 'undefined')
    _und = __;
  else
    throw 'underscore.js isn\'t found!' 

  var tree = function () {}, debug = false; 

  tree.prototype = {

    train: function(data, target, featuresType, cb) {
      var features=[];
      var _s=_und(data);
      for(var f in featuresType) {
        if (featuresType.hasOwnProperty(f)) {
          if(featuresType[f]!=='real' && featuresType[f]!=='category') {
            console.log('ERROR. unrecogznied feature type '+featuresType[f]);
            cb(undefined, 'ERROR:unrecognized feature type '+featuresType[f]);
            return;
          }
          features.push(f);
        }
      }
      var targets = _und.unique(_s.pluck(target));
      this.features=features;
      this.targets=targets;
      cb({
        features:this.features,
        targets:this.targets,
        model:this._c45(_s,target,features, featuresType, 0),
        classify: function(sample) {
          var root = this.model;
          if(typeof root === 'undefined') {
            return 'null';
          }
          while(root.type != "result") {
            var childNode;
            if(root.type === 'feature_real') {
              var feature_name = root.name;
              var sampleVal = parseFloat(sample[feature_name]);
              if(sampleVal<=root.cut)
                childNode=root.vals[1];
              else
                childNode=root.vals[0]; 
            } else {
              var attr = root.name;
              var sampleVal = sample[attr];
              childNode = _und.detect(root.vals,function(x){return x.name == sampleVal});
            }
            //unseen feature value (didn't appear in training data)
            if(typeof childNode === 'undefined') {
              console.log('unseen feature value:',root.name,'sample:',sample);
              return 'unkown';
            }
            root = childNode.child;
          }
          return root.val;
        },
        calcAccuracy: function(samples, target, cb) {
          var total = 0;
          var correct = 0;
          var that = this;
          _und.each(samples, function(s) {
            total++;
            var pred = that.classify(s);
            var actual = s[target];
            //console.log('predict:'+pred,' actual:'+actual);
            if(pred === actual){
              correct++;
            }
          });
          console.log( 'got '+correct +' correct out of '+total+' examples.');
          if(total>0)
            cb(correct/total);
          else
            cb(0.0);
        },
      }, undefined);
    },

    _c45: function(_s,target,features, featuresType, depth) {
      var that=this;
      var targets = _und.unique(_s.pluck(target));//unique label values
      //this shouldn't happend
      if (targets.length == 0) {
        return {type:"result", val: 'none data', name: 'none data',alias:'none data'+that.randomTag() }; 
      }
      if (targets.length == 1) {
        return {type:"result", val: targets[0], name: targets[0],alias:targets[0]+that.randomTag() }; 
      }
      if(features.length == 0) {
        var topTarget = that.mostCommon(targets);
        return {type:"result", val: topTarget, name: topTarget, alias: topTarget+that.randomTag()};
      }
      var bestFeatureData = this.maxGain(_s,target,features, featuresType);
      var bestFeature = bestFeatureData.feature;
      if(featuresType[bestFeature]==='category') {
        var remainingFeatures = _und.without(features,bestFeature);
        var possibleValues = _und.unique(_s.pluck(bestFeature));
        var node = {name: bestFeature,alias: bestFeature+that.randomTag()};
        node.type = "feature_category";
        node.vals = _und.map(possibleValues,function(v){
          var _newS = _und(_s.filter(function(x) {return x[bestFeature] == v}));
          var child_node = {name:v,alias:v+that.randomTag(),type: "feature_value"};
          child_node.child = that._c45(_newS,target,remainingFeatures, featuresType, depth+1);
          return child_node; 
        });
      } else{//default is real
        var remainingFeatures = _und.without(features,bestFeature);
        var possibleValues = _und.unique(_s.pluck(bestFeature));
        var node = {name: bestFeature,alias: bestFeature+that.randomTag()};
        node.type = "feature_real";
        node.cut = bestFeatureData.cut;
        node.vals=[];

        var _newS_r = _und(_s.filter(function(x) {return parseFloat(x[bestFeature])>bestFeatureData.cut}));
        var child_node_r = {name:bestFeatureData.cut.toString(),alias:'>'+bestFeatureData.cut.toString()+that.randomTag(),type: "feature_value"};
        child_node_r.child = that._c45(_newS_r,target,remainingFeatures, featuresType, depth+1);
        node.vals.push(child_node_r);

        var _newS_l = _und(_s.filter(function(x) {return parseFloat(x[bestFeature])<=bestFeatureData.cut}));
        var child_node_l= {name:bestFeatureData.cut.toString(),alias:'<='+bestFeatureData.cut.toString()+that.randomTag(),type: "feature_value"};
        child_node_l.child = that._c45(_newS_l,target,remainingFeatures, featuresType, depth+1);
        node.vals.push(child_node_l);

      }
      return node;
    }, 

    //node(alias, vals(node))
    addEdges:function(node, targets, colors, h_color, g){
	    var that=this;
      if(node.type == 'feature_real'||node.type=='feature_category'){
        _und.each(node.vals,function(m){
          g.push(['val:'+m.alias+'</span>',node.alias+'','node']);
          g = that.addEdges(m, targets, colors, h_color, g);
        });
        return g;
      } else if(node.type == 'feature_value'){ 
        var that=this;
        //g.push(['<div style="color:red">'+node.child.alias+'</div>',node.alias,'']);
        //g.push([node.child.alias,node.alias,'value']);
        if(node.child.type != 'result'){
          g.push([node.child.alias+'','val:'+node.alias+'</span>','value']);
          g = that.addEdges(node.child, targets, colors, h_color, g);
        } else {
          var color='black';
          if(node.child.name in h_color) {
            color = h_color[node.child.name];
          } else {
            var _sz = Object.keys(h_color).length;
            if (_sz >=colors.length) color='black';
            else color = colors[_sz];
            h_color[node.child.name]=color;
          }
          g.push(['<span style="color:'+color+';font-weight:bold;">'+node.child.alias+'</span>','val:'+node.alias+'</span>','value']);
        }
        return g;
      }
      /*
      if(node.type == 'result'){ 
        g.push(['<div style="color:red">'+node.alias+'</div>',node.alias,'']);
        return g;
      }
      */
      return g;
    } ,

    drawGraph: function(model,divId, cb){
      if(typeof google==='undefined') {
        cb('google visualization APIs are not defined');
        return;
      }
      var g = new Array();
      var colors=['red','blue','green','yellow','black','fuchsia','gold','indigo','lime','mintcream','navy','olive','salmon','skyblue'];
      var h_color={};
      g = this.addEdges(model.model,model.targets,colors,h_color,g).reverse();
      window.g = g;
      var data = google.visualization.arrayToDataTable(g.concat(g));
      var chart = new google.visualization.OrgChart(document.getElementById(divId));
      google.visualization.events.addListener(chart, 'ready',function(){
         _und.each($('.google-visualization-orgchart-node'),function(x){
            var oldVal = $(x).html();
            if(oldVal){
                var cleanVal = oldVal.replace(/_r[0-9]+/,'');
                cleanVal = cleanVal.replace(/val:/,'<div style="color:olivedrab;">');
                $(x).html(cleanVal);
            }
          }); 
      });
      chart.draw(data, {allowHtml: true}); 
	    cb();
    }, 

    //compute info gain for this feature. feature can be category or real type
    gain: function(_s,target,feature, featuresType){
		  var that=this;
      var setEntropy = that.entropy(_s.pluck(target));
      if(featuresType[feature]==='category') {
        var attrVals = _und.unique(_s.pluck(feature));//feature values
        var setSize = _s.size();
        var entropies = attrVals.map(function(n){//conditional entropy
          var subset = _s.filter(function(x){return x[feature] === n});//instances of this feature value
          return (subset.length/setSize)*that.entropy(_und.pluck(subset,target));
        });
        var sumOfEntropies =  entropies.reduce(function(a,b){return a+b},0);
        return {feature:feature, gain:setEntropy - sumOfEntropies, cut:0};
      } else{//default is real
        var attrVals = _und.unique(_s.pluck(feature));//feature values
        var gainVals=attrVals.map(function(cut) {
          var cutf=parseFloat(cut);
          var _gain = setEntropy-that.conditionalEntropy(_s, feature, cutf, target);
          return {feature:feature, gain:_gain, cut:cutf};
        });
        var _maxgain= _und.max(gainVals, function(e){return e.gain});
        return _maxgain;
      } 
    },

    entropy: function (vals){
      var that=this;
      var uniqueVals = _und.unique(vals);
      var probs = uniqueVals.map(function(x){return that.prob(x,vals)});
      var logVals = probs.map(function(p){return -p*that.log2(p) });
      return logVals.reduce(function(a,b){return a+b},0);
    }, 

    //conditional entropy if data is split to two
    conditionalEntropy: function(_s, feature, cut, target) {
      var that=this;
      var subset1 = _s.filter(function(x){return parseFloat(x[feature]) <= cut});//instances of this feature value
      var subset2 = _s.filter(function(x){return parseFloat(x[feature]) > cut});//instances of this feature value
      var setSize = _s.size();
      return subset1.length/setSize*that.entropy(_und.pluck(subset1,target))+ subset2.length/setSize*that.entropy(_und.pluck(subset2,target));
    }, 

    maxGain: function (_s,target,features, featuresType){
      var that=this;
      var g45 = features.map(function(feature) {
        return that.gain(_s,target,feature, featuresType);
      });
      return _und.max(g45,function(e){
      return e.gain;
      });
    },

    prob: function(val,vals){
     var instances = _und.filter(vals,function(x) {return x === val}).length;
     var total = vals.length;
     return instances/total;
    },

    log2: function (n){
     return Math.log(n)/Math.log(2);
    }, 

    mostCommon: function(l){
      var that=this;
      return  _und.sortBy(l,function(a){
        return that.count(a,l);
      }).reverse()[0];
    },

    count: function (a,l){
      return _und.filter(l,function(b) { return b === a}).length
    },

    randomTag: function (){
      return "_r"+Math.round(Math.random()*1000000).toString();
    }

 }

  var exports = exports||{};
  exports.tree = tree;
  return exports;

})(typeof module != 'undefined' && module.exports); 
