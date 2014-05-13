function renderTest (model, samples, features, targets, $el) {
  $el.append("<tr style='background:#eeeeee;'><td>"+features.join('</td><td>')+'</td><td>Prediction</td><td>Actual</td></tr>');
  //_.each(samples,function(s) {
  for(var i=0;i<samples.length;i++) {
    //var vals_for_sample = _.map(features,function(x){return s[x]});
    var s = samples[i];
    var target = targets[i];
    var vals_for_sample = s;
    $el.append("<tr><td>"+vals_for_sample.join('</td><td>')+"</td><td><b>"+model.predict(s)+"</b></td><td> "+target+"</td></tr>");
  }
} 

function processTestFile(f) {
  var reader = new FileReader(); 
  reader.onload = (function(theFile) {
    return function(e) { 
      loadString(e.target.result, function(D) {
        var start = (new Date).getTime();
        var tree = new learningjs.tree();
        if(typeof trained_model === 'undefined') {
          alert('You need to train a model first.');
        } else {
          $("#status").append('Testing in process</br>');
          console.log('model:',trained_model);
          var elapsed = 0.00;
          var diff = (new Date).getTime() - start;
          console.log('Testing took ' + diff.toFixed(0) + " ms.");
          trained_model.calcAccuracy(D.data, D.targets, function(acc, correct, total){
            console.log( 'Testing: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
            $("#status").append( 'Testing: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%<br/>');
          });
          renderTest(trained_model, D.data,D.featureNames, D.targets, $("#samples"));
        }
      });
    };
  })(f); 
  reader.readAsText(f);
}

function processTrainFile(f) {
  var reader = new FileReader(); 
  reader.onload = (function(theFile) {
    return function(e) { 
      loadString(e.target.result, function(D) {
        //console.log(D);
        var start = (new Date).getTime();
        var tree = new learningjs.tree();
        $("#status").append('Training in process</br>');
        tree.train(D, function(model, err){
          if(err) {
            console.log(err);
          } else {
            console.log('drawing tree');
            tree.drawGraph(model,'canvas', function(err){
              if(err)
                  $("#status").append('Error.'+err+'<br/>'); 
            });
            console.log('model:',model);
            trained_model = model;
            var elapsed = 0.00;
            var diff = (new Date).getTime() - start;
            console.log('training took ' + diff.toFixed(0) + " ms.");
            model.calcAccuracy(D.data, D.targets, function(acc, correct, total){
              console.log( 'training: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
            });
            $("#status").append('Model training has finished. Now drop your test file.</br>');
          }
        });
      });
    };
  })(f); 
  reader.readAsText(f);
}

function handleTestFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  this.className='holder';
  var f = evt.dataTransfer.files[0]; // FileList object
  console.log(f.type);
  processTestFile(f);
}

function handleTrainFileSelect(evt) {
  $('#canvas').html('');
  $('#status').html('');
  $('#samples').html('');
  evt.stopPropagation();
  evt.preventDefault();
  this.className='holder';
  var f = evt.dataTransfer.files[0]; // FileList object
  console.log(f.type);
  processTrainFile(f);
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
  this.className='holder hover';
}

function handleLeave(evt) {
  this.className='holder';
}

$(function(){
  var dropZone = document.getElementById('drop_train_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('dragleave', handleLeave, false);
  dropZone.addEventListener('drop', handleTrainFileSelect, false);
  var dropZone2 = document.getElementById('drop_test_zone');
  dropZone2.addEventListener('dragover', handleDragOver, false);
  dropZone2.addEventListener('dragleave', handleLeave, false);
  dropZone2.addEventListener('drop', handleTestFileSelect, false);

  function deleteVars() {
    $('#demoScript').remove();
    delete _training_data;
    delete training_data;
    delete features;
    delete classlabel;
    delete test_data;
  }

  $('#reset').click(function() {
    deleteVars();
    $('#canvas').html('');
    $('#status').html('');
    $('#samples').html('');
  });
});

var trained_model = undefined;
