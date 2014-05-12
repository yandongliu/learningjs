LearningJS: A Javascript Implementation of Logistic Regression and C4.5 Decision Tree Algorithms
==========
Author: Yandong Liu. Email: yandongl @ cs.cmu.edu

#Update
I've made some update on the data loading logic so now it reads in csv-format file. Previous version is still accessible but it's no longer supported.

#Introduction
Javascript implementation of several machine learning algorithms including Decision Tree and Logistic Regression this far. More to come.

#Online Demo
Here's a online [demo](http://www.cs.cmu.edu/~yandongl/learningjs/decision-tree-demo.html) with visualization and a few datasets.

#Usage
Data loading: data_util.js provides three methods:

 * `loadTextFile`: the csv-format file will be loaded from disk and columns are parsed as strings unless 2nd line specifies feature types.
 * `loadRealFile`: the csv-format file will be loaded from disk and columns are parsed as real numbers.
 * `loadString`: a big string will be chopped into lines and columns are parsed as strings unless 2nd line specifies feature types.

In the loading callback function you will obtain a data object D on which you can apply the learning methods. Note that only Decision Tree supports both real and categorical features. Logistic Regression works on real features only.  


```javascript
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
<script type="text/javascript" src="data_util.js"></script>
<script type="text/javascript" src="learningjs.js"></script>
loadString(content, function(D) {
  var tree = new learningjs.tree();
  tree.train(D, function(model, err){
    if(err) {
      console.log(err);
    } else {
      model.calcAccuracy(D.data, D.targets, function(acc, correct, total){
        console.log( 'training: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
      });
    }
  });
}); 
```

#Use in Nodejs
Similarly you need to import the lib and do the same:

```javascript 
var learningjs = require('learningjs.js');
var data_util = require('data_util.js');
var tree = new learningjs.tree();
data_util.loadRealFile(fn_csv, function(D) {

  //normalize data
  data_util.normalize(D.data, D.nfeatures); 

  //logistic regression. following params are optional
  D.optimizer = 'sgd'; //default choice. other choice is 'gd'
  D.learning_rate = 0.005;
  D.l2_weight = 0.0;
  D.iterations = 1000; //increase number of iterations for better performance

  new learningjs.logistic().train(D, function(model, err){
    if(err) {
      console.log(err);
    } else {
      model.calcAccuracy(D.data, D.targets, function(acc, correct, total){
        console.log('training: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
      });
      data_util.loadRealFile(fn_test, function(T) {
        model.calcAccuracy(T.data, T.targets, function(acc, correct, total){
          console.log('    test: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
        });
      });
    }
  });
}); 
```

#License
MIT
