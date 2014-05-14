LearningJS: A Javascript Implementation of Logistic Regression and C4.5 Decision Tree Algorithms
==========
Author: Yandong Liu. Email: yandongl @ cs.cmu.edu

#Update
I've made some update on the data loading logic so now it reads in csv-format file. Previous version is still accessible but it's no longer supported.

#Introduction
Javascript implementation of several machine learning algorithms including Decision Tree and Logistic Regression this far. More to come.

#Online Demo
Here's a online [demo](http://www.cs.cmu.edu/~yandongl/learningjs/decision-tree-demo.html) with visualization and a few datasets.

#Data format
Input files need to be in CSV-format with 1st line being feature names. One of the features has to be called 'label'. E.g.  
<pre>
outlook, temp, humidity, wind, label
text, real, text, text, feature_type
'Sunny',80,'High', 'Weak', 'No'
'Sunny',82,'High', 'Strong', 'No'
'Overcast',73,'High', 'Weak', 'Yes' 
</pre>
There's also an optional 2nd line for feature types and the 'label' column for 2nd line has to be called 'feature_type'. This is useful if feature types are mixed. For Logistic Regression, all features should be real numbers. E.g.
<pre>
label,a,b,c,d,e,f,g,h,i,j,k,l,m
1,1,0.72694,1.4742,0.32396,0.98535,1,0.83592,0.0046566,0.0039465,0.04779,0.12795,0.016108,0.0052323
2,2,0.74173,1.5257,0.36116,0.98152,0.99825,0.79867,0.0052423,0.0050016,0.02416,0.090476,0.0081195,0.002708
3,3,0.76722,1.5725,0.38998,0.97755,1,0.80812,0.0074573,0.010121,0.011897,0.057445,0.0032891,0.00092068
1,4,0.73797,1.4597,0.35376,0.97566,1,0.81697,0.0068768,0.0086068,0.01595,0.065491,0.0042707,0.0011544
</pre>


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
