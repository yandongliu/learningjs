var trainModelc45 = function(trainingData, target, featuresType, testData){
  $("#samples tbody").children().remove();
  $("#training tbody").children().remove();
  $("#canvas").html('');
  $("#drop_zone").html('Training in process');
  $("#status").append('Training in process</br>');
  $("#drop_zone").attr('class','holder training');
  console.log('building model');
  setTimeout(function(){
    var start = (new Date).getTime();
    var tree = new learningjs.tree();
    tree.train(trainingData, target, featuresType, function(model, err){
	if(err) {
      $("#status").append(err+'<br/>');
	} else {
      var diff = (new Date).getTime() - start;
      console.log('training done. running time:'+(diff/60.0).toFixed(2)+' seconds');
      $("#status").append('training took '+(diff/60.0).toFixed(2)+' seconds.<br/>');
      $("#drop_zone").html('Drop files here');
      $("#drop_zone").attr('class','holder');
      console.log('drawing tree');
      tree.drawGraph(model,'canvas', function(err){
	      if(err)
            $("#status").append('Error.'+err+'<br/>'); 
      });
      model.calcAccuracy(trainingData, target, function(acc){
        $("#status").append('training accuracy '+(acc*100.0).toFixed(1)+'%.<br/>');
      });
      model.calcAccuracy(testData, target, function(acc){
        $("#status").append('test accuracy '+(acc*100.0).toFixed(1)+'%.<br/>');
      });
      var features=[]
      for(var f in featuresType) {
        if (featuresType.hasOwnProperty(f)) {
          if(featuresType[f]!=='real'&&featuresType[f]!=='category') {
            console.log('ERROR. unrecogznied feature type '+featuresType[f]);
            cb(undefined, 'ERROR:unrecognized feature type '+featuresType[f]);
            return;
          }
          features.push(f);
        }
      }
      renderTest(model, testData,features, target, $("#samples"));
	}
        $("#status").append('-----------------------<br/>');
    });
  }, 500);
}

function renderTest (model, samples, features, target, $el) {
  $el.append("<tr style='background:#eeeeee;'><td>"+features.join('</td><td>')+'</td><td>Prediction</td><td>Actual</td></tr>');
  _.each(samples,function(s) {
    var vals_for_sample = _.map(features,function(x){return s[x]});
    $el.append("<tr><td>"+vals_for_sample.join('</td><td>')+"</td><td><b>"+model.classify(s)+"</b></td><td> "+s[target]+"</td></tr>");
  })
} 

function processJSTraining(f) {
  var reader = new FileReader(); 
  reader.onload = (function(theFile) {
    return function(e) {
      eval(e.target.result);
      if(typeof training_data === 'undefined') {
          $("#status").append('Error. training_data is missing.<br/>'); 
      } else {
        if(training_data.length==0) {
          $("#status").append('Error. training_data has no elements.<br/>'); 
        } else {
          var label='label';
          if(typeof classlabel !== 'undefined') {
            label=classlabel;
            $("#status").append('use column '+classlabel+' as label.<br/>');
          } else {
            $("#status").append('classlabel is missing. use default "label".<br/>');
          }
          var labelmissing=_.find(_.map(training_data,function(e) {
              return e[label]===undefined;
            }), function(e) {
            return e===true;
          });
          if(labelmissing){
            $("#status").append('Error. some training_data misses label!.<br/>'); 
          } else {
            if(typeof features=== 'undefined') {
              $("#status").append('Error. feature list is missing!.<br/>'); 
            } else {
              var testData=[]
              if(typeof test_data !== 'undefined') testData = test_data;
              trainModelc45(training_data,label, features, testData);
            }
          }
        }
      }
    };
  })(f); 
  reader.readAsText(f);
}

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  this.className='holder';
  var files = evt.dataTransfer.files; // FileList object
    for (var i = 0, f; f = files[i]; i++) { 
      if(f.type.match('.*/javascript')) {
        processJSTraining(f);
      }else if (f.type.match('text.*')) {
      } else if(f.type.match('image.*')) {
      } 
   }
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
  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('dragleave', handleLeave, false);
  dropZone.addEventListener('drop', handleFileSelect, false);

  function loadDemoData(name, classlabel) {
    //var head = document.getElementsByTagName("head")[0];  
    var first = document.getElementsByTagName('script')[0];
    var script =document.createElement('script');   
    script.id = 'demoScript';  
    script.type = 'text/javascript';  
    script.src = "js/"+name+".js";   
    first.parentNode.insertBefore(script);
    script.onload = function(){
      demotrain(classlabel); 
    }
  }
  function demotrain(classlabel) {
    if(typeof test_data !== 'undefined') {
      setTimeout(function(){
        trainModelc45(training_data,classlabel, features, test_data);
    }, 500);
    } else {
      $("#status").append('Test data is missing.<br/>');
      $("#status").append('-----------------------<br/>');
    }
  }
  function foo() {
    console.log('foo');
    demotrain();
  }
  function deleteVars() {
    $('#demoScript').remove();
    delete _training_data;
    delete training_data;
    delete features;
    delete classlabel;
    delete test_data;
  }
  $('#wilt').click(function() {
    deleteVars();
    loadDemoData('wilt', 'labelxxx');
  });
  $('#golf').click(function() {
    deleteVars();
    loadDemoData('golf', 'play');
  });
  $('#iris').click(function() {
    deleteVars();
    loadDemoData('iris', 'label');
  });
  $('#reset').click(function() {
    deleteVars();
    $('#canvas').html('');
    $('#status').html('');
    $('#samples').html('');
  });
});
