////////////////////////////////////////////////////////////////////////////////////////////////
// javascript implementation of 
//   decision tree
//   logistic regression
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

  var debug=true;

  function debugp(msg, depth) {
    if(!debug) return;
    var s='';
    for(var i=0;i<depth*2;i++) {
      s+=' ';
    }
    console.log(s,msg);
  }

  var tree = function () {}, debug = false; 

  tree.prototype = {

    train: function(D, cb) {
      var major_label = this.mostCommon(D.targets);
      cb({
        model:this._c45(D.data, D.targets, D.l_featuresIndex, D.featureNames, D.featuresType, major_label),
        classify: function(sample) {
          var root = this.model;
          if(typeof root === 'undefined') {
            return 'null';
          }
          while(root.type != "result") {
            var childNode;
            if(root.type === 'feature_real') {
              var feature_name = root.name;
              var sampleVal = parseFloat(sample[D.feature_name2id[feature_name]]);
              if(sampleVal<=root.cut)
                childNode=root.vals[1];
              else
                childNode=root.vals[0]; 
            } else {
              var attr = root.name;
              var sampleVal = sample[D.feature_name2id[attr]];
              childNode = _und.detect(root.vals,function(x){return x.name == sampleVal});
            }
            //unseen feature value (didn't appear in training data)
            if(typeof childNode === 'undefined') {
              //console.log('unseen feature value:',root.name,'sample:',sample);
              return major_label;
            }
            root = childNode.child;
          }
          return root.val;
        },
        calcAccuracy: function(samples, targets, cb) {
          var total = samples.length;
          var correct = 0;
          for(var i=0;i<samples.length;i++) {
            var pred = this.classify(samples[i]);
            var actual = targets[i];
            //console.log('predict:'+pred,' actual:'+actual);
            if(pred === actual){
              correct++;
            }
          }
          if(total>0)
            cb(correct/total, correct, total);
          else
            cb(0.0);
        },
      }, undefined);
    },

    _c45: function(data, targets, l_features_id, l_features_name, featuresType, major_label) {
      var node;
      if (targets.length == 0) {
        debugp("==no data",0);
        return {type:"result", val: major_label, name: major_label,alias:major_label+this.randomTag() }; 
      }
      if (targets.length == 1) {
        debugp("==end node "+targets[0],0);
        return {type:"result", val: targets[0], name: targets[0],alias:targets[0]+this.randomTag() }; 
      }
      if(l_features_name.length == 0) {
        debugp("==returning the most dominate feature", 0);
        var topTarget = this.mostCommon(targets);
        return {type:"result", val: topTarget, name: topTarget, alias: topTarget+this.randomTag()};
      }
      var bestFeatureData = this.maxGain(data,targets,l_features_id, l_features_name, featuresType);
      var best_id = bestFeatureData.feature_id;//feature_id is index in data file
      var best_name = bestFeatureData.feature_name;
      //console.log('bestFeatureData:',bestFeatureData);
      //console.log(featuresType[bestFeatureData.feature_name]);
      var remainingFeaturesId = _und.without(l_features_id, best_id);
      var remainingFeaturesName = _und.without(l_features_name, best_name);
      if(featuresType[best_name]==='real') {
        node = {name: best_name, id:best_id,alias: best_name+this.randomTag()};
        node.type = "feature_real";
        node.cut = bestFeatureData.cut;
        node.vals=[];

        var _newS_r = this.filterByCutGreater(data, targets, bestFeatureData.cut, best_id);
        //printDataset(_newS_r,bestFeature, 'label','>'+bestFeatureData.cut);
        var child_node_r = {name:bestFeatureData.cut.toString(),alias:'>'+bestFeatureData.cut.toString()+this.randomTag(),type: "feature_value"};
        child_node_r.child = this._c45(_newS_r[0], _newS_r[1], remainingFeaturesId, remainingFeaturesName, featuresType, major_label);
        node.vals.push(child_node_r);

        var _newS_l = this.filterByCutLessEqual(data, targets, bestFeatureData.cut, best_id);
        //printDataset(_newS_l,bestFeature, 'label','<='+bestFeatureData.cut);
        var child_node_l= {name:bestFeatureData.cut.toString(),alias:'<='+bestFeatureData.cut.toString()+this.randomTag(),type: "feature_value"};
        child_node_l.child = this._c45(_newS_l[0],_newS_l[1], remainingFeaturesId, remainingFeaturesName, featuresType, major_label);
        node.vals.push(child_node_l);

      } else{ //default is text
        var possibleValues = _und.unique(this.getCol(data, best_id));
        node = {name: best_name, alias: best_name+this.randomTag()};
        node.type = "feature_category";
        node.vals=[];

        for(var i=0;i<possibleValues.length;i++) {
          var _newS = this.filterByValue(data,targets,best_id, possibleValues[i]);
          var child_node = {name:possibleValues[i], alias:possibleValues[i]+this.randomTag(),type: "feature_value"};
          child_node.child = this._c45(_newS[0],_newS[1],remainingFeaturesId,remainingFeaturesName, featuresType, major_label);
          node.vals.push(child_node);
        }
      }
      return node;
    }, 

    //node(alias, vals(node))
    addEdges:function(node, colors, h_color, g){
      var that = this;
      if(node.type == 'feature_real'||node.type=='feature_category'){
        _und.each(node.vals,function(m){
          g.push(['val:'+m.alias+'</span>',node.alias+'','node']);
          g = that.addEdges(m, colors, h_color, g);
        });
        return g;
      } else if(node.type == 'feature_value'){ 
        if(node.child.type != 'result'){
          g.push([node.child.alias+'','val:'+node.alias+'</span>','value']);
          g = this.addEdges(node.child, colors, h_color, g);
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
      g = this.addEdges(model.model, colors,h_color,g).reverse();
      window.g = g;
      var data = google.visualization.arrayToDataTable(g.concat(g));
      var chart = new google.visualization.OrgChart(document.getElementById(divId));
      google.visualization.events.addListener(chart, 'ready',function(){
         _und.each($('.google-visualization-orgchart-node'),function(x){
            var oldVal = $(x).html();
            if(oldVal){
                var cleanVal = oldVal.replace(/_r[0-9]+/,'');
                cleanVal = cleanVal.replace(/val:/,'<span style="color:olivedrab;">');
                $(x).html(cleanVal);
            }
          }); 
      });
      chart.draw(data, {allowHtml: true}); 
      cb();
    }, 

    getCol:function(d, colIdx) {
      var col = [];
      for(var i=0;i<d.length;i++) col.push(d[i][colIdx]);
      return col;
    },

    filterByCutLessEqual:function(d, targets, cut, col) {
      var nd = [];
      var nt = [];
      if(d.length != targets.length) {
        console.log('ERRROR: difft dimensions');
      }
      for(var i=0;i<d.length;i++) 
        if(parseFloat(d[i][col])<=cut) {
          nd.push(d[i]);
          nt.push(targets[i]);
        }
      return [nd, nt];
    },

    filterByCutGreater:function(d, targets, cut, col) {
      var nd = [];
      var nt = [];
      if(d.length != targets.length) {
        console.log('ERRROR: difft dimensions');
      }
      for(var i=0;i<d.length;i++) 
        if(parseFloat(d[i][col])>cut) {
          nd.push(d[i]);
          nt.push(targets[i]);
        }
      return [nd, nt];
    },

    //filter data, target at the same time
    filterByValue:function(d,t, featureIdx, val) {
      var nd = [];
      var nt = [];
      for(var i=0;i<d.length;i++) 
        if(d[i][featureIdx]===val) {
          nd.push(d[i]);
          nt.push(t[i]);
        }
      return [nd,nt];
    },

    //compute info gain for this feature. feature can be category or real type
    gain: function(data,targets, feature_id, featureName, featuresType) {
      if(data.length != targets.length) {
        console.log('ERRROR: difft dimensions');
      }
      var setEntropy = this.entropy(targets);
      //console.log('setEntropy:',setEntropy);
      var vals = _und.unique(this.getCol(data,feature_id));
      if(featuresType[featureName] === 'real') {
        var gainVals = [];
        for(var i=0;i<vals.length;i++) {
          var cutf=parseFloat(vals[i]);
          var _gain = setEntropy-this.conditionalEntropy(data, targets, feature_id, cutf);
          gainVals.push({feature_id:feature_id, feature_name:featureName, gain:_gain, cut:cutf});
        }
        var _maxgain= _und.max(gainVals, function(e){return e.gain});
        //debugp('real maxgain: '+_maxgain.cut+' '+_maxgain.gain,0);
        return _maxgain;
      } else{//default is text
        var setSize = data.length;
        var entropies = [];
        for(var i=0;i<vals.length;i++) {
          var subset = this.filterByValue(data, targets, feature_id, vals[i]);
          entropies.push((subset[0].length/setSize)*this.entropy(subset[1]));
        }
        //console.log(featureName,' entropies:',entropies);
        var sumOfEntropies =  _und(entropies).reduce(function(a,b){return a+b},0);
        //console.log(featureName,' sumOfEntropies:',sumOfEntropies);
        return {feature_id:feature_id, feature_name:featureName, gain:setEntropy - sumOfEntropies, cut:0};
      } 
    },

    entropy: function (vals){
      var that = this;
      var uniqueVals = _und.unique(vals);
      var probs = uniqueVals.map(function(x){return that.prob(x,vals)});
      var logVals = probs.map(function(p){return -p*that.log2(p) });
      return logVals.reduce(function(a,b){return a+b},0);
    }, 

    //conditional entropy if data is split to two
    conditionalEntropy: function(_s, targets, feature_id, cut) {
      var subset1 = this.filterByCutLessEqual(_s, targets, cut, feature_id);
      var subset2 = this.filterByCutGreater(_s, targets, cut, feature_id);
      var setSize = _s.length;
      return subset1[0].length/setSize*this.entropy(subset1[1]) + subset2[0].length/setSize*this.entropy(subset1[1]);
    }, 

    maxGain: function (data, targets, l_features_id, l_features_name, featuresType){
      var g45 = [];
      for(var i=0;i<l_features_id.length;i++) {
        //console.log('maxgain feature:'+l_features_id[i]+' '+l_features_name[i]);
        g45.push(this.gain(data,targets,l_features_id[i], l_features_name[i], featuresType));
      }
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
      }).reverse()[1];
    },

    count: function (a,l){
      return _und.filter(l,function(b) { return b === a}).length
    },

    randomTag: function (){
      return "_r"+Math.round(Math.random()*1000000).toString();
    }

 }

  //logistic regression
  var lr = function () {};

  lr.prototype = {

    train: function(D, cb) {
      cb({
        that:this,
        thetas:this.optimize(D),
        classify: function(sample) {
          var max_p = this.that.compThetaXProduct(this.thetas[D.l_targets[0]], sample, D.nfeatures);
          var max_t = D.l_targets[0];
          for(var i=1;i<D.ntargets;i++) {
            var target = D.l_targets[i];
            var p = this.that.compThetaXProduct(this.thetas[target], sample, D.nfeatures);
            if(max_p<p) {
              max_p = p;
              max_t = target;
            }
          }
          return max_t;
        },
        calcAccuracy: function(samples, targets, cb) {
          var total = samples.length;
          var correct = 0;
          for(var i=0;i<samples.length;i++) {
            var pred = this.classify(samples[i]);
            var actual = targets[i];
            //console.log('predict:'+pred,' actual:'+actual);
            if(pred === actual){
              correct++;
            }
          }
          if(total>0)
            cb(correct/total, correct, total);
          else
            cb(0.0);
        },
      }, undefined);
    },

    printThetas: function(thetas, ntargets, l_targets, nfeatures) {
      for(var i=0;i<ntargets;i++) {
        console.log(l_targets[i]);
        for(var j=0;j<nfeatures;j++) {
          process.stdout.write(thetas[l_targets[i]][j]+' ');
        }
        console.log(' ');
      }
    },

    optimize: function(D) {

      if(!('optimizer' in D)) D.optimizer = 'sgd';
      if(!('learning_rate' in D)) D.learning_rate = 0.005;
      if(!('l2_weight' in D)) D.l2_weight = 0.000001;
      if(!('iterations' in D)) D.iterations = 50;

      var thetas={};
      for(var i=0;i<D.ntargets;i++) {
        var theta=[];
        for(var j=0;j<D.nfeatures;j++) {
          theta.push(0.0);
        }
        thetas[D.l_targets[i]]=theta; 
      }
      for(var i=0;i<D.iterations;i++) {
        if(D.optimizer === 'sgd')
          this.sgd_once(thetas, D.data, D.nfeatures, D.targets,D.l_targets, D.ntargets, D.learning_rate, D.l2_weight);
        else if (D.optimizer === 'gd') 
          this.gd_batch(thetas, D.data, D.nfeatures,D.targets,D.l_targets, D.ntargets, D.learning_rate, D.l2_weight);
        else {
          console.log('unrecognized optimizer:'+D.optimizer);
          break;
        }
      }
      //this.printThetas(thetas, D.ntargets, D.l_targets, D.nfeatures);
      return thetas;
    },

    gd_batch: function(thetas, training, nfeatures,targets,l_targets, ntargets, learning_rate, l2_weight){
      for(var t=0;t<ntargets;t++) {
        var gradient=[];
        for(var k=0;k<nfeatures;k++) {
          gradient.push(0.0);
        }
        var target = l_targets[t];

        for(var i=0;i<training.length;i++) {
          var prdt=[], this_prdt;
          prdt.push(this.compThetaXProduct(thetas[l_targets[0]], training[i], nfeatures));
          if(t==0) this_prdt = prdt[0];
          var max_prdt = prdt[0];

          for(var j=1;j<ntargets;j++) {
            var prdt1 = this.compThetaXProduct(thetas[l_targets[j]], training[i], nfeatures);
            prdt[j] = prdt1;
            if(t==j) this_prdt = prdt1;
            if(max_prdt < prdt1) max_prdt= prdt1;
          }
          var z=0.0;
          for(var j=0;j<ntargets;j++) {
            z+=Math.exp(prdt[j]-max_prdt);
          }
          var p = Math.exp(this_prdt-max_prdt)/z;
          for(var k=0;k<nfeatures;k++) {
            if(target === targets[i]) {
              gradient[k] += ((1.0-p)*training[i][k]);
            } else {
              gradient[k] += ((0.0-p)*training[i][k]);
            }
          }
        }
        var theta = thetas[target];
        for(var k=0;k<nfeatures;k++) {
          theta[k] += (learning_rate* gradient[k] - 2*training.length*l2_weight*theta[k]);
        }
      }
    },

    sgd_once: function(thetas, training, nfeatures,targets,l_targets, ntargets, learning_rate, l2_weight){
      for(var i=0;i<training.length;i++) {
        var prdt=[];
        prdt.push(this.compThetaXProduct(thetas[l_targets[0]], training[i], nfeatures));
        var max_prdt = prdt[0];
        for(var j=1;j<ntargets;j++) {
          var prdt1 = this.compThetaXProduct(thetas[l_targets[j]], training[i], nfeatures);
          prdt[j] = prdt1;
          if(max_prdt < prdt1) max_prdt= prdt1;
        }
        var z=0.0;
        for(var j=0;j<ntargets;j++) {
          z+=Math.exp(prdt[j]-max_prdt);
        }
        for(var j=0;j<ntargets;j++) {
          var p = Math.exp(prdt[j]-max_prdt)/z;
          var target = l_targets[j];
          var theta = thetas[target];
          for(var k=0;k<nfeatures;k++) {
            if(target === targets[i]) {
              theta[k] += (learning_rate*(1.0-p)*training[i][k] - 2*l2_weight*theta[k]);
            } else {
              theta[k] += (learning_rate*(0.0-p)*training[i][k] - 2*l2_weight*theta[k]);
            }
          }
        }
      }
    }, 

    compThetaXProduct:function(theta, sample, nfeatures) {
      var a=0;
      for(var i=0;i<nfeatures;i++) {
        a += theta[i]*sample[i];
      }
      return a;
    }
 }

  var exports = exports||{};
  exports.logistic = lr;
  exports.tree = tree;
  return exports;

})(typeof module != 'undefined' && module.exports); 
