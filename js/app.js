(function(){
  Parse.initialize("zEk6NG5ll6QYlhOCcKYtWsRNLXHQ1FkTgbIs8vMC", "iwMmuokr2DUqXHaegg7gt8iK22f6Sn0r33BDfhAG");
 // 初始化Parse();
 var templates = {};
 ['loginView','evaluationView','updateSuccessView'].forEach (function (e){
 	templateCode = document.getElementById(e).text;
    templates[e] = doT.template(templateCode);
 });
  //編譯template engine函數();
  
  var commons = {
    loginRequiredView: function (ViewFunction) {
      return function () {
        var currentUser = Parse.User.current();
        if (currentUser) {
          ViewFunction();
        } else {
          window.location.hash = "login/" + window.location.hash;
        }
      }
    },
  }

  //可選-編寫共用函數();
  var handler = {
    navbar: function(){
    	var current_user = Parse.User.current();
      if(current_user){
        document.getElementById("loginButton").style.display = "none";
        document.getElementById("logoutButton").style.display = "block";
        document.getElementById("evaluationButton").style.display = "block";
        //顯示哪些button();
      } else {
      	document.getElementById("loginButton").style.display = "block";
        document.getElementById("logoutButton").style.display = "none";
        document.getElementById("evaluationButton").style.display = "none";
        //顯示哪些button();      
      }
       document.getElementById('logoutButton').addEventListener('click', function(){
        Parse.User.logOut();
        handler.navbar();
        window.location.hash = 'login/';
      });
    },
     login: function(){
      var current_user = Parse.User.current();
      var postAction = function(){
        handler.navbar();
        window.location.hash = 'peer-evaluation/';
        handler.evaluation();
      }
      if (current_user) {
        window.location.hash = 'peer-evaluation/';
      } else {
        // Signin Function binding, provided by Parse SDK.        
        document.getElementById('content').innerHTML = templates.loginView();
      	// 把版型印到瀏覽器上();

        // 綁定註冊表單的密碼檢查事件(); // 參考上課範例
        document.getElementById('form-signup-password1').addEventListener('keyup', function(){
          var singupForm_password = document.getElementById('form-signup-password');
          var message = (this.value !== singupForm_password.value) ? '密碼不一致' : '';
          document.getElementById('form-signup-message').style.display = 'block';     
          document.getElementById('form-signup-message').innerHTML = message;  
          if(this.value === singupForm_password.value){
             document.getElementById('form-signup-message').style.display = 'none';     
          }
        });
       
        // 綁定登入表單的學號檢查事件(); // 可以利用TAHelp物件  
        document.getElementById('form-signin').addEventListener('submit', function(){
          var student_id = document.getElementById('form-signin-student-id').value;
          if(!TAHelp._isMemberOf(student_id)){
            document.getElementById('form-signin-message').style.display = 'block';     
            document.getElementById('form-signin-message').innerHTML = '不要亂來';
          }
        });
        
        // 綁定註冊表單的學號檢查事件(); // 可以利用TAHelp物件
        document.getElementById('form-signup').addEventListener('submit', function(){
          var student_id = document.getElementById('form-signup-student-id').value;
          if(!TAHelp._isMemberOf(student_id)){
            alert('查無此人');
            window.location.hash = '';
          }

        });

        // 綁定登入表單的登入檢查事件(); // 送出還要再檢查一次，這裡會用Parse.User.logIn
        document.getElementById('form-signin').addEventListener('submit', function(){
          Parse.User.logIn(document.getElementById('form-signin-student-id').value,
              document.getElementById('form-signin-password').value, {
            success: function(user) {
              postAction();
            },
            error: function(user, error) {
              document.getElementById('form-signin-message').style.display = 'block';     
              document.getElementById('form-signin-message').innerHTML = "忘記密碼？";
            }
          }); 
        });

        // 綁定註冊表單的註冊檢查事件(); // 送出還要再檢查一次，這裡會用Parse.User.signUp和相關函數
        document.getElementById('form-signup').addEventListener('submit', function(){
          var user = new Parse.User();
          user.set("username", document.getElementById('form-signup-student-id').value);
          user.set("password", document.getElementById('form-signup-password').value);
          user.set("email", document.getElementById('form-signup-email').value);
 
          user.signUp(null, {
            success: function(user) {
              postAction();
              // Hooray! Let them use the app now.
            },
            error: function(user, error) {
              // Show the error message somewhere and let the user try again.
              document.getElementById('form-signup-message').style.display = 'block';     
              document.getElementById('form-signup-message').innerHTML = error.message;
            }
          });


   
        });
       
        }
    },
    evaluation: function(object){
      // t = evaluation n = current_user r = access
          var evaluation = Parse.Object.extend("Evaluation");
          var current_user = Parse.User.current();
          var access = new Parse.ACL;
          access.setPublicReadAccess(true);
          access.setPublicWriteAccess(false);
          access.setReadAccess(current_user, true);
          access.setWriteAccess(current_user, true);
          // i = tmp_evaluation
          var tmp_evaluation = new Parse.Query(evaluation);
          tmp_evaluation.equalTo("user",current_user);
          tmp_evaluation.first({
            success: function(tmp_evaluation){
            window.EVAL = tmp_evaluation;
            if(tmp_evaluation === undefined){
              var s = TAHelp.getMemberlistOf(current_user.get("username")).filter(function(e){return e.StudentId !== current_user.get("username") ? true : false}).map(function(e){
                e.scores = ["0","0","0","0"];
                return e
              })
            }else{
              var s = tmp_evaluation.toJSON().evaluations
            }
            // console.log(s);
            document.getElementById("content").innerHTML = templates.evaluationView(s);
            var action = tmp_evaluation === undefined ? "送出表單" : "修改表單";
            document.getElementById("evaluationForm-submit").value = action;
            document.getElementById("evaluationForm").addEventListener("submit",function(){
              for(var o = 0; o < s.length; o++){
                for(var u = 0; u < s[o].scores.length; u++){
                  var a = document.getElementById("stu" + s[o].StudentId + "-q" + u);
                  var f = a.options[a.selectedIndex].value;s[o].scores[u] = f
                }
              }
                if(tmp_evaluation === undefined){
                  tmp_evaluation = new evaluation;
                  tmp_evaluation.set("user",current_user);
                  tmp_evaluation.setACL(access);
                }
                  tmp_evaluation.set("evaluations",s);
                  tmp_evaluation.save(null,{success: function(){
                    document.getElementById("content").innerHTML = templates.updateSuccessView();
                  },
                  error: function(){

                  }
                })
                },
                false
                )},
            error: function(e,evaluation){}
          })
      // 基本上和上課範例購物車的函數很相似，這邊會用Parse DB
      // 問看看Parse有沒有這個使用者之前提交過的peer review物件(
      // 沒有的話: 從TAHelp生一個出來(加上scores: [‘0’, ‘0’, ‘0’, ‘0’]屬性存分數並把自己排除掉)
      // 把peer review物件裡的東西透過版型印到瀏覽器上();
      // 綁定表單送出的事件(); // 如果Parse沒有之前提交過的peer review物件，要自己new一個。或更新分數然後儲存。
    },
    scoreboard: function(){
      var Score = Parse.Object.extend("Evaluation");
      var query = new Parse.Query(Score);
      // StudentId
      // scores
      // for (var i = 1; i < TAHelp._Memberlist.length; i++) {
      //   for (var j = 0; j < TAHelp._Memberlist[i].length; j++) {
      //     query.equalTo("evaluations", TAHelp._Memberlist[i][j].StudentId);
          query.find({
            success: function(results) {
              // alert("Successfully retrieved " + results.length + " scores.");
              // Do something with the returned Parse.Object values
              var s = results[0].toJSON().evaluations
              // console.log(s);
              for (var i = 1; i < results.length; i++) { 
                var object = results[i];
                // alert(object.id + ' - ' + object.get('evaluations'));
                // console.log(object.toJSON().evaluations)
                s = s.concat(object.toJSON().evaluations);
                // console.log(s);
              }
              s.sort(function(a,b){
                if (a.StudentId > b.StudentId)
                  return 1;
                if (a.StudentId < b.StudentId)
                  return -1;
                // a must be equal to b
                // else{
                //   for(var i = 0 ; i < 4 ; i++){
                //     a.scores[i] = parseInt(a.scores[i]) + parseInt(b.scores[i]);
                //   }
                  return 0;
                // }
              });
              var uniqueNames = [];
              var n = 1;
              for (var i = 0; i < s.length; i++) {
                while(s[i+n].StudentId == s[i].StudentId){
                    for(var j = 0 ; j < 4 ; j++){
                      s[i].scores[j] = parseInt(s[i].scores[j]) + parseInt(s[i+n].scores[j]);
                    }
                      n = n + 1;
                      if(i+n==s.length)break;
                }
                  uniqueNames.push(s[i]);
                  i = i + n - 1;
                  n = 1;
                  // var index = s.indexOf(s[i+1]);
                  // s.splice(index, 1);
              };
              // $.each(s, function(i, el){
              //     if(i.StudentId !== el.StudentId) uniqueNames.push(el);
              // });
              document.getElementById("content").innerHTML = templates.scoreboardView(uniqueNames);
            },
            error: function(error) {
              alert("Error: " + error.code + " " + error.message);
            }
          });
      //   };
      // };

    },
  };
  var App = Parse.Router.extend({
    routes: {
      '': 'index',
      'login/': 'login',
      'peer-evaluation/': 'evaluation',
      'scoreboard/': 'scoreboard'
    },
    index: function(){
      if(Parse.User.current()){
        window.location.hash = "peer-evaluation/"
      }else{
        window.location.hash = "login/"
      }
    },
    evaluation: handler.evaluation,
    login: handler.login,
    scoreboard: handler.scoreboard
  });

  this.Router = new App();
  Parse.history.start();
  handler.navbar();
  // 讓router活起來();
})();
