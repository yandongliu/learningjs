LearningJS: Javascript implementation of C4.5 Decision Tree Algorithm
==========
Author: Yandong Liu. Email: yandongl @ cs.cmu.edu

#Introduction
There have been a few implementations of decision tree classifiers on the Web such as https://github.com/willkurt/ID3-Decision-Tree but I found they don't deal with real values which significantly constraints their application. Below one can handle both real and categorical values.

#Online Demo
Here's a online [demo](http://www.cs.cmu.edu/~yandongl/learningjs/decision-tree-demo.html) with visualization and a few datasets.

#Usage
You need define 3 variables: `training_data`, `features`, and `test_data`. 

 * `training_data`: array of JSON object. each object consists of a number of feature_name:feature_value pairs.
 * `test_data`: similar to training_data, but consists of test instances to be classified.
 * `features`: JSON object for feature definition. format: feature_name:feature_type. feature_type can be category or real.

```javascript
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
<script type="text/javascript" src="learningjs.js"></script>

var training_data=[
{ sepal_length:'5.1',sepal_width:'3.5',petal_length:'1.4',petal_width:'0.2',label:'Iris-setosa' }, 
{ sepal_length:'4.9',sepal_width:'3.0',petal_length:'1.4',petal_width:'0.2',label:'Iris-setosa' }, 
{ sepal_length:'4.7',sepal_width:'3.2',petal_length:'1.3',petal_width:'0.2',label:'Iris-setosa' }
...
]

var features={'sepal_length':'real','sepal_width':'real','petal_length':'real','petal_width':'real'};

var test_data=[
{ sepal_length:'6.1',sepal_width:'2.6',petal_length:'5.6',petal_width:'1.4',label:'Iris-virginica' },
{ sepal_length:'7.7',sepal_width:'3.0',petal_length:'6.1',petal_width:'2.3',label:'Iris-virginica' },
{ sepal_length:'6.3',sepal_width:'3.4',petal_length:'5.6',petal_width:'2.4',label:'Iris-virginica' },
]

var tree = new learningjs.tree();
//train a model. parameters: training data, label column, features, callback for trained model
tree.train(training_data,'label', features, function(model, err){
  if(err) {
    console.log(err);
  } else {
    //classify single instanes
    console.log(model.classify(test_data[0]));
    console.log(model.classify(test_data[1]));
    console.log(model.classify(test_data[2]));
    $('body').append('prediction: ');
    $('body').append(model.classify(test_data[0]));
    $('body').append('</br>');
    $('body').append('prediction: ');
    $('body').append(model.classify(test_data[1]));
    $('body').append('</br>');
    $('body').append('prediction: ');
    $('body').append(model.classify(test_data[2]));
    $('body').append('</br>');
    //compute overall accuracy on multiple instances
    model.calcAccuracy(test_data, 'label', function(acc){
      console.log('accuracy: '+acc);
      $('body').append('accuracy: '+acc);
    });
   }
});
```

#Use in Nodejs
Similarly you need to import the lib and do the same:

```javascript

  var learningjs = require('learningjs');
  var tree = new learningjs.tree();
  var training_data = [...];
  var features = {...}
  var test_data = [..]
  ...
```

#License
MIT
