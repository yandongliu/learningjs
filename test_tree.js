//////////////////////////////////////////////////////////////////
/// sample code using decision tree for classification
//  some datasets can be found at 
//    https://archive.ics.uci.edu/ml/datasets.html
//
//  you have to manually add the header(features) to each data file
//////////////////////////////////////////////////////////////////
'use strict';

var learningjs = require('./js/learningjs.js');
var data_util = require("./js/data_util.js");

if(process.argv.length<4) {
  console.log('usage: %s %s training_file test_file', process.argv[0], process.argv[1]);
  process.exit(0);
}
var fn = process.argv[2];
var fn_test = process.argv[3];

console.log('=== TRAIN:%s ===', fn);
console.log('=== TEST:%s ===', fn_test);

data_util.loadTextFile(fn, function(D) {

  //decision tree deals with both numeric/categorical features
  //but you have to specify its type individually in 2nd line of the file

  var start = process.hrtime();
  new learningjs.tree().train(D, function(model, err){
    if(err) {
      console.log(err);
    } else {
      //console.log('model:',model);
      var elapsed = process.hrtime(start)[1] / 1000000;
      console.log('training took ' + process.hrtime(start)[0] + " s, " + elapsed.toFixed(2) + " ms.");
      model.calcAccuracy(D.data, D.targets, function(acc, correct, total){
        console.log('training: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
      });
      data_util.loadTextFile(fn_test, function(T) {
        model.calcAccuracy(T.data, T.targets, function(acc, correct, total){
          console.log('    test: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
        });
      });
    }
  });
}); 
